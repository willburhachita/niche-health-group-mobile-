# NHL Connect — Desktop App Plan
**Niche Healthcare Limited**
Last updated: April 2026

---

## 1. OVERVIEW

Build a full desktop companion to the existing NHL Connect mobile app.
Same Convex backend. Same auth system. Different UI shell optimised for
large screens (clinic reception desks, admin workstations, nurse stations).

---

## 2. FOLDER STRUCTURE DECISION

### Why NOT a full monorepo reorganisation

Moving the mobile app into `apps/mobile/` would require:
- Updating 100+ relative import paths
- Rebuilding the Android `.cxx` CMake cache
- Updating `app.json`, `metro.config.js`, `eas.json`, Gradle paths
- Very high risk of breaking the working APK build

### Chosen approach: Desktop as a sub-app, Convex stays at root

```
Niche-heathcare-mobile-app/          ← git root (keep as-is)
│
├── App.js                           ← mobile entry point
├── index.js                         ← mobile entry point
├── package.json                     ← mobile-only dependencies
├── app.json                         ← Expo / EAS config
├── metro.config.js                  ← Metro bundler config
├── eas.json                         ← EAS build config
├── android/                         ← Android native build
├── src/                             ← mobile screens & components
├── assets/                          ← mobile assets
│
├── convex/                          ← SHARED backend (never moves)
│   ├── schema.ts
│   ├── auth.ts
│   ├── appointments.ts
│   ├── patients.ts
│   ├── invoices.ts
│   ├── notifications.ts
│   └── ... (all existing functions)
│
├── apps/
│   └── desktop/                     ← NEW: self-contained desktop app
│       ├── package.json             ← desktop-only dependencies
│       ├── index.html               ← Vite HTML entry
│       ├── vite.config.ts           ← Vite bundler config
│       ├── tailwind.config.ts       ← Tailwind config
│       ├── tsconfig.json            ← TypeScript config
│       ├── .env.local               ← EXPO_PUBLIC_CONVEX_URL (same URL)
│       ├── electron/                ← Electron main process
│       │   ├── main.ts              ← Window creation, OS integration
│       │   └── preload.ts           ← Node bridge to renderer
│       └── src/
│           ├── main.tsx             ← React app entry
│           ├── App.tsx              ← Root with ConvexProvider + Router
│           ├── layouts/
│           │   ├── AppShell.tsx     ← Sidebar + topbar wrapper
│           │   ├── Sidebar.tsx      ← Left nav with all sections
│           │   └── TopBar.tsx       ← User, notifications, search
│           ├── screens/
│           │   ├── auth/            ← Login, OTP, Password screens
│           │   ├── home/            ← Dashboard with charts
│           │   ├── messages/        ← Two-pane chat layout
│           │   ├── channels/        ← Channel list + thread view
│           │   ├── clinic/          ← All clinical management
│           │   ├── admin/           ← Administration panel
│           │   └── settings/        ← Profile, preferences
│           ├── components/
│           │   ├── common/          ← Button, Input, Badge, Table, Modal
│           │   ├── charts/          ← Stats charts for dashboard
│           │   ├── clinic/          ← PatientRow, AppointmentRow, etc.
│           │   └── chat/            ← MessageBubble, ChatPane, etc.
│           └── styles/
│               └── globals.css      ← Tailwind base styles
│
├── docs/
│   └── planning/
│       └── desktop-app-plan.md      ← this file
│
└── niche.apk                        ← latest Android build
```

### Key rules to prevent conflicts

| Concern | Rule |
|---|---|
| Dependencies | Desktop has its own `package.json`. Never install desktop deps at root. |
| Convex | Both apps import from `../../convex` (desktop) and `./convex` (mobile). Never duplicate. |
| Assets | Desktop has its own `src/assets/`. Logo copied from mobile assets. |
| Env vars | Desktop has its own `.env.local` with the same `CONVEX_URL`. |
| Build output | Desktop builds to `apps/desktop/dist/`. Android builds to `android/`. |
| Git | One repo, both apps. Desktop ignored from EAS via `.easignore`. |

---

## 3. TECH STACK — DESKTOP

