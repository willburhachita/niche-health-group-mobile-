# NHL Connect — Master Execution Plan
### Niche Healthcare Limited | Internal Communication & Management System
**Version:** 1.0 | **Date:** March 2026 | **Status:** Active

---

> This is the single source of truth for building, designing, and delivering the NHL Connect system.
> All sections reference the existing planning documents in `docs/planning/`.
> Do NOT deviate from the design tokens, screen specifications, or architectural decisions documented here.

---

## Document Map

| # | File | Covers |
|---|------|--------|
| 01 | [01-product-design.md](./01-product-design.md) | Screen build order, component system, UX rules |
| 02 | [02-frontend.md](./02-frontend.md) | Expo mobile app, React web dashboard, Electron desktop |
| 03 | [03-backend.md](./03-backend.md) | Convex schema, queries, mutations, subscriptions |
| 04 | [04-auth.md](./04-auth.md) | Privy OTP, device trust, fingerprinting, admin alerts |
| 05 | [05-patient-comms.md](./05-patient-comms.md) | Patient-facing lightweight interface |
| 06 | [06-notifications.md](./06-notifications.md) | Real-time notifications across all user types |
| 07 | [07-roadmap.md](./07-roadmap.md) | Phased timeline, critical path, milestones |
| 08 | [08-testing.md](./08-testing.md) | Unit, integration, beta rollout |
| 09 | [09-deployment.md](./09-deployment.md) | Expo builds, Convex prod, web hosting, Electron packaging |
| 10 | [10-maintenance.md](./10-maintenance.md) | Bug workflow, monitoring, scaling, future features |

---

## System Overview

```
NHL Connect
├── Mobile App        → Expo (React Native) — Staff primary interface
├── Web Dashboard     → React — Admin & management panel
├── Desktop App       → Electron (wraps web dashboard)
├── Backend           → Convex — Real-time data, auth logic, business rules
├── Authentication    → Privy — OTP-based, device-trust policy
└── Patient Portal    → Lightweight web interface — Messaging only
```

---

## User Types

| Type | Access | Primary Platform |
|------|--------|-----------------|
| Doctor | Full app + patient messaging | Mobile + Web |
| Nurse | Full app (no admin panel) | Mobile |
| Admin | Full app + admin panel | Mobile + Web + Desktop |
| Patient | Doctor-patient messaging ONLY | Web portal (lightweight) |

---

## Core Reference Documents

- Branding: `docs/planning/branding.md`
- Component Styles: `docs/planning/styles.md`
- Screen Specs: `docs/planning/screens.md`
- Task List: `docs/planning/tasks.md`
- Navigation: `docs/planning/navigation.md`
- Agent Rules: `docs/planning/agent.md`

---

## Non-Negotiable Constraints

1. Light mode only — no dark mode
2. Feather icons exclusively — no mixing
3. Inter font — must load before first render
4. No emojis in any UI surface
5. All colors via `constants/colors.js` — never hardcoded hex
6. All spacing via `constants/spacing.js` — never hardcoded pixels
7. Deny-by-default authorization on Convex
8. Every new device login triggers an admin notification
9. Patient data is strictly isolated — staff cannot query patient records via general endpoints
10. No third-party UI libraries (no NativeBase, Paper, etc.)
