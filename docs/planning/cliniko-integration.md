# Cliniko Integration Plan — NHL Connect

## The Problem

NHL Connect is currently a **communication app** (messaging, channels, schedule).  
The clinic uses **Cliniko** for practice management (appointments, patients, billing, etc.).  
We need to surface Cliniko-style clinical tools **inside** NHL Connect so staff have **one app** for everything.

**Constraints:**
- No new bottom tabs (keep the existing 5: Home, Messages, Channels, Schedule, More)
- Staff & admin only (no patient-facing features)
- Follow existing branding/design system
- Mock data & functional UI for demo purposes

---

## Integration Strategy: "Clinic Hub"

Rather than scattering clinical features randomly, we create a **single entry point** called **"Clinic"** — a dedicated hub screen that organizes all practice management tools. It's accessible from two natural places:

### Entry Points (no new tabs needed)

| Location | How | What |
|----------|-----|------|
| **Home Dashboard** | Prominent "Clinic" card below the welcome header + "Next Appointment" widget | Quick access to hub + at-a-glance clinical info |
| **More Tab** | "Clinic Tools" section at the top of the menu (before General) | Full tool list for intentional access |

### Why This Works
- **Home** is the daily command center — clinical highlights belong there
- **More** is already the "everything else" drawer — clinical tools fit naturally
- **Schedule tab** stays focused on personal schedule (shifts/events) — no overloading
- **Zero new tabs** — staff learn one new card on Home, one new section in More

---

## New Screen Map

### CL-00: Clinic Hub (Main Entry)

The central screen for all clinical tools.

**Layout:**
- Header: Back chevron, "Clinic"
- Quick Stats Row (horizontal):
  - "8 Today" (appointments) + `calendar` icon
  - "3 Pending" (treatment notes) + `file-text` icon
  - "2 Invoices Due" + `credit-card` icon
- Section: **TODAY'S APPOINTMENTS** (next 3, compact cards)
  - Patient name, time, type, status dot (confirmed/pending)
  - "See All" → CL-01
- Section: **QUICK ACTIONS** (2x3 grid of icon cards)
  - Book Appointment → CL-03
  - Patient Lookup → CL-04
  - New Treatment Note → CL-07
  - Create Invoice → CL-10
  - Reports → CL-11
  - Telehealth → CL-12
- Section: **RECENT PATIENTS** (last 3 seen)
  - Patient avatar + name + last visit date
  - "View All" → CL-04

---

### CL-01: Appointments List

**Purpose:** View and manage all patient appointments

**Layout:**
- Header: Back chevron, "Appointments", right: `plus` icon (→ CL-03)
- Toggle: "Today" | "Upcoming" | "Past" (pill buttons)
- Date banner: "Tuesday, 25 March 2026" with left/right day nav
- Appointment list (FlatList):
  - Time slot (left) + Patient name + appointment type + status badge
  - Status: Confirmed (green), Pending (amber), Cancelled (red), Completed (grey)
- FAB: `plus` → CL-03
- Empty state: "No appointments for this day"

**Mock Data:**
| Time | Patient | Type | Provider | Status |
|------|---------|------|----------|--------|
| 08:30 | John Mwanza | Dialysis Follow-up | Dr. Mbewe | Confirmed |
| 09:15 | Mary Chanda | Initial Consultation | Dr. Mbewe | Confirmed |
| 10:00 | Peter Zulu | Blood Test Review | Dr. Banda | Pending |
| 11:00 | Agnes Nkole | Dialysis Session | Dr. Mbewe | Confirmed |
| 14:00 | Joseph Tembo | Post-Op Check | Dr. Mbewe | Confirmed |
| 15:30 | Grace Bwalya | Prescription Renewal | Dr. Patel | Pending |
| 16:00 | *Available Slot* | — | — | Open |

---

### CL-02: Appointment Detail

**Purpose:** Full details of a single appointment

