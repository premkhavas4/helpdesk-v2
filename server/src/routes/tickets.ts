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
// List tickets with server-side sorting & filtering
router.get("/", async (req, res) => {
  try {
    const { sortBy = "id", sortOrder = "desc", search, status, category, page = "1", pageSize = "10" } = req.query;

    const allowedSortFields = ["id", "subject", "senderName", "senderEmail", "status", "category", "createdAt"];
    const sortField = typeof sortBy === "string" && allowedSortFields.includes(sortBy) ? sortBy : "id";
    const order = typeof sortOrder === "string" && sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

    const pageNum = Math.max(1, parseInt(typeof page === "string" ? page : "1", 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(typeof pageSize === "string" ? pageSize : "10", 10) || 10));
    const skip = (pageNum - 1) * limit;

    const where: any = {};
    if (typeof status === "string" && status.trim() !== "" && status !== "all") {
      where.status = status;
    }
    if (typeof category === "string" && category.trim() !== "" && category !== "all") {
      where.category = category;
    }
    if (typeof search === "string" && search.trim() !== "") {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { senderName: { contains: search, mode: "insensitive" } },
        { senderEmail: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [totalCount, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: {
          [sortField]: order,
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      tickets,
      totalCount,
      page: pageNum,
      pageSize: limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

export default router;
