# 05 — Patient Communication System

> Patients are NOT full app users. They have a single-purpose, lightweight web interface for messaging their assigned doctor only.

---

## 5.1 Design Philosophy

The patient interface is intentionally minimal:
- Web-only (no native app — patients use a link, not an app store download)
- Messaging ONLY — no dashboards, no staff data visible
- Doctor-patient link is explicitly set by admin — patients cannot browse or contact arbitrary doctors
- Styled with NHL branding but vastly simpler than the staff app
- Mobile-first responsive web page

---

## 5.2 Patient User Journey

```
Patient receives a secure link/SMS from NHL admin
│
└── patient.nichehealthcare.co.uk/chat?token=<secureToken>
    │
    ├── Token validated (Convex HTTP endpoint)
    │   ├── Valid → Load patient interface
    │   └── Invalid/Expired → "This link has expired. Contact the clinic."
    │
    └── Patient Messaging Interface
        ├── Header: NHS logo + "Niche Healthcare" + patient's name
        ├── Single conversation: their assigned doctor
        ├── Message list (patient's own messages right, doctor's left)
        ├── Auto-scroll to latest
        ├── Message input + Send button
        └── Footer: "This is a secure internal messaging system."
```

---

## 5.3 Patient Data Model

Patient accounts are a subset of the `users` collection with `userType: 'patient'`.

```typescript
// Patient user example
{
  "_id": "px_abc123",
  "userType": "patient",
  "staffRole": undefined,       // always null for patients
  "displayName": "Mr. James Banda",
  "phone": "+260977000123",     // used for OTP if needed
  "isActive": true,
  "assignedDoctorId": "jd7a9x2...",  // single doctor link
  "patientRef": "NHL-2026-0042",     // internal patient reference
}
```

**Additional fields to add to `users` schema for patients:**
```typescript
assignedDoctorId: v.optional(v.id('users')),
patientRef:       v.optional(v.string()),
accessToken:      v.optional(v.string()),   // single-use or rotating link token
accessTokenExpiry: v.optional(v.number()),
```

---

## 5.4 Patient Conversation Model

Each patient has exactly one conversation in the `conversations` table:

```typescript
{
  type: 'direct',
  members: [patientUserId, assignedDoctorUserId],
  name: undefined,
  isPatientConversation: true,   // flag to prevent staff from seeing in their DM list
}
```

**Additional field to add to `conversations` schema:**
```typescript
isPatientConversation: v.optional(v.boolean()),
```

**Guard: Staff conversation list MUST exclude patient conversations:**
```typescript
// In listConversations query — add this filter:
.filter(q => q.neq(q.field('isPatientConversation'), true))
```

---

## 5.5 Patient Web Interface

### Tech: Separate lightweight React app
```
patient-portal/
├── index.html
├── src/
│   ├── App.jsx              ← Token validation + render
│   ├── PatientChat.jsx      ← Main messaging UI
│   ├── components/
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   └── Header.jsx
│   └── styles/
│       └── patient.css      ← Minimal styling, NHL brand colors
```

### Token Validation
```javascript
// App.jsx
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const { data, error } = await convex.query(api.patients.validateAccessToken, { token });
if (!data) return <ExpiredLinkScreen />;
// Render PatientChat with conversation data
```

### Convex: `validateAccessToken`
```typescript
export const validateAccessToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const patient = await ctx.db
      .query('users')
      .filter(q =>
        q.and(
          q.eq(q.field('accessToken'), token),
          q.eq(q.field('userType'), 'patient'),
          q.gt(q.field('accessTokenExpiry'), Date.now())
        )
      )
      .first();
    if (!patient) return null;
    const convo = await ctx.db
      .query('conversations')
      .filter(q =>
        q.and(
          q.includes(q.field('members'), patient._id),
          q.eq(q.field('isPatientConversation'), true)
        )
      )
      .first();
    return { patient, conversationId: convo?._id };
  },
});
```

---

## 5.6 Patient Interface — Screen Layout

