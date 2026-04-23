# 07 — Development Roadmap

---

## 7.1 Phase Summary

| Phase | Focus | Duration | Outcome |
|-------|-------|----------|---------|
| 1 | Setup & Architecture | Week 1 | Repo, structure, constants, mock data, navigation |
| 2 | Core Components | Week 2 | All reusable components built and tested |
| 3 | Auth Screens | Week 3 | Full auth flow (S-01 → S-05) working |
| 4 | Core Backend | Week 4 | Convex schema live, key mutations deployed |
| 5 | Mobile App MVP | Weeks 5–9 | All 65 screens, mock data replaced with live |
| 6 | Auth Integration | Week 10 | Privy OTP + device trust live |
| 7 | Web Dashboard | Weeks 11–13 | Admin panel functional |
| 8 | Patient Portal | Week 14 | Lightweight patient chat live |
| 9 | Desktop App | Week 15 | Electron wrapper packaged |
| 10 | QA & Beta | Weeks 16–17 | Internal staff beta |
| 11 | Launch | Week 18 | Production go-live |

**Target: Full beta in staff hands by end of Month 4 (~Week 16)**

---

## 7.2 Phase Detail

### Phase 1: Setup & Architecture (Week 1)

**Goal:** Runnable skeleton with navigation and design system.

| Task | Owner | Notes |
|------|-------|-------|
| Install core dependencies | Dev | T-001 |
| Create full folder structure | Dev | T-002 |
| Implement all constants files | Dev | T-003 |
| Create all mock data files | Dev | T-004 |
| Set up Convex project + connect | Dev | New Convex project, `.env` set up |
| Configure Expo app.json | Dev | App name, splash, icon, bundle ID |
| Set up git repository & branching | Dev | `main` + `develop` + feature branches |

**Completion criteria:** `npx expo start` runs, Inter font loads, navigation shell renders with empty screens.

---

### Phase 2: Core Components (Weeks 1–2)

**Goal:** Complete component library — no screens build before components are done.

| Task | Owner | Notes |
|------|-------|-------|
| Atom components | Dev | T-005: AppText, Icon, Spacer, Divider, Badge, StatusDot |
| Molecule components | Dev | T-006: Avatar, Button, Input, SearchBar, Card, Tag, etc. |
| Chat components | Dev | T-007: ChatBubble, ChatInput, ConversationItem, etc. |
| Channel + Schedule + Notif components | Dev | T-008 |
| Component storybook / visual test | Dev + Designer | Render each component in isolation, verify against styles.md |

**Completion criteria:** Every component renders in all documented variants with correct styling.

---

### Phase 3: Auth Screens (Week 3)

**Goal:** Complete auth UI flow — mock OTP, no real backend yet.

**Screens:** S-01, S-02, S-03, S-04, S-05

**Mock behaviour:**
- OTP "123456" always succeeds
- Device trust always returns "trusted" (skip pending screen for now)
- Auth state stored in `AsyncStorage` (toggled by a dev menu button)

**Completion criteria:** Auth flow navigates through all 5 screens correctly. Login state persists across app restarts.

---

### Phase 4: Core Backend (Week 4)

**Goal:** Convex schema deployed, real-time queries working with seed data.

| Task | Owner |
|------|-------|
| `convex/schema.ts` — all 7 collections | Dev |
| Seed script: insert mock data into Convex | Dev |
| `getViewer` + `getViewerOrThrow` helpers | Dev |
| `listConversations`, `listMessages` queries | Dev |
| `sendMessage` mutation | Dev |
| `listChannels`, `listChannelMessages` queries | Dev |
| `listNotifications`, `getUnreadCount` queries | Dev |
| `listAppointments` query | Dev |

**Completion criteria:** Convex dashboard shows all collections with seeded data. `useQuery(api.conversations.listConversations)` returns data in the app.

---

### Phase 5: Mobile App MVP (Weeks 5–9)

Build screens in order from Group D → I (see `01-product-design.md §1.1`).

**Week 5 — Home + Messages Core:**
- S-10 Home Dashboard (mock → live data)
- S-20 Conversation List
- S-21 Chat Thread 1:1
- S-22 Chat Group

**Week 6 — Messages Module Complete:**
- S-23 New Message, S-24 New Group
- S-25 Chat Info, S-26 Members, S-27 Add Members
- S-28 Media & Files, S-29 Search

**Week 7 — Channels:**
- S-30 through S-36

**Week 8 — Schedule:**
- S-40 through S-44

**Week 9 — More Tab:**
- S-50 through S-65
- Modals: S-70, S-71, S-72, S-73

