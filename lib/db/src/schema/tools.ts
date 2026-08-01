import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const toolsTable = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["active", "inactive", "coming_soon"] })
    .notNull()
    .default("active"),
  category: text("category").notNull(),
  redirectUrl: text("redirect_url").notNull(),
  iconUrl: text("icon_url"),
  cookieData: text("cookie_data"),
  // ── Bot auto-sync fields ──────────────────────────────────────────────
  botLoginUrl: text("bot_login_url"),
  botUsername: text("bot_username"),
  /** AES-256-GCM encrypted password — never returned to clients */
  botPassword: text("bot_password"),
  lastCookieSync: timestamp("last_cookie_sync", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertToolSchema = createInsertSchema(toolsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof toolsTable.$inferSelect;
