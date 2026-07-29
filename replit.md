# Kenter Tech Portal

A full-stack digital tools subscription platform where subscribers browse, access, and manage their digital toolkit. Dark-themed command-center-style SaaS portal with admin controls.

## Run & Operate

- `pnpm --filter @workspace/kenter-tech-portal run dev` — run the frontend (port assigned automatically)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Seed Accounts

| Email | Password | Role |
|---|---|---|
| admin@kenter.tech | admin123 | Admin |
| jane@example.com | user123 | Subscriber |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 (dark theme)
- API: Express 5 + JWT auth (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod v3, drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: users, tools, subscriptions
- `artifacts/api-server/src/routes/` — auth, tools, subscriptions, admin routes
- `artifacts/api-server/src/lib/auth.ts` — JWT helpers + Express middleware
- `artifacts/kenter-tech-portal/src/` — React frontend
- `artifacts/kenter-tech-portal/src/contexts/auth-context.tsx` — auth state
- `lib/api-client-react/src/custom-fetch.ts` — auto-attaches Bearer token from localStorage

## Architecture decisions

- JWT stored in `localStorage` as `kenter_token`; attached to every request via `customFetch`
- Admin-only routes guarded by `requireAdmin` middleware server-side; also hidden on frontend via role check
- Drizzle `push` used for dev schema sync; production uses Replit's publish-time migration flow
- Token is attached in `custom-fetch.ts` (not per-component), so all generated hooks are automatically authenticated
- Tailwind dark mode forced via `class="dark"` on `<html>` element

## Product

- **Login / Signup** — JWT auth, role-based (admin / subscriber)
- **Dashboard** — welcome card, subscription status, stats overview
- **Available Tools** — filterable grid of tool cards with category badges and Access/Coming Soon actions
- **My Account** — subscription details, plan selection (monthly / annual / lifetime)
- **Admin Panel** — tabs for Users, Tools, Subscriptions, Stats with full CRUD

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Tailwind v4: do not use `@apply dark` — `dark` is a variant, not a utility class. Use `class="dark"` on `<html>` instead.
- Orval v8.23 generates Zod v4 syntax (`zod.int()`, `zod.email()`); workspace is on Zod v3 — avoid `type: integer` and `format: email` in the OpenAPI spec.
- After editing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before running the API server typecheck so declarations are fresh.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
