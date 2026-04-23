# NHL Connect - Complete Screen Map

## Overview

Every screen in the NHL Connect mobile app, organized by navigation flow. No dead ends - every screen has clear entry points, exit points, and navigation paths. All data shown is mocked/static for Phase 1 UI build.

---

## Navigation Architecture

```
App Root
├── Auth Stack (unauthenticated)
│   ├── S-01  Splash Screen
│   ├── S-02  Welcome Screen
│   ├── S-03  Login (Phone/Email Entry)
│   ├── S-04  OTP Verification
│   └── S-05  Device Pending Approval
│
└── Main Stack (authenticated)
    ├── Bottom Tabs
    │   ├── Tab 1: Home
    │   │   ├── S-10  Home Dashboard
    │   │   ├── S-11  Quick Actions Sheet
    │   │   └── S-12  Announcement Detail
    │   │
    │   ├── Tab 2: Messages
    │   │   ├── S-20  Conversations List
    │   │   ├── S-21  Chat Thread (1:1)
    │   │   ├── S-22  Chat Thread (Group)
    │   │   ├── S-23  New Message (Contact Picker)
    │   │   ├── S-24  New Group Chat (Setup)
    │   │   ├── S-25  Chat Info / Details
    │   │   ├── S-26  Group Members List
    │   │   ├── S-27  Add Members to Group
    │   │   ├── S-28  Media & Files (shared in chat)
    │   │   └── S-29  Message Search
    │   │
    │   ├── Tab 3: Channels
    │   │   ├── S-30  Channels List
    │   │   ├── S-31  Channel Thread
    │   │   ├── S-32  Channel Info / Settings
    │   │   ├── S-33  Channel Members
    │   │   ├── S-34  Create Channel
    │   │   ├── S-35  Browse / Discover Channels
    │   │   └── S-36  Pinned Messages
    │   │
    │   ├── Tab 4: Schedule
    │   │   ├── S-40  Schedule Overview (Calendar)
    │   │   ├── S-41  Day View
    │   │   ├── S-42  Event / Shift Detail
    │   │   ├── S-43  Create Event / Shift
    │   │   └── S-44  Training Sessions List
    │   │
    │   └── Tab 5: More
    │       ├── S-50  More Menu
    │       ├── S-51  My Profile
    │       ├── S-52  Edit Profile
    │       ├── S-53  Notifications List
    │       ├── S-54  Notification Settings
    │       ├── S-55  Files & Documents
    │       ├── S-56  Document Viewer
    │       ├── S-57  Staff Directory
    │       ├── S-58  Department Directory
    │       ├── S-59  Staff Profile (other user)
    │       ├── S-60  Settings
    │       ├── S-61  Account Settings
    │       ├── S-62  Privacy & Security
    │       ├── S-63  Trusted Devices
    │       ├── S-64  About App
    │       └── S-65  Admin Panel (admin role only)
    │
    └── Full-Screen Modals (overlay any tab)
        ├── S-70  Global Search
        ├── S-71  File Preview (Image)
        ├── S-72  File Preview (Document)
        └── S-73  Status Picker
```

---

## AUTH STACK

---

### S-01: Splash Screen

**Purpose:** App launch, brand recognition while checking auth state

**Layout:**
- Full white background
- NHL logo centered (heart + hand mark), 120px
- Company name below: "NICHE HEALTHCARE LIMITED"
- Tagline: "You are in Safe Hands" in italics, Peach color
- Subtle fade-in animation (300ms)

**Navigation:**
- Auto-navigates to S-02 (Welcome) if unauthenticated
- Auto-navigates to S-10 (Home) if authenticated

**Mock Data:** None

---

### S-02: Welcome Screen

**Purpose:** First touchpoint, entry to login flow

**Layout:**
- Top: NHL logo (small, 48px) left-aligned in header area
- Heading (Display): "Better care starts with better communication"
- Subheading (Body, Dark Grey): "Your secure internal platform for Niche Healthcare"
- Center: Two feature cards in a row
  - Card 1: Icon `message-circle` + "Messaging" + "Stay connected with your team"
  - Card 2: Icon `shield` + "Secure" + "Private and encrypted"
- Bottom:
  - Primary Button (full width): "Get Started"
  - Secondary Button (full width): "Log In"
  - Caption below: "For Niche Healthcare staff only"

**Navigation:**
- "Get Started" → S-03 (Login)
- "Log In" → S-03 (Login)

**Mock Data:** None

---

### S-03: Login (Phone/Email Entry)

**Purpose:** Staff enters phone number or email for OTP

**Layout:**
- Header: Back chevron (left), "Log In" (center)
- Heading (H1): "Welcome back"
- Subheading (Body, Dark Grey): "Enter your phone number or email to continue"
- Tab selector: "Phone" | "Email" (underline active, Navy Blue)
- Input field:
  - Phone: Country code picker (+44) + phone number
  - Email: Standard email input
- Primary Button: "Send Verification Code" (disabled until valid input)
- Bottom text (Caption): "By continuing, you agree to our Terms of Service"

**Navigation:**
- Back → S-02
- Submit → S-04

**Mock Data:**
- Default country code: +44 (UK)

---

