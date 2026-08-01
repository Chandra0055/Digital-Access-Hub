import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, toolsTable, userToolAccessTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin, requireActiveSubscription } from "../lib/auth";
import { encrypt } from "../lib/encrypt.js";
import {
  ListToolsQueryParams,
  GetToolParams,
  UpdateToolParams,
  DeleteToolParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── Shared bot-credentials extension for create / update ────────────────────
const BotFields = z.object({
  botLoginUrl: z.string().url().optional().or(z.literal("")),
  botUsername: z.string().optional(),
  botPassword: z.string().optional(),
});

const CreateToolBody = z.object({
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(["active", "inactive", "coming_soon"]).default("active"),
  category: z.string(),
  redirectUrl: z.string(),
  iconUrl: z.string().optional(),
  cookieData: z.string().optional(),
}).merge(BotFields);

const UpdateToolBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "coming_soon"]).optional(),
  category: z.string().optional(),
  redirectUrl: z.string().optional(),
  iconUrl: z.string().optional(),
  cookieData: z.string().optional(),
}).merge(BotFields);

// ── Serializer ───────────────────────────────────────────────────────────────

function serializeTool(
  tool: typeof toolsTable.$inferSelect,
  hasAccess = true,
  hideSecrets = false,
  isAdmin = false,
) {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    status: tool.status,
    category: tool.category,
    redirectUrl: tool.redirectUrl,
    iconUrl: tool.iconUrl ?? null,
    cookieData: (hideSecrets || !hasAccess) ? null : (tool.cookieData ?? null),
    createdAt: tool.createdAt,
    hasAccess,
    // Bot fields — only visible to admins; botPassword is NEVER sent to any client
    ...(isAdmin ? {
      botLoginUrl: tool.botLoginUrl ?? null,
      botUsername: tool.botUsername ?? null,
      lastCookieSync: tool.lastCookieSync ?? null,
    } : {}),
  };
}

// GET /tools — returns ALL tools; hasAccess indicates which ones this user can use
router.get("/tools", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;

  const subscriptionExpired =
    user.role !== "admin" &&
    (user.subscriptionStatus !== "active" ||
      (user.validUntil !== null && new Date(user.validUntil) < new Date()));

  const parsed = ListToolsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let tools = await db.select().from(toolsTable).orderBy(toolsTable.createdAt);

  if (params.category) tools = tools.filter((t) => t.category === params.category);
  if (params.status) tools = tools.filter((t) => t.status === params.status);

  if (user.role === "admin") {
    res.json(tools.map((t) => serializeTool(t, true, false, true)));
    return;
  }

  const accessRows = await db
    .select()
    .from(userToolAccessTable)
    .where(eq(userToolAccessTable.userId, user.id));
  const allowedIds = new Set(accessRows.map((r) => r.toolId));

  res.json(
    tools.map((t) => {
      const hasAccess = allowedIds.has(t.id) && !subscriptionExpired;
      return serializeTool(t, hasAccess, subscriptionExpired, false);
    }),
  );
});

// POST /tools
router.post("/tools", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateToolBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { botPassword, ...rest } = parsed.data;
  const insertData = {
    ...rest,
    ...(botPassword ? { botPassword: encrypt(botPassword) } : {}),
  };

  const [tool] = await db.insert(toolsTable).values(insertData).returning();
  res.status(201).json(serializeTool(tool, true, false, true));
});

// GET /tools/:id — admin sees all; subscriber needs active subscription
router.get("/tools/:id", requireAuth, requireActiveSubscription, async (req, res): Promise<void> => {
  const params = GetToolParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [tool] = await db.select().from(toolsTable).where(eq(toolsTable.id, params.data.id));
  if (!tool) { res.status(404).json({ error: "Ai Blast not found" }); return; }

  const isAdmin = req.user!.role === "admin";
  res.json(serializeTool(tool, true, false, isAdmin));
});

// PATCH /tools/:id
router.patch("/tools/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateToolParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateToolBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { botPassword, ...rest } = body.data;
  const updateData = {
    ...rest,
    ...(botPassword ? { botPassword: encrypt(botPassword) } : {}),
  };

  const [tool] = await db
    .update(toolsTable)
    .set(updateData)
    .where(eq(toolsTable.id, params.data.id))
    .returning();

  if (!tool) { res.status(404).json({ error: "Ai Blast not found" }); return; }
  res.json(serializeTool(tool, true, false, true));
});

// DELETE /tools/:id
router.delete("/tools/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteToolParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [tool] = await db.delete(toolsTable).where(eq(toolsTable.id, params.data.id)).returning();
  if (!tool) { res.status(404).json({ error: "Ai Blast not found" }); return; }
  res.sendStatus(204);
});

export default router;
