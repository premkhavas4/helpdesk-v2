import "dotenv/config";
import express, { type Request, type Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware for auth
import session from "express-session";
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
});
app.use(sessionMiddleware);

// Better Auth must be mounted before express.json()

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers for browser compatibility
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL || "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback simple auth route
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@example.com" && password === "password") {
    req.session!.user = { email };
    res.json({ message: "Logged in" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.use("/api/auth", toNodeHandler(auth));

// API route
app.get("/api", (req: Request, res: Response) => {
  res.json({ message: "AI-Powered Helpdesk API" });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});