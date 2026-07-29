import { Router, type IRouter } from "express";
import { db, usersTable, toolsTable, subscriptionsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { AdminUpdateUserParams, AdminUpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
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

// GET /admin/users
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const subs = await db.select().from(subscriptionsTable);

  const subMap = new Map(subs.map((s) => [s.userId, s]));

  const result = users.map((user) => {
    const sub = subMap.get(user.id);
    return {
      ...serializeUser(user),
      subscription: sub ? serializeSubscription(sub) : undefined,
    };
  });

  res.json(result);
});

// PATCH /admin/users/:id
router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AdminUpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (body.data.role) updateData.role = body.data.role;
  if (body.data.subscriptionStatus) updateData.subscriptionStatus = body.data.subscriptionStatus;

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(user));
});

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);
  const [totalToolsResult] = await db.select({ count: count() }).from(toolsTable);
  const [activeSubsResult] = await db
    .select({ count: count() })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));

  const toolsByCategory = await db
    .select({
      category: toolsTable.category,
      count: count(),
    })
    .from(toolsTable)
    .groupBy(toolsTable.category);

  const subscriptionsByPlan = await db
    .select({
      planType: subscriptionsTable.planType,
      count: count(),
    })
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
    toolsByCategory: toolsByCategory.map((r) => ({
      category: r.category,
      count: r.count,
    })),
    subscriptionsByPlan: subscriptionsByPlan.map((r) => ({
      planType: r.planType,
      count: r.count,
    })),
    recentUsers: recentUsers.map(serializeUser),
  });
});

// GET /admin/subscriptions
router.get(
  "/admin/subscriptions",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const subs = await db
      .select()
      .from(subscriptionsTable)
      .orderBy(subscriptionsTable.createdAt);

    const users = await db.select().from(usersTable);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = subs.map((sub) => {
      const user = userMap.get(sub.userId);
      return {
        ...serializeSubscription(sub),
        user: user ? serializeUser(user) : undefined,
      };
    });

    res.json(result);
  },
);

export default router;
