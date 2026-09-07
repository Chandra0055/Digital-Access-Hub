---
name: Subscription warning presentation
description: Shared subscriber status messaging across portal pages while preserving page-specific layout density.
---

Subscription status wording, visual treatment, and announcement semantics belong in one shared presentation component. Page-specific variants may change density or placement, but should not reimplement state logic.

**Why:** Dashboard and Tools previously duplicated expiry-state markup, allowing content, colors, and accessibility behavior to diverge.

**How to apply:** Reuse the shared warning component for subscriber-facing status notices and keep `getSubscriptionState` as the single source of expiry truth.