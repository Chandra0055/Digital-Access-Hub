import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, createSessionId } from "../lib/auth";
import { SignupBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

export function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    validUntil: user.validUntil ?? null,
    createdByAdmin: user.createdByAdmin,
    accessGrantedByAdmin: user.accessGrantedByAdmin,
    createdAt: user.createdAt,
  };
}

// POST /auth/signup
router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: "subscriber", subscriptionStatus: "inactive" })
    .returning();

  const sessionId = createSessionId();
  const [sessionUser] = await db
    .update(usersTable)
    .set({ activeSessionId: sessionId })
    .where(eq(usersTable.id, user.id))
    .returning();
  const token = signToken({ userId: user.id, role: user.role, sessionId });
  res.status(201).json({ token, user: serializeUser(sessionUser ?? user) });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const sessionId = createSessionId();
  const [sessionUser] = await db
    .update(usersTable)
    .set({ activeSessionId: sessionId })
    .where(eq(usersTable.id, user.id))
    .returning();
  const token = signToken({ userId: user.id, role: user.role, sessionId });
  res.json({ token, user: serializeUser(sessionUser ?? user) });
});

// POST /auth/logout
router.post("/auth/logout", (_req, res): void => {
  res.sendStatus(204);
});

// GET /auth/me
router.get("/auth/me", requireAuth, (req, res): void => {
  res.json(serializeUser(req.user!));
});

export default router;