| Layer | Choice | Reason |
|---|---|---|
| **Framework** | Electron 33 | Cross-platform (Windows, macOS, Linux). Battle-tested. |
| **UI Framework** | React 19 + TypeScript | Team already knows React from mobile. |
| **Bundler** | Vite 6 | Fast dev server, fast builds. Better than Webpack. |
| **Styling** | TailwindCSS 4 | Utility-first, rapid UI development. |
| **Components** | shadcn/ui | Radix-based, accessible, healthcare-appropriate, no vendor lock-in. |
| **Icons** | Lucide React | Same icon family as Feather (mobile uses Feather). |
| **Backend** | Convex (same deployment) | Zero new backend work. Same queries/mutations. |
| **Auth** | Same Convex auth.ts | Same email → OTP → password flow. |
| **Routing** | React Router v7 | In-app navigation without page reloads. |
| **Charts** | Recharts | Simple, React-native charting for dashboard stats. |
| **Tables** | TanStack Table v8 | Powerful data tables for patients, invoices, stock. |
| **Forms** | React Hook Form + Zod | Same validation patterns across desktop. |

---

## 4. DESIGN LANGUAGE — DESKTOP

Same brand, different layout paradigm.

```
┌────────────────────────────────────────────────────────────┐
│  TOPBAR: [NHL Connect logo]   [Search...]   [Bell] [Avatar] │
├───────────┬────────────────────────────────────────────────┤
│           │                                                  │
│  SIDEBAR  │              MAIN CONTENT AREA                  │
│           │                                                  │
│  Home     │  (varies per section — table, dashboard, chat)  │
│  Messages │                                                  │
│  Channels │                                                  │
│  ──────── │                                                  │
│  Clinic   │                                                  │
│  Patients │                                                  │
│  Appts    │                                                  │
│  Invoices │                                                  │
│  Stock    │                                                  │
│  Finance  │                                                  │
│  ──────── │                                                  │
│  Admin    │                                                  │
│  Settings │                                                  │
│           │                                                  │
└───────────┴────────────────────────────────────────────────┘
```

- **Colour palette**: Same as mobile — Navy #3B4B8A, Peach #F0A882, white backgrounds
- **Typography**: Inter font (same as mobile)
- **Light mode only** (same as mobile)
- **Density**: Comfortable — healthcare staff read data quickly, not cramped

---

## 5. SCREEN-BY-SCREEN FEATURE MAP

### Auth Screens (same flow as mobile)
- LoginScreen — email input
- OTPScreen — 6-digit code entry
- PasswordScreen — password entry
- Auto-redirect to Dashboard on success

### Dashboard (Home)
Desktop-specific enhancements over mobile:
- Stat cards: Total Patients, Today's Appointments, Pending, Revenue Today
- Line chart: Appointments over last 30 days
- Bar chart: Revenue by week
- Today's appointment list (right panel)
- Quick actions toolbar

### Messages
Three-pane layout:
- Left: Conversation list with search
- Centre: Active chat thread
- Right: Contact info / patient link (collapsible)
- Same Convex queries as mobile

### Channels
Two-pane layout:
- Left: Channel list
- Right: Channel thread with pinned messages banner
- Admin: create/delete channels inline

### Patients
Full data table:
- Columns: Name, DOB, Phone, Last Visit, Status
- Sorting, filtering, search
- Click row → Patient detail slide-over panel
- Create/Edit in modal dialog

### Appointments
Calendar view (monthly/weekly/daily toggle) + list view:
- Drag-to-reschedule (future)
- Status colour coding
- Click → Appointment detail panel
- Book Appointment modal
- Mark Arrived / Complete buttons in detail panel

### Invoices
Data table:
- Columns: Invoice #, Patient, Date, Amount, Status
- Filter by status: Draft / Unpaid / Paid / Overdue
- Click → Invoice detail with line items
- Create Invoice modal with line item editor
- Print / PDF export

### Stock & Inventory
Data table:
- Columns: Item, Code, Category, Qty, Unit Cost, Expiry, Status
- Low stock / expiring highlighted in amber/red
- Adjust Stock modal
- Stock History timeline per item

### Suppliers
Data table + detail panel
- Link to stock items per supplier

### Finance — Payments
Data table:
- Filter by invoice, date range, method
- Record Payment modal

### Finance — Expenses
Data table + Create Expense modal

### Treatment Notes
Accessed from Patient detail panel:
- Timeline view of all notes
- Rich text entry form

### Telehealth
Session list + Schedule Session modal

### Departments
Card grid of departments with member avatars

### Admin Panel
- Staff list with role badges
- Add Staff modal (same as mobile)
- Device Approvals queue
- Send Announcement form
- Manage Channels table
- Analytics dashboard with charts
- Activity Logs feed

### Settings / Profile
- Edit profile form
- Change password
- Trusted devices list

---

## 6. CONVEX INTEGRATION STRATEGY

Both apps talk to the SAME Convex deployment.
No new backend functions needed for desktop (in most cases).

