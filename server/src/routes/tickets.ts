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
        include: {
          assignedUser: { select: { id: true, name: true, email: true, role: true } },
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

// ── GET /api/tickets/agents ─────────────────────────────────────────
// Fetch active agents/users for ticket assignment dropdowns
router.get("/agents", async (req, res) => {
  try {
    const rawAgents = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    const formattedMap = new Map<string, typeof rawAgents[0]>();

    for (const agent of rawAgents) {
      let displayName = agent.name;
      const lowerName = agent.name.toLowerCase();
      const lowerEmail = agent.email.toLowerCase();

      if (lowerName.includes("admin") || lowerEmail.includes("admin")) {
        displayName = "Admin";
      } else if (lowerName.includes("one") || lowerName.includes("1") || lowerEmail.includes("agent1")) {
        displayName = "Agent 1";
      } else if (lowerName.includes("two") || lowerName.includes("2") || lowerEmail.includes("agent2")) {
        displayName = "Agent 2";
      } else if (lowerName.includes("test") || lowerEmail.includes("test")) {
        displayName = "Test User";
      }

      if (!formattedMap.has(displayName)) {
        formattedMap.set(displayName, { ...agent, name: displayName });
      }
    }

    const agents = Array.from(formattedMap.values());
    res.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    res.status(500).json({ error: "Failed to fetch agents list" });
  }
});

// ── GET /api/tickets/:id ─────────────────────────────────────────────
// Fetch a single ticket by ID
router.get("/:id", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        replies: { include: { agent: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    res.status(500).json({ error: "Failed to fetch ticket details" });
  }
});

// ── PATCH /api/tickets/:id/assign ───────────────────────────────────
// Assign or unassign a ticket to an agent (ensures assignedTo / assignedToId is a valid user)
router.patch("/:id/assign", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    // Accept assignedTo or assignedToId
    const rawAssignedTo = req.body.assignedToId !== undefined ? req.body.assignedToId : req.body.assignedTo;
    const assignedTo = typeof rawAssignedTo === "string" && rawAssignedTo.trim() !== "" ? rawAssignedTo.trim() : null;

    if (assignedTo) {
      // Verify assignedTo / assignedToId is a valid user who is not soft-deleted
      const validUser = await prisma.user.findFirst({
        where: {
          id: assignedTo,
          deletedAt: null,
        },
      });

      if (!validUser) {
        res.status(400).json({
          error: "Invalid assignedTo user: User does not exist or has been deleted",
        });
        return;
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedTo,
      },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.json({ message: "Ticket assigned successfully", ticket });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({ error: "Failed to assign ticket" });
  }
});

// ── PATCH /api/tickets/:id ───────────────────────────────────────────
// General update ticket endpoint with assignedTo / assignedToId validation
router.patch("/:id", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const { status, category, assignedTo, assignedToId } = req.body;
    const rawAssignedTo = assignedToId !== undefined ? assignedToId : assignedTo;

    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;

    if (rawAssignedTo !== undefined) {
      const assignedToIdValue = typeof rawAssignedTo === "string" && rawAssignedTo.trim() !== "" ? rawAssignedTo.trim() : null;

      if (assignedToIdValue) {
        const validUser = await prisma.user.findFirst({
          where: {
            id: assignedToIdValue,
            deletedAt: null,
          },
        });

        if (!validUser) {
          res.status(400).json({
            error: "Invalid assignedTo user: User does not exist or has been deleted",
          });
          return;
        }
      }

      updateData.assignedTo = assignedToIdValue;
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.json({ message: "Ticket updated successfully", ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

export default router;