**Layout:**
- Header: Back chevron, "Appointment", right: `edit` icon
- Status banner: color-coded (green=confirmed, amber=pending)
- Patient card: Avatar + Name + Patient ID + phone icon + message icon
- Details section:
  - Date/Time: icon `clock` + "Tue, 25 March 2026, 08:30 - 09:30"
  - Type: icon `activity` + "Dialysis Follow-up"
  - Provider: icon `user` + "Dr. Sarah Mbewe"
  - Location: icon `map-pin` + "Dialysis Unit, Bay 2"
  - Notes: icon `file-text` + "Patient reports improved fluid levels..."
- Previous Visits section (last 2):
  - Date + type + brief note
- Action Buttons:
  - Primary: "Start Consultation" (if upcoming) / "View Notes" (if completed)
  - Secondary: "Reschedule"
  - Destructive: "Cancel Appointment"

---

### CL-03: Book Appointment

**Purpose:** Create a new patient appointment

**Layout:**
- Header: Back chevron, "Book Appointment", "Save" (right)
- Patient picker: Search + select (like contact picker S-23)
- Appointment type: "Consultation" | "Follow-up" | "Dialysis" | "Lab Review" | "Other" (pills)
- Date picker
- Time picker (start + end)
- Provider picker: Staff list (doctors only)
- Location input
- Notes (multiline)
- Toggle: "Send SMS reminder to patient"
- Toggle: "Recurring appointment" → frequency picker

---

### CL-04: Patient Directory

**Purpose:** Search and browse all patients

**Layout:**
- Header: Back chevron, "Patients", right: `plus` icon (→ CL-06)
- Search bar (search by name, ID, phone)
- Filter pills: "All" | "Active" | "Dialysis" | "Recent" 
- Patient list (grouped by letter):
  - Avatar (initials) + Name + Patient ID + Last visit date
  - Right: chevron
- Total count: "42 patients" (Caption, bottom)
- FAB: `plus` → CL-06

**Mock Data:**
| Name | ID | Last Visit | Department | Status |
|------|----|-----------|------------|--------|
| Grace Bwalya | PT-001 | 2 days ago | General | Active |
| Mary Chanda | PT-002 | Today | Dialysis | Active |
| Agnes Nkole | PT-003 | 1 week ago | Dialysis | Active |
| John Mwanza | PT-004 | Today | Dialysis | Active |
| Joseph Tembo | PT-005 | 3 days ago | General | Active |
| Peter Zulu | PT-006 | Today | General | Active |
| Emmanuel Kapata | PT-007 | 2 weeks ago | ICU | Discharged |
| Charity Mumba | PT-008 | 1 month ago | Pharmacy | Inactive |

---

### CL-05: Patient Profile

**Purpose:** Complete patient record (the most important screen)

**Layout:**
- Header: Back chevron, "Patient", right: `edit` icon (→ CL-06)
- Patient card (top):
  - Avatar (80px) + Name (H1) + Patient ID badge
  - Age / DOB + Gender
  - Phone + email
  - Status badge: "Active" / "Discharged" / "Inactive"
- Action row: `phone` Call, `message-circle` SMS, `calendar` Book Apt
- Tab bar: **Overview** | **Notes** | **Files** | **Billing** | **Appointments**

**Overview tab:**
- Allergies card (highlighted if present): "Penicillin, Ibuprofen"
- Current Medications list
- Key Conditions list
- Emergency Contact card
- Insurance/Billing info card

**Notes tab:**
- Treatment notes list (date + provider + type + preview)
- Tap → CL-07
- FAB: `plus` → CL-07 (new note)

**Files tab:**
- Uploaded documents, lab results, images
- Grid/list toggle

**Billing tab:**
- Invoice list (date + amount + status: Paid/Unpaid/Overdue)
- Total outstanding balance card
- Tap → CL-09

**Appointments tab:**
- Past and upcoming appointments list
- Tap → CL-02

---

### CL-06: Add/Edit Patient

