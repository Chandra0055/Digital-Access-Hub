import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, toolsTable, subscriptionsTable, userToolAccessTable } from "@workspace/db";
import { eq, count, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { syncToolCookies } from "../services/cookieSyncer.js";
import { z } from "zod";

const router: IRouter = Router();

// ─── Serializers ─────────────────────────────────────────────────────────────

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    validUntil: user.validUntil ?? null,
    createdAt: user.createdAt,
  };
}

function serializeSubscription(sub: typeof subscriptionsTable.$inferSelect) {
  return {
    id: sub.id,
    userId: sub.userId,
    status: sub.status,
    planType: sub.planType,
    expiresAt: sub.expiresAt ?? null,
    createdAt: sub.createdAt,
  };
}

// ─── Inline validation schemas ────────────────────────────────────────────────

const UserIdParam = z.object({ id: z.coerce.number().int().positive() });

const CreateUserBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "subscriber"]).default("subscriber"),
  accessDays: z.number().int().min(0).optional(),
  toolIds: z.array(z.number().int().positive()).optional(),
});

const UpdateUserBody = z.object({
  role: z.enum(["admin", "subscriber"]).optional(),
  subscriptionStatus: z.enum(["active", "inactive", "trial", "expired"]).optional(),
  accessDays: z.number().int().min(0).nullable().optional(),
});

const SetUserToolsBody = z.object({
  toolIds: z.array(z.number().int().positive()),
});

// ─── GET /admin/users ─────────────────────────────────────────────────────────

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const subs = await db.select().from(subscriptionsTable);
  const accesses = await db.select().from(userToolAccessTable);

  const subMap = new Map(subs.map((s) => [s.userId, s]));
  const accessMap = new Map<number, number[]>();
  for (const a of accesses) {
    if (!accessMap.has(a.userId)) accessMap.set(a.userId, []);
    accessMap.get(a.userId)!.push(a.toolId);
  }

  const result = users.map((user) => {
    const sub = subMap.get(user.id);
    return {
      ...serializeUser(user),
      toolIds: accessMap.get(user.id) ?? [],
      subscription: sub ? serializeSubscription(sub) : undefined,
    };
  });

  res.json(result);
});

// ─── POST /admin/users ────────────────────────────────────────────────────────

router.post("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role, accessDays, toolIds } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // accessDays === 0 → immediately expired (validUntil set to 1 second ago)
  const validUntil = accessDays === undefined || accessDays === null
    ? null
    : accessDays === 0
    ? new Date(Date.now() - 1000)
    : new Date(Date.now() + accessDays * 86_400_000);

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      passwordHash,
      role,
      subscriptionStatus: "active",
      ...(validUntil ? { validUntil } : {}),
    })
    .returning();

  // Grant tool access if specified
  if (toolIds && toolIds.length > 0) {
    await db.insert(userToolAccessTable).values(
      toolIds.map((toolId) => ({ userId: user.id, toolId })),
    );
  }

  res.status(201).json({
    ...serializeUser(user),
    toolIds: toolIds ?? [],
  });
});

// ─── PATCH /admin/users/:id ───────────────────────────────────────────────────

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid user id" }); return; }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (body.data.role) updateData.role = body.data.role;
  if (body.data.subscriptionStatus) updateData.subscriptionStatus = body.data.subscriptionStatus;

  if (body.data.accessDays !== undefined) {
    if (body.data.accessDays === null) {
      updateData.validUntil = null;
    } else if (body.data.accessDays === 0) {
      // 0 days = immediately expired
      updateData.validUntil = new Date(Date.now() - 1000);
    } else {
      updateData.validUntil = new Date(Date.now() + body.data.accessDays * 86_400_000);
    }
  }

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json(serializeUser(user));
});

// ─── DELETE /admin/users/:id ──────────────────────────────────────────────────

router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid user id" }); return; }

  const [user] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
});

// ─── GET /admin/users/:id/tools ───────────────────────────────────────────────

router.get("/admin/users/:id/tools", requireAdmin, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid user id" }); return; }

  const rows = await db
    .select()
    .from(userToolAccessTable)
    .where(eq(userToolAccessTable.userId, params.data.id));

  res.json({ toolIds: rows.map((r) => r.toolId) });
});

// ─── PUT /admin/users/:id/tools ───────────────────────────────────────────────
// Replaces the user's entire tool access list.

router.put("/admin/users/:id/tools", requireAdmin, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid user id" }); return; }

  const body = SetUserToolsBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { toolIds } = body.data;

  // Clear existing access
  await db.delete(userToolAccessTable).where(eq(userToolAccessTable.userId, params.data.id));

  // Insert new access
  if (toolIds.length > 0) {
    await db.insert(userToolAccessTable).values(
      toolIds.map((toolId) => ({ userId: params.data.id, toolId })),
    );
  }

  res.json({ toolIds });
});

// ─── GET /admin/stats ─────────────────────────────────────────────────────────

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);
  const [totalToolsResult] = await db.select({ count: count() }).from(toolsTable);
  const [activeSubsResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.subscriptionStatus, "active"));

  const toolsByCategory = await db
    .select({ category: toolsTable.category, count: count() })
    .from(toolsTable)
    .groupBy(toolsTable.category);

  const subscriptionsByPlan = await db
    .select({ planType: subscriptionsTable.planType, count: count() })
    .from(subscriptionsTable)
    .groupBy(subscriptionsTable.planType);

  const recentUsers = await db
    .select()
    .from(usersTable)
    .orderBy(sql`${usersTable.createdAt} desc`)
    .limit(5);

  res.json({
    totalUsers: totalUsersResult.count,
    totalTools: totalToolsResult.count,
    activeSubscriptions: activeSubsResult.count,
    toolsByCategory: toolsByCategory.map((r) => ({ category: r.category, count: r.count })),
    subscriptionsByPlan: subscriptionsByPlan.map((r) => ({ planType: r.planType, count: r.count })),
    recentUsers: recentUsers.map(serializeUser),
  });
});

// ─── GET /admin/subscriptions ─────────────────────────────────────────────────

router.get("/admin/subscriptions", requireAdmin, async (_req, res): Promise<void> => {
  const subs = await db.select().from(subscriptionsTable).orderBy(subscriptionsTable.createdAt);
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = subs.map((sub) => {
    const user = userMap.get(sub.userId);
    return { ...serializeSubscription(sub), user: user ? serializeUser(user) : undefined };
  });

  res.json(result);
});

// ─── POST /admin/tools/:id/force-sync ────────────────────────────────────────

const ToolIdParam = z.object({ id: z.coerce.number().int().positive() });

router.post("/admin/tools/:id/force-sync", requireAdmin, async (req, res): Promise<void> => {
  const params = ToolIdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid tool id" }); return; }

  const [tool] = await db
    .select({ id: toolsTable.id, botLoginUrl: toolsTable.botLoginUrl })
    .from(toolsTable)
    .where(eq(toolsTable.id, params.data.id));

  if (!tool) { res.status(404).json({ error: "Tool not found" }); return; }

  if (!tool.botLoginUrl) {
    res.status(422).json({ error: "Bot credentials not configured for this tool" });
    return;
  }

  const result = await syncToolCookies(params.data.id);
  res.json(result);
});

export default router;
