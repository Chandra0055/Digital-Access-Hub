---
name: Per-user tool access architecture
description: How Ai Blast access control works — junction table, empty = all
---

## Rule
The `user_tool_access` table (userId FK → users, toolId FK → tools, UNIQUE userId+toolId) controls which Ai Blasts a subscriber can see.

**Logic in GET /tools:**
- Admin: always sees all tools
- Subscriber with ≥1 row in user_tool_access: only sees those tools
- Subscriber with 0 rows: sees all tools (backward-compatible default)

**Admin API:**
- `PUT /admin/users/:id/tools` with `{ toolIds: number[] }` replaces the entire access list
- `GET /admin/users/:id/tools` returns `{ toolIds }` (not needed in UI since adminListUsers already includes toolIds)
- adminListUsers response includes `toolIds` field (pre-joined in the list query)

**Why:** Flexibility — admin can restrict specific users without affecting others; no grants = no restriction.
**How to apply:** When adding new tool-gating logic, always check `user.role !== "admin"` first before querying userToolAccessTable.
