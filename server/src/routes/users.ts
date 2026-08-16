import { Router } from "express";
import { prisma, auth } from "../auth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Protect all routes under this router
router.use(requireAuth);
router.use(requireAdmin);

// ── GET /api/users ──────────────────────────────────────────────────
// Returns a list of all registered users/agents
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ── POST /api/users ─────────────────────────────────────────────────
// Allows admin to create a new user/agent
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    // 1. Create user using Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: name || email.split("@")[0],
        email,
        password,
      },
    });

    if (!signUpResult?.user) {
      res.status(400).json({ error: "Failed to create user account" });
      return;
    }

    // 2. Update user role in database
    const finalUser = await prisma.user.update({
      where: { id: signUpResult.user.id },
      data: {
        role: role || "agent",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ user: finalUser });
  } catch (error: any) {
    console.error("Error creating user:", error);
    // Better Auth might throw specific error messages, check for duplicate emails
    const message = error.message || "Failed to create user";
    res.status(400).json({ error: message });
  }
});

// ── PUT /api/users/:id ──────────────────────────────────────────────
// Allows admin to update user's name or role
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(400).json({ error: "Failed to update user. User might not exist." });
  }
});

// ── DELETE /api/users/:id ───────────────────────────────────────────
// Allows admin to delete a user/agent by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (req.sessionUser && req.sessionUser.id === id) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(400).json({ error: "Failed to delete user. User might not exist." });
  }
});

export default router;
