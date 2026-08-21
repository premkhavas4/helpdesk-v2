import "dotenv/config";
import { auth, prisma } from "./auth.js";

async function testLogin() {
  try {
    const res = await auth.api.signInEmail({
      body: {
        email: "admin@example.com",
        password: "password",
      },
    });
    console.log("LOGIN SUCCESS:", res);
  } catch (err: any) {
    console.error("LOGIN ERROR:", err?.message || err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testLogin();
