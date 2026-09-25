---
name: Subscription countdown timezone
description: Product rule for calendar-day calculations in subscription expiry warnings.
---

Subscription expiry countdown labels use UTC calendar dates, while determining whether an expiry has passed continues to compare exact instants.

**Why:** A viewer-local calendar makes the same expiry timestamp appear a day closer or farther away when a user travels across time zones.

**How to apply:** Any subscriber-facing “today,” “tomorrow,” or days-remaining calculation must derive calendar boundaries from UTC and preserve the established wording.