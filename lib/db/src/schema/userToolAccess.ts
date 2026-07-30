import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { toolsTable } from "./tools";

export const userToolAccessTable = pgTable(
  "user_tool_access",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    toolId: integer("tool_id")
      .notNull()
      .references(() => toolsTable.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.toolId)],
);

export type UserToolAccess = typeof userToolAccessTable.$inferSelect;
