---
name: HMR auth context error
description: useAuth "not in AuthProvider" is a Vite Fast Refresh artifact, not a real bug
---

## Rule
When editing files that transitively import auth-context.tsx, Vite's Fast Refresh may temporarily emit:
```
Error: useAuth must be used within AuthProvider
```

This is NOT a real runtime error. It happens because Fast Refresh re-executes component modules before the full React tree remounts, briefly running hooks outside the provider tree.

**Why it matters:** Do not chase this error or refactor auth context to "fix" it. The app works correctly after a full page load.
**How to apply:** Ignore these errors in HMR/workflow logs during development; only investigate if the error persists after a hard reload.