**End of Week 9:** All 65 screens functional with live Convex data.

---

### Phase 6: Auth Integration (Week 10)

Replace mock auth with Privy + Convex device trust.

| Task | Notes |
|------|-------|
| Install and configure Privy Expo SDK | `@privy-io/expo` |
| Implement `ConvexProviderWithPrivy` | Bridges JWT |
| Implement `getDeviceFingerprint()` | `expo-crypto` hash |
| Deploy `registerOrValidateDevice` mutation | Convex |
| Wire OTPScreen to real Privy `loginWithCode` | |
| Test: new device → pending flow | Admin gets notification |
| Test: returning device → auto-auth | |
| Deploy `approveDevice` + notification | Admin panel (basic) |

---

### Phase 7: Web Admin Dashboard (Weeks 11–13)

| Week | Focus |
|------|-------|
| 11 | Project setup, sidebar, top bar, dashboard page (stats + activity) |
| 12 | StaffPage (list, add, suspend), DeviceApprovalsPage (approve/reject) |
| 13 | ChannelsPage, AnnouncementsPage, ActivityLogsPage, SettingsPage |

---

### Phase 8: Patient Portal (Week 14)

| Task | Notes |
|------|-------|
| `patient-portal` React project setup | Separate repo or monorepo package |
| Token validation endpoint | Convex HTTP action |
| Patient messaging UI | Single conversation view |
| Admin: create patient + generate link | Mutation + admin page |
| SMS notification via Twilio | Convex action |

---

### Phase 9: Desktop App (Week 15)

| Task | Notes |
|------|-------|
| Electron project setup | Wraps built web dashboard |
| Main process + BrowserWindow config | `main.js` |
| System tray + badge | `electron-notifier` |
| `electron-builder` config | macOS + Windows + Linux |
| Test packaging | Both platforms |

---

### Phase 10: QA & Beta (Weeks 16–17)

- Internal beta: distribute to 5–10 NHL staff (doctors + nurses + 1 admin)
- Bug tracking: GitHub Issues
- Priority triage: P0 (crash), P1 (data loss), P2 (functional), P3 (UI)
- Fix P0 and P1 immediately; P2 before go-live; P3 post-launch

---

### Phase 11: Production Launch (Week 18)

- Expo EAS production build (APK + IPA)
- Submit to App Store and Google Play
- Convex production environment deployment
- Web dashboard hosted (Vercel or Netlify)
- Electron installers distributed internally

---

## 7.3 Critical Path

```
✦ = milestone

Week 1:  Setup + Constants
Week 2:  Components ✦ (component library done)
Week 3:  Auth UI
Week 4:  Backend ✦ (Convex live)
Week 5:  Home + Messages Core
Week 6:  Messages Module Complete
Week 7:  Channels ✦
Week 8:  Schedule
Week 9:  More Tab ✦ (all 65 screens done)
Week 10: Auth Integration ✦ (real Privy login)
Week 11-13: Web Dashboard ✦
Week 14: Patient Portal ✦
Week 15: Desktop ✦
Week 16-17: Beta ✦ (staff testing)
Week 18: LAUNCH ✦
```

**Critical dependencies:**
- Components must finish before any screen work begins
- Convex schema must be deployed before mock-to-live data migration
- Privy setup requires Privy account + app ID (must be created early)
- Patient portal requires patient Convex records + Twilio account
- Electron requires web dashboard build to be complete

---

## 7.4 Task Dependencies Graph

```
T-001 → T-002 → T-003 ─┬─→ T-005 ─┬─→ T-007 ─┐
                        │          ├─→ T-008 ─┤
                        └─→ T-006 ─┘          ↓
T-004 (mock data) ─────────────────────────→ All screen tasks (T-011+)
T-009 (auth nav) + T-010 (tab nav) ────────→ All screen tasks
Backend schema ────────────────────────────→ Phase 5 (mock-to-live)
Privy setup ───────────────────────────────→ Phase 6
Web dashboard ─────────────────────────────→ Phase 9 (Electron)
```

---

## 7.5 Team Roles Aligned to Phases

| Role | Phase Focus |
|------|------------|
| Product Designer | Phases 1–3 (design system) + review every phase |
| Frontend Dev (Mobile) | Phases 1–6, 10 |
| Frontend Dev (Web) | Phases 7–9 |
| Backend Dev | Phases 4, 6, 8 (Convex + auth + patient backend) |
| QA | Phase 10 full-time, partial throughout |
| Project Manager | All phases — tracking, unblocking, milestone sign-off |
