---
name: Zod in api-server
description: zod must be explicitly declared in api-server deps; format:email breaks orval codegen
---

## Rules

1. **Add zod to api-server/package.json** with `"zod": "catalog:"`. The api-server builds with esbuild which resolves all imports; if zod is not in package.json, build fails with "Could not resolve zod".

2. **Never use `format: email` in OpenAPI schemas** that flow through orval codegen. Orval generates `zod.email()` which does not exist in zod v3 (zod v3 uses `z.string().email()`). Just use `type: string` without format on email fields.

**Why:** Discovered when adding AdminCreateUser schema — format:email caused a runtime crash when the built bundle loaded.
**How to apply:** Before running orval codegen after schema changes, check that no new string fields use `format: email`.
