import "dotenv/config";
import { auth, prisma } from "./auth.js";

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (existingUser) {
    await prisma.account.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log("Deleted old admin user");
  }

  await auth.api.signUpEmail({
    body: {
      name: "Admin User",
      email: "admin@example.com",
      password: "password",
    },
  });

  await prisma.user.update({
    where: { email: "admin@example.com" },
    data: { role: "admin" },
  });

  console.log("Successfully created admin user: admin@example.com / password");
}

main().catch(console.error).finally(() => prisma.$disconnect());
