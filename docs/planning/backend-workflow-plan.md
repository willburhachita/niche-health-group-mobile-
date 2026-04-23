# NHL Connect — Complete Backend & Workflow Plan

> **Purpose:** Exhaustive mapping of every UI screen, component, clickable element, and workflow to its Convex backend interaction.
> **Status:** Planning — awaiting review before implementation.
> **Backend:** Convex (real-time DB, serverless functions, file storage, cron jobs)

---

## Document Map

| Part | File | Covers |
|------|------|--------|
| 1 | [backend-plan-schema.md](./backend-plan-schema.md) | Complete Convex schema (21 collections) |
| 2 | [backend-plan-screens.md](./backend-plan-screens.md) | Screen-by-screen workflow map (every clickable element) |
| 3 | [backend-plan-functions.md](./backend-plan-functions.md) | All queries, mutations, actions, crons, file storage, auth matrix |
| 4 | [backend-plan-seed.md](./backend-plan-seed.md) | Seed data migration + mock-to-live replacement map |

---

## Meeting Expansion (13 Apr 2026)

**After the stakeholder meeting, major new modules were identified. See:**
- [meeting-expansion-plan.md](./meeting-expansion-plan.md) — Full breakdown of 27 new requirements

**New modules added:**
- Stock & Inventory (6 new screens)
- Suppliers (3 new screens)
- Finance: Payments & Expenses (6 new screens)
- Patient Consent system (1 new screen + booking gate)
- Enhanced Patient Profile (6 new sub-screens)
- In-App Calling / VoIP (2 new screens)
- NHIMA Integration (external API)

---

## Summary Stats (Updated)

- **32 Convex collections** (21 original + 11 new from meeting)
- **~110 queries** across all modules
- **~80 mutations** across all modules
- **8 actions** (Expo Push, Twilio SMS, PDF gen, NHIMA API, VoIP)
- **9 cron jobs** (reminders, overdue, reports, expiry alerts, recall checks, cleanup)
- **~89 screens** total (65 original + 24 new)
- **5 user roles** with full authorization matrix
