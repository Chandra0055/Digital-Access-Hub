import { Router, type IRouter } from "express";
import { db, toolsTable, userToolAccessTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import {
  ListToolsQueryParams,
  CreateToolBody,
  GetToolParams,
  UpdateToolParams,
  UpdateToolBody,
  DeleteToolParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeTool(tool: typeof toolsTable.$inferSelect) {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    status: tool.status,
    category: tool.category,
    redirectUrl: tool.redirectUrl,
    iconUrl: tool.iconUrl ?? null,
    cookieData: tool.cookieData ?? null,
    createdAt: tool.createdAt,
  };
}

// GET /tools
router.get("/tools", requireAuth, async (req, res): Promise<void> => {
  // Check access validity for non-admin users
  const user = req.user!;
  if (user.role !== "admin" && user.validUntil && new Date(user.validUntil) < new Date()) {
    res.status(403).json({ error: "Your access has expired. Please contact your administrator." });
    return;
  }

  const parsed = ListToolsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let tools = await db.select().from(toolsTable).orderBy(toolsTable.createdAt);

  // Filter by user's tool access (non-admin with specific grants)
  if (user.role !== "admin") {
    const accessRows = await db
      .select()
      .from(userToolAccessTable)
      .where(eq(userToolAccessTable.userId, user.id));

    if (accessRows.length > 0) {
      const allowedIds = new Set(accessRows.map((r) => r.toolId));
      tools = tools.filter((t) => allowedIds.has(t.id));
    }
  }

  if (params.category) tools = tools.filter((t) => t.category === params.category);
  if (params.status) tools = tools.filter((t) => t.status === params.status);

  res.json(tools.map(serializeTool));
});

// POST /tools
router.post("/tools", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateToolBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [tool] = await db.insert(toolsTable).values(parsed.data).returning();
  res.status(201).json(serializeTool(tool));
});

// GET /tools/:id
router.get("/tools/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetToolParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [tool] = await db.select().from(toolsTable).where(eq(toolsTable.id, params.data.id));
  if (!tool) { res.status(404).json({ error: "Ai Blast not found" }); return; }

  res.json(serializeTool(tool));
});

// PATCH /tools/:id
router.patch("/tools/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateToolParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateToolBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [tool] = await db
    .update(toolsTable)
    .set(body.data)
    .where(eq(toolsTable.id, params.data.id))
    .returning();

  if (!tool) { res.status(404).json({ error: "Ai Blast not found" }); return; }
  res.json(serializeTool(tool));
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