### S-04: OTP Verification

**Purpose:** Enter the 6-digit code sent to phone/email

**Layout:**
- Header: Back chevron (left), "Verification" (center)
- Heading (H1): "Check your messages"
- Subheading (Body, Dark Grey): "We sent a code to +44 7*** ***890"
- 6 individual digit input boxes (48px each, spaced 8px)
  - Auto-focus first box
  - Auto-advance on digit entry
  - Border: Light Grey default, Navy Blue on focus
- Timer text (Caption): "Resend code in 0:45"
- When timer expires: Text button "Resend Code" (Navy Blue)
- Auto-submit when all 6 digits entered

**Navigation:**
- Back → S-03
- Valid code → S-10 (Home) or S-05 (if new device)
- Invalid code → shake animation + error text "Invalid code, try again"

**Mock Data:**
- Mock OTP: `123456`
- Phone display: `+44 7*** ***890`

---

### S-05: Device Pending Approval

**Purpose:** New device detected, waiting for admin approval

**Layout:**
- Center-aligned:
  - Icon: `shield` (48px, Navy Blue on Navy Light bg circle 80px)
  - Heading (H1): "New Device Detected"
  - Body text (Dark Grey): "For your security, an administrator needs to approve this device before you can access the full app."
  - Card (Standard):
    - Row: "Device" → "iPhone 15 Pro" (Body Bold)
    - Row: "Platform" → "iOS" (Body)
    - Row: "Requested" → "Just now" (Body)
    - Row: "Status" → "Pending" with Warning badge
  - Primary Button: "Check Status" (refreshes)
  - Text Button: "Contact Administrator"
  - Text Button: "Log Out" (Destructive style)

**Navigation:**
- "Check Status" → Refresh (stays on screen)
- "Contact Administrator" → Opens email/phone
- "Log Out" → S-02
- If approved → Auto-navigate to S-10

**Mock Data:**
- Device: "iPhone 15 Pro"
- Platform: "iOS"
- Status: "Pending"

---

## MAIN APP - TAB 1: HOME

---

### S-10: Home Dashboard

**Purpose:** Daily overview, quick access to everything important

**Layout:**
- Header:
  - Left: "Welcome back," (Caption) + "Dr. Sarah Mbewe" (Display)
  - Right: Avatar (40px) with online dot → taps to S-51
- Scrollable content:
  
  **Section 1: Urgent Alerts** (only if pending)
  - Highlighted Card (Peach):
    - Icon `alert-triangle` + "2 Urgent Announcements" + chevron-right
    - Taps to S-53 filtered to urgent

  **Section 2: Quick Stats Row** (horizontal scroll)
  - Stat Card: "5 Unread" + icon `message-circle`
  - Stat Card: "3 Mentions" + icon `at-sign`
  - Stat Card: "2 Events Today" + icon `calendar`
  - Stat Card: "1 Pending" + icon `clock`

  **Section 3: Recent Conversations** (3 items max)
  - Section header: "RECENT MESSAGES" + "See All" (text button → S-20)
  - Chat list items (S-20 style, top 3)

  **Section 4: Your Channels** (horizontal scroll of channel pills)
  - Pills: "#dialysis-team", "#pharmacy", "#general", "#announcements"
  - Each taps to S-31

  **Section 5: Today's Schedule** (2 items max)
  - Section header: "TODAY'S SCHEDULE" + "View All" (→ S-40)
  - Event cards with time, title, location

  **Section 6: Recent Announcements** (latest 1-2)
  - Section header: "ANNOUNCEMENTS"
  - Announcement card: Title + preview + timestamp + "From Admin"

- FAB: None on home (actions accessible through tabs)

**Navigation:**
- Avatar → S-51
- Unread stat → S-20
- Mentions stat → S-70 (search for mentions)
- Events stat → S-40
- Chat item → S-21/S-22
- Channel pill → S-31
- Event card → S-42
- Announcement → S-12

**Mock Data:**
- User: Dr. Sarah Mbewe, Doctor, Dialysis Dept
- 5 unread messages, 3 mentions, 2 events, 1 pending approval
- Recent chats: Nurse James, Dr. Banda, Pharmacy Group
- Channels: #dialysis-team, #pharmacy, #general, #announcements
- Today's events: "Training: New Dialysis Protocol" 10:00 AM, "Shift Handover" 2:00 PM
- Announcement: "Updated SOPs for Q1 are now available" - Admin, 2h ago

---

### S-11: Quick Actions Sheet (Bottom Sheet)

**Purpose:** Fast access to common actions

**Layout:**
- Bottom Sheet modal:
  - Drag handle
  - Grid of action items (2 columns):
    - `edit` New Message → S-23
    - `hash` New Channel → S-34
    - `users` Staff Directory → S-57
    - `file-text` Documents → S-55
    - `calendar` Schedule → S-40
    - `bell` Notifications → S-53

**Navigation:**
- Each item navigates to respective screen
- Swipe down or tap overlay → dismiss

---

### S-12: Announcement Detail

**Purpose:** Full view of an admin announcement

