import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = "admin@example.com";

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Admin user '${adminEmail}' already exists – skipping seed.`);
    return;
  }

  console.log("Note: Admin user will be auto-created when the server starts.");
  console.log("Run `bun run dev` to start the server and create the admin user.");
}

main()
  .catch((e) => console.error("❌ Seed failed:", e))
  .finally(() => prisma.$disconnect());