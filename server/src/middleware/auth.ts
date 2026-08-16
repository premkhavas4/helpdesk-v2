import type { Request, Response, NextFunction } from "express";
import { auth, prisma } from "../auth.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    req.sessionUser = session.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.sessionUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.sessionUser.id },
      select: { role: true },
    });

    if (user?.role?.toLowerCase() !== "admin") {
      res.status(403).json({ error: "Forbidden: Admins only" });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