```ts
// apps/desktop/.env.local
VITE_CONVEX_URL=https://silent-meerkat-382.eu-west-1.convex.cloud

// apps/desktop/src/main.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
```

Note: Vite uses `VITE_` prefix (not `EXPO_PUBLIC_`). This is the only
difference. Same URL, same backend, same data.

Desktop imports Convex API from the shared convex folder:
```ts
import { api } from "../../../convex/_generated/api";
// (relative path from apps/desktop/src/ → convex/)
```

---

## 7. FEATURES DESKTOP GETS THAT MOBILE DOESN'T

| Feature | Reason |
|---|---|
| Multi-column data tables | Screen space allows it |
| Keyboard shortcuts (Ctrl+K search, Ctrl+N new, etc.) | Desktop UX expectation |
| Print/PDF invoices and reports | Desktop OS print dialog |
| Drag-to-reschedule appointments | Mouse interaction |
| Resizable panels | Desktop window management |
| Bulk actions (select multiple patients/invoices) | Mouse + keyboard |
| Side-by-side patient + appointment view | Screen real estate |
| Persistent sidebar navigation | No tab bar needed |

---

## 8. FEATURES MOBILE GETS THAT DESKTOP DOESN'T

| Feature | Reason |
|---|---|
| Push notifications | Mobile OS feature |
| Camera for document/photo upload | Mobile has camera |
| Biometric login | Touch ID / Face ID |
| Offline mode | Mobile assumption |

---

## 9. BUILD & DISTRIBUTION

```
Development:
  cd apps/desktop
  npm run dev          → Vite dev server (browser preview)
  npm run electron:dev → Full Electron window with hot reload

Production build:
  npm run build         → Vite bundles React to dist/
  npm run electron:build → electron-builder packages to .exe / .dmg / .AppImage

Output files:
  Windows: NHL-Connect-Setup-1.0.0.exe
  macOS:   NHL-Connect-1.0.0.dmg
  Linux:   NHL-Connect-1.0.0.AppImage
```

Distribution (internal):
- Share the `.exe` installer directly (no code signing required for internal use)
- Staff download and install on clinic workstations
- No app store required

---

## 10. IMPLEMENTATION PHASES

### Phase 1 — Foundation (Week 1)
- [ ] Create `apps/desktop/` folder structure
- [ ] Set up Electron + Vite + React + TypeScript + Tailwind
- [ ] Implement AppShell: Sidebar + TopBar layout
- [ ] Connect to Convex backend
- [ ] Build Auth flow: Login → OTP → Password (reuses convex/auth.ts)
- [ ] Basic routing with React Router

### Phase 2 — Core Clinical (Week 2)
- [ ] Dashboard with live stats from Convex
- [ ] Patients: table, search, create/edit modal, detail panel
- [ ] Appointments: list + calendar, book, mark arrived, complete
- [ ] Invoices: table, create, line items, finalize

### Phase 3 — Communication (Week 3)
- [ ] Messages: three-pane chat layout, real-time via Convex
- [ ] Channels: two-pane layout, send messages, pin
- [ ] Announcements: view + create (admin)

### Phase 4 — Operations (Week 4)
- [ ] Stock & Inventory: table, adjust stock, history
- [ ] Suppliers: table + detail
- [ ] Payments: table, record payment
- [ ] Expenses: table, create expense
- [ ] Treatment Notes: patient timeline view

### Phase 5 — Admin & Polish (Week 5)
- [ ] Admin Panel: staff, devices, analytics, activity logs
- [ ] Departments management
- [ ] Reports dashboard with Recharts
- [ ] Telehealth session scheduling
- [ ] Keyboard shortcuts
- [ ] Print/PDF for invoices
- [ ] Packaged .exe installer

---

## 11. OPEN DECISIONS (TO CONFIRM BEFORE STARTING)

1. **Windows only or cross-platform?**
   Electron supports all 3. Building for Windows first is simplest
   (matches clinic workstation OS). macOS/Linux can come later.

2. **Offline support?**
   Convex is real-time cloud. No offline support without significant
   extra work. For a clinic LAN this is fine. Confirm with stakeholders.

3. **Print/PDF invoices?**
   Electron gives access to the OS print dialog. We can also generate
   PDFs using `electron-pdf` or `puppeteer`. Decide which format.

4. **Single instance per clinic or multi-user?**
   Convex handles multi-user real-time natively. Multiple staff can
   have the desktop app open simultaneously — changes sync instantly.

5. **Auto-update?**
   `electron-updater` can push updates silently. Requires a file server
   or GitHub Releases to host update packages. Worth planning early.