**Layout:**
- Header: Back chevron, "Announcement"
- Content:
  - Title (H1): "Updated SOPs for Q1 2026"
  - Meta row: "Admin" role badge + "Dr. Patel" + "2 hours ago"
  - Divider
  - Body text (Body): Full announcement text
  - Attachments section (if any):
    - File cards: icon `file-text` + filename + size + download icon
  - Divider
  - "Acknowledged by 12 of 24 staff" (Caption)

**Navigation:**
- Back → S-10
- Attachment → S-72 (Document viewer)

**Mock Data:**
- Title: "Updated SOPs for Q1 2026"
- From: Dr. Patel (Admin)
- Body: Multi-paragraph text about new procedures
- 1 attached PDF: "SOP_Dialysis_v3.2.pdf (2.4 MB)"
- Acknowledged: 12/24

---

## MAIN APP - TAB 2: MESSAGES

---

### S-20: Conversations List

**Purpose:** All 1:1 and group direct message conversations

**Layout:**
- Header: "Messages" (H1, left-aligned), right: `edit` icon (→ S-23)
- Search Bar (taps to S-29)
- Filter pills row: "All" | "Unread" | "Groups" (horizontal scroll, pill style)
- Conversation list (FlatList):
  - Each item: Chat List Item component
  - Avatar, name, last message preview, timestamp, unread badge
  - Group chats show group avatar (overlapping circles) + group name
- Empty state (if no conversations):
  - Icon `message-circle` (48px)
  - "No conversations yet"
  - "Start messaging your colleagues"
  - Primary Button: "New Message"
- FAB: `edit` icon → S-23

**Navigation:**
- Conversation item → S-21 (1:1) or S-22 (group)
- Edit icon / FAB → S-23
- Search → S-29

**Mock Data:**

| Name | Last Message | Time | Unread |
|------|-------------|------|--------|
| Nurse James Phiri | "Patient in Bay 3 needs review" | 2m ago | 2 |
| Dr. Chisanga Banda | "Thanks, I'll check the results" | 15m ago | 0 |
| Pharmacy Team (group) | "Dr. Mbewe: New stock arrived" | 1h ago | 5 |
| Admin Support | "Your device has been approved" | 3h ago | 0 |
| Dr. Yusuf Patel | "Training session confirmed" | Yesterday | 0 |
| Night Shift Handover (group) | "Nurse Tembo: All stable tonight" | Yesterday | 0 |

---

### S-21: Chat Thread (1:1)

**Purpose:** Direct message conversation with one person

**Layout:**
- Header:
  - Back chevron (left)
  - Center: Avatar (32px) + Name (H3) + online status dot
  - Right: `phone` icon, `info` icon (→ S-25)
- Messages area (scrollable, newest at bottom):
  - Date separator: "Today", "Yesterday", "March 23, 2026"
  - Sent messages (Navy Blue bubbles, right-aligned)
  - Received messages (Off White bubbles, left-aligned)
  - Read receipts: "Read 2:15 PM" (Small, Medium Grey) under last sent
  - Typing indicator: Three animated dots in a bubble
- Message Input Bar (bottom):
  - Attachment icon (left) → file picker sheet
  - Text input (pill shaped)
  - Send button (right, appears when text entered)

**Navigation:**
- Back → S-20
- Name/avatar in header → S-25
- Info icon → S-25
- Attachment → System file picker
- Image in chat → S-71

**Mock Data (conversation with Nurse James Phiri):**

```
--- Today ---

James (10:22 AM):
"Good morning Dr. Mbewe, patient in Bay 3 is showing elevated BP readings since 6am"

James (10:22 AM):
"Current reading is 165/95. Patient is on their regular dialysis session."

You (10:25 AM):
"Thanks James. Has the patient reported any symptoms? Headache or dizziness?"

James (10:26 AM):
"No headache, slight dizziness when standing. Fluid intake has been normal."

You (10:28 AM):
"OK. Let's reduce the UF rate by 200ml/hr and recheck in 30 mins. I'll come by after my 11am."

James (10:28 AM):
"Noted. Will adjust and monitor. Thank you Doctor."

Read 10:28 AM
```

---

### S-22: Chat Thread (Group)

**Purpose:** Group direct message conversation

**Layout:**
- Same as S-21 but with:
  - Header: Group avatar (overlapping circles) + Group name + member count
  - Each received message shows sender name (Caption, Navy Blue) above bubble
  - Sender avatar (24px) next to each message cluster

**Navigation:**
- Same as S-21
- Group name in header → S-25 (group info)

**Mock Data (Pharmacy Team group):**

```
--- Today ---

Dr. Mbewe (You, 09:15 AM):
"Morning team. Do we have sufficient Heparin stock for the week?"

Pharmacist Mutale (09:20 AM):
"Good morning. Yes, we received the new shipment yesterday. 
Current stock: 450 units. Should cover us through Friday."

Nurse Tembo (09:22 AM):
"Great news. Bay 2 was running low yesterday."

Pharmacist Mutale (09:25 AM):
"I've allocated 50 units to Bay 2 already. Collection is ready."

Dr. Mbewe (You, 09:26 AM):
"Perfect, thank you Mutale. Please also check Erythropoietin stock."

Pharmacist Mutale (09:30 AM):
"Will check and update by noon."
```

