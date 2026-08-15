import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const user = await prisma.users.findUnique({ where: { email: 'admin@example.com' } });
  console.log('Admin user:', user);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
