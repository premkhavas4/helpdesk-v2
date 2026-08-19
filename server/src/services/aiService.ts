import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogle } from "@ai-sdk/google";
import { prisma } from "../auth.js";
import { TicketCategory } from "../../../core/src/schemas/ticket.js";

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

/**
 * Classifies a ticket asynchronously in a non-blocking fashion using OpenAI GPT / AI model.
 * Updates the ticket's category field in the database once classification completes.
 */
export function classifyTicketWithGPTNonBlocking(ticketId: number, subject: string, body: string): void {
  // Use setImmediate to ensure execution happens asynchronously outside the current HTTP event loop tick
  setImmediate(() => {
    classifyAndSave(ticketId, subject, body).catch((err) => {
      console.error(`[AI Classifier] Background error classifying ticket #${ticketId}:`, err);
    });
  });
}

export async function classifyAndSave(ticketId: number, subject: string, body: string): Promise<void> {
  const category = await classifyTicketCategory(subject, body);
  
  if (category) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category },
    });
    console.log(`[AI Classifier] Ticket #${ticketId} classified as "${category}"`);
  }
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