**Purpose:** Create or edit patient record

**Layout:**
- Header: Back chevron, "New Patient" / "Edit Patient", "Save" (right)
- Avatar placeholder + camera icon
- Sections:
  - **Personal:** First name, Last name, DOB, Gender (picker), Phone, Email
  - **Medical:** Allergies (tags input), Conditions, Blood type
  - **Insurance:** Provider, Policy number
  - **Emergency Contact:** Name, Phone, Relationship

---

### CL-07: Treatment Note

**Purpose:** Create/view a treatment note for a patient

**Layout:**
- Header: Back chevron, "Treatment Note", "Save" (right)
- Patient banner: Avatar + name + Patient ID (non-editable, selected)
- Date/Time: Auto-filled (editable)
- Template picker: "General Consultation" | "Dialysis Session" | "Follow-up" | "Custom"
- Rich text area:
  - **Subjective:** Patient's complaint (multiline)
  - **Objective:** Examination findings (multiline)
  - **Assessment:** Diagnosis (multiline)
  - **Plan:** Treatment plan (multiline)
- Vitals section (optional expandable):
  - BP, Heart rate, Temperature, Weight, O2 Sat
- Attach files button
- Toggle: "Mark as private note"

---

### CL-08: Invoices List

**Purpose:** View all invoices across patients

**Layout:**
- Header: Back chevron, "Invoices", right: `plus` icon
- Summary card: "Total Outstanding: K 12,450.00" (highlighted)
- Filter: "All" | "Unpaid" | "Overdue" | "Paid" (pills)
- Invoice list:
  - Invoice # + Patient name + Date + Amount + Status badge
  - Status colors: Paid (green), Unpaid (amber), Overdue (red)
- FAB: `plus` → CL-10

**Mock Data:**
| # | Patient | Date | Amount | Status |
|---|---------|------|--------|--------|
| INV-001 | John Mwanza | Today | K 2,500 | Unpaid |
| INV-002 | Mary Chanda | Yesterday | K 1,800 | Paid |
| INV-003 | Peter Zulu | 3 days ago | K 3,200 | Overdue |
| INV-004 | Agnes Nkole | 1 week ago | K 4,950 | Unpaid |
| INV-005 | Joseph Tembo | 1 week ago | K 1,500 | Paid |
| INV-006 | Grace Bwalya | 2 weeks ago | K 2,100 | Paid |

---

### CL-09: Invoice Detail

**Purpose:** Full invoice view

**Layout:**
- Header: Back chevron, "Invoice #INV-001"
- Status banner (color-coded)
- Patient info card: Name + ID + Contact
- Line items table:
  - Description + Qty + Unit Price + Total
  - e.g., "Dialysis Session" x 1 = K 2,000
  - e.g., "Consultation Fee" x 1 = K 500
- Subtotal / Tax / Total
- Payment history (if partial payments)
- Action buttons:
  - Primary: "Record Payment" (if unpaid)
  - Secondary: "Send to Patient" (SMS/Email)
  - Tertiary: "Download PDF"

---

### CL-10: Create Invoice

**Purpose:** Create a new invoice

**Layout:**
- Header: Back chevron, "New Invoice", "Save"
- Patient picker (search + select)
- Line items:
  - "Add Item" button
  - Each item: Description input + Quantity + Price
  - Remove (X) button per item
- Auto-calculated subtotal
- Tax toggle + rate
- Total (bold, large)
- Notes field
- Toggle: "Send invoice to patient on save"

---

### CL-11: Reports Dashboard

**Purpose:** Practice analytics and insights

**Layout:**
- Header: Back chevron, "Reports"
- Period picker: "This Week" | "This Month" | "This Year" (pills)
- Stats cards row (2x2 grid):
  - "42 Appointments" this month (with +12% vs last month)
  - "K 48,500 Revenue" (with trend)
  - "38 Patients Seen" (with trend)
  - "2 No-Shows" (with trend)