---

### S-23: New Message (Contact Picker)

**Purpose:** Select a person to start a 1:1 conversation

**Layout:**
- Header: "New Message" (H3), right: "Cancel" text button
- To: field with inline search (like email compose)
- Search bar below "To:" field
- Section: "SUGGESTED" (recent contacts, max 5)
- Section: "ALL STAFF" (alphabetical, grouped by letter)
- Each item: Contact List Item (avatar + name + role badge + department)
- Multi-select mode: when 2+ selected, show "Create Group" option (→ S-24)

**Navigation:**
- Cancel → S-20
- Select 1 person → S-21 (opens/creates conversation)
- Select 2+ → shows "Create Group" button → S-24

**Mock Data:**

*Suggested:*
- Nurse James Phiri (Dialysis)
- Dr. Chisanga Banda (General)
- Pharmacist Grace Mutale (Pharmacy)

*All Staff: (A-Z)*
- Dr. Banda, Chisanga - Doctor, General
- Nurse Chomba, Ruth - Nurse, ICU
- Dr. Mbewe, Sarah - Doctor, Dialysis (You)
- Pharmacist Mutale, Grace - Pharmacy
- Dr. Patel, Yusuf - Admin
- Nurse Phiri, James - Nurse, Dialysis
- Nurse Tembo, David - Nurse, Night Shift

---

### S-24: New Group Chat (Setup)

**Purpose:** Name and configure a new group

**Layout:**
- Header: Back chevron, "New Group" (H3), "Create" (text button, Navy Blue, disabled until name entered)
- Group avatar placeholder (64px circle, camera icon overlay)
- Input: "Group Name" (e.g., "Dialysis Morning Team")
- Selected members row (horizontal scroll of avatar chips with X to remove)
- Add more members button (+ icon + "Add Members") → S-27

**Navigation:**
- Back → S-23
- "Create" → S-22 (new group chat created)
- "Add Members" → S-27

**Mock Data:**
- Selected: James Phiri, Grace Mutale
- Group name input: empty

---

### S-25: Chat Info / Details

**Purpose:** View details about a conversation (1:1 or group)

**Layout:**
- Header: Back chevron, "Details"
- **For 1:1:**
  - Avatar (80px) centered
  - Name (H1) centered
  - Role badge + Department tag
  - Status: "Online" or "Last seen 2h ago"
  - Action row: `message-circle` Message, `phone` Call, `video` Video (future)
  - Divider
  - Options list:
    - "Shared Media & Files" → S-28 (chevron-right)
    - "Search in Conversation" → S-29
    - "Notifications" + toggle (on/off)
    - Divider
    - "Block User" (destructive text)

- **For Groups:**
  - Group avatar (80px) centered
  - Group name (H1) centered
  - "[X] Members" (Caption) → taps to S-26
  - Action row: same as 1:1
  - Divider
  - "Members ([X])" → S-26 (chevron-right)
  - "Add Members" → S-27
  - "Shared Media & Files" → S-28
  - "Search in Conversation" → S-29
  - "Notifications" + toggle
  - Divider
  - "Leave Group" (destructive text)

**Navigation:**
- Back → S-21/S-22
- Members → S-26
- Add Members → S-27
- Shared Media → S-28
- Search → S-29

**Mock Data (1:1 - Nurse James):**
- Name: James Phiri, Nurse, Dialysis
- Status: Online
- Shared: 3 photos, 2 files

**Mock Data (Group - Pharmacy Team):**
- Name: Pharmacy Team
- Members: 4
- Created by: Dr. Mbewe

---

### S-26: Group Members List

**Purpose:** View and manage group members

**Layout:**
- Header: Back chevron, "Members" (H3), member count
- Staff list items (avatar + name + role badge)
- Admin/creator indicated with "Admin" tag
- Long press: shows options sheet ("View Profile", "Remove from Group" for admins)

**Navigation:**
- Back → S-25
- Tap member → S-59

---

### S-27: Add Members to Group

**Purpose:** Add new members to existing group

**Layout:**
- Header: Back chevron, "Add Members", "Done" (right)
- Search bar
- Selected members chips (top, horizontal)
- Staff list (filterable)

**Navigation:**
- Back/Done → S-25 or S-24

---

### S-28: Media & Files

**Purpose:** Browse all files shared in a conversation

**Layout:**
- Header: Back chevron, "Media & Files"
- Tab bar: "Media" | "Files" | "Links"
- Media tab: Grid view (3 columns) of images
- Files tab: List of file items (icon + name + size + date)
- Links tab: List of shared URLs (preview card if available)

**Navigation:**
- Image → S-71
- File → S-72
- Link → In-app browser

---

### S-29: Message Search

**Purpose:** Search within conversations

**Layout:**
- Header: Search input (auto-focused) + "Cancel"
- Results list: Each result shows message snippet with highlighted match + sender + date
- Tap result → jumps to message in chat thread

---

## MAIN APP - TAB 3: CHANNELS

---

### S-30: Channels List

**Purpose:** Browse and access department/topic channels

