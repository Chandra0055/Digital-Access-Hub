---
name: Validity / expiry pattern
description: How time-limited access works for customers
---

## Rule
`users.valid_until` (TIMESTAMPTZ, nullable) gates subscriber access to tools.

**API pattern:**
- Admin sends `accessDays: number` → server computes `validUntil = now + accessDays * 86400000ms`
- Admin sends `accessDays: null` → server sets `validUntil = null` (unlimited)
- Omitting `accessDays` leaves `validUntil` unchanged

**Enforcement in GET /tools:**
```ts
if (user.role !== "admin" && user.validUntil && new Date(user.validUntil) < new Date()) {
  res.status(403).json({ error: "Your access has expired." });
  return;
}
```

**Why:** Simple day-based grants are easier for admins than picking specific dates; server controls the timestamp.
**How to apply:** Any new protected endpoint should replicate this expiry check if it returns subscriber-specific content.
