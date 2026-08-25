import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * If a user's validUntil has passed and they're not already 'expired',
 * auto-update their subscriptionStatus to 'expired' in the DB and on the object.
 */
async function autoExpireIfNeeded(user: typeof usersTable.$inferSelect): Promise<typeof usersTable.$inferSelect> {
  if (
    user.role !== "admin" &&
    user.subscriptionStatus !== "expired" &&
    user.validUntil !== null &&
    new Date(user.validUntil) < new Date()
  ) {
    const [updated] = await db
      .update(usersTable)
      .set({ subscriptionStatus: "expired" })
      .where(eq(usersTable.id, user.id))
      .returning();
    return updated ?? user;
  }
  return user;
}

const JWT_SECRET = process.env.SESSION_SECRET ?? "kenter-secret-dev";

export function signToken(payload: { userId: number; role: string; sessionId?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number; role: string; sessionId?: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: string; sessionId?: string };
}

export function createSessionId(): string {
  return randomUUID();
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
    const [rawUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));
    if (!rawUser) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    // Subscribers may use only the most recently issued session. Admins are
    // intentionally exempt so administrators can work from multiple devices.
    if (
      rawUser.role !== "admin" &&
      (!payload.sessionId || !rawUser.activeSessionId || payload.sessionId !== rawUser.activeSessionId)
    ) {
      res.status(401).json({ error: "This account was signed in on another device." });
      return;
    }
    req.user = await autoExpireIfNeeded(rawUser);
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
