import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "agent",
        input: false, // don't allow users to set their own role on signup
      },
    },
  },
});