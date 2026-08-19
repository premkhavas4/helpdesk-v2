import { PgBoss } from "pg-boss";
import { processTicketWithAI, classifyTicketWithGPTNonBlocking } from "./aiService.js";

const QUEUE_NAME = "classify-ticket";
let boss: PgBoss | null = null;
let isStarted = false;

/**
 * Initializes and starts the pg-boss background job queue using PostgreSQL connection.
 */
export async function startQueue(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[Queue Service] DATABASE_URL not found, using fallback classifier.");
    return;
  }

  try {
    boss = new PgBoss(connectionString);

    boss.on("error", (error) => console.error("[pg-boss Error]", error));

    await boss.start();
    isStarted = true;
    console.log("✓ pg-boss background job queue started successfully");

    await boss.createQueue(QUEUE_NAME).catch(() => {});

    // Register job subscription/worker
    await boss.work<{ ticketId: number; subject: string; body: string }>(
      QUEUE_NAME,
      async (jobs) => {
        for (const job of jobs) {
          const { ticketId, subject, body } = job.data;
          console.log(`[pg-boss Worker] Processing job #${job.id} for ticket #${ticketId}`);
          await processTicketWithAI(ticketId, subject, body);
        }
      }
    );
  } catch (error) {
    console.error("✗ Failed to start pg-boss queue, falling back to setImmediate:", error);
    isStarted = false;
  }
}

/**
 * Enqueues a ticket classification job into pg-boss asynchronously.
 * Falls back to setImmediate if pg-boss queue is unavailable.
 */
export function enqueueTicketClassification(ticketId: number, subject: string, body: string): void {
  if (boss && isStarted) {
    boss.send(QUEUE_NAME, { ticketId, subject, body }).catch((err) => {
      console.warn(`[Queue Service] Failed to send job to pg-boss, falling back to setImmediate:`, err);
      classifyTicketWithGPTNonBlocking(ticketId, subject, body);
    });
  } else {
    classifyTicketWithGPTNonBlocking(ticketId, subject, body);
  }
}

export function stopQueue(): Promise<void> {
  if (boss && isStarted) {
    return boss.stop();
  }
  return Promise.resolve();
}
