import "dotenv/config";
import { prisma } from "./auth.js";

async function check() {
  const users = await prisma.user.findMany({
    include: {
      accounts: true,
    },
  });
  console.log("USERS AND ACCOUNTS IN DB:", JSON.stringify(users, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
