import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "../auth.js";
import { TicketStatus, SenderType } from "../../../core/src/schemas/ticket.js";
import { enqueueTicketClassification } from "./queueService.js";

let isListening = false;
let checkInterval: NodeJS.Timeout | null = null;

/**
 * Connects to Gmail via IMAP, checks unread messages, and automatically imports them as Tickets
 */
export async function checkGmailInbox() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass || user.includes("your-email") || pass.includes("your-app")) {
    return;
  }

  const cleanPass = pass.replace(/\s+/g, "");

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: parseInt(process.env.IMAP_PORT || "993", 10),
    secure: true,
    auth: { user, pass: cleanPass },
    logger: false,
  });

  // Handle socket timeouts & errors quietly without crashing Node process
  client.on("error", (err) => {
    if (err?.code !== "ETIMEOUT") {
      console.warn("[Gmail Sync Socket Warning]", err?.message || err);
    }
  });

  try {
    console.log("[Gmail Sync] Connecting to Gmail IMAP...");
    await client.connect();

    const mailboxStatus = await client.status("INBOX", { messages: true });
    const totalMessages = mailboxStatus.messages || 0;
    console.log(`[Gmail Sync] Connected to INBOX (${totalMessages} total messages)`);

    if (totalMessages === 0) {
      await client.logout();
      return;
    }

    const startSeq = Math.max(1, totalMessages - 15);

    const lock = await client.getMailboxLock("INBOX");
    try {
      // Fetch recent 15 messages in INBOX
      const messages = client.fetch(`${startSeq}:*`, { source: true, uid: true, envelope: true, flags: true });

      for await (const message of messages) {
        const envFrom = message.envelope?.from?.[0]?.address?.toLowerCase();
        const envName = message.envelope?.from?.[0]?.name || envFrom || "Customer";
        const envSubject = message.envelope?.subject || "(No Subject)";

        // Skip system automated replies
        if (!envFrom || (envFrom === user.toLowerCase() && envSubject.includes("Re: [Ticket #"))) {
          continue;
        }

        // Check if subject contains ticket ID format like [Ticket #123]
        const ticketMatch = envSubject.match(/\[Ticket\s*#(\d+)\]/i);
        let existingTicketId: number | null = null;
        if (ticketMatch && ticketMatch[1]) {
          existingTicketId = parseInt(ticketMatch[1], 10);
        }

        // Pre-check if new ticket (without ID) already exists in database by sender & subject
        if (!existingTicketId) {
          const alreadyImported = await prisma.ticket.findFirst({
            where: {
              senderEmail: envFrom,
              subject: envSubject.trim(),
            },
          });

          if (alreadyImported) {
            continue; // Extremely fast skip for existing tickets!
          }
        }

        if (!message.source) continue;
        const parsed = await simpleParser(message.source);
        const bodyText = (parsed.text || parsed.html || "").toString();

        let existingTicket = null;
        if (existingTicketId) {
          existingTicket = await prisma.ticket.findUnique({
            where: { id: existingTicketId },
          });
        }

        if (existingTicket) {
          const existingReply = await prisma.ticketReply.findFirst({
            where: {
              ticketId: existingTicket.id,
              message: bodyText.trim(),
            },
          });

          if (!existingReply) {
            await prisma.ticketReply.create({
              data: {
                ticketId: existingTicket.id,
                senderType: SenderType.CUSTOMER,
                message: bodyText.trim(),
                sentAt: parsed.date || new Date(),
              },
            });

            await prisma.ticket.update({
              where: { id: existingTicket.id },
              data: { status: TicketStatus.OPEN, updatedAt: new Date() },
            });

            console.log(`[Gmail Sync] ✓ Customer reply appended to Ticket #${existingTicket.id} from ${envFrom}`);
          }
        } else {
          console.log(`[Gmail Sync] 📩 Importing new email from ${envFrom}: "${envSubject}"`);

          const aiUser = await prisma.user.findUnique({
            where: { email: "ai.agent@helpdesk.local" },
          });

          const newTicket = await prisma.ticket.create({
            data: {
              senderName: envName,
              senderEmail: envFrom,
              subject: envSubject.trim(),
              body: bodyText.trim(),
              status: TicketStatus.OPEN,
              assignedTo: aiUser?.id || null,
            },
          });

          console.log(`[Gmail Sync] 🎉 Created new Ticket #${newTicket.id} for ${envFrom}`);

          enqueueTicketClassification(newTicket.id, newTicket.subject, newTicket.body);
        }

        if (!message.flags?.has("\\Seen")) {
          await client.messageFlagsAdd(String(message.seq), ["\\Seen"]);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error: any) {
    if (!error?.message?.includes("AUTHENTICATIONFAILED")) {
      console.warn("[Gmail Sync]", error?.message || error);
    }
  }
}

/**
 * Starts background poller to check Gmail inbox every 20 seconds
 */
export function startEmailListener() {
  if (isListening) return;
  isListening = true;

  console.log("✓ Gmail Inbox Poller started (syncing unread emails every 20s)...");

  // Initial check
  checkGmailInbox().catch(() => {});

  // Polling loop
  checkInterval = setInterval(() => {
    checkGmailInbox().catch(() => {});
  }, 20000);
}

export function stopEmailListener() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  isListening = false;
}
