import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const adminEmail = 'admin@example.com';
const adminPassword = 'SuperSecretPassword123';

async function main() {
  const existing = await prisma.users.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Admin user '${adminEmail}' already exists – skipping seed.`);
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.users.create({
    data: {
      email: adminEmail,
      password_hash: hash,
      role: "admin",
    },
  });

  console.log(`✅ Created admin user: ${user.email}`);
}

main()
  .catch((e) => console.error('❌ Seed failed:', e))
  .finally(() => prisma.$disconnect());