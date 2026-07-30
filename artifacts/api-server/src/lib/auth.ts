import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET ?? "kenter-secret-dev";

export function signToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

/**
 * Requires the authenticated user to have an active subscription.
 * Admins always pass. For subscribers: subscriptionStatus must be 'active'
 * and validUntil (if set) must be in the future.
 */
export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    const user = req.user!;
    if (user.role === "admin") { next(); return; }

    if (user.subscriptionStatus !== "active") {
      res.status(403).json({ error: "Subscription expired." });
      return;
    }
    if (user.validUntil && new Date(user.validUntil) < new Date()) {
      res.status(403).json({ error: "Subscription expired." });
      return;
    }
    next();
  });
}
