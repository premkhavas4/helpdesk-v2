import pg from "pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Prem004@127.0.0.1:5432/helpdesk";
const isLocal = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

function getBaseURL(): string {
  let url = process.env.BETTER_AUTH_URL || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || "http://localhost:3000";
  url = url.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

const baseURL = getBaseURL();

function getClientURL(): string {
  let url = process.env.CLIENT_URL || baseURL;
  url = url.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

const clientURL = getClientURL();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL,
  secret: process.env.BETTER_AUTH_SECRET || "helpdesk-dev-secret-change-this-123456789",

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    clientURL,
    baseURL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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