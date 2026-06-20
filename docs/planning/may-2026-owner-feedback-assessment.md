# Owner Feedback Assessment — May 2026

> Comprehensive assessment of the owner meeting notes + Cliniko reference screenshots,
> cross-referenced against the current state of the **mobile app** (`src/`) and the
> **desktop app** (`apps/desktop/src/`). Use this as the working backlog for the next
> sprint of changes.

---

## Table of Contents

1. [Feature Parity Audit — Mobile vs Desktop](#1-feature-parity-audit--mobile-vs-desktop)
2. [Meeting Notes — Item-by-Item Backlog](#2-meeting-notes--item-by-item-backlog)
3. [Cliniko Screenshot Analysis (Images 1–6)](#3-cliniko-screenshot-analysis-images-16)
4. [New Settings Module — "Clinic Configuration"](#4-new-settings-module--clinic-configuration)
5. [Schema Additions Required](#5-schema-additions-required)
6. [Permissions & Role Matrix (Updated)](#6-permissions--role-matrix-updated)
7. [Prioritised Roadmap](#7-prioritised-roadmap)

---

## 1. Feature Parity Audit — Mobile vs Desktop

Cross-reference of every clinic/operations feature. **✅ = implemented, ⚠️ = partial, ❌ = missing.**

| Feature | Mobile | Desktop | Notes |
|---|---|---|---|
| **Patients** | | | |
| List + search | ✅ `PatientDirectoryScreen.js` | ✅ `PatientsScreen.tsx` | |
| Add/Edit patient | ✅ `AddEditPatientScreen.js` | ⚠️ `PatientsScreen.tsx` modal | Desktop missing: profile image upload, NHIMA fields, multiple insurers UI, consent flow, comms preferences |
| Patient profile (deep) | ✅ `PatientProfileScreen.js` | ⚠️ side-panel only | Desktop missing dedicated profile route with sub-tabs |
| Profile image (camera/gallery) | ✅ | ❌ | |
| Multiple insurance providers | ✅ schema + UI | ⚠️ schema only | Desktop UI doesn't expose `otherInsuranceProviders` |
| Country-code phone picker | ❌ | ❌ | Both need this (R-new) |
| Auto-calc age from DOB | ✅ | ✅ | |
| Archive (not delete) | ❌ | ❌ | Currently hard-deletes |
| **Appointments** | | | |
| Book appointment | ✅ `BookAppointmentScreen.js` | ✅ `AppointmentsScreen.tsx` | Desktop modal is minimal vs full mobile flow |
| Recurring appointments | ⚠️ flag only | ❌ | Mobile sets `isRecurring`, no UI for pattern selection |
| Appointment-type service catalog | ❌ | ❌ | Neither has a configurable appointment-types table |
| Pre-populate from service type | ❌ | ❌ | |
| "Mark Arrived" → draft invoice | ⚠️ partial | ✅ | Desktop has draft-invoice button, mobile flow is split across screens |
| Uninvoiced filter | ✅ `listUninvoiced` query | ❌ | Desktop missing this filter pill |
| Cancellation notifications (SMS/email) | ❌ | ❌ | |
| **Stock & Inventory** | | | |
| List + alerts | ✅ `StockListScreen.js` | ✅ `StockScreen.tsx` | |
| Item detail | ✅ `StockItemDetailScreen.js` | ⚠️ side-panel only | Desktop has no `StockHistoryScreen` equivalent |
| Adjustment with reasons | ✅ | ✅ | Reason lists slightly different |
| History/audit log | ✅ `StockHistoryScreen.js` | ❌ | Desktop missing history view |
| Expiry tracking + countdown | ✅ | ⚠️ | Desktop shows expiry but no 3/2/1-month countdown badge |
| Per-item reorder alert config | ⚠️ | ⚠️ | Field exists but no per-category default UI |
| Notes timestamp + author | ❌ | ❌ | Notes are plain string; no created-at / archived-by metadata |
| Admin-only archive of products | ❌ | ❌ | |
| **Suppliers** | | | |
| List | ✅ `SuppliersListScreen.js` | ✅ `SuppliersScreen.tsx` | |
| Detail | ✅ `SupplierDetailScreen.js` | ⚠️ side-panel | |
| Create/Edit | ✅ `CreateEditSupplierScreen.js` | ⚠️ modal | |
| Location/region field | ✅ schema (`region`, `city`, `country`) | ⚠️ | Desktop form may not expose region |
| **Invoices** | | | |
| List | ✅ `InvoicesListScreen.js` | ✅ `InvoicesScreen.tsx` | |
| Create with line items | ✅ `CreateInvoiceScreen.js` | ✅ | |
| **Pick from stock when creating** | ✅ (stock picker modal) | ❌ | Desktop only has free-text description |
| Detail | ✅ `InvoiceDetailScreen.js` | ✅ | |
| Edit (admin only) | ❌ | ✅ | Desktop already gates on `account.role === 'admin'` — mobile missing this gate |
| Outstanding invoices view | ⚠️ status filter | ⚠️ status filter | Neither has a dedicated "Outstanding" dashboard |
| Print invoice | ❌ | ✅ `window.print()` | Mobile has no print/share |
| NHIMA submission flag | ⚠️ form field exists | ❌ | Mobile form has `submitToNhima` toggle, desktop missing |
| Auto-deduct stock on save | ⚠️ planned | ❌ | |
| **Payments** | | | |
| List | ✅ `PaymentsListScreen.js` | ✅ `PaymentsScreen.tsx` | |
| Record from invoice detail | ⚠️ | ⚠️ | Both can record but neither has "Enter Payment" tightly bound to invoice screen with running balance |
| NHIMA as payment method | ⚠️ enum has it | ⚠️ | Schema supports `insurance_nhima`, UI says "Insurance" |
| **Expenses** | | | |
| List | ✅ `ExpensesListScreen.js` | ✅ `ExpensesScreen.tsx` | |
| Create | ✅ `CreateExpenseScreen.js` | ✅ | |
| Detail | ✅ `ExpenseDetailScreen.js` | ❌ | Desktop missing dedicated detail view |
| Attach receipts/files | ⚠️ planned | ❌ | |
| **Reports** | | | |
| Dashboard | ✅ `ReportsDashboardScreen.js` | ✅ `ReportsScreen.tsx` | |
| Revenue by product | ❌ | ❌ | |
| Expense vs revenue (accountant view) | ⚠️ stats only | ⚠️ stats only | No drill-down report |
| Export PDF | ❌ | ❌ | |
| **Telehealth** | | | |
| Session list | ✅ | ✅ | |
| Start session + invite staff | ✅ | ✅ | |
| **Email/SMS invite to patient** | ❌ | ❌ | Critical gap |
| Call summary screen | ✅ `TelehealthCallSummaryScreen.js` | ❌ | |
| **Treatment Notes** | | | |
| Create/edit | ✅ | ✅ | |
| Link stock used | ❌ | ❌ | |
| Show created-by + timestamp | ⚠️ | ⚠️ | Field exists but not surfaced in UI |
| **Admin** | | | |
| Staff management | ✅ | ✅ | |
| Device approvals | ✅ | ✅ | |
| Activity logs | ✅ | ✅ | |
| Announcements | ✅ | ✅ | |
| Shift management | ✅ via Schedule | ✅ `ShiftManagementScreen.tsx` | |
| Time tracking (login/logout) | ⚠️ | ✅ `TimeTrackingScreen.tsx` | Mobile missing dedicated view |
| **Settings (Clinic Configuration)** | | | |
| Billable items catalog | ❌ | ❌ | **All missing — see §4** |
| Appointment types config | ❌ | ❌ | |
| Payment types config | ❌ | ❌ | |
| Tax rates config | ❌ | ❌ | |
| Recall types config | ❌ | ❌ | |
| SMS/email templates | ❌ | ❌ | |
| Clinic identity (account ownership) | ⚠️ About card | ⚠️ About card | Read-only, not editable |

### Parity Summary

- **Desktop must catch up** in: profile image, NHIMA fields, multiple insurers, consent flow, invoice stock picker, stock history, expense detail, telehealth patient invite, country-code picker, archive-instead-of-delete, uninvoiced filter.
- **Mobile must catch up** in: invoice edit-gate by role, invoice print/share, time-tracking view.
- **Both apps need** the entire **Clinic Configuration settings module** (billable items, appointment types, payment types, taxes, recall types, SMS templates) — this is the biggest missing piece per the Cliniko screenshots.

---

## 2. Meeting Notes — Item-by-Item Backlog

Each note is given an **ID (`M-xx`)**, mapped to file paths, current state, and the change required.

### Phone, Profile & Save Buttons

#### M-01 — Country code selector everywhere a phone number is entered
- **Where:** Mobile `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/clinic/AddEditPatientScreen.js:35`, `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/more/AdminAddStaffScreen.js`, `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/more/EditProfileScreen.js`; Desktop `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/clinic/PatientsScreen.tsx:268`, `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/settings/SettingsScreen.tsx:74`
- **Current:** plain text input with `+260...` placeholder.
- **Change:** introduce a shared `PhoneInput` component with country flag dropdown (default Zambia +260) reused everywhere.
- **Priority:** **High** — affects data quality.

#### M-02 — "Save Profile" button on desktop currently doesn't persist
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/settings/SettingsScreen.tsx:30-34`
- **Current:** `handleSaveProfile` only does `await new Promise(r => setTimeout(r, 500))` — fake save.
- **Change:** call `api.auth.updateProfile` (or new mutation) with `fullName`, `phone`, `title`.
- **Priority:** **High** — silent data loss bug.

### Patient Module

#### M-03 — Bold the section headers ("Personal Info", "Medical Record", "Emergency Contact")
- **Where:** Desktop `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/clinic/PatientsScreen.tsx:254-259` tab labels; Mobile `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/clinic/AddEditPatientScreen.js` section headers.
- **Change:** apply `font-bold text-base text-gray-900` (desktop) and `bodyBold` variant with darker color (mobile).
- **Priority:** **Low** — pure cosmetic.

#### M-04 — Country-code on phone fields (covered by M-01)

### Stock Module

#### M-05 — "What type of item should remind you when stock is low?"
- **Interpretation:** Per-item or per-category reorder-level config + a notification rule (only certain categories should trigger alerts, e.g. consumables yes, fixed equipment no).
- **Where:** schema `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/convex/schema.ts:251-272` has `reorderLevel` but no `alertEnabled` flag.
- **Change:**
  - Add `alertOnLow: v.boolean()` (default true) to `stockItems`.
  - On stock-create form, expose "Notify me when low" toggle + reorder threshold.
  - Filter `api.stock.alerts` to only items with `alertOnLow = true`.
- **Priority:** **Medium**.

#### M-06 — Stock notes need timestamps + author + archived flag
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/convex/schema.ts:264` — `notes` is just a string.
- **Change:** convert to a sub-collection `stockNotes`:
  ```ts
  stockNotes: defineTable({
    stockItemId: v.id("stockItems"),
    body: v.string(),
    authorEmail: v.string(),
    isArchived: v.boolean(),
    archivedBy: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_stockItemId", ["stockItemId"])
  ```
  - Show notes list with author + timestamp on `StockItemDetailScreen` and desktop side-panel.
  - Only admins can archive (gate by `account.role === 'admin'`).
- **Priority:** **Medium**.

#### M-07 — Archive everywhere (rename "Delete" → "Archive", admin-only)
- **Affected entities:** `patients`, `stockItems`, `suppliers`, `invoices`, `expenses`, `appointments`, `treatmentNotes`, `staffAccounts`.
- **Where:** every `remove` mutation across `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/convex/patients.ts`, `convex/stock.ts`, `convex/invoices.ts`, etc.
- **Change:**
  - Add `isArchived: v.boolean()`, `archivedBy`, `archivedAt`, `archiveReason` to each table.
  - Replace `db.delete()` with `db.patch({ isArchived: true, ... })`.
  - Add `callerRole` arg and throw if not `admin`.
  - All list queries filter `q => q.eq(q.field("isArchived"), false)` by default with an optional `includeArchived` flag for admins.
  - UI: change "Delete" buttons to "Archive" everywhere, show only for admins.
- **Priority:** **High** — litigation/audit risk if not done.

#### M-08 — Anti-theft system for stock
- **Interpretation:** Audit trail + tamper-evident logging. Already partially covered by `stockAdjustments` table. Need:
  - Mandatory `reason` + `notes` for every decrease.
  - Daily reconciliation report: physical count vs. system count discrepancy.
  - Optional hardware integration (out of scope for software-side now — flag as **Phase 2**).
- **Where:** schema `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/convex/schema.ts:275-286`.
- **Change:** add `stockReconciliations` table + a daily "End-of-day stock check" screen. Defer hardware integration.
- **Priority:** **Medium** (audit), **Low** (hardware).

#### M-09 — Adjust stock additional fields (note in transcript was cut off)
- **Best-guess interpretation:** add **batch/lot number** + **expiry per batch** when adding stock (already partly handled by `newExpiryDate` on adjust). Also add an **attached invoice/PO reference** when reason = "purchase".
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/operations/StockScreen.tsx:181-209` and `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/clinic/StockAdjustmentScreen.js`.
- **Change:** add `batchNumber`, `purchaseInvoiceRef` to `stockAdjustments`.
- **Priority:** **Medium**.

### Invoices, Appointments & Service Catalog

#### M-10 — Invoice creation should select from stock instead of free-text
- **Where mobile:** ✅ already done in `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/clinic/CreateInvoiceScreen.js:138-164` (stock picker exists).
- **Where desktop:** ❌ `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/clinic/InvoicesScreen.tsx:229-236` — free-text only.
- **Change:** add a "Pick from Stock" button per line item on the desktop Create Invoice modal (and Edit Invoice modal too). Reuse the same Convex `api.stock.list` query.
- **Priority:** **High** — feature parity.

#### M-11 — Book Appointment: capture "reason for visit" / what info patient has come for
- **Where:** Both apps have only a `notes` textarea. Per the owner, this should be a structured field.
- **Change:** add `reasonForVisit: v.optional(v.string())` to `appointments`, surface as a separate required-ish input on the booking modal.
- **Priority:** **Medium**.

#### M-12 — Pre-populated **Service Type catalog** that auto-selects stock
- **Critical concept from the owner:** a "service type" defines:
  - Fixed service price (what the patient is billed).
  - Default list of stock items consumed per delivery of the service.
  - Calculation of cost-of-goods → **profit/loss per session** automatically.
  - If extra stock is used beyond the default, the staff member must **enter a reason**.
- **Where:** does not exist anywhere yet.
- **Change:** new module — **Service Types** (see §4 — also matches the Cliniko "Appointment types" screenshot).
  ```ts
  serviceTypes: defineTable({
    name: v.string(),                       // "Private Insurance Haemodialysis"
    category: v.string(),                   // "Dialysis" | "Medicine" | ...
    durationMinutes: v.number(),
    defaultPrice: v.number(),
    taxId: v.optional(v.id("taxes")),
    telehealthEnabled: v.boolean(),
    color: v.string(),                      // calendar pill color
    defaultStockUsage: v.array(v.object({
      stockItemId: v.id("stockItems"),
      quantity: v.number(),
    })),
    treatmentNoteTemplate: v.optional(v.string()),
    isArchived: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
  })
  ```
  Plus `extraStockUsed` array on each appointment with mandatory `reason` per extra item.
- **Priority:** **High** — biggest workflow change.

#### M-13 — Repeated appointments (weekly / monthly / yearly)
- **Where:** schema has `isRecurring` + `recurringPattern` but neither UI exposes pattern selection cleanly.
- **Change:**
  - Desktop `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/clinic/AppointmentsScreen.tsx:329-340` — add "Repeat" select (None / Daily / Weekly / Monthly / Yearly) + end-date picker.
  - Mobile already partially supports it (`BookAppointmentScreen.js:211-213`) — expose a real radio group, not just a toggle.
  - Backend: when `isRecurring`, generate child appointments up to `recurringEndDate` (already conceptually planned).
- **Priority:** **Medium**.

#### M-14 — When patient arrives, pre-populate invoice from service type + stock used
- **Depends on:** M-12 (service catalog).
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/clinic/AppointmentsScreen.tsx:73-90` `handleDraftInvoice` currently just creates a `[{ description: type, quantity: 1, unitPrice: 0 }]` placeholder.
- **Change:** when drafting, look up the linked `serviceType` and:
  1. Set the service line at the service's `defaultPrice`.
  2. Add line items for each default stock item (qty + auto-deduct on save).
  3. Allow staff to add "extra" items with a mandatory reason — flagged in profit/loss report.
- **Priority:** **High**.

#### M-15 — "Uninvoiced appointments" / "Missed appointments" view
- **Mobile:** `api.appointments.listUninvoiced` already exists (used in `CreateInvoiceScreen.js:86`).
- **Desktop:** missing filter pill.
- **Change:**
  - Desktop AppointmentsScreen: add filter pills "All / Today / Uninvoiced / Missed / Upcoming".
  - "Missed" = `status === 'pending'` AND `startTime < now - 1h` (configurable).
  - Add a separate section under Reports: "Appointments not yet invoiced" with one-click "Create invoice".
- **Priority:** **Medium**.

#### M-16 — Add "Dialysis" appointment type (already in dropdowns) — superseded by M-12 service catalog

### Payments & Billing

#### M-17 — NHIMA integration / NHIMA as a payment method
- **Where:** schema `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/convex/schema.ts:344` already lists `insurance_nhima` as a method.
- **Change:**
  - Surface "NHIMA" explicitly in payment method dropdowns (not just "Insurance").
  - On invoice: add `submitToNhimaAt`, `nhimaClaimNumber`, `nhimaStatus` fields.
  - Add a "Submit to NHIMA" action (no real API yet — manual flag for now; integration with NHIMA's actual API is **Phase 2**).
  - Patient form needs `nhimaMemberNo`, `nhimaScheme`, `nhimaEmployer` (already in mobile, missing in desktop).
- **Priority:** **High** for UI/flag, **Medium** for actual API.

#### M-18 — "Tilly invoicing system" testing
- **Interpretation:** Tilly = team member who tests invoicing. **Action:** ship features → hand to Tilly for UAT. No code change.

#### M-19 — Connect payments to invoices (only record when paid)
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/clinic/InvoicesScreen.tsx:170-176` has "Mark Paid" but no "Record Payment" modal that captures method.
- **Change:** replace "Mark Paid" with a "Record Payment" modal that captures **amount, method, reference, date, notes**, and only then marks the invoice paid (or partial). Update both invoice list and `payments` table atomically.
- **Priority:** **High**.

#### M-20 — Print invoice
- **Mobile:** ❌ — add share/print via `expo-print` or `expo-sharing`.
- **Desktop:** ✅ `window.print()` exists at `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/clinic/InvoicesScreen.tsx:116`.
- **Change:** mobile — implement PDF generation + share sheet. Desktop — add a styled print stylesheet so the printout looks like a real invoice.
- **Priority:** **Medium**.

#### M-21 — View outstanding invoices easily
- **Change:** add a top-level **Outstanding Invoices** dashboard widget on:
  - Mobile `HomeScreen` and `ClinicHubScreen` — link directly to filtered list.
  - Desktop `DashboardScreen` — same.
  - Filter by aging buckets: 0-30d, 31-60d, 61-90d, 90+d.
- **Priority:** **Medium**.

#### M-22 — Billable items table (see Cliniko screenshot Image 1)
- **Covered by §4 — new Clinic Configuration module.**

### Reports & Insights

#### M-23 — Expenses + payments + invoices as an accountant would see
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/operations/ReportsScreen.tsx` and `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/clinic/ReportsDashboardScreen.js`.
- **Change:** add an **"Accounting" tab** with:
  - Profit & loss statement (revenue − COGS − expenses).
  - Cashflow report (payments received vs expenses paid).
  - Trial balance.
  - Tax owed report (sum of VAT collected vs VAT paid).
  - Export to CSV/PDF.
- **Priority:** **High** for owner/admin role.

#### M-24 — Product revenue report
- **Change:** new report — "Revenue by Stock Item / Service Type" with quantity sold + revenue + COGS + margin per item over a date range.
- **Priority:** **Medium**.

#### M-25 — Reports easily / draft report creation on mobile
- **Change:** add report templates + "Save as Draft" so a partial report can be saved and finished later. Add scheduled report email (admin-configurable cron).
- **Priority:** **Low**.

### Telehealth

#### M-26 — SMS / email patient when invited to telehealth
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/convex/telehealth.ts` `startSession` mutation only stores invitees by `userId` — no notification action.
- **Change:**
  - Add `patientNotifyMethod: v.array(v.union(v.literal("sms"), v.literal("email")))` per session.
  - On session start, dispatch a notification action that sends:
    - SMS via Twilio (room URL + meeting time).
    - Email via Resend / SendGrid (HTML invite + calendar `.ics`).
  - Respect patient `consentPreferences` (only contact via methods they accepted — see Patient consent flow).
- **Priority:** **High** — owner explicitly called this out.

### Settings, Permissions & Roles

#### M-27 — Only admin sees financial details
- **Where:** desktop `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/hooks/useAuth.ts:52-64` permission lists.
- **Change:** introduce four roles + matching permissions (see §6):
  - **Admin** — full access.
  - **Moderator+ ("Power Receptionist")** — clinical + financial (no staff admin).
  - **Moderator ("Receptionist")** — clinical only, no financial detail.
  - **Member ("Staff")** — messaging + own profile only.
  - **Bookkeeper** — financial only (payments, invoices, expenses, reports) + read-only patient list.
- **Priority:** **High**.

#### M-28 — Account ownership in settings (clinic identity editable)
- **Where:** desktop `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/settings/SettingsScreen.tsx:141-205` is read-only "About" card.
- **Change:** add an admin-only **"Clinic"** tab that lets the owner edit:
  - Clinic legal name, trading name, logo, address, phone, email, website.
  - Tax registration / VAT number.
  - Currency, date format.
  - Stored as a singleton `clinicSettings` table.
- **Priority:** **Medium**.

#### M-29 — Self-calculated login/logout for moderators (working hours)
- **Mobile:** ❌ no UI.
- **Desktop:** ✅ `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/admin/TimeTrackingScreen.tsx` already exists.
- **Change:** mirror on mobile — add a "Clock in / Clock out" widget on the home screen for moderators+. Backend `convex/timeEntries.ts` already supports it.
- **Priority:** **Medium**.

#### M-30 — Staff status types (Unavailable, On leave, etc.)
- **Where:** `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/convex/schema.ts:37` users have `onlineStatus`.
- **Change:** extend to support custom status: `Available`, `Busy`, `Unavailable`, `On leave`, `In meeting`. Show in StaffDirectory + chat avatars. Admin can configure list of allowed statuses.
- **Priority:** **Low**.

### Patient Recalls

#### M-31 — Add recall types for patients
- **Concept:** A "recall" = scheduled follow-up reminder ("come back in 6 months for checkup"). Each recall has a **type** (configurable in settings, e.g. "Dialysis follow-up", "Annual checkup", "Lab review").
- **Change:** new schema:
  ```ts
  recallTypes: defineTable({
    name: v.string(),
    defaultIntervalDays: v.number(),
    color: v.string(),
    isArchived: v.boolean(),
  })
  recalls: defineTable({
    patientId: v.id("patients"),
    recallTypeId: v.id("recallTypes"),
    dueDate: v.number(),
    status: v.string(),                    // "pending" | "contacted" | "completed" | "missed"
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
  ```
  + screens to manage recall types and view due/overdue recalls per patient.
- **Priority:** **Medium**.

### Marketing (Section incomplete in notes)

#### M-32 — Marketing module
- **Notes were cut off.** Likely scope based on Cliniko parity:
  - Patient segmentation (e.g. "all dialysis patients", "patients overdue for recall").
  - Bulk SMS / email campaigns to segments.
  - Campaign performance (delivery, open rate, response rate).
- **Action:** flag as **Phase 2** until owner clarifies scope. Add `marketingCampaigns` table when ready.
- **Priority:** **Deferred — needs clarification.**

---

## 3. Cliniko Screenshot Analysis (Images 1–6)

### Image 1 — Billable Items
Shows a flat list of services with: code, name, item type (Service), price ex-tax, tax, price inc-tax. Two CTAs: "+ Add service" and "+ Add other".

**Implication:** We need a **Billable Items** screen under Settings (matches M-12 service catalog + a separate "Other" billable category for one-off charges that aren't tied to a service appointment — e.g. "Photocopy", "Late fee").

**Schema:**
```ts
billableItems: defineTable({
  itemCode: v.string(),          // e.g. "C.H.ADRMWEEMBA"
  name: v.string(),              // "Initial Nephrologist consult"
  itemType: v.string(),          // "service" | "other"
  serviceTypeId: v.optional(v.id("serviceTypes")), // link if service
  priceExTax: v.number(),
  taxId: v.optional(v.id("taxes")),
  priceIncTax: v.number(),
  isArchived: v.boolean(),
})
```

### Image 2 — Appointment Types
Color-coded list with: name, optional "Telehealth enabled" badge, category, duration.

**Implication:** Same as M-12 `serviceTypes`. Category column = our `category` field. Duration explicit. Telehealth flag explicit.

### Image 3 — Payment Types
Simple list: HICAPS, Credit Card, EFTPOS, Cash, Other. Configurable by admin.

**Schema:**
```ts
paymentTypes: defineTable({
  name: v.string(),               // "NHIMA", "Cash", "Mobile Money"
  requiresReference: v.boolean(), // true for cards/bank, false for cash
  isArchived: v.boolean(),
  sortOrder: v.number(),
})
```
Replace the current hard-coded payment methods in `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/operations/PaymentsScreen.tsx:9` with a query against this table.

### Image 4 — Taxes
Name + Rate. E.g. "GST 10%", "VAT 16%".

**Schema:**
```ts
taxes: defineTable({
  name: v.string(),               // "VAT"
  rate: v.number(),               // 0.16
  isDefault: v.boolean(),
  isArchived: v.boolean(),
})
```
Currently `taxType` on `stockItems` is a hard-coded enum string. Switch to a `taxId` foreign key.

### Image 5 — Settings categories
Three columns:
- **Finances:** Billable items, Invoices, Payment types, Taxes.
- **Communication:** SMS settings, Appointment cancellations, Appointment confirmations, Appointment reminders, Follow-up messages, SMS message templates.
- **Data & docs:** Data imports, Data exports, Documents & printing.

**Implication:** Our Settings screen should be rebuilt with this grid layout. See §4.

### Image 6 — Cliniko Product Detail Reference
Shows: Item code, Price ex-tax, Price inc-tax, Cost price, Stock level. Sidebar nav: Dashboard, Appointments, Clients, Invoices, Payments, Products, Expenses, Contacts, Communications, Reports, Settings.

**Implication:** Confirms our overall navigation structure is correct. Cliniko has a "Contacts" tab (= referrers, GPs, other clinics) which we don't have — flag as **Phase 2** (`contacts` table for referring doctors).

---

## 4. New Settings Module — "Clinic Configuration"

Build a new Settings layout that matches Image 5. Both apps.

### Routes / Screens to add

| Section | Screen | Mobile path | Desktop path |
|---|---|---|---|
| Finances | Billable Items | `BillableItemsScreen` | `/settings/billable-items` |
| Finances | Payment Types | `PaymentTypesScreen` | `/settings/payment-types` |
| Finances | Taxes | `TaxesScreen` | `/settings/taxes` |
| Clinical | Appointment / Service Types | `ServiceTypesScreen` | `/settings/service-types` |
| Clinical | Recall Types | `RecallTypesScreen` | `/settings/recall-types` |
| Clinical | Treatment Note Templates | `NoteTemplatesScreen` | `/settings/note-templates` |
| Communication | SMS Templates | `SmsTemplatesScreen` | `/settings/sms-templates` |
| Communication | Appointment Reminders | `RemindersScreen` | `/settings/reminders` |
| Clinic | Clinic Details (M-28) | `ClinicDetailsScreen` | `/settings/clinic` |
| Clinic | Roles & Permissions | `RolesScreen` | `/settings/roles` |
| Data | Imports / Exports | `DataIoScreen` | `/settings/data` |

### Settings landing page redesign
Replace the simple tab list at `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/screens/settings/SettingsScreen.tsx:8-14` with a card-grid layout (3 columns × N rows) matching Image 5.

Mobile equivalent: replace `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/src/screens/more/SettingsScreen.js` with the same card grid (single column on mobile).

---

## 5. Schema Additions Required

Consolidated list (all to `convex/schema.ts`):

```ts
// Archive metadata pattern (apply to: patients, stockItems, suppliers, invoices, expenses, appointments, treatmentNotes)
isArchived: v.boolean(),
archivedBy: v.optional(v.string()),
archivedAt: v.optional(v.number()),
archiveReason: v.optional(v.string()),

// Patient (M-01, M-17)
phoneCountryCode: v.optional(v.string()),        // "+260"
nhimaMemberNo: v.optional(v.string()),
nhimaScheme: v.optional(v.string()),
nhimaEmployer: v.optional(v.string()),
consentAcceptedAt: v.optional(v.number()),
consentPreferences: v.optional(v.object({
  sms: v.boolean(), email: v.boolean(), phone: v.boolean(),
})),

// Appointment (M-11, M-14)
reasonForVisit: v.optional(v.string()),
serviceTypeId: v.optional(v.id("serviceTypes")),
extraStockUsed: v.optional(v.array(v.object({
  stockItemId: v.id("stockItems"),
  quantity: v.number(),
  reason: v.string(),
}))),

// Invoice (M-17, M-19)
submitToNhimaAt: v.optional(v.number()),
nhimaClaimNumber: v.optional(v.string()),
nhimaStatus: v.optional(v.string()),
paidAmount: v.optional(v.number()),               // for partial payments

// Stock (M-05, M-06)
alertOnLow: v.boolean(),                          // default true

// NEW TABLES
serviceTypes: defineTable({ /* see M-12 */ })
billableItems: defineTable({ /* see Image 1 */ })
paymentTypes: defineTable({ /* see Image 3 */ })
taxes: defineTable({ /* see Image 4 */ })
recallTypes: defineTable({ /* see M-31 */ })
recalls: defineTable({ /* see M-31 */ })
stockNotes: defineTable({ /* see M-06 */ })
smsTemplates: defineTable({
  name: v.string(),
  trigger: v.string(),     // "appointment_confirmation" | "reminder" | "cancellation" | "follow_up"
  body: v.string(),
  isActive: v.boolean(),
})
clinicSettings: defineTable({                     // singleton
  legalName: v.string(),
  tradingName: v.string(),
  logoStorageId: v.optional(v.string()),
  address: v.string(),
  phone: v.string(),
  email: v.string(),
  website: v.optional(v.string()),
  taxRegNumber: v.optional(v.string()),
  currency: v.string(),
  dateFormat: v.string(),
  defaultTaxId: v.optional(v.id("taxes")),
})
stockReconciliations: defineTable({               // M-08
  date: v.number(),
  performedBy: v.string(),
  items: v.array(v.object({
    stockItemId: v.id("stockItems"),
    systemCount: v.number(),
    physicalCount: v.number(),
    discrepancy: v.number(),
    reason: v.optional(v.string()),
  })),
  notes: v.optional(v.string()),
})
```

---

## 6. Permissions & Role Matrix (Updated)

Update `@/c:/Users/wilbu/Projects/Niche-heathcare-mobile-app/apps/desktop/src/hooks/useAuth.ts:52-64` and matching mobile auth hook.

| Permission | Admin | Moderator+ (Power Recept.) | Moderator (Recept.) | Bookkeeper | Member |
|---|:-:|:-:|:-:|:-:|:-:|
| `clinicDashboard` | ✅ | ✅ | ✅ | ✅ (read-only) | ❌ |
| `createPatient` / `editPatient` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `archivePatient` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `bookAppointment` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `createInvoice` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `editInvoice` (after creation) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `recordPayment` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `manageExpenses` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `viewFinancialReports` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `manageStock` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `archiveStock` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `manageStaff` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `manageSettings` (catalogs/taxes) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `messaging` / `channels` | ✅ | ✅ | ✅ | ✅ | ✅ |

**Action items:**
- Add `'moderator_plus'` and `'bookkeeper'` to the role enum.
- Refactor the `hasPermission` function in both apps to read from a permission map by role rather than the hardcoded arrays.
- Make this configurable in settings (`RolesScreen`) — admins can customise which permissions each non-admin role gets.

---

## 7. Prioritised Roadmap

### Sprint 1 — Critical fixes & data integrity (1–2 weeks)
1. **M-02** Desktop Save Profile bug.
2. **M-07** Archive-instead-of-delete across all tables.
3. **M-01** Country code picker (shared component).
4. **M-19** "Record Payment" modal replacing "Mark Paid".
5. **M-17** NHIMA fields on desktop patient form + as a payment type.
6. **M-27** Permissions refactor (roles + map).

### Sprint 2 — Service catalog & invoicing parity (2–3 weeks)
7. **M-12** Service Types table + screen.
8. **M-22** Billable Items + Taxes + Payment Types catalogs (Cliniko-style).
9. **M-10** Desktop CreateInvoice — stock picker per line item.
10. **M-14** Auto-populate invoice from appointment + service type.
11. **M-20** Invoice print + mobile share.
12. **M-21** Outstanding invoices dashboard.

### Sprint 3 — Workflow improvements (2 weeks)
13. **M-13** Recurring appointments UI.
14. **M-15** Uninvoiced / Missed filter (desktop) + report.
15. **M-26** Telehealth SMS/email patient invite.
16. **M-11** Reason-for-visit field.
17. **M-06** Stock notes (timestamps + author + archive).
18. **M-05** Per-item low-stock alert toggle.

### Sprint 4 — Reports, recalls & settings (2 weeks)
19. **M-23** Accountant reports (P&L, cashflow, tax).
20. **M-24** Revenue by product/service report.
21. **M-31** Recall types + recalls per patient.
22. **M-28** Editable clinic identity in settings.
23. **M-29** Mobile clock-in/out widget.

### Sprint 5 — Polish & deferred (1 week)
24. **M-03** Bold section headers.
25. **M-30** Staff status types.
26. **M-08** Stock reconciliation report.
27. **M-09** Batch number on stock adjustments.
28. **M-25** Report drafts & scheduled emails.

### Phase 2 — Deferred until clarified
- **M-32** Marketing module (segments + campaigns).
- **NHIMA real API** integration (currently flag-only).
- Cliniko-style "Contacts" (referrers / GPs) table.
- Hardware anti-theft integration.

---

**Owner / Reviewer:** sign off on this assessment before Sprint 1 starts so we can lock the schema additions in §5 and the role matrix in §6.