- Section: **REVENUE OVERVIEW**
  - Simple bar chart (7 bars for last 7 days, mock)
  - Each bar shows daily revenue amount
- Section: **APPOINTMENT BREAKDOWN**
  - Horizontal bars: Dialysis 45%, Consultation 25%, Follow-up 20%, Other 10%
- Section: **TOP PROVIDERS**
  - Staff list with appointment counts

---

### CL-12: Telehealth

**Purpose:** Manage virtual consultation rooms

**Layout:**
- Header: Back chevron, "Telehealth"
- Active session card (if any, highlighted):
  - "In Progress: Mary Chanda" + duration timer
  - "Rejoin" button
- Section: **UPCOMING VIRTUAL APPOINTMENTS**
  - Appointment cards with "Start Call" button (enabled 5 min before)
- Section: **PAST SESSIONS**
  - List with duration + notes link
- Empty state: "No telehealth sessions scheduled"

**Mock Data:**
| Patient | Time | Status |
|---------|------|--------|
| Peter Zulu | 10:00 AM | Ready to start |
| Grace Bwalya | 14:00 PM | Upcoming |

---

### CL-13: Telehealth Call (Mock)

**Purpose:** Mock video consultation screen

**Layout:**
- Full screen, dark background
- Patient name + call duration timer (top center)
- Large avatar or camera placeholder (center)
- "Your camera" small preview (bottom right corner)
- Bottom bar with action buttons:
  - Mic toggle (on/off)
  - Camera toggle (on/off)  
  - End Call (red circle, center)
  - Chat (open side panel)
  - Notes (open notes overlay)
- Notes overlay (slide from right):
  - Quick notes input during call
  - Auto-saves to treatment note

---

## Home Screen Changes

Add **two new elements** to the existing Home dashboard:

### 1. Clinic Quick Access Card (below urgent alerts, above stats)

```
┌──────────────────────────────────────┐
│  ⚕ Clinic                    →      │
│  8 appointments today · 2 pending   │
└──────────────────────────────────────┘
```

- Navy blue left border (4px) to visually distinguish
- Taps to CL-00 (Clinic Hub)
- Shows today's appointment count + pending items

### 2. Next Appointment Widget (below quick stats)

```
┌──────────────────────────────────────┐
│  NEXT APPOINTMENT                    │
│  ┌────────────────────────────────┐  │
│  │ 08:30  John Mwanza             │  │
│  │        Dialysis Follow-up      │  │
│  │        Bay 2 · Confirmed ●     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## More Screen Changes

Add **"Clinic Tools"** as the FIRST section (before General):

```
CLINIC TOOLS
  ⚕  Clinic Hub          → CL-00
  📅 Appointments         → CL-01
  👥 Patients             → CL-04
  💳 Billing & Invoices   → CL-08
  📊 Reports              → CL-11
  📹 Telehealth           → CL-12
