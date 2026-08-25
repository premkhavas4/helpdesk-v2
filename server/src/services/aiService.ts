import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogle } from "@ai-sdk/google";
import { prisma } from "../auth.js";
import { TicketCategory, TicketStatus, SenderType } from "../../../core/src/schemas/ticket.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openaiApiKey = process.env.OPENAI_API_KEY;
const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const openai = createOpenAI({
  apiKey: openaiApiKey || "",
});

const google = createGoogle({
  apiKey: googleApiKey || "",
});

const ALLOWED_CATEGORIES = [
  TicketCategory.GENERAL_QUESTION,
  TicketCategory.TECHNICAL_QUESTION,
  TicketCategory.REFUND_REQUEST,
] as const;

interface KBArticle {
  id: string;
  title: string;
  keywords: string[];
  content: string;
}

function loadKnowledgeBase(): KBArticle[] {
  try {
    const kbPath = path.join(__dirname, "../config/knowledgeBase.json");
    if (fs.existsSync(kbPath)) {
      const data = fs.readFileSync(kbPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[AI Service] Failed to load knowledge base file:", err);
  }
  return [];
}

/**
 * Main worker function to process incoming tickets:
 * 1. Move status from 'new' -> 'processing'
 * 2. Attempt Knowledge Base auto-resolution
 * 3. If resolved -> add AI reply, set status = 'resolved'
 * 4. If unresolved -> set category, set status = 'open'
 */
export async function processTicketWithAI(ticketId: number, subject: string, body: string): Promise<void> {
  try {
    const aiUser = await prisma.user.findUnique({ where: { email: "ai.agent@helpdesk.local" } });
    const aiAgentId = aiUser?.id || "ai-agent-system-id";

    // 1. Mark ticket status as 'processing' via PostgreSQL stored function
    await prisma.$queryRaw`SELECT compute_ticket_status(${ticketId}, 'start_processing', NULL, ${aiAgentId})`;
    console.log(`[AI Engine] Ticket #${ticketId} status updated via stored function to "processing"`);

    // 2. Check Knowledge Base for auto-resolution
    const kbArticles = loadKnowledgeBase();
    const resolution = await matchKnowledgeBase(subject, body, kbArticles);

    const category = (await classifyTicketCategory(subject, body)) || TicketCategory.GENERAL_QUESTION;

    if (resolution) {
      // Extract customer's first name
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { senderName: true },
      });
      const rawName = ticket?.senderName || "there";
      const firstName = rawName.trim().split(/\s+/)[0] || "there";

      const formattedMessage = formatCustomerFriendlyReply(firstName, resolution.answer);

      // 3. Auto-resolve with AI reply and compute status via stored function
      await prisma.ticketReply.create({
        data: {
          ticketId,
          senderType: SenderType.AI,
          message: formattedMessage,
          sentAt: new Date(),
        },
      });

      await prisma.$queryRaw`SELECT compute_ticket_status(${ticketId}, 'auto_resolve', ${category}, ${aiAgentId})`;

      console.log(`[AI Engine] Ticket #${ticketId} AUTO-RESOLVED via stored function using KB article "${resolution.articleId}"`);
      return;
    }

    // 4. Could not auto-resolve -> Unassign from AI Agent and compute status as 'open' via stored function
    await prisma.$queryRaw`SELECT compute_ticket_status(${ticketId}, 'unassign_open', ${category}, NULL)`;

    console.log(`[AI Engine] Ticket #${ticketId} categorized as "${category}", status computed as "open" via stored function`);
  } catch (err) {
    console.error(`[AI Engine] Error processing ticket #${ticketId}:`, err);
    // On error, compute fallback ticket status to 'open' via stored function
    await prisma.$queryRaw`SELECT compute_ticket_status(${ticketId}, 'error_open', NULL, NULL)`.catch(() => {});
  }
}

/**
 * Formats automated KB responses with a polite greeting addressing customer by first name
 * and signs off with Code with Prem Support.
 */
function formatCustomerFriendlyReply(firstName: string, answerText: string): string {
  let cleanAnswer = answerText.trim();

  // If the answer already contains a greeting, clean it or format around it
  const hasGreeting = /^(hi|hello|dear)\b/i.test(cleanAnswer);
  const greeting = hasGreeting ? "" : `Hi ${firstName},\n\nThank you for reaching out to us!\n\n`;

  const hasSignOff = /code with (prem|mosh) support/i.test(cleanAnswer);
  const signOff = hasSignOff
    ? ""
    : `\n\nIf you have any further questions or need additional assistance, please feel free to reach out to us.\n\nBest regards,\nCode with Prem Support`;

  return `${greeting}${cleanAnswer}${signOff}`;
}

/**
 * Backwards compatible alias for classifyAndSave
 */
export async function classifyAndSave(ticketId: number, subject: string, body: string): Promise<void> {
  return processTicketWithAI(ticketId, subject, body);
}

export function classifyTicketWithGPTNonBlocking(ticketId: number, subject: string, body: string): void {
  setImmediate(() => {
    processTicketWithAI(ticketId, subject, body).catch((err) => {
      console.error(`[AI Classifier] Background error processing ticket #${ticketId}:`, err);
    });
  });
}

