import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "../auth.js";
import { TicketStatus, SenderType } from "../../../core/src/schemas/ticket.js";
import { enqueueTicketClassification } from "./queueService.js";

let isListening = false;
let checkInterval: NodeJS.Timeout | null = null;
let isSyncing = false;
const processedUids = new Set<number>();

/**
 * Connects to Gmail via IMAP, checks unread messages, and automatically imports them as Tickets
 */
export async function checkGmailInbox() {
  if (isSyncing) return;
  isSyncing = true;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass || user.includes("your-email") || pass.includes("your-app")) {
    isSyncing = false;
    return;
  }

  const cleanUser = user.trim().replace(/^["']|["']$/g, "");
  const cleanPass = pass.trim().replace(/^["']|["']$/g, "");

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: parseInt(process.env.IMAP_PORT || "993", 10),
    secure: true,
    servername: process.env.IMAP_HOST || "imap.gmail.com",
    tls: {
      rejectUnauthorized: false,
      servername: process.env.IMAP_HOST || "imap.gmail.com",
    },
    auth: { user: cleanUser, pass: cleanPass },
    logger: false,
  });

  client.on("error", (err: Error & { code?: string }) => {
    if (err?.code !== "ETIMEOUT" && err?.code !== "ClosedAfterConnectTLS") {
      console.warn("[Gmail Sync Socket Notice]", err?.message || err);
    }
  });

  try {
    await client.connect();

    const mailboxStatus = await client.status("INBOX", { messages: true });
    const totalMessages = mailboxStatus.messages || 0;

    if (totalMessages === 0) {
      await client.logout();
      return;
    }

    const startSeq = Math.max(1, totalMessages - 20);

    const lock = await client.getMailboxLock("INBOX");
    try {
      // 1. Fetch all messages in the range into memory first to avoid IMAP stream conflicts
      const fetchedItems: any[] = [];
      const messagesStream = client.fetch(`${startSeq}:*`, { source: true, uid: true, envelope: true, flags: true });
      for await (const message of messagesStream) {
        fetchedItems.push(message);
      }

      // 2. Process fetched items sequentially
      for (const message of fetchedItems) {
        const uid = message.uid;
        if (uid && processedUids.has(uid)) {
          continue;
        }

        const isUnread = !message.flags?.has("\\Seen");
        const envFrom = message.envelope?.from?.[0]?.address?.toLowerCase()?.trim();
        const envName = message.envelope?.from?.[0]?.name || envFrom || "Customer";
        const envSubject = (message.envelope?.subject || "(No Subject)").replace(/[\r\n\t]/g, "").trim();

        // Skip invalid senders and self-sent emails from our own helpdesk address
        if (!envFrom || envFrom === user.toLowerCase() || envFrom === cleanUser.toLowerCase()) {
          if (uid) processedUids.add(uid);
          continue;
        }

        const ticketMatch = envSubject.match(/\[Ticket\s*#(\d+)\]/i);
        let existingTicketId: number | null = null;
        if (ticketMatch && ticketMatch[1]) {
          existingTicketId = parseInt(ticketMatch[1], 10);
        }

        if (!existingTicketId) {
          const alreadyImported = await prisma.ticket.findFirst({
            where: {
              senderEmail: { equals: envFrom, mode: "insensitive" },
              subject: { equals: envSubject, mode: "insensitive" },
            },
          });

          if (alreadyImported) {
            if (uid) processedUids.add(uid);
            if (isUnread) {
              await client.messageFlagsAdd(String(message.seq), ["\\Seen"]).catch(() => {});
            }
            continue;
          }
        }

        let bodyText = "";
        let parsedDate = new Date();

        if (message.source) {
          try {
            const parsed = await simpleParser(message.source);
            bodyText = (parsed.text || parsed.html || "").toString();
            if (parsed.date) parsedDate = parsed.date;
          } catch (downloadErr) {
            console.warn("[Gmail Sync] Failed to parse message body:", downloadErr);
          }
        }

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
                sentAt: parsedDate,
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
              subject: envSubject,
              body: bodyText.trim(),
              status: TicketStatus.OPEN,
              assignedTo: aiUser?.id || null,
            },
          });

          console.log(`[Gmail Sync] 🎉 Created new Ticket #${newTicket.id} for ${envFrom}`);

          enqueueTicketClassification(newTicket.id, newTicket.subject, newTicket.body);
        }

        if (uid) processedUids.add(uid);
        if (isUnread) {
          await client.messageFlagsAdd(String(message.seq), ["\\Seen"]).catch(() => {});
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error: any) {
    if (error?.reason?.includes("bandwidth limits") || error?.code === "ClosedAfterConnectTLS") {
      // Quietly wait for rate limit to settle
    } else {
      console.warn("[Gmail Sync Notice]", error?.message || error);
    }
    await client.logout().catch(() => {});
  } finally {
    isSyncing = false;
  }
}

/**
 * Starts background poller to check Gmail inbox every 30 seconds
 */
export function startEmailListener() {
  if (isListening) return;
  isListening = true;

  console.log("✓ Gmail Inbox Poller started (syncing unread emails every 30s)...");

  // Initial check
  checkGmailInbox().catch(() => {});

  // Polling loop (every 30s)
  checkInterval = setInterval(() => {
    checkGmailInbox().catch(() => {});
  }, 30000);
}

export function stopEmailListener() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  isListening = false;
}