**Layout:**
- Header: "Channels" (H1, left-aligned), right: `plus` icon (→ S-34)
- Search bar
- Section: "STARRED CHANNELS" (user's favorites)
  - Channel items with star icon
- Section: "YOUR CHANNELS"
  - Joined channel items with unread counts
- Section: "BROWSE"
  - Row: "Discover Channels" → S-35 (chevron-right)
- FAB: `plus` icon → S-34

**Navigation:**
- Channel item → S-31
- Plus / FAB → S-34
- Discover → S-35

**Mock Data:**

*Starred:*
- #dialysis-team (12 members, 3 unread)
- #announcements (24 members, 1 unread)

*Your Channels:*
- #general (24 members)
- #pharmacy (8 members, 5 unread)
- #training-updates (24 members)
- #night-shift (6 members)
- #icu (10 members)

---

### S-31: Channel Thread

**Purpose:** View and participate in channel conversation

**Layout:**
- Header:
  - Back chevron
  - `#` icon + Channel name (H3) + member count
  - Right: `search` icon, `info` icon (→ S-32)
- Channel topic/description bar (collapsible):
  - Body text: "Dialysis team coordination and updates"
- Messages (same bubble styles as chat):
  - All messages show sender avatar + name
  - Reactions support (long-press → reaction sheet, future)
- Pinned message banner (if pinned messages exist):
  - Icon `bookmark` + "3 Pinned Messages" → S-36
- Message Input Bar (same as S-21)

**Navigation:**
- Back → S-30
- Info → S-32
- Search → S-29 (scoped to channel)
- Pinned banner → S-36
- Sender avatar/name → S-59

**Mock Data (#dialysis-team):**

```
--- Today ---

Dr. Banda (08:00 AM):
"Morning team. Bay allocations for today:
Bay 1: 6 patients (Dr. Banda)
Bay 2: 5 patients (Dr. Mbewe)
Bay 3: 4 patients (Dr. Patel)"

Nurse Phiri (08:05 AM):
"Confirmed. Bay 2 is prepped. Machines 4 and 5 had maintenance 
yesterday - both cleared."

Dr. Mbewe (You, 08:10 AM):
"Thanks James. Please double-check water quality readings 
before we start."

Nurse Phiri (08:12 AM):
"Water quality checked. All readings within normal range.
Conductivity: 14.2, Temperature: 37.1C"

Admin (System, 08:30 AM):
PINNED: "Reminder: Monthly clinical audit is scheduled for 
Friday 28th March. All bay leads please submit reports by Thursday."
```

---

### S-32: Channel Info / Settings

**Purpose:** Channel details, settings, membership

**Layout:**
- Header: Back chevron, "Channel Details"
- Channel name (H1) centered with # prefix
- Description (Body, Dark Grey)
- Created by + creation date (Caption)
- Divider
- Options:
  - "Members ([X])" → S-33 (chevron-right)
  - "Pinned Messages ([X])" → S-36
  - "Shared Media & Files" → S-28
  - "Search" → S-29
  - Divider
  - "Notifications" + toggle
  - "Starred" + toggle
  - Divider
  - "Leave Channel" (destructive)
  - "Edit Channel" (admin only)
  - "Delete Channel" (admin only, destructive)

---

### S-33: Channel Members

Same pattern as S-26 but for channels.

---

### S-34: Create Channel

**Purpose:** Admin creates a new channel

**Layout:**
- Header: Back chevron, "Create Channel", "Create" (right, disabled until name)
- Channel name input: prefix "#" + text input
- Description input: multiline
- Toggle: "Private Channel" (with explanation text)
- Section: "Add Members"
  - "Add Members" row → S-27 style picker
  - Selected members as chips

**Navigation:**
- Back → S-30
- Create → S-31 (new channel)

---

### S-35: Browse / Discover Channels

**Purpose:** Find and join channels you're not yet in

**Layout:**
- Header: Back chevron, "Discover Channels"
- Search bar
- List of all channels not yet joined:
  - Channel name + description preview + member count + "Join" button
- Section grouping by department (optional)

**Navigation:**
- Join → Adds to S-30 list
- Channel name tap → Preview of channel (read-only) with "Join" CTA

**Mock Data:**
- #lab-results (4 members) - "Lab test results and discussions"
- #social (18 members) - "Non-work conversation"
- #maintenance (3 members) - "Equipment and facility maintenance"

---

### S-36: Pinned Messages

**Purpose:** View all pinned messages in a channel/chat

**Layout:**
- Header: Back chevron, "Pinned Messages"
- List of message cards (with sender, timestamp, full message)
- Tap → jumps to message in thread

---

## MAIN APP - TAB 4: SCHEDULE

---

### S-40: Schedule Overview (Calendar)

**Purpose:** Monthly calendar with events/shifts

**Layout:**
- Header: "Schedule" (H1, left-aligned), right: `plus` icon (→ S-43, admin only)
- Month/year selector with left/right chevrons
- Calendar grid:
  - Days with events have colored dots:
    - Navy dot = shift/work event
    - Peach dot = training
  - Today highlighted with Navy Blue circle on date
  - Selected day highlighted with Navy Light background
- Below calendar: events for selected day (same as S-41)

**Navigation:**
- Tap day → Shows events below (inline) or S-41
- Plus → S-43
- Event card → S-42

**Mock Data (March 2026):**
- March 25: "Morning Shift 7:00-15:00", "Bay 2 Lead"
- March 26: "Morning Shift 7:00-15:00"
- March 27: "Off Day"
- March 28: "Morning Shift 7:00-15:00", "Clinical Audit"
- March 29: "Training: IV Cannulation Refresher 14:00-16:00"

---

### S-41: Day View

**Purpose:** Detailed view of a single day's schedule

**Layout:**
- Header: Back chevron, "Tuesday, March 25"
- Timeline view (hourly blocks, 06:00-22:00):
  - Event blocks colored:
    - Shifts: Navy Blue left border (4px) on white card
    - Training: Peach left border on white card
    - Meetings: Navy Light background
  - Each block shows: Time range, title, location (if applicable), icon

**Navigation:**
- Back → S-40
- Event block → S-42

---

### S-42: Event / Shift Detail

**Purpose:** Full details of a schedule event

**Layout:**
- Header: Back chevron, "Event Details", right: `edit` icon (if admin/creator)
- Content:
  - Title (H1): "Morning Shift"
  - Date/Time row: icon `clock` + "Tue, 25 March 2026, 07:00 - 15:00"
  - Location row: icon `map-pin` + "Dialysis Unit, Bay 2"
  - Organizer row: icon `user` + "Dr. Patel" (avatar + name)
  - Divider
  - Description (Body): "Regular morning shift. Bay 2 lead responsibilities."
  - Attendees section:
    - Avatars row + "4 staff members assigned"
    - List: Name + Role + Status (Confirmed/Pending)
  - Notes section (if any)
- Bottom: Primary Button "Acknowledge" (or "Acknowledged" state)

**Navigation:**
- Back → S-40/S-41
- Organizer → S-59
- Edit → S-43 (pre-filled)

---

### S-43: Create Event / Shift

**Purpose:** Admin creates schedule entry

**Layout:**
- Header: Back chevron, "New Event", "Save" (right)
- Form:
  - Title input
  - Event type selector: "Shift" | "Training" | "Meeting" | "Other" (pill buttons)
  - Date picker
  - Start time picker
  - End time picker
  - Location input
  - Description (multiline)
  - Assign staff: member picker (multi-select)
  - Toggle: "Send notification to assigned staff"

**Navigation:**
- Back → discard dialog
- Save → S-40

---

### S-44: Training Sessions List

**Purpose:** Dedicated view for all training sessions

**Layout:**
- Header: Back chevron, "Training Sessions"
- Filter: "Upcoming" | "Past" (pill buttons)
- List of training event cards:
  - Title, Date, Time, Instructor, Status (Registered/Not Registered)
  - "Register" button on unregistered

**Mock Data:**
- "IV Cannulation Refresher" - Mar 29, 14:00, Dr. Patel, Registered
- "New Dialysis Protocol Training" - Apr 5, 10:00, Dr. Banda, Not Registered
- "Infection Control Update" - Apr 12, 09:00, Admin, Not Registered

---

## MAIN APP - TAB 5: MORE

---

### S-50: More Menu

**Purpose:** Access to all secondary features and settings

**Layout:**
- Header: "More" (H1)
- User card (top):
  - Avatar (56px) + Name + "Doctor, Dialysis" + online status
  - Entire card taps to S-51
- Menu sections:

**GENERAL**
- `bell` Notifications → S-53
- `file-text` Files & Documents → S-55
- `users` Staff Directory → S-57
- `grid` Departments → S-58

**ACCOUNT**
- `user` My Profile → S-51
- `settings` Settings → S-60
- `shield` Privacy & Security → S-62
- `smartphone` Trusted Devices → S-63

**ABOUT**
- `info` About NHL Connect → S-64
- `help-circle` Help & Support → external link
- `log-out` Log Out → confirmation dialog

**Navigation:**
- Each item navigates to respective screen

---

### S-51: My Profile

**Purpose:** View own complete profile

**Layout:**
- Header: Back chevron, "Profile", right: `edit` icon (→ S-52)
- Avatar (80px) centered + camera icon overlay (change photo)
- Name (H1) centered
- Role badge + Department tag centered
- Status: icon `circle` (green) + "Online" (or custom status) → S-73
- Divider
- Info section (list rows):
  - `mail` Email: sarah.mbewe@nichehealthcare.co.uk
  - `phone` Phone: +44 7700 900890
  - `briefcase` Department: Dialysis
  - `award` Role: Doctor
  - `calendar` Joined: January 2025
- Divider
- "Edit Profile" → S-52

**Mock Data:**
- Dr. Sarah Mbewe
- Doctor, Dialysis Department
- Email: sarah.mbewe@nichehealthcare.co.uk
- Phone: +44 7700 900890

---

### S-52: Edit Profile

**Purpose:** Edit own profile information

**Layout:**
- Header: Back chevron, "Edit Profile", "Save" (right)
- Avatar with edit overlay
- Fields (editable):
  - Full Name
  - Display Name
  - Phone (read-only, managed by admin)
  - Email (read-only, managed by admin)
  - Bio / About (multiline, "Tell your team about yourself")
  - Status message

---

### S-53: Notifications List

**Purpose:** All notifications feed

**Layout:**
- Header: Back chevron, "Notifications", right: `check-check` icon ("Mark all read")
- Filter: "All" | "Unread" | "Mentions" | "Alerts" (horizontal pills)
- Notification items (see Notification Item component):
  - Unread items have #FAFAFE background with Navy Blue dot
  - Read items have white background
- Pull-to-refresh

**Mock Data:**

| Icon | Title | Description | Time | Read |
|------|-------|-------------|------|------|
| `message-circle` | New message | James Phiri sent you a message | 2m ago | No |
| `hash` | #dialysis-team | Dr. Banda posted in #dialysis-team | 15m ago | No |
| `at-sign` | Mention | Nurse Tembo mentioned you in #pharmacy | 1h ago | No |
| `bell` | Announcement | New policy update from Admin | 3h ago | Yes |
| `calendar` | Schedule | Your shift for tomorrow has been updated | 5h ago | Yes |
| `shield` | Security | New device approved by admin | 1d ago | Yes |

---

### S-54: Notification Settings

**Purpose:** Configure notification preferences

**Layout:**
- Header: Back chevron, "Notification Settings"
- Sections with toggles:

**MESSAGES**
- Direct Messages (toggle, default: on)
- Group Messages (toggle, default: on)
- Message previews (toggle, default: on)

**CHANNELS**
- Channel messages (toggle, default: on)
- Only when mentioned (toggle, default: off)

**SCHEDULE**
- Shift reminders (toggle, default: on)
- Training reminders (toggle, default: on)
- Reminder time: "30 minutes before" (picker)

**GENERAL**
- Announcements (toggle, default: on)
- Security alerts (toggle, default: on, non-toggleable)
- Sound (toggle, default: on)
- Vibration (toggle, default: on)

**QUIET HOURS**
- Enable quiet hours (toggle)
- Start: 22:00 (time picker)
- End: 07:00 (time picker)

---

### S-55: Files & Documents

**Purpose:** Browse shared documents, SOPs, training manuals

**Layout:**
- Header: Back chevron, "Files & Documents"
- Search bar
- Filter: "All" | "SOPs" | "Training" | "Policies" | "Forms" (scrollable pills)
- Sort: "Recent" dropdown (Recent, Name A-Z, Size)
- File list:
  - File item: Type icon (pdf/doc/img) + Name + Size + Uploaded by + Date
  - Folder items: Folder icon + Name + Item count

**Mock Data:**
- Folder: Standard Operating Procedures (12 files)
- Folder: Training Materials (8 files)
- Folder: Policies & Guidelines (5 files)
- File: "Shift_Rota_March_2026.xlsx" (245 KB, Admin, 3 days ago)
- File: "Dialysis_Protocol_v3.2.pdf" (1.8 MB, Dr. Banda, 1 week ago)
- File: "Infection_Control_Guide.pdf" (3.2 MB, Admin, 2 weeks ago)

**Navigation:**
- Folder → subfolder view (same layout)
- File → S-56

---

### S-56: Document Viewer

**Purpose:** View a document in detail

**Layout:**
- Header: Back chevron, filename, right: `download` icon + `share` icon
- Document preview (PDF viewer or image viewer)
- Bottom bar: page indicator (for multi-page docs)

---

### S-57: Staff Directory

**Purpose:** Browse all staff members

**Layout:**
- Header: Back chevron, "Staff Directory"
- Search bar
- Filter: "All" | "Doctors" | "Nurses" | "Admin" | "Pharmacy" (pills)
- Staff list (grouped by first letter):
  - Contact List Items (avatar + name + role + department + online status)
- Total count: "24 staff members" (Caption, bottom)

**Navigation:**
- Tap person → S-59
- Long press → Quick actions sheet (Message, Call)

**Mock Data:**

*B*
- Dr. Banda, Chisanga - Doctor, General Medicine (Online)

*C*
- Nurse Chomba, Ruth - Nurse, ICU (Offline)

*M*
- Dr. Mbewe, Sarah - Doctor, Dialysis (You, Online)
- Pharmacist Mutale, Grace - Pharmacist, Pharmacy (Away)

*P*
- Dr. Patel, Yusuf - Admin / Doctor (Online)
- Nurse Phiri, James - Nurse, Dialysis (Online)

*T*
- Nurse Tembo, David - Nurse, Night Shift (Offline)

---

### S-58: Department Directory

**Purpose:** Browse departments

**Layout:**
- Header: Back chevron, "Departments"
- Department cards (Standard Card):
  - Department name (H2)
  - Member count + channel link
  - Head/Lead name
  - Description

**Mock Data:**
- Dialysis Unit - 8 staff, Lead: Dr. Mbewe, Channel: #dialysis-team
- Pharmacy - 4 staff, Lead: Grace Mutale, Channel: #pharmacy
- ICU - 6 staff, Lead: Dr. Banda, Channel: #icu
- Night Shift - 4 staff, Lead: Nurse Tembo, Channel: #night-shift
- Administration - 2 staff, Lead: Dr. Patel

**Navigation:**
- Department card → filtered staff list (S-57 with filter applied)
- Channel link → S-31

---

### S-59: Staff Profile (other user)

**Purpose:** View another staff member's profile

**Layout:**
- Header: Back chevron, "Profile"
- Avatar (80px) centered
- Name (H1) + role badge + department tag + status
- Action row:
  - `message-circle` Message (→ opens/creates DM)
  - `phone` Call
- Divider
- Info section (same as S-51 but read-only, limited fields):
  - Email, Department, Role, Joined date
- "View in Directory" link

**Navigation:**
- Message → S-21 (creates or opens existing conversation)
- Back → previous screen

---

### S-60: Settings

**Purpose:** App settings

**Layout:**
- Header: Back chevron, "Settings"
- Sections:

**ACCOUNT**
- Account Settings → S-61
- Privacy & Security → S-62
- Trusted Devices → S-63

**NOTIFICATIONS**
- Notification Preferences → S-54

**APPEARANCE**
- Text Size (slider: Small / Medium / Large)

**DATA**
- Storage Usage (e.g., "245 MB used")
- Clear Cache

**ABOUT**
- About NHL Connect → S-64
- Terms of Service
- Privacy Policy
- Version: 1.0.0 (Build 1)

---

### S-61: Account Settings

**Purpose:** Account-level settings

**Layout:**
- Header: Back chevron, "Account"
- Rows:
  - Email (read-only with change request)
  - Phone (read-only with change request)
  - Change Password (if applicable)
  - Deactivate Account (destructive, confirmation dialog)

---

### S-62: Privacy & Security

**Purpose:** Security settings overview

**Layout:**
- Header: Back chevron, "Privacy & Security"
- Security status card:
  - Shield icon (green) + "Your account is secure"
  - Or Warning icon + "Action required"
- Rows:
  - Trusted Devices → S-63
  - Active Sessions (count)
  - Two-factor Authentication (toggle / status)
  - Login Activity (recent login list)

---

### S-63: Trusted Devices

**Purpose:** View and manage trusted devices

**Layout:**
- Header: Back chevron, "Trusted Devices"
- Current device (highlighted):
  - Device card: icon `smartphone` + "iPhone 15 Pro" + "This device"
  - Badge: "Trusted" (green) + "Last active: Now"
- Other devices:
  - Device cards: icon + name + platform + last seen + trusted status
  - Swipe left to reveal "Revoke" (destructive, admin may need to approve)

**Mock Data:**
- iPhone 15 Pro (This device) - iOS, Trusted, Active now
- MacBook Pro (Web) - Chrome, Trusted, Last seen 2 days ago
- Samsung Galaxy S24 (Pending) - Android, Pending admin approval, 1h ago

---

### S-64: About App

**Purpose:** App information

**Layout:**
- Header: Back chevron, "About"
- NHL logo centered (64px)
- "NHL Connect" (H1)
- "Version 1.0.0" (Caption)
- Company: "Niche Healthcare Limited"
- Tagline: "You are in Safe Hands"
- Divider
- Links:
  - Website
  - Terms of Service
  - Privacy Policy
  - Licenses

---

### S-65: Admin Panel (admin only)

**Purpose:** Admin management features

**Layout:**
- Header: Back chevron, "Admin Panel"
- Requires `staffRole == "ADMIN"` check
- Menu:
  - `users` Manage Staff → user list with create/suspend actions
  - `shield` Device Approvals → pending device list
  - `hash` Manage Channels → channel list with edit/delete
  - `bell` Send Announcement → announcement composer
  - `bar-chart-2` System Analytics → usage stats
  - `file-text` Manage Documents → document upload/management

---

## FULL-SCREEN MODALS

---

### S-70: Global Search

**Purpose:** Search across messages, channels, people, files

**Layout:**
- Full screen with search input (top, auto-focused)
- "Cancel" text button (right)
- Tab filters below: "All" | "Messages" | "People" | "Channels" | "Files"
- Recent searches (if no query)
- Results grouped by type:
  - People results: avatar + name + role
  - Channel results: # + name + member count
  - Message results: sender + message preview + channel/DM name + date
  - File results: icon + filename + location

---

### S-71: File Preview (Image)

**Purpose:** Full-screen image viewer

**Layout:**
- Dark background
- Close button (X, top-left, white)
- Image (zoomable, pannable)
- Bottom bar: sender name, date, `download` icon, `share` icon

---

### S-72: File Preview (Document)

**Purpose:** View document files

**Layout:**
- Header: Back chevron, filename, `download` + `share` icons
- Document content viewer
- For unsupported formats: "Open in..." option

---

### S-73: Status Picker

**Purpose:** Set your availability status

**Layout:**
- Bottom Sheet modal:
  - "Set Status" (H2)
  - Status options (list):
    - `circle` (green) Online
    - `clock` Away
    - `minus-circle` Do Not Disturb
    - `circle` (grey) Appear Offline
  - Custom status input: text + clear after duration picker
  - "Save" Primary Button

---

## Navigation Flow Summary

Every screen has:
- A clear **entry point** (how user gets there)
- A clear **exit** (back button, close, or tab switch)
- **No dead ends** - every action leads somewhere meaningful

All data is **mocked/hardcoded** for Phase 1 UI development.