export async function classifyTicketCategory(subject: string, body: string): Promise<string> {
  const combinedText = `Subject: ${subject}\nBody: ${body}`;

  // 1. Try OpenAI GPT model if OPENAI_API_KEY is configured
  if (openaiApiKey && openaiApiKey.trim() !== "") {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an automated ticket classification assistant. Your task is to categorize customer support tickets into EXACTLY ONE of the following three categories:
1. "General question"
2. "Technical question"
3. "Refund request"

Respond ONLY with the exact category string (e.g. "General question", "Technical question", or "Refund request"). Do not include quotes, extra text, punctuation, or explanations.`,
        prompt: combinedText,
      });

      const normalized = normalizeCategory(text);
      if (normalized) return normalized;
    } catch (err) {
      console.warn("[AI Classifier] OpenAI API call failed, attempting fallback:", err);
    }
  }

  // 2. Try Gemini model if GEMINI_API_KEY is configured
  if (googleApiKey && googleApiKey.trim() !== "") {
    try {
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: `You are an automated ticket classification assistant. Categorize customer support tickets into EXACTLY ONE of these categories:
1. "General question"
2. "Technical question"
3. "Refund request"

Return ONLY the category string verbatim.`,
        prompt: combinedText,
      });

      const normalized = normalizeCategory(text);
      if (normalized) return normalized;
    } catch (err) {
      console.warn("[AI Classifier] Gemini API call failed, attempting rule fallback:", err);
    }
  }

  // 3. Keyword / Rule-based Fallback
  return fallbackKeywordClassifier(subject, body);
}

function normalizeCategory(rawText: string): string | null {
  if (!rawText) return null;
  const clean = rawText.trim().replace(/^["']|["']$/g, "");
  
  const found = ALLOWED_CATEGORIES.find((cat) => cat.toLowerCase() === clean.toLowerCase());
  return found || null;
}

function fallbackKeywordClassifier(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();

  if (text.includes("refund") || text.includes("billing") || text.includes("invoice") || text.includes("cancel") || text.includes("payment") || text.includes("money back")) {
    return TicketCategory.REFUND_REQUEST;
  }

  if (text.includes("error") || text.includes("bug") || text.includes("crash") || text.includes("failed") || text.includes("issue") || text.includes("api") || text.includes("code") || text.includes("technical")) {
    return TicketCategory.TECHNICAL_QUESTION;
  }

  return TicketCategory.GENERAL_QUESTION;
}

interface KBResult {
  articleId: string;
  answer: string;
}

async function matchKnowledgeBase(
  subject: string,
  body: string,
  articles: KBArticle[]
): Promise<KBResult | null> {
  if (!articles || articles.length === 0) return null;

  const combinedText = `Subject: ${subject}\nBody: ${body}`;
  const textLower = combinedText.toLowerCase();

  // Try AI matching if OpenAI or Gemini is available
  if (openaiApiKey && openaiApiKey.trim() !== "") {
    try {
      const articlesContext = articles
        .map((a) => `ID: ${a.id}\nTitle: ${a.title}\nContent: ${a.content}`)
        .join("\n\n");

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an expert customer support AI. Analyze the customer support ticket and the Knowledge Base articles.
Determine if one of the Knowledge Base articles directly and completely answers the customer's question.

Knowledge Base Articles:
${articlesContext}

If an article completely answers the ticket, respond with JSON ONLY in this format:
{"canResolve": true, "articleId": "<ID>", "answer": "<Comprehensive helpful response derived from the KB article>"}

If none of the articles answer the ticket, respond with JSON ONLY:
{"canResolve": false}`,
        prompt: combinedText,
      });

      const parsed = parseJSONSafe(text);
      if (parsed?.canResolve && parsed.articleId && parsed.answer) {
        return { articleId: parsed.articleId, answer: parsed.answer };
      }
    } catch (err) {
      console.warn("[AI Engine] OpenAI KB resolution failed, trying keyword fallback:", err);
    }
  }

  if (googleApiKey && googleApiKey.trim() !== "") {
    try {
      const articlesContext = articles
        .map((a) => `ID: ${a.id}\nTitle: ${a.title}\nContent: ${a.content}`)
        .join("\n\n");

      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: `Analyze ticket and KB articles. If an article directly answers the inquiry, reply with JSON: {"canResolve": true, "articleId": "<ID>", "answer": "<response>"}. Otherwise reply {"canResolve": false}.

Knowledge Base:
${articlesContext}`,
        prompt: combinedText,
      });

      const parsed = parseJSONSafe(text);
      if (parsed?.canResolve && parsed.articleId && parsed.answer) {
        return { articleId: parsed.articleId, answer: parsed.answer };
      }
    } catch (err) {
      console.warn("[AI Engine] Gemini KB resolution failed, trying keyword fallback:", err);
    }
  }

  // Keyword Matching Fallback
  for (const article of articles) {
    const matchedCount = article.keywords.filter((kw) => textLower.includes(kw.toLowerCase())).length;
    if (matchedCount >= 2 || (article.keywords.length === 1 && matchedCount === 1)) {
      return {
        articleId: article.id,
        answer: article.content,
      };
    }
  }

  return null;
}

function parseJSONSafe(text: string): any {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}