```
┌───────────────────────────────────┐
│  NHS + NHL Logo  |  "Niche..."   │ ← Header (56px, white bg, border bottom)
│  "Hello, Mr. Banda"              │
├───────────────────────────────────┤
│                                   │
│   Dr. Sarah Mbewe (doctor card)  │ ← Assigned doctor info card (name + role)
│                                   │
├───────────────────────────────────┤
│                                   │
│  [System] "You are now connected  │ ← System bubble (centered, grey)
│  with Dr. Sarah Mbewe"           │
│                                   │
│  Dr. Mbewe (10:30 AM):           │ ← Received bubble (Off White, left)
│  "Good morning Mr. Banda.        │
│   How are you feeling today?"    │
│                                   │
│    "I have been feeling better   │ ← Sent bubble (Navy Blue, right)
│     after the medication change   │
│     you recommended last week."  │
│                           11:15AM│
│                                   │
│  Dr. Mbewe (11:20 AM):            │
│  "That's great news. Please      │
│   continue with the current      │
│   dosage."                       │
│                                   │
├───────────────────────────────────┤
│  [Type a message...]    [ Send ] │ ← Input bar (no file upload for patients)
├───────────────────────────────────┤
│ "This is a secure internal       │ ← Footer disclaimer
│  messaging system."              │
└───────────────────────────────────┘
```

---

## 5.7 Doctor-Side (Staff App) — Patient Messages

Doctors see patient conversations in a **dedicated "Patient Messages" section** (not mixed with staff DMs):

- In `ChatInfoScreen.js` (S-25), a flag shows "Patient Conversation" warning banner
- In `ConversationsScreen.js` (S-20), patient conversations are in a separate list section labeled "PATIENT MESSAGES" — visually distinct from staff conversations
- Patient conversations have a Peach left border on conversation items to distinguish them

### Filter on `listConversations`:
```typescript
// For doctors: also include patient conversations assigned to them
const patientConvos = await ctx.db
  .query('conversations')
  .filter(q =>
    q.and(
      q.includes(q.field('members'), viewer._id),
      q.eq(q.field('isPatientConversation'), true)
    )
  )
  .collect();
```

---

## 5.8 Admin: Creating Patient Access

Admin creates a patient record and generates a secure access link:

```typescript
export const createPatientAccess = mutation({
  args: {
    displayName: v.string(),
    phone: v.optional(v.string()),
    assignedDoctorId: v.id('users'),
    patientRef: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    if (viewer.staffRole !== 'admin') throw new Error('Forbidden');

    // Generate secure random token (32 bytes → hex)
    const token = generateSecureToken(); // custom utility using crypto
    const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

    const patientId = await ctx.db.insert('users', {
      userType: 'patient',
      displayName: args.displayName,
      phone: args.phone,
      firstName: '',
      lastName: '',
      initials: args.displayName.substring(0, 2).toUpperCase(),
      assignedDoctorId: args.assignedDoctorId,
      patientRef: args.patientRef,
      accessToken: token,
      accessTokenExpiry: expiry,
      isActive: true,
      onlineStatus: 'offline',
      joinedAt: Date.now(),
    });

    // Create the doctor-patient conversation
    await ctx.db.insert('conversations', {
      type: 'direct',
      members: [patientId, args.assignedDoctorId],
      createdBy: viewer._id,
      createdAt: Date.now(),
      isArchived: false,
      isPatientConversation: true,
    });

    // Return the access link for admin to share with patient
    return `https://patient.nichehealthcare.co.uk/chat?token=${token}`;
  },
});
```

---

## 5.9 Patient Notification Flow

Patients are notified via SMS (not push notification — they don't have the app installed):

- When doctor replies to patient → Convex scheduled function sends SMS via Twilio/similar
- SMS content: "You have a new message from Dr. [Name] on the Niche Healthcare portal. Tap your link to view."
- The link in the SMS is their existing access token link

This is implemented as a Convex action (can call external HTTP APIs):

```typescript
export const notifyPatientViaSMS = action({
  args: { patientId: v.id('users'), doctorName: v.string() },
  handler: async (ctx, { patientId, doctorName }) => {
    const patient = await ctx.runQuery(api.users.getById, { userId: patientId });
    if (!patient?.phone) return;
    const link = `https://patient.nichehealthcare.co.uk/chat?token=${patient.accessToken}`;
    await fetch('https://api.twilio.com/...', {
      method: 'POST',
      body: new URLSearchParams({
        To: patient.phone,
        Body: `You have a new message from ${doctorName}. View it here: ${link}`,
      }),
      headers: { Authorization: `Basic ${btoa(TWILIO_SID + ':' + TWILIO_TOKEN)}` },
    });
  },
});
```
