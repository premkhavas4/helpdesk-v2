import { Router } from "express";
import { prisma } from "../auth.js";
import { createTicketFromEmailSchema, TicketStatus } from "../../../core/src/schemas/ticket.js";

const router = Router();

// ── POST /api/tickets/inbound ───────────────────────────────────────
// Receives an incoming email at support address and converts it to a ticket
router.post("/inbound", async (req, res) => {
  try {
    // Standardize body fields (supporting 'from'/'senderEmail', 'fromName'/'senderName', and 'text'/'body')
    const rawPayload = {
      senderName: req.body.senderName || req.body.fromName || req.body.name,
      senderEmail: req.body.senderEmail || req.body.from || req.body.sender,
      subject: req.body.subject,
      body: req.body.body || req.body.text || req.body["body-plain"],
      category: req.body.category,
    };

    const validation = createTicketFromEmailSchema.safeParse(rawPayload);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0]?.message || "Invalid payload",
      });
      return;
    }

    const { senderName, senderEmail, subject, body, category } = validation.data;

    // Create ticket in database
    const ticket = await prisma.ticket.create({
      data: {
        senderName,
        senderEmail,
        subject,
        body,
        status: TicketStatus.OPEN,
        category,
      },
    });

    res.status(201).json({
      message: "Ticket created from email successfully",
      ticket,
    });
  } catch (error) {
    console.error("Error creating ticket from email:", error);
    res.status(500).json({ error: "Failed to process incoming support email" });
  }
});

// ── POST /api/webhooks/email ────────────────────────────────────────
// Alias webhook endpoint for email service integrations (SendGrid/Mailgun/etc.)
router.post("/webhook", async (req, res) => {
  try {
    const rawPayload = {
      senderName: req.body.senderName || req.body.fromName || req.body.name,
      senderEmail: req.body.senderEmail || req.body.from || req.body.sender,
      subject: req.body.subject,
      body: req.body.body || req.body.text || req.body["body-plain"],
      category: req.body.category,
    };

    const validation = createTicketFromEmailSchema.safeParse(rawPayload);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0]?.message || "Invalid payload",
      });
      return;
    }

    const { senderName, senderEmail, subject, body, category } = validation.data;

    const ticket = await prisma.ticket.create({
      data: {
        senderName,
        senderEmail,
        subject,
        body,
        status: TicketStatus.OPEN,
        category,
      },
    });

    res.status(201).json({
      message: "Ticket created from inbound email webhook successfully",
      ticket,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Failed to process email webhook" });
  }
});

// ── GET /api/tickets ────────────────────────────────────────────────
// List tickets
router.get("/", async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

export default router;