```

(Using Feather icons: `activity`, `calendar`, `users`, `credit-card`, `bar-chart-2`, `video`)

---

## New Mock Data Files

### `mockPatients.js`
- 8 patients with: id, name, DOB, gender, phone, email, allergies, conditions, medications, insuranceProvider, emergencyContact, status, lastVisit, patientId (PT-XXX)

### `mockAppointments.js`
- 12+ appointments across next 7 days with: id, patientId, providerId, type, dateTime, duration, location, status, notes, isRecurring, reminderSent

### `mockInvoices.js`
- 8 invoices with: id, patientId, invoiceNumber, date, lineItems[], subtotal, tax, total, status, payments[]

### `mockTreatmentNotes.js`
- 6 treatment notes with: id, patientId, providerId, date, template, subjective, objective, assessment, plan, vitals, attachments, isPrivate

### `mockReportsData.js`
- Weekly/monthly aggregated stats for charts: dailyRevenue[], appointmentsByType{}, patientsSeen, noShows, topProviders[]

---

## Navigation Registration

All new screens live in the **MoreStack** (since Clinic Hub is accessed from More/Home):

```javascript
// Add to MoreStackScreen in TabNavigator.js
<MoreStack.Screen name="ClinicHub" component={ClinicHubScreen} />
<MoreStack.Screen name="AppointmentsList" component={AppointmentsListScreen} />
<MoreStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
<MoreStack.Screen name="BookAppointment" component={BookAppointmentScreen} />
<MoreStack.Screen name="PatientDirectory" component={PatientDirectoryScreen} />
<MoreStack.Screen name="PatientProfile" component={PatientProfileScreen} />
<MoreStack.Screen name="AddEditPatient" component={AddEditPatientScreen} />
<MoreStack.Screen name="TreatmentNote" component={TreatmentNoteScreen} />
<MoreStack.Screen name="InvoicesList" component={InvoicesListScreen} />
<MoreStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
<MoreStack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
<MoreStack.Screen name="ReportsDashboard" component={ReportsDashboardScreen} />
<MoreStack.Screen name="Telehealth" component={TelehealthScreen} />
<MoreStack.Screen name="TelehealthCall" component={TelehealthCallScreen} />
```

Also register in HomeStack for cross-tab navigation from the Home clinic card.

---

## File Structure

```
src/
├── screens/
│   └── clinic/                          ← NEW folder
│       ├── ClinicHubScreen.js           (CL-00)
│       ├── AppointmentsListScreen.js    (CL-01)
│       ├── AppointmentDetailScreen.js   (CL-02)
│       ├── BookAppointmentScreen.js     (CL-03)
│       ├── PatientDirectoryScreen.js    (CL-04)
│       ├── PatientProfileScreen.js      (CL-05)
│       ├── AddEditPatientScreen.js      (CL-06)
│       ├── TreatmentNoteScreen.js       (CL-07)
│       ├── InvoicesListScreen.js        (CL-08)
│       ├── InvoiceDetailScreen.js       (CL-09)
│       ├── CreateInvoiceScreen.js       (CL-10)
│       ├── ReportsDashboardScreen.js    (CL-11)
│       ├── TelehealthScreen.js          (CL-12)
│       └── TelehealthCallScreen.js      (CL-13)
├── components/
│   └── clinic/                          ← NEW folder
│       ├── AppointmentCard.js
│       ├── PatientCard.js
│       ├── InvoiceItem.js
│       ├── VitalsInput.js
│       ├── StatBar.js
│       └── ClinicQuickAction.js
└── data/
    ├── mockPatients.js                  ← NEW
    ├── mockAppointments.js              ← NEW
    ├── mockInvoices.js                  ← NEW
    ├── mockTreatmentNotes.js            ← NEW
    └── mockReportsData.js               ← NEW
```

---

## Build Order

| Phase | Screens | Estimate |
|-------|---------|----------|
| 1. Mock Data | All 5 new data files | 1.5h |
| 2. Clinic Components | 6 reusable components | 2h |
| 3. Clinic Hub + Home/More changes | CL-00 + Home card + More section | 2h |
| 4. Appointments flow | CL-01, CL-02, CL-03 | 3h |
| 5. Patients flow | CL-04, CL-05, CL-06, CL-07 | 4h |
| 6. Billing flow | CL-08, CL-09, CL-10 | 3h |
| 7. Reports | CL-11 | 2h |
| 8. Telehealth | CL-12, CL-13 | 2h |
| 9. Navigation wiring | Register all screens + cross-tab nav | 1h |
| **Total** | **14 new screens** | **~20.5h** |

---

## Design Rules (same as existing app)

- All colors from `constants/colors.js`
- All typography from `constants/typography.js`
- All spacing from `constants/spacing.js`
- Feather icons only
- No emojis
- Card-based layouts with borders
- White backgrounds, Navy Blue primary actions
- Peach accent for highlights/alerts
- Currency: Zambian Kwacha (K) — matches Zambian setting
