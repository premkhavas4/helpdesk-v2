import { Router } from "express";
import { prisma } from "../auth.js";
import { createTicketFromEmailSchema, TicketStatus, TicketCategory, SenderType } from "../../../core/src/schemas/ticket.js";
import { formatAgents } from "../../../core/src/utils/formatAgents.js";
import { enqueueTicketClassification } from "../services/queueService.js";
import { sendTicketReplyEmail } from "../services/emailService.js";
import { checkGmailInbox } from "../services/emailListenerService.js";

const router = Router();

// ── POST /api/tickets/sync-inbox ────────────────────────────────────
// Manually triggers Gmail inbox sync
router.post("/sync-inbox", async (_req, res) => {
  try {
    checkGmailInbox().catch((err) => console.warn("Manual sync error:", err));
    res.json({ message: "Gmail inbox sync initiated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger inbox sync" });
  }
});

// ── POST /api/tickets/inbound ───────────────────────────────────────
// Receives an incoming email at support address and converts it to a ticket
router.post("/inbound", async (req, res) => {
  try {
    // Standardize body fields (supporting 'from'/'senderEmail', 'fromName'/'senderName', and 'text'/'body')
    const rawPayload = {
      senderName: req.body.senderName || req.body.fromName || req.body.name || "Support Customer",
      senderEmail: req.body.senderEmail || req.body.from || req.body.sender || "customer@example.com",
      subject: req.body.subject || "Incoming Support Request",
      body: req.body.body || req.body.text || req.body["body-plain"] || "New ticket request received.",
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

    const aiAgent = await prisma.user.findUnique({ where: { email: "ai.agent@helpdesk.local" } });

    // Create ticket in database with initial status 'new' and assigned to AI Agent
    const ticket = await prisma.ticket.create({
      data: {
        senderName,
        senderEmail,
        subject,
        body,
        status: TicketStatus.NEW,
        category: category || null,
        assignedTo: aiAgent?.id || null,
      },
    });

    // Enqueue ticket classification & auto-resolution job into pg-boss background queue
    enqueueTicketClassification(ticket.id, subject, body);

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
router.post(["/webhook", "/"], async (req, res) => {
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

    const aiAgent = await prisma.user.findUnique({ where: { email: "ai.agent@helpdesk.local" } });

    const ticket = await prisma.ticket.create({
      data: {
        senderName,
        senderEmail,
        subject,
        body,
        status: TicketStatus.NEW,
        category: category || null,
        assignedTo: aiAgent?.id || null,
      },
    });

    // Enqueue ticket classification & auto-resolution job into pg-boss background queue
    enqueueTicketClassification(ticket.id, subject, body);

    res.status(201).json({
      message: "Ticket created from inbound email webhook successfully",
      ticket,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Failed to process email webhook" });
  }
});

// ── GET /api/tickets/stats ──────────────────────────────────────────
// Analytics dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const aiUser = await prisma.user.findUnique({ where: { email: "ai.agent@helpdesk.local" } });
    const aiUserId = aiUser?.id;

    const [totalTickets, openTickets, aiResolvedTickets, resolvedTickets] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.ticket.count({
        where: {
          status: TicketStatus.RESOLVED,
          OR: [
            ...(aiUserId ? [{ assignedTo: aiUserId }] : []),
            { replies: { some: { senderType: SenderType.AI } } },
          ],
        },
      }),
      prisma.ticket.findMany({
        where: { status: TicketStatus.RESOLVED },
        select: {
          createdAt: true,
          updatedAt: true,
          replies: {
            select: { createdAt: true, sentAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    const totalResolvedCount = resolvedTickets.length;
    const aiResolvedPercentage = totalTickets > 0 ? parseFloat(((aiResolvedTickets / totalTickets) * 100).toFixed(1)) : 0;

    let avgResolutionTimeMs = 0;
    let formattedAvgResolutionTime = "N/A";

    if (totalResolvedCount > 0) {
      const totalDurationMs = resolvedTickets.reduce((acc, t) => {
        const created = t.createdAt ? new Date(t.createdAt).getTime() : Date.now();
        let resolvedAt = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;

        // Fallback to latest reply timestamp if updatedAt is equal to createdAt
        if (resolvedAt <= created && t.replies?.[0]) {
          const replyTime = t.replies[0].sentAt || t.replies[0].createdAt;
          if (replyTime) resolvedAt = new Date(replyTime).getTime();
        }

        const diff = resolvedAt > created ? resolvedAt - created : 350; // Default sub-second AI resolution ~350ms
        return acc + diff;
      }, 0);

      avgResolutionTimeMs = Math.round(totalDurationMs / totalResolvedCount);
      formattedAvgResolutionTime = formatDuration(avgResolutionTimeMs);
    }

    // Past 30 days daily ticket count aggregation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const ticketsInPast30Days = await prisma.ticket.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    const countMap = new Map<string, number>();
    for (const t of ticketsInPast30Days) {
      if (t.createdAt) {
        const dateStr = new Date(t.createdAt).toISOString().split("T")[0]!;
        countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
      }
    }

    const dailyTickets: { date: string; label: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split("T")[0]!;
      const formattedLabel = i === 0 ? "Today" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const count = countMap.get(isoDate) || 0;

      dailyTickets.push({
        date: isoDate,
        label: formattedLabel,
        count,
      });
    }

    res.json({
      totalTickets,
      openTickets,
      aiResolvedTickets,
      aiResolvedPercentage,
      avgResolutionTimeMs,
      formattedAvgResolutionTime,
      dailyTickets,
    });
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    res.status(500).json({ error: "Failed to fetch ticket statistics" });
  }
});

function formatDuration(ms: number): string {
  if (ms <= 0) return "N/A";
  if (ms < 1000) {
    const sec = (ms / 1000).toFixed(1);
    return `${sec}s`;
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) {
    return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes}m`;
  }
  const hours = (seconds / 3600).toFixed(1);
  return `${hours}h`;
}

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
      if (status === "active") {
        where.status = { in: [TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.PROCESSING] };
      } else {
        where.status = status;
      }
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

    const agents = formatAgents(rawAgents);
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

    if (status !== undefined) {
      const allowedStatuses = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED];
      const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "";
      if (!allowedStatuses.includes(normalizedStatus as any)) {
        res.status(400).json({ error: "Invalid ticket status" });
        return;
      }
      updateData.status = normalizedStatus;
    }

    if (category !== undefined) {
      if (category !== null && category !== "") {
        const allowedCategories = [
          TicketCategory.GENERAL_QUESTION,
          TicketCategory.TECHNICAL_QUESTION,
          TicketCategory.REFUND_REQUEST,
        ];
        if (!allowedCategories.includes(category)) {
          res.status(400).json({ error: "Invalid ticket category" });
          return;
        }
        updateData.category = category;
      } else {
        updateData.category = null;
      }
    }

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

// ── POST /api/tickets/:id/replies ───────────────────────────────────
// Submit a reply to a ticket (supports senderType: "agent" | "customer")
router.post("/:id/replies", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const { message, bodyHtml, agentId, senderType } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      res.status(400).json({ error: "Reply message is required" });
      return;
    }

    const normalizedSenderType = (senderType === SenderType.CUSTOMER || senderType === "customer")
      ? SenderType.CUSTOMER
      : SenderType.AGENT;

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    let selectedAgentId: string | null = null;

    if (normalizedSenderType === SenderType.AGENT) {
      selectedAgentId = agentId || null;
      if (!selectedAgentId) {
        if (ticket.assignedTo) {
          selectedAgentId = ticket.assignedTo;
        } else {
          const defaultUser = await prisma.user.findFirst({
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          });
          if (defaultUser) {
            selectedAgentId = defaultUser.id;
          }
        }
      }

      if (!selectedAgentId) {
        res.status(400).json({ error: "No agent available to post reply" });
        return;
      }
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        agentId: selectedAgentId || undefined,
        senderType: normalizedSenderType,
        message: message.trim(),
        bodyHtml: typeof bodyHtml === "string" && bodyHtml.trim() !== "" ? bodyHtml.trim() : null,
        sentAt: new Date(),
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    // Trigger outbound email reply to customer asynchronously
    if (normalizedSenderType === SenderType.AGENT && ticket.senderEmail) {
      sendTicketReplyEmail({
        toEmail: ticket.senderEmail,
        recipientName: ticket.senderName || undefined,
        ticketId: ticket.id,
        subject: ticket.subject,
        replyBody: message.trim(),
      }).catch((err) => {
        console.error("Background email send error:", err);
      });
    }

    res.status(201).json({ message: "Reply added successfully", reply });
  } catch (error) {
    console.error("Error creating ticket reply:", error);
    res.status(500).json({ error: "Failed to create ticket reply" });
  }
});

export default router;
