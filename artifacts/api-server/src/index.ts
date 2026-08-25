import app from "./app";
import { logger } from "./lib/logger";
import cron from "node-cron";
import { db, pool, toolsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { syncToolCookies } from "./services/cookieSyncer.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  // Keep this additive migration safe for existing installations. The
  // project currently applies schema changes at server startup.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS active_session_id TEXT`);

  app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ── Cookie sync cron: every 6 hours ────────────────────────────────────
  cron.schedule("0 */6 * * *", async () => {
    logger.info("Starting scheduled cookie sync for all active tools");

    const activeTools = await db
      .select({ id: toolsTable.id, name: toolsTable.name })
      .from(toolsTable)
      .where(eq(toolsTable.status, "active"));

    // Run one at a time to avoid overloading memory
    for (const tool of activeTools) {
      if (!tool.id) continue;
      logger.info({ toolId: tool.id, name: tool.name }, "Syncing cookies");
      const result = await syncToolCookies(tool.id);
      logger.info({ toolId: tool.id, ...result }, "Sync result");
    }

    logger.info("Scheduled cookie sync complete");
  });
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to initialize database schema");
  process.exit(1);
});
