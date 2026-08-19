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
          model: google("gemini-1.5-pro"),
          system:
            "You are an expert customer support agent. Polish and refine the support agent's draft reply. Make it polite, professional, clear, and helpful. Correct any grammar or spelling mistakes. Preserve the main intent and key details of the agent's message. ALWAYS start the polished reply by addressing the customer by their FIRST name ONLY (e.g. 'Hello [First Name],'). Sign the polished reply using the agent's name. Also include https://codewithmosh.com at the end. Return ONLY the polished response message text, without quotes or additional commentary.",
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
    text = `Hello ${name},\n\n${text}`;
  }

  if (!/[.!?]$/.test(text)) {
    text += ".";
  }

  if (!lower.includes("regards") && !lower.includes("best") && !lower.includes("thank")) {
    text += "\n\nThank you for reaching out. Please let us know if you need any further assistance!\n\nBest regards,\nSupport Team";
  }

  if (!text.includes("https://codewithmosh.com")) {
    text += "\n\nhttps://codewithmosh.com";
  }

  return text;
}

export default router;
