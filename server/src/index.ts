import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth, prisma } from "./auth.js";
import usersRouter from "./routes/users.js";
import ticketsRouter from "./routes/tickets.js";
import aiRouter from "./routes/ai.js";

import { initSentry, Sentry } from "./sentry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");

// Initialize Sentry error tracking
initSentry();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Body parsing — needed for any non-auth POST/PUT endpoints
app.use(express.json());

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    error: "Too many attempts from this IP, please try again later.",
  },
});
app.use("/api/auth", authLimiter);

// ── Better Auth handler ─────────────────────────────────────────────
// Better Auth handles: sign-up, sign-in, sign-out, session, etc.
// All auth routes live under /api/auth/*
app.all("/api/auth/*splat", toNodeHandler(auth));

// ── Health & Info endpoints ─────────────────────────────────────────

app.get("/", (_req, res) => {
  if (fs.existsSync(clientDistPath)) {
    res.sendFile(path.join(clientDistPath, "index.html"));
    return;
  }
  res.json({
    message: "AI-Powered Helpdesk API Server is running!",
    health: "http://localhost:3000/health",
    api: "http://localhost:3000/api",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (_req, res) => {
  res.json({
    message: "AI-Powered Helpdesk API is running",
  });
});

// ── Current user endpoint ───────────────────────────────────────────
// Returns the full user profile (including role) for the logged-in user.
// Better Auth session only returns basic user info, so we fetch from DB.
app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/webhooks/email", ticketsRouter);
app.use("/api/ai", aiRouter);

// ── Serve Production Client Static Assets ────────────────────────────
if (fs.existsSync(clientDistPath)) {
  console.log(`✓ Serving static client assets from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get("*splat", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

export const AI_AGENT_EMAIL = "ai.agent@helpdesk.local";

export async function ensureDefaultAIAgent() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: AI_AGENT_EMAIL },
    });

    if (existing) {
      console.log("✓ Default AI Agent user already exists");
      return existing;
    }

    const aiUser = await prisma.user.create({
      data: {
        id: "ai-agent-system-id",
        name: "AI",
        email: AI_AGENT_EMAIL,
        role: "agent",
      },
    });

    console.log("✓ Default AI Agent created (AI / ai.agent@helpdesk.local)");
    return aiUser;
  } catch (e) {
    console.error("✗ Failed to ensure default AI Agent:", e);
    return null;
  }
}

// ── Seed default admin user ─────────────────────────────────────────
async function ensureDefaultAdmin() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
      include: { accounts: true },
    });

    if (existing && existing.accounts.length > 0) {
      console.log("✓ Default admin user verified (admin@example.com / password)");
      return;
    }

    if (existing) {
      await prisma.account.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    // Use Better Auth's sign-up to create the admin, so password is
    // properly hashed by Better Auth's internal mechanism.
    await auth.api.signUpEmail({
      body: {
        name: "Admin",
        email: "admin@example.com",
        password: "password",
      },
    });

    // Now set the role to admin
    await prisma.user.update({
      where: { email: "admin@example.com" },
      data: { role: "admin" },
    });

    console.log("✓ Default admin user created (admin@example.com / password)");
  } catch (e) {
    console.error("✗ Failed to ensure default admin user:", e);
  }
}

import { startQueue } from "./services/queueService.js";
import { ensureStoredFunctions } from "./config/ensureStoredFunctions.js";
import { startEmailListener } from "./services/emailListenerService.js";

// ── Sentry Error Handler ────────────────────────────────────────────
try {
  Sentry.setupExpressErrorHandler(app);
} catch (e) {
  // Sentry not initialized or not configured
}

// ── Start server ────────────────────────────────────────────────────

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  if (process.env.DATABASE_URL) {
    ensureStoredFunctions().catch((err) => console.warn("ensureStoredFunctions notice:", err?.message || err));
    ensureDefaultAdmin().catch((err) => console.warn("ensureDefaultAdmin notice:", err?.message || err));
    ensureDefaultAIAgent().catch((err) => console.warn("ensureDefaultAIAgent notice:", err?.message || err));
    startQueue().catch((err) => console.warn("Queue start notice:", err?.message || err));
    startEmailListener();
  }
});