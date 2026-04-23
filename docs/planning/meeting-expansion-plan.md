# NHL Connect — Meeting Expansion Plan (13 Apr 2026)

> New requirements from stakeholder meeting. This document maps every new requirement to:
> (A) modifications to existing screens, (B) new screens to build, (C) new backend collections,
> (D) new workflows, and (E) integration points.

---

## Table of Contents

1. [Requirements Summary](#1-requirements-summary)
2. [New Modules Overview](#2-new-modules-overview)
3. [Existing Screen Modifications](#3-existing-screen-modifications)
4. [New Screens to Build](#4-new-screens-to-build)
5. [New Backend Collections](#5-new-backend-collections)
6. [New Queries, Mutations & Actions](#6-new-queries-mutations--actions)
7. [NHIMA Integration Plan](#7-nhima-integration-plan)
8. [In-App Calling System](#8-in-app-calling-system)
9. [Navigation Changes](#9-navigation-changes)
10. [Updated Patient Profile Tabs](#10-updated-patient-profile-tabs)
11. [Build Order](#11-build-order)

---

## 1. Requirements Summary

Every requirement from the meeting, numbered for traceability:

| # | Requirement | Category | Priority |
|---|-------------|----------|----------|
| R01 | Patient must accept privacy policy before booking | Consent & Compliance | High |
| R02 | Patient communication preferences (message/email/calls) | Consent & Compliance | High |
| R03 | Patient must consent to data access | Consent & Compliance | High |
| R04 | Patient receives booking cancellation email | Notifications | High |
| R05 | NHIMA integration — invoices sent to NHIMA | Integration | High |
| R06 | All invoices support payment processing | Billing | High |
| R07 | Paper billing fallback when system is down | Billing | Medium |
| R08 | Invoice line items auto-deduct from stock | Stock/Inventory | High |
| R09 | Full stock/inventory management module | Stock/Inventory | High |
| R10 | Stock table: item code, name, serial number, supplier, price, tax, cost price, stock level, notes | Stock/Inventory | High |
| R11 | Suppliers saved and reusable after first entry | Stock/Inventory | High |
| R12 | Unique item codes, no duplicate products even from different suppliers | Stock/Inventory | High |
| R13 | Ownership/audit trail on all created items (invoices, notes, stock) | Audit | High |
| R14 | Stock adjustment system with reasons | Stock/Inventory | High |
| R15 | Stock increase reasons: purchase, returned, other | Stock/Inventory | High |
| R16 | Stock decrease reasons: damaged, out of date | Stock/Inventory | High |
| R17 | Expiry date tracking on stock items | Stock/Inventory | High |
| R18 | Expiry notification countdown: 3, 2, 1 months before expiry | Stock/Inventory | High |
| R19 | Payments section: all transaction details for invoices sent/received | Finance | High |
| R20 | Expenses section: add expense details, attach invoices/receipts | Finance | High |
| R21 | View all expenses and payments together | Finance | High |
| R22 | Enhanced patient profile: forms, letters, cases, account statement, recalls, communications | Patient Management | High |
| R23 | In-app calling system (VoIP) | Communication | Medium |
| R24 | NHIMA data sharing — correct invoicing for NHIMA patients | Integration | High |
| R25 | Create product / cancel flow in stock | Stock/Inventory | High |
| R26 | Tax dropdown (VAT at 16.0%) on stock items and invoices | Billing/Stock | High |
| R27 | Number-only keyboard for stock level input | UX | Low |

---

## 2. New Modules Overview

### 2A. Stock & Inventory Module (NEW — R08-R18, R25-R27)
Entirely new module. Entry from ClinicHub and MoreScreen.

### 2B. Suppliers Module (NEW — R11)
Supplier management, linked to stock items. Tracks first-time vs. regular suppliers.

### 2C. Finance Module — Payments & Expenses (NEW — R19-R21)
Payments ledger + expenses tracking. Merged view. Entry from ClinicHub and MoreScreen.

### 2D. Patient Consent System (NEW — R01-R03)
Privacy policy acceptance + communication preferences. Gate before booking.

### 2E. Enhanced Patient Profile (MODIFY — R22)
Add tabs/sections: Forms, Letters, Cases, Account Statement, Recalls, Communications.

### 2F. NHIMA Integration (NEW — R05, R24)
External API integration for invoice submission and data sharing.

### 2G. In-App Calling (NEW — R23)
VoIP calling between staff members. Extension of existing messaging system.

---

## 3. Existing Screen Modifications

### 3.1 ClinicHubScreen — `src/screens/clinic/ClinicHubScreen.js`

**Current quick actions (6):** Book Appointment, Patient Lookup, Treatment Note, Create Invoice, Reports, Telehealth

**Add quick actions:**
| New Action | Icon | Nav Target |
|-----------|------|-----------|
| Stock / Inventory | `package` | `StockList` |
| Payments | `dollar-sign` | `PaymentsList` |
| Expenses | `file-minus` | `ExpensesList` |

**Add quick stats:**
| New Stat | Data |
|----------|------|
| Low Stock | Count of items below reorder level |
| Expiring Soon | Count of items expiring within 3 months |

---

### 3.2 MoreScreen — `src/screens/more/MoreScreen.js`

**Current "Clinic Tools" section:** ClinicHub, Appointments, Patients, Billing & Invoices, Reports, Telehealth

**Add to "Clinic Tools":**
| New Item | Icon | Screen |
|----------|------|--------|
| Stock & Inventory | `package` | `StockList` |
| Payments | `dollar-sign` | `PaymentsList` |
| Expenses | `file-minus` | `ExpensesList` |
| Suppliers | `truck` | `SuppliersList` |

---

### 3.3 BookAppointmentScreen — `src/screens/clinic/BookAppointmentScreen.js`

**Modifications for R01-R03:**
- Before saving, check if patient has accepted privacy policy
- If not: show consent modal/screen with:
  - Privacy policy text (scrollable, must scroll to bottom)
  - Communication preferences checkboxes: SMS, Email, Phone Calls
  - Data access consent checkbox
  - "I Accept" button (disabled until all required consents given)
- Store consent on patient record with timestamp
- Only patients with `consentAccepted: true` can have appointments booked

**Add tax handling (R26):**
- Add tax toggle/dropdown to BookAppointment if linked to invoice creation

---

### 3.4 CreateInvoiceScreen — `src/screens/clinic/CreateInvoiceScreen.js`

**Modifications:**
- **R08 — Stock deduction:** When line items are added, show stock item search/picker. When invoice is saved, auto-deduct quantities from stock.
- **R26 — Tax:** Add a tax dropdown per line item or per invoice (VAT 16.0%, Exempt, Zero-rated). Auto-calculate tax amount.
- **R05/R24 — NHIMA:** Add "Submit to NHIMA" toggle. If patient is NHIMA-insured, auto-enable.
- **R13 — Ownership:** Already tracked by `providerId`. Ensure `createdBy` field is saved.
- **R07 — Paper fallback:** Add "Paper Invoice" option that generates a printable PDF without requiring system connectivity.

**New fields needed:**
```
- taxRate (dropdown: 0%, 16% VAT)
- taxAmount (auto-calculated)
- linkedStockItems[] (item ID + qty to deduct)
- submitToNhima (boolean toggle)
- nhimaClaimId (returned from NHIMA API)
- createdBy (user ID)
```

---

### 3.5 InvoiceDetailScreen — `src/screens/clinic/InvoiceDetailScreen.js`

**Modifications:**
- **R06 — Payment processing:** Add "Record Payment" modal with: amount, method (Cash, Mobile Money, Insurance, Card, NHIMA), date, reference number.
- **R05 — NHIMA status:** Show NHIMA claim status badge (Submitted, Approved, Rejected, Pending).
- **R19 — Payment history:** Already exists. Enhance with method icons and reference numbers.
- **R13 — Ownership:** Show "Created by: Dr. Sarah Mbewe" with timestamp.

---

### 3.6 PatientProfileScreen — `src/screens/clinic/PatientProfileScreen.js`

**Current tabs (5):** Overview, Notes, Files, Billing, Appointments

**New tabs to add (R22):**
| New Tab | Content |
|---------|---------|
| Forms | Patient consent forms, intake forms, signed documents |
| Letters | Referral letters, discharge letters, medical certificates |
| Cases | Clinical cases grouping related appointments/notes/invoices |
| Statement | Account statement — all charges, payments, balance |
| Recalls | Scheduled follow-up reminders/recalls |
| Comms | Communication log — all messages, calls, emails to/from patient |

**Total tabs: 11** — This is too many for a horizontal tab bar. **Solution:** Use a 2-row tab system or a scrollable tab bar, or group into primary tabs with sub-sections.

**Recommended structure:**
```
Primary Tabs (visible):  Overview | Clinical | Financial | Communications
                                    |            |              |
Sub-sections:         Notes        Billing      Comms
                      Files        Statement    Recalls
                      Forms        Payments     Letters
                      Cases
                      Appointments
```

---

### 3.7 AddEditPatientScreen — `src/screens/clinic/AddEditPatientScreen.js`

**Add fields (R01-R03):**
- Communication preferences section:
  - Preferred contact method: SMS / Email / Phone Call (multi-select)
  - Consent to data access: checkbox + date
  - Privacy policy accepted: checkbox + date
- NHIMA section (R24):
  - NHIMA member: Yes/No toggle
  - NHIMA number (if yes)
  - NHIMA scheme type

---

### 3.8 TreatmentNoteScreen — `src/screens/clinic/TreatmentNoteScreen.js`

**Modifications (R13):**
- Show "Created by" with user name and timestamp on read-only view
- Track `createdBy` and `updatedBy` user IDs

**Modifications (R08):**
- If treatment uses consumables, allow linking stock items used (optional)
- Auto-deduct from stock on save

---

### 3.9 HomeScreen — `src/screens/home/HomeScreen.js`

**Add to clinic quick access card:**
- Show low stock alert count if > 0
- Show expiring items count if > 0

---

### 3.10 AppointmentDetailScreen — `src/screens/clinic/AppointmentDetailScreen.js`

**Modifications (R04):**
- "Cancel" button now triggers cancellation email to patient
- Show confirmation: "Cancel appointment? Patient will be notified via [email/SMS]."

---

## 4. New Screens to Build

### 4A. STOCK & INVENTORY MODULE

#### 4A-01. StockListScreen
**Entry:** ClinicHub > "Stock/Inventory" tile, MoreScreen > "Stock & Inventory"
**Content:**
- Search bar
- Filter pills: All, Low Stock, Expiring Soon, Out of Stock
- Stock item cards: item code, name, stock level (color-coded), price, supplier
- Sort by: name, stock level, expiry date
- FAB → CreateEditProduct

#### 4A-02. StockItemDetailScreen
**Entry:** StockListScreen > item press
**Content:**
- Item code, name, serial number
- Supplier name (linked, pressable → SupplierDetail)
- Price per unit + tax info (VAT 16% or exempt)
- Cost price (total expense = price × stock level)
- Current stock level (large, color-coded: green >10, yellow 1-10, red 0)
- Expiry date + countdown badge ("Expires in 2 months")
- Notes
- **Ownership:** "Added by [user] on [date]", "Last updated by [user] on [date]"
- **Action buttons:**
  - "Adjust Stock" → StockAdjustmentScreen
  - "Edit" → CreateEditProduct (edit mode)
  - "View History" → StockHistoryScreen

#### 4A-03. CreateEditProductScreen (modal)
**Entry:** StockListScreen FAB, StockItemDetail > "Edit"
**Fields:**
- Item code (auto-generated, unique, editable) — validate uniqueness
- Name (required) — warn if similar name exists (duplicate prevention)
- Serial number (optional)
- Supplier (searchable dropdown — R11: saved suppliers appear as suggestions)
  - "Add New Supplier" inline option
- Price per item (number keyboard) — e.g., "K 10 per syringe"
- Tax section:
  - Includes tax? toggle
  - Tax dropdown: VAT (16.0%), Zero-rated, Exempt
- Cost price (auto-calculated: price × quantity or shown as total expense)
- Stock level (number-only keyboard — R27)
- Expiry date (date picker — R17)
- Notes (multiline text)
- **Buttons:** "Create Product" / "Save Changes" | "Cancel"
- **Validation:** Duplicate check on save — if product name + serial already exists, show error

#### 4A-04. StockAdjustmentScreen (modal)
**Entry:** StockItemDetail > "Adjust Stock"
**Content:**
- Current stock level (displayed, not editable)
- Adjustment type: Increase / Decrease (toggle)
- **Increase reasons (R15):** Stock Purchase, Returned, Other
- **Decrease reasons (R16):** Damaged, Out of Date, Used (consumed), Other
- Quantity to adjust (number-only keyboard)
- New stock level (auto-calculated preview)
- Notes/reason detail (required for "Other")
- Date of adjustment (default today)
- **Save button** — logs adjustment with full audit trail (R13)

#### 4A-05. StockHistoryScreen
**Entry:** StockItemDetail > "View History"
**Content:**
- Chronological list of all adjustments for this item
- Each entry: date, adjustment type (↑/↓), quantity, reason, who did it, notes
- Filter by: All, Increases, Decreases

#### 4A-06. ExpiryAlertsScreen
**Entry:** ClinicHub > "Expiring Soon" stat, Notifications
**Content:**
- List of items grouped by urgency:
  - **Expired** (red) — past expiry date
  - **Expires this month** (red) — within 30 days
  - **Expires in 2 months** (warning/orange)
  - **Expires in 3 months** (yellow)
- Each item: name, item code, expiry date, stock level, "Adjust Stock" button

---

### 4B. SUPPLIERS MODULE

#### 4B-01. SuppliersListScreen
**Entry:** MoreScreen > "Suppliers", CreateEditProduct > "View all suppliers"
**Content:**
- Search bar
- Supplier cards: name, contact, product count, last order date
- FAB → CreateEditSupplier
- Filter: All, Frequent (>3 orders), New

#### 4B-02. SupplierDetailScreen
**Entry:** SuppliersListScreen > supplier press, StockItemDetail > supplier name press
**Content:**
- Supplier name, contact person, phone, email, address
- Products supplied (list of linked stock items)
- Order history
- "Edit" button → CreateEditSupplier
- Notes

#### 4B-03. CreateEditSupplierScreen (modal)
**Entry:** SuppliersListScreen FAB, CreateEditProduct > "Add New Supplier"
**Fields:**
- Name (required)
- Contact person
- Phone
- Email
- Address
- Notes
- **Save / Cancel buttons**

---

### 4C. FINANCE MODULE — PAYMENTS & EXPENSES

#### 4C-01. PaymentsListScreen
**Entry:** ClinicHub > "Payments" tile, MoreScreen > "Payments"
**Content:**
- Summary card: Total Received (this month), Total Pending, Total Overdue
- Filter pills: All, Received, Pending, Overdue
- Payment entry list:
  - Invoice number, patient name, amount, method, date, status
  - Press → InvoiceDetail (linked)
- Search by invoice number or patient name

#### 4C-02. RecordPaymentScreen (modal)
**Entry:** InvoiceDetailScreen > "Record Payment"
**Fields:**
- Invoice number (pre-filled, read-only)
- Patient name (pre-filled, read-only)
- Outstanding amount (displayed)
- Payment amount (number input)
- Payment method: Cash, Mobile Money, Card, Insurance (NHIMA), Bank Transfer, Other
- Reference number (optional — for mobile money, card, or bank transfers)
- Payment date (default today)
- Notes
- **Save / Cancel buttons**
- On save: update invoice status (paid/partial), create payment record, update patient account statement

#### 4C-03. ExpensesListScreen
**Entry:** ClinicHub > "Expenses" tile, MoreScreen > "Expenses"
**Content:**
- Summary card: Total Expenses (this month), by category
- Filter pills: All, Medical Supplies, Equipment, Utilities, Other
- Expense entry list:
  - Description, amount, category, date, attached documents count
  - Press → ExpenseDetailScreen
- FAB → CreateExpenseScreen

#### 4C-04. CreateExpenseScreen (modal)
**Entry:** ExpensesListScreen FAB
**Fields:**
- Description (required)
- Amount (number input)
- Category: Medical Supplies, Equipment, Utilities, Salaries, Maintenance, Other
- Date (default today)
- Vendor/Payee name
- Payment method: Cash, Mobile Money, Card, Bank Transfer
- Reference number (optional)
- **Attach invoice/receipt** (R20): camera capture or file picker — upload to Convex storage
- Multiple attachments supported
- Notes
- **Save / Cancel buttons**

#### 4C-05. ExpenseDetailScreen
**Entry:** ExpensesListScreen > expense press
**Content:**
- All expense fields (read-only)
- Attached invoices/receipts (viewable/downloadable)
- Created by + timestamp (R13)
- "Edit" / "Delete" buttons

#### 4C-06. FinanceOverviewScreen
**Entry:** ClinicHub or Reports — "Financial Overview"
**Content:**
- Combined view (R21):
  - Revenue summary (from payments received)
  - Expenses summary
  - Net position (revenue - expenses)
  - Trend charts
- Period picker: This Week, This Month, This Quarter
- Quick links to Payments and Expenses lists

---

### 4D. PATIENT CONSENT SYSTEM

#### 4D-01. PatientConsentScreen (modal)
**Entry:** BookAppointmentScreen (triggered before save if consent not given)
**Content:**
- NHL Healthcare logo
- "Privacy Policy & Consent" header
- Scrollable privacy policy text
- **Checkboxes:**
  - [ ] I have read and accept the Privacy Policy (required)
  - [ ] I consent to my health data being accessed and stored (required)
  - [ ] I consent to receive communications via:
    - [ ] SMS
    - [ ] Email
    - [ ] Phone Call
- Signature line (optional — could be typed name confirmation)
- Date (auto-filled today)
- **"I Accept" button** — disabled until required checkboxes checked
- **"Cancel" button** — returns to booking screen without saving

---

### 4E. ENHANCED PATIENT PROFILE SUB-SCREENS

#### 4E-01. PatientFormsScreen
**Entry:** PatientProfileScreen > Forms section
**Content:**
- List of completed forms: consent forms, intake questionnaires
- Each form: name, date completed, signed by
- "Add Form" button → form template picker
- Form press → view completed form (read-only)

#### 4E-02. PatientLettersScreen
**Entry:** PatientProfileScreen > Letters section
**Content:**
- List of letters: referral letters, discharge summaries, medical certificates
- Each letter: type, date, author, recipient
- "Create Letter" button → letter template picker
- Letter press → view/edit letter
- "Print" / "Email" actions per letter

#### 4E-03. PatientCasesScreen
**Entry:** PatientProfileScreen > Cases section
**Content:**
- A "case" groups related appointments, notes, invoices for a clinical episode
- Case list: case name, status (Open/Closed), date range, linked items count
- Case press → CaseDetailScreen showing timeline of linked items
- "Create Case" button

#### 4E-04. PatientAccountStatementScreen
**Entry:** PatientProfileScreen > Statement section
**Content:**
- Running balance display (credit/debit)
- Chronological list:
  - Charges (invoices created) — debit
  - Payments received — credit
  - Adjustments — credit/debit
- Date range filter
- Running balance after each transaction
- "Export PDF" / "Print" button
- Summary: Total Charged, Total Paid, Outstanding Balance

#### 4E-05. PatientRecallsScreen
**Entry:** PatientProfileScreen > Recalls section
**Content:**
- List of scheduled recalls/follow-up reminders
- Each recall: reason, due date, status (Pending/Completed/Overdue), assigned provider
- "Create Recall" button → recall form:
  - Reason (text)
  - Due date
  - Assigned provider (dropdown)
  - Notification method (SMS/Email/Call)
  - Notes
- Recall items automatically generate notifications when due

#### 4E-06. PatientCommsScreen
**Entry:** PatientProfileScreen > Communications section
**Content:**
- Unified communication log:
  - SMS sent/received (linked to Twilio)
  - Emails sent
  - Phone calls logged (manual entry or from in-app calls)
  - In-app messages (if patient portal active)
- Each entry: type icon, direction (in/out), content preview, date, staff member
- "Log Communication" button → manual entry form
- Filter: All, SMS, Email, Calls

---

### 4F. IN-APP CALLING

#### 4F-01. CallScreen (fullScreenModal)
**Entry:** StaffProfile > "Call" button, ChatScreen > phone icon in header
**Content:**
- Full-screen calling interface (similar to TelehealthCallScreen but for staff-to-staff)
- Recipient name + avatar
- Call status: Ringing, Connected, Ended
- Call duration timer
- Controls: Mute, Speaker, End Call
- After call: log to communication history

#### 4F-02. CallHistoryScreen
**Entry:** MoreScreen or Messages
**Content:**
- Recent calls list: name, direction (incoming/outgoing/missed), duration, timestamp
- Call entry press → return call or view profile

---

## 5. New Backend Collections

### 5.1 `stockItems`
```typescript
stockItems: defineTable({
  itemCode:         v.string(),           // unique, e.g., "STK-001"
  name:             v.string(),
  serialNumber:     v.optional(v.string()),
  supplierId:       v.id('suppliers'),
  pricePerItem:     v.number(),           // Kwacha, per unit
  includesTax:      v.boolean(),
  taxType:          v.union(v.literal('vat_16'), v.literal('zero_rated'), v.literal('exempt')),
  taxRate:          v.number(),           // 0.16, 0, 0
  costPrice:        v.number(),           // total expense (computed or manual)
  stockLevel:       v.number(),           // current quantity
  reorderLevel:     v.optional(v.number()), // alert threshold
  expiryDate:       v.optional(v.number()), // timestamp
  notes:            v.optional(v.string()),
  status:           v.union(v.literal('active'), v.literal('discontinued')),
  createdBy:        v.id('users'),
  updatedBy:        v.optional(v.id('users')),
  createdAt:        v.number(),
  updatedAt:        v.number(),
})
.index('by_item_code', ['itemCode'])
.index('by_name', ['name'])
.index('by_supplier', ['supplierId'])
.index('by_stock_level', ['stockLevel'])
.index('by_expiry', ['expiryDate'])
.index('by_status', ['status'])
.searchIndex('search_stock', {
  searchField: 'name',
  filterFields: ['status'],
})
```

### 5.2 `stockAdjustments`
```typescript
stockAdjustments: defineTable({
  stockItemId:    v.id('stockItems'),
  adjustmentType: v.union(v.literal('increase'), v.literal('decrease')),
  reason:         v.union(
                    // increase reasons
                    v.literal('stock_purchase'),
                    v.literal('returned'),
                    v.literal('other_increase'),
                    // decrease reasons
                    v.literal('damaged'),
                    v.literal('out_of_date'),
                    v.literal('used'),
                    v.literal('other_decrease')
                  ),
  quantity:        v.number(),
  previousLevel:   v.number(),
  newLevel:        v.number(),
  notes:           v.optional(v.string()),
  adjustedBy:      v.id('users'),
  adjustedAt:      v.number(),
  linkedInvoiceId: v.optional(v.id('invoices')),   // if deducted via invoice
})
.index('by_stock_item', ['stockItemId'])
.index('by_adjusted_at', ['adjustedAt'])
.index('by_reason', ['reason'])
```

### 5.3 `suppliers`
```typescript
suppliers: defineTable({
  name:            v.string(),
  contactPerson:   v.optional(v.string()),
  phone:           v.optional(v.string()),
  email:           v.optional(v.string()),
  address:         v.optional(v.string()),
  notes:           v.optional(v.string()),
  isFrequent:      v.boolean(),         // auto-set after 3+ orders
  orderCount:      v.number(),
  lastOrderDate:   v.optional(v.number()),
  createdBy:       v.id('users'),
  createdAt:       v.number(),
  updatedAt:       v.number(),
})
.index('by_name', ['name'])
.searchIndex('search_suppliers', {
  searchField: 'name',
})
```

### 5.4 `payments`
```typescript
payments: defineTable({
  invoiceId:       v.id('invoices'),
  patientId:       v.id('patients'),
  amount:          v.number(),
  method:          v.union(
                     v.literal('cash'),
                     v.literal('mobile_money'),
                     v.literal('card'),
                     v.literal('insurance_nhima'),
                     v.literal('bank_transfer'),
                     v.literal('other')
                   ),
  referenceNumber: v.optional(v.string()),
  status:          v.union(v.literal('completed'), v.literal('pending'), v.literal('failed')),
  paymentDate:     v.number(),
  notes:           v.optional(v.string()),
  recordedBy:      v.id('users'),
  createdAt:       v.number(),
})
.index('by_invoice', ['invoiceId'])
.index('by_patient', ['patientId'])
.index('by_date', ['paymentDate'])
.index('by_method', ['method'])
.index('by_status', ['status'])
```

### 5.5 `expenses`
```typescript
expenses: defineTable({
  description:     v.string(),
  amount:          v.number(),
  category:        v.union(
                     v.literal('medical_supplies'),
                     v.literal('equipment'),
                     v.literal('utilities'),
                     v.literal('salaries'),
                     v.literal('maintenance'),
                     v.literal('other')
                   ),
  date:            v.number(),
  vendorName:      v.optional(v.string()),
  paymentMethod:   v.optional(v.string()),
  referenceNumber: v.optional(v.string()),
  attachments:     v.array(v.object({
                     name: v.string(),
                     storageId: v.id('_storage'),
                     url: v.string(),
                     type: v.string(),
                   })),
  notes:           v.optional(v.string()),
  createdBy:       v.id('users'),
  updatedBy:       v.optional(v.id('users')),
  createdAt:       v.number(),
  updatedAt:       v.number(),
})
.index('by_date', ['date'])
.index('by_category', ['category'])
.index('by_created_by', ['createdBy'])
```

### 5.6 `patientConsents`
```typescript
patientConsents: defineTable({
  patientId:              v.id('patients'),
  privacyPolicyAccepted:  v.boolean(),
  privacyPolicyDate:      v.optional(v.number()),
  dataAccessConsent:      v.boolean(),
  dataAccessDate:         v.optional(v.number()),
  commPreferences:        v.object({
    sms:    v.boolean(),
    email:  v.boolean(),
    phone:  v.boolean(),
  }),
  commPreferencesDate:    v.optional(v.number()),
  version:                v.string(),           // policy version accepted
  recordedBy:             v.id('users'),
  createdAt:              v.number(),
  updatedAt:              v.number(),
})
.index('by_patient', ['patientId'])
```

### 5.7 `patientLetters`
```typescript
patientLetters: defineTable({
  patientId:      v.id('patients'),
  type:           v.union(
                    v.literal('referral'),
                    v.literal('discharge_summary'),
                    v.literal('medical_certificate'),
                    v.literal('sick_note'),
                    v.literal('other')
                  ),
  title:          v.string(),
  content:        v.string(),
  recipientName:  v.optional(v.string()),
  recipientOrg:   v.optional(v.string()),
  attachments:    v.array(v.object({
                    name: v.string(),
                    storageId: v.id('_storage'),
                    url: v.string(),
                  })),
  createdBy:      v.id('users'),
  createdAt:      v.number(),
})
.index('by_patient', ['patientId'])
.index('by_type', ['type'])
```

### 5.8 `patientCases`
```typescript
patientCases: defineTable({
  patientId:       v.id('patients'),
  name:            v.string(),
  description:     v.optional(v.string()),
  status:          v.union(v.literal('open'), v.literal('closed')),
  startDate:       v.number(),
  endDate:         v.optional(v.number()),
  linkedAppointmentIds: v.array(v.id('clinicAppointments')),
  linkedNoteIds:        v.array(v.id('treatmentNotes')),
  linkedInvoiceIds:     v.array(v.id('invoices')),
  createdBy:       v.id('users'),
  createdAt:       v.number(),
  updatedAt:       v.number(),
})
.index('by_patient', ['patientId'])
.index('by_status', ['status'])
```

### 5.9 `patientRecalls`
```typescript
patientRecalls: defineTable({
  patientId:       v.id('patients'),
  reason:          v.string(),
  dueDate:         v.number(),
  status:          v.union(v.literal('pending'), v.literal('completed'), v.literal('overdue'), v.literal('cancelled')),
  assignedTo:      v.optional(v.id('users')),
  notificationMethod: v.union(v.literal('sms'), v.literal('email'), v.literal('phone')),
  notificationSent:   v.boolean(),
  notes:           v.optional(v.string()),
  completedAt:     v.optional(v.number()),
  createdBy:       v.id('users'),
  createdAt:       v.number(),
})
.index('by_patient', ['patientId'])
.index('by_due_date', ['dueDate'])
.index('by_status', ['status'])
```

### 5.10 `communicationLogs`
```typescript
communicationLogs: defineTable({
  patientId:       v.optional(v.id('patients')),
  staffId:         v.optional(v.id('users')),     // other party if staff-to-staff
  type:            v.union(v.literal('sms'), v.literal('email'), v.literal('phone_call'), v.literal('in_app')),
  direction:       v.union(v.literal('inbound'), v.literal('outbound')),
  subject:         v.optional(v.string()),
  content:         v.optional(v.string()),
  duration:        v.optional(v.number()),         // for calls, in seconds
  status:          v.union(v.literal('sent'), v.literal('delivered'), v.literal('failed'), v.literal('completed'), v.literal('missed')),
  loggedBy:        v.id('users'),
  createdAt:       v.number(),
})
.index('by_patient', ['patientId'])
.index('by_staff', ['staffId'])
.index('by_type', ['type'])
.index('by_date', ['createdAt'])
```

### 5.11 `calls` (In-App VoIP)
```typescript
calls: defineTable({
  callerId:        v.id('users'),
  receiverId:      v.id('users'),
  status:          v.union(
                     v.literal('ringing'),
                     v.literal('connected'),
                     v.literal('ended'),
                     v.literal('missed'),
                     v.literal('declined')
                   ),
  startedAt:       v.number(),
  connectedAt:     v.optional(v.number()),
  endedAt:         v.optional(v.number()),
  duration:        v.optional(v.number()),
  roomId:          v.optional(v.string()),
  createdAt:       v.number(),
})
.index('by_caller', ['callerId'])
.index('by_receiver', ['receiverId'])
.index('by_status', ['status'])
```

---

### 5.12 Modifications to Existing Collections

#### `patients` — add fields:
```typescript
// NHIMA fields (R24)
nhimaNumber:        v.optional(v.string()),
nhimaScheme:        v.optional(v.string()),
isNhimaMember:      v.optional(v.boolean()),

// Communication preferences (R02)
commPreferences:    v.optional(v.object({
  sms:    v.boolean(),
  email:  v.boolean(),
  phone:  v.boolean(),
})),

// Consent (R01, R03)
consentAccepted:    v.optional(v.boolean()),
consentDate:        v.optional(v.number()),
```

#### `invoices` — add fields:
```typescript
// Tax (R26)
taxRate:            v.optional(v.number()),
taxType:            v.optional(v.string()),

// Stock linkage (R08)
linkedStockItems:   v.optional(v.array(v.object({
  stockItemId: v.id('stockItems'),
  quantity:    v.number(),
}))),

// NHIMA (R05)
nhimaClaimId:       v.optional(v.string()),
nhimaStatus:        v.optional(v.union(
  v.literal('not_submitted'),
  v.literal('submitted'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('pending')
)),

// Audit (R13)
createdBy:          v.id('users'),
updatedBy:          v.optional(v.id('users')),
```

#### `treatmentNotes` — add field:
```typescript
// Audit (R13)
updatedBy:          v.optional(v.id('users')),

// Stock usage (R08 — optional)
consumablesUsed:    v.optional(v.array(v.object({
  stockItemId: v.id('stockItems'),
  quantity:    v.number(),
}))),
```

---

## 6. New Queries, Mutations & Actions

### Stock & Inventory
| Type | Name | Purpose |
|------|------|---------|
| Q | `stockItems.listAll` | All stock items with search/filter |
| Q | `stockItems.getById` | Single stock item detail |
| Q | `stockItems.search` | Search by name/code |
| Q | `stockItems.getLowStock` | Items below reorder level |
| Q | `stockItems.getExpiringSoon` | Items expiring within 3 months |
| Q | `stockItems.getExpired` | Items past expiry |
| Q | `stockAdjustments.listByItem` | History for an item |
| M | `stockItems.create` | Create product (validate uniqueness) |
| M | `stockItems.update` | Edit product |
| M | `stockItems.adjustLevel` | Adjust stock + create adjustment record |
| M | `stockItems.deductForInvoice` | Auto-deduct when invoice saved |

### Suppliers
| Type | Name | Purpose |
|------|------|---------|
| Q | `suppliers.list` | All suppliers |
| Q | `suppliers.getById` | Single supplier |
| Q | `suppliers.search` | Search suppliers |
| M | `suppliers.create` | Add supplier |
| M | `suppliers.update` | Edit supplier |

### Payments
| Type | Name | Purpose |
|------|------|---------|
| Q | `payments.listAll` | All payments with filters |
| Q | `payments.listByInvoice` | Payments for an invoice |
| Q | `payments.listByPatient` | Payments for a patient |
| Q | `payments.getSummary` | Monthly totals |
| M | `payments.record` | Record a payment |

### Expenses
| Type | Name | Purpose |
|------|------|---------|
| Q | `expenses.listAll` | All expenses with filters |
| Q | `expenses.getById` | Single expense |
| Q | `expenses.getSummary` | Monthly/category totals |
| M | `expenses.create` | Add expense |
| M | `expenses.update` | Edit expense |
| M | `expenses.delete` | Delete expense |

### Patient Consent
| Type | Name | Purpose |
|------|------|---------|
| Q | `patientConsents.getByPatient` | Get consent status |
| M | `patientConsents.record` | Record consent acceptance |
| M | `patientConsents.update` | Update preferences |

### Patient Enhancements
| Type | Name | Purpose |
|------|------|---------|
| Q | `patientLetters.listByPatient` | Patient's letters |
| M | `patientLetters.create` | Create letter |
| Q | `patientCases.listByPatient` | Patient's cases |
| M | `patientCases.create` | Create case |
| M | `patientCases.linkItem` | Link appointment/note/invoice to case |
| Q | `patientRecalls.listByPatient` | Patient's recalls |
| Q | `patientRecalls.getOverdue` | All overdue recalls |
| M | `patientRecalls.create` | Create recall |
| M | `patientRecalls.complete` | Mark complete |
| Q | `communicationLogs.listByPatient` | Patient's comms |
| M | `communicationLogs.create` | Log a communication |
| Q | `payments.getAccountStatement` | Patient charges + payments timeline |

### NHIMA
| Type | Name | Purpose |
|------|------|---------|
| A | `nhima.submitClaim` | Submit invoice to NHIMA API |
| A | `nhima.checkClaimStatus` | Check claim status |
| A | `nhima.syncPatient` | Sync patient NHIMA data |

### In-App Calling
| Type | Name | Purpose |
|------|------|---------|
| M | `calls.initiate` | Start a call |
| M | `calls.answer` | Answer incoming call |
| M | `calls.end` | End call |
| M | `calls.decline` | Decline call |
| Q | `calls.getIncoming` | Check for incoming calls (reactive) |
| Q | `calls.getHistory` | Recent call history |

### Notifications (new crons)
| Type | Name | Purpose |
|------|------|---------|
| Cron | `stock.checkExpiry` | Daily — check expiry dates, send 3/2/1 month alerts |
| Cron | `recalls.checkOverdue` | Daily — mark overdue recalls, send notifications |
| A | `notifications.sendCancellationEmail` | Send booking cancellation email to patient (R04) |

---

## 7. NHIMA Integration Plan

**NHIMA** = National Health Insurance Management Authority (Zambia)

### What needs to happen:
1. **Patient registration:** If patient is NHIMA member, store NHIMA number + scheme
2. **Invoice submission:** When invoice is created for NHIMA patient, submit claim to NHIMA
3. **Claim tracking:** Track claim status (submitted → approved/rejected)
4. **Payment reconciliation:** When NHIMA pays, record as payment against invoice
5. **Data sharing:** Share required patient/treatment data with NHIMA as per their API

### Integration approach:
- **Phase 1 (MVP):** Manual NHIMA number entry, "Submit to NHIMA" button on invoices, PDF export formatted for NHIMA
- **Phase 2:** Direct API integration if NHIMA provides one (explore their technical documentation)
- **Phase 3:** Automated claim submission, status polling, payment reconciliation

### Data flow:
```
CreateInvoice → [NHIMA patient?] → Toggle "Submit to NHIMA"
→ On save: Create invoice + submit claim (Action: external HTTP)
→ Claim ID returned and stored on invoice
→ Cron polls claim status periodically
→ When approved: auto-record payment from NHIMA
```

---

## 8. In-App Calling System

### Technical approach:
- Use **WebRTC** (via a service like Twilio Voice, Agora, or Daily.co)
- Convex manages call state (ringing, connected, ended)
- Push notification sent to receiver when call initiated
- VoIP push for background call receiving (APNs VoIP for iOS, FCM for Android)

### UI integration points:
- **StaffProfileScreen:** Add "Call" button next to "Message"
- **ChatScreen header:** Add phone icon button
- **Incoming call:** Full-screen overlay with Accept/Decline
- **Active call:** Same style as TelehealthCallScreen but simpler (no video by default)
- **Call history:** Accessible from Messages tab or MoreScreen

---

## 9. Navigation Changes

### New screens to register in `MoreStack` (TabNavigator.js):

```javascript
// Stock & Inventory
<MoreStack.Screen name="StockList" component={StockListScreen} />
<MoreStack.Screen name="StockItemDetail" component={StockItemDetailScreen} />
<MoreStack.Screen name="CreateEditProduct" component={CreateEditProductScreen} options={{ presentation: 'modal' }} />
<MoreStack.Screen name="StockAdjustment" component={StockAdjustmentScreen} options={{ presentation: 'modal' }} />
<MoreStack.Screen name="StockHistory" component={StockHistoryScreen} />
<MoreStack.Screen name="ExpiryAlerts" component={ExpiryAlertsScreen} />

// Suppliers
<MoreStack.Screen name="SuppliersList" component={SuppliersListScreen} />
<MoreStack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
<MoreStack.Screen name="CreateEditSupplier" component={CreateEditSupplierScreen} options={{ presentation: 'modal' }} />

// Finance
<MoreStack.Screen name="PaymentsList" component={PaymentsListScreen} />
<MoreStack.Screen name="RecordPayment" component={RecordPaymentScreen} options={{ presentation: 'modal' }} />
<MoreStack.Screen name="ExpensesList" component={ExpensesListScreen} />
<MoreStack.Screen name="CreateExpense" component={CreateExpenseScreen} options={{ presentation: 'modal' }} />
<MoreStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
<MoreStack.Screen name="FinanceOverview" component={FinanceOverviewScreen} />

// Patient Consent
<MoreStack.Screen name="PatientConsent" component={PatientConsentScreen} options={{ presentation: 'modal' }} />

// Patient Profile Subs
<MoreStack.Screen name="PatientForms" component={PatientFormsScreen} />
<MoreStack.Screen name="PatientLetters" component={PatientLettersScreen} />
<MoreStack.Screen name="PatientCases" component={PatientCasesScreen} />
<MoreStack.Screen name="PatientStatement" component={PatientAccountStatementScreen} />
<MoreStack.Screen name="PatientRecalls" component={PatientRecallsScreen} />
<MoreStack.Screen name="PatientComms" component={PatientCommsScreen} />

// Calling
<MoreStack.Screen name="Call" component={CallScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
<MoreStack.Screen name="CallHistory" component={CallHistoryScreen} />
```

**Total new screens: ~24**

---

## 10. Updated Patient Profile Tabs

### Restructured tab layout for PatientProfileScreen:

```
Scrollable tab bar (horizontal):

[Overview] [Clinical] [Billing] [Comms] [Cases]

Overview → existing (allergies, meds, conditions, emergency, insurance + NHIMA info + consent status)
Clinical → Notes, Files, Appointments, Recalls, Forms (sub-tabs or scrollable sections)
Billing  → Invoices, Payments, Account Statement
Comms    → Communications log, Letters
Cases    → Clinical cases
```

Each "sub-tab" renders as a section within the main tab content, with "See All" links to full screens.

---

## 11. Build Order

### Phase A: Stock & Inventory (highest impact from meeting)
1. `suppliers` collection + mock data + SuppliersListScreen + CreateEditSupplierScreen
2. `stockItems` collection + mock data + StockListScreen + CreateEditProductScreen
3. StockItemDetailScreen
4. `stockAdjustments` collection + StockAdjustmentScreen + StockHistoryScreen
5. ExpiryAlertsScreen + expiry notification cron
6. Modify CreateInvoiceScreen for stock deduction

### Phase B: Finance (Payments & Expenses)
7. `payments` collection + PaymentsListScreen + RecordPaymentScreen
8. Modify InvoiceDetailScreen for payment recording
9. `expenses` collection + ExpensesListScreen + CreateExpenseScreen + ExpenseDetailScreen
10. FinanceOverviewScreen

### Phase C: Patient Enhancements
11. Patient consent system (collection + PatientConsentScreen + BookAppointment gate)
12. Modify AddEditPatientScreen (NHIMA fields, comm preferences)
13. Modify PatientProfileScreen (restructure tabs)
14. PatientAccountStatementScreen
15. PatientRecallsScreen + recall cron
16. PatientCommsScreen + PatientLettersScreen
17. PatientFormsScreen + PatientCasesScreen

### Phase D: Integrations
18. NHIMA integration (Phase 1: manual)
19. Modify CreateInvoiceScreen for NHIMA submission
20. Cancellation email notification (R04)

### Phase E: In-App Calling
21. `calls` collection + CallScreen
22. Incoming call overlay
23. CallHistoryScreen
24. Integration with StaffProfile and ChatScreen

### Phase F: Navigation & ClinicHub Updates
25. Register all new screens in TabNavigator
26. Update ClinicHubScreen quick actions + stats
27. Update MoreScreen menu items
