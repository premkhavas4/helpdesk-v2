import { Router } from "express";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";

const router = Router();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const google = createGoogle({
  apiKey: apiKey || "",
});

// ── POST /api/ai/polish ─────────────────────────────────────────────
// Polishes a draft agent reply using Vercel AI SDK and Google Gemini Flash model
router.post("/polish", async (req, res) => {
  try {
    const { draftReply, ticketSubject, ticketBody, customerName } = req.body;

    if (!draftReply || typeof draftReply !== "string" || draftReply.trim() === "") {
      res.status(400).json({ error: "draftReply is required" });
      return;
    }

    const trimmedDraft = draftReply.trim();
    const customerFirstName = typeof customerName === "string" && customerName.trim()
      ? customerName.trim().split(/\s+/)[0]
      : "there";

    if (apiKey && apiKey.trim() !== "") {
      try {
        const { text } = await generateText({
          model: google("gemini-2.0-flash"),
          system:
            "You are an expert customer support assistant. Polish and refine the support agent's draft reply. Make it polite, professional, clear, customer-friendly, and properly formatted. Correct any grammar or spelling mistakes. Preserve the main intent and key details of the agent's message. ALWAYS start the reply by addressing the customer by their FIRST name ONLY (e.g. 'Hi [First Name],'). ALWAYS end the reply by signing off with 'Best regards,\nCode with Prem Support'. Return ONLY the polished response message text, without quotes or additional commentary.",
          prompt: `Ticket Subject: ${ticketSubject || "N/A"}\nTicket Body: ${ticketBody || "N/A"}\nCustomer First Name: ${customerFirstName}\n\nDraft Reply to Polish:\n${trimmedDraft}`,
        });

        if (text && text.trim()) {
          res.json({ polishedReply: text.trim() });
          return;
        }
      } catch (aiError) {
        console.warn("Vercel AI SDK / Gemini call failed, using smart fallback:", aiError);
      }
    }

    // Fallback enhancement for dev mode / when API key is not configured
    const polishedFallback = enhanceDraftFallback(trimmedDraft, customerFirstName);
    res.json({ polishedReply: polishedFallback });
  } catch (error) {
    console.error("Error polishing reply:", error);
    res.status(500).json({ error: "Failed to polish reply message" });
  }
});

function enhanceDraftFallback(draft: string, customerFirstName?: string): string {
  let text = draft.trim();

  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  const name = customerFirstName && customerFirstName.trim() ? customerFirstName.trim() : "there";
  const lower = text.toLowerCase();

  if (lower.startsWith("hello,") || lower.startsWith("hi,") || lower.startsWith("dear,")) {
    text = text.replace(/^(hello|hi|dear),/i, `$1 ${name},`);
  } else if (!lower.startsWith("hi") && !lower.startsWith("hello") && !lower.startsWith("dear")) {
    text = `Hi ${name},\n\n${text}`;
  }

  if (!/[.!?]$/.test(text)) {
    text += ".";
  }

  if (!lower.includes("code with prem support") && !lower.includes("code with mosh support")) {
    text += "\n\nIf you need any further assistance, please feel free to reach out.\n\nBest regards,\nCode with Prem Support";
  }

  return text;
}

// ── POST /api/ai/summarize ──────────────────────────────────────────
// Summarizes a ticket and its conversation thread history using AI model
router.post("/summarize", async (req, res) => {
  try {
    const { ticketSubject, ticketBody, replies } = req.body;

    const formattedReplies = Array.isArray(replies) && replies.length > 0
      ? replies
          .map((r: any, idx: number) => `Reply #${idx + 1} [${r.senderType || "agent"}]: ${r.message || ""}`)
          .join("\n")
      : "No replies yet.";

    if (apiKey && apiKey.trim() !== "") {
      try {
        const { text } = await generateText({
          model: google("gemini-1.5-flash"),
          system:
            "You are an expert customer support assistant. Provide a concise, clear 2-3 bullet point summary of the ticket issue and its conversation thread history. Focus on the main customer problem and the latest status/updates.",
          prompt: `Ticket Subject: ${ticketSubject || "N/A"}\nTicket Body: ${ticketBody || "N/A"}\n\nConversation History:\n${formattedReplies}`,
        });

        if (text && text.trim()) {
          res.json({ summary: text.trim() });
          return;
        }
      } catch (aiError) {
        console.warn("Vercel AI SDK / Gemini summarize call failed, using fallback:", aiError);
      }
    }

    const summaryFallback = generateSummaryFallback(ticketSubject, ticketBody, replies);
    res.json({ summary: summaryFallback });
  } catch (error) {
    console.error("Error summarizing ticket:", error);
    res.status(500).json({ error: "Failed to summarize ticket" });
  }
});

function generateSummaryFallback(subject?: string, body?: string, replies?: any[]): string {
  let summary = `• Main Subject: ${subject || "Support Inquiry"}\n• Ticket Problem: ${body ? (body.length > 120 ? body.slice(0, 120) + "..." : body) : "N/A"}`;
  if (Array.isArray(replies) && replies.length > 0) {
    summary += `\n• Discussion: ${replies.length} message(s) exchanged in conversation thread.`;
  } else {
    summary += `\n• Discussion: No replies in conversation history yet.`;
  }
  return summary;
}

export default router;
