import { prisma } from "./auth.js";

async function main() {
  await prisma.user.deleteMany({
    where: { email: "admin@helpdesk.local" },
  });

  await prisma.user.updateMany({
    where: { email: "agent1@example.com" },
    data: { name: "Agent 1" },
  });

  await prisma.user.updateMany({
    where: { email: "agent2@example.com" },
    data: { name: "Agent 2" },
  });

  await prisma.user.updateMany({
    where: { email: "admin@example.com" },
    data: { name: "Admin" },
  });

  await prisma.user.updateMany({
    where: { email: "test@helpdesk.local" },
    data: { name: "Test User" },
  });

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true },
  });
  console.log("SUCCESSFULLY UPDATED USERS:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
