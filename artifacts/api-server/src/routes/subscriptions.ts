import { Router, type IRouter } from "express";
import { db, subscriptionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import {
  CreateSubscriptionBody,
  UpdateSubscriptionParams,
  UpdateSubscriptionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

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

// GET /subscriptions/me
router.get("/subscriptions/me", requireAuth, async (req, res): Promise<void> => {
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.user!.id));

  if (!sub) {
    res.status(404).json({ error: "No subscription found" });
    return;
  }

  res.json(serializeSubscription(sub));
});

// POST /subscriptions
router.post("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.id;
  const { planType } = parsed.data;

  // Calculate expiry
  let expiresAt: Date | null = null;
  if (planType === "monthly") {
    expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else if (planType === "annual") {
    expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({ userId, planType, status: "active", expiresAt })
    .returning();

  // Update user subscription status
  await db
    .update(usersTable)
    .set({ subscriptionStatus: "active" })
    .where(eq(usersTable.id, userId));

  res.status(201).json(serializeSubscription(sub));
});

// PATCH /subscriptions/:id
router.patch("/subscriptions/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateSubscriptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateSubscriptionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [sub] = await db
    .update(subscriptionsTable)
    .set(body.data)
    .where(eq(subscriptionsTable.id, params.data.id))
    .returning();

  if (!sub) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json(serializeSubscription(sub));
});

export default router;
