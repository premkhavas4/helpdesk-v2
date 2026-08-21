import "dotenv/config";
import { prisma } from "./auth.js";

async function cleanup() {
  // Keep only the lowest ID for duplicate Security alert tickets
  const duplicates = await prisma.ticket.findMany({
    where: {
      subject: { contains: "Security alert" },
    },
    orderBy: { id: "asc" },
  });

  if (duplicates.length > 1) {
    const keepId = duplicates[0].id;
    const removeIds = duplicates.slice(1).map((t) => t.id);

    console.log(`Keeping Ticket #${keepId}, deleting duplicates:`, removeIds);
    await prisma.ticketReply.deleteMany({ where: { ticketId: { in: removeIds } } });
    await prisma.ticket.deleteMany({ where: { id: { in: removeIds } } });
    console.log("✅ Duplicate Security alert tickets deleted successfully!");
  } else {
    console.log("No duplicate Security alert tickets to clean up.");
  }
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
