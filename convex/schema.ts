import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Staff Accounts (authentication) ──────────────────────────────────
  staffAccounts: defineTable({
    userId: v.string(),
    email: v.string(),
    phone: v.optional(v.union(v.string(), v.null())),
    title: v.optional(v.union(v.string(), v.null())),
    displayName: v.optional(v.union(v.string(), v.null())),
    fullName: v.optional(v.union(v.string(), v.null())),
    role: v.string(),
    password: v.string(),
    verificationCode: v.optional(v.string()),
    otpExpiry: v.optional(v.number()),
    isActive: v.boolean(),
    isOnboarded: v.boolean(),
    trustedDevices: v.array(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"])
    .index("by_userId", ["userId"]),

  // ── Users (profile/display info) ─────────────────────────────────────
  users: defineTable({
    externalId: v.string(), // matches userId in staffAccounts
    displayName: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    initials: v.string(),
    userType: v.string(),
    staffRole: v.string(),
    department: v.string(),
    email: v.string(),
    phone: v.string(),
    onlineStatus: v.string(),
    lastSeenAt: v.optional(v.number()),
    joinedAt: v.number(),
    bio: v.optional(v.string()),
  }).index("by_externalId", ["externalId"])
    .index("by_email", ["email"]),

  // ── Conversations (DMs & groups) ─────────────────────────────────────
  conversations: defineTable({
    type: v.string(), // "direct" | "group"
    name: v.optional(v.string()),
    members: v.array(v.string()), // user externalIds
    lastMessage: v.optional(v.string()),
    lastMessageBy: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessageType: v.optional(v.string()),
    unreadCount: v.number(),
    unreadBy: v.optional(v.record(v.string(), v.boolean())),
    readAt: v.optional(v.record(v.string(), v.number())), // userId -> timestamp of last read
  }),

  // ── Messages ─────────────────────────────────────────────────────────
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    type: v.string(), // "text" | "file" | "system"
    sentAt: v.number(),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    mentions: v.optional(v.array(v.string())), // array of userIds mentioned with @
    hiddenBy: v.optional(v.array(v.string())), // userIds who deleted for themselves
    editedAt: v.optional(v.number()),
  }).index("by_conversation", ["conversationId", "sentAt"])
    .index("by_sender", ["senderId", "sentAt"]),

  // ── Channels ─────────────────────────────────────────────────────────
  channels: defineTable({
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // "public" | "private"
    members: v.array(v.string()),
    admins: v.array(v.string()),
    unreadCount: v.number(),
    isStarred: v.boolean(),
    memberCount: v.number(),
  }).index("by_name", ["name"]),

  // ── Channel Messages ─────────────────────────────────────────────────
  channelMessages: defineTable({
    channelId: v.id("channels"),
    senderId: v.string(),
    content: v.string(),
    type: v.string(),
    sentAt: v.number(),
    isPinned: v.optional(v.boolean()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    mentions: v.optional(v.array(v.string())), // array of userIds mentioned with @
  }).index("by_channel", ["channelId", "sentAt"])
    .index("by_sender", ["senderId", "sentAt"]),

  // ── Files & Documents ────────────────────────────────────────────────
  files: defineTable({
    name: v.string(),
    fileType: v.string(), // "folder" | "pdf" | "xlsx" | "doc" | "png" etc
    size: v.optional(v.number()),
    itemCount: v.optional(v.number()), // for folders
    uploadedBy: v.optional(v.string()),
    uploadedAt: v.optional(v.number()),
    storageId: v.optional(v.string()), // Convex storage ID for actual files
    parentFolderId: v.optional(v.id("files")),
  }),

  // ── Announcements ────────────────────────────────────────────────────
  announcements: defineTable({
    title: v.string(),
    body: v.string(),
    author: v.string(),
    authorName: v.optional(v.string()),
    priority: v.optional(v.string()), // "normal" | "urgent" | "critical"
    audience: v.optional(v.string()), // "all" | "admin" | "moderator" | "member"
    expiresAt: v.optional(v.number()),
    isPinned: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      fileType: v.string(),
      size: v.number(),
      storageId: v.optional(v.string()),
    }))),
    acknowledgedBy: v.array(v.string()),
    totalStaff: v.number(),
    createdAt: v.number(),
  }),

  // ── Activity Logs ──────────────────────────────────────────────────────
  activityLogs: defineTable({
    action: v.string(),
    category: v.string(), // "auth" | "staff" | "channel" | "announcement" | "device" | "system"
    performedBy: v.string(),
    performedByName: v.optional(v.string()),
    target: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_category", ["category"]).index("by_timestamp", ["timestamp"]),

  // ── Device Requests ──────────────────────────────────────────────────
  deviceRequests: defineTable({
    staffId: v.string(),
    deviceId: v.string(),
    deviceName: v.optional(v.string()),
    platform: v.optional(v.string()),
    status: v.string(), // "pending" | "approved" | "rejected"
    requestedAt: v.number(),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
  }).index("by_staffId", ["staffId"]),

  // ── Login Alerts ─────────────────────────────────────────────────────
  loginAlerts: defineTable({
    staffId: v.string(),
    deviceName: v.string(),
    loggedInAt: v.number(),
  }),

  // ══════════════════════════════════════════════════════════════════════
  // ── CLINIC TOOLS ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════

  // ── Patients ──────────────────────────────────────────────────────────
  patients: defineTable({
    patientCode: v.string(),          // human-readable "PT-001"
    firstName: v.string(),
    lastName: v.string(),
    displayName: v.string(),
    initials: v.string(),
    dateOfBirth: v.string(),          // "1985-04-12"
    gender: v.string(),               // "Male" | "Female" | "Other"
    phone: v.string(),
    email: v.optional(v.string()),
    allergies: v.array(v.string()),
    conditions: v.array(v.string()),
    medications: v.array(v.string()),
    bloodType: v.optional(v.string()),
    insuranceProvider: v.optional(v.string()),
    policyNumber: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    status: v.string(),               // "active" | "discharged" | "inactive"
    department: v.string(),           // "General" | "Dialysis" | "ICU" etc
    lastVisit: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_patientCode", ["patientCode"])
    .index("by_status", ["status"])
    .index("by_lastName", ["lastName"])
    .searchIndex("search_name", { searchField: "displayName" }),

  // ── Appointments ──────────────────────────────────────────────────────
  appointments: defineTable({
    patientId: v.optional(v.id("patients")), // null for "open" slots
    providerId: v.string(),           // staff userId
    type: v.optional(v.string()),     // "Consultation" | "Follow-up" | "Dialysis Session" etc
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),             // minutes
    location: v.optional(v.string()),
    status: v.string(),               // "confirmed" | "pending" | "cancelled" | "completed" | "noShow" | "open"
    notes: v.optional(v.string()),
    isRecurring: v.boolean(),
    recurringPattern: v.optional(v.string()), // "daily" | "weekly" | "biweekly" | "monthly"
    recurringEndDate: v.optional(v.number()),
    parentAppointmentId: v.optional(v.id("appointments")), // for recurrence instances
    reminderSent: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_startTime", ["startTime"])
    .index("by_patientId", ["patientId"])
    .index("by_providerId_and_startTime", ["providerId", "startTime"])
    .index("by_status", ["status"]),

  // ── Schedule Events ───────────────────────────────────────────────────
  scheduleEvents: defineTable({
    title: v.string(),
    type: v.string(),                 // "shift" | "meeting" | "training" | "other"
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    isAllDay: v.boolean(),
    organizer: v.string(),            // staff userId
    attendees: v.array(v.string()),   // staff userIds
    isRecurring: v.boolean(),
    recurringPattern: v.optional(v.string()), // "daily" | "weekly" | "biweekly" | "monthly"
    recurringEndDate: v.optional(v.number()),
    parentEventId: v.optional(v.id("scheduleEvents")),
    acknowledgedBy: v.array(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_startTime", ["startTime"])
    .index("by_organizer", ["organizer"]),

  // ── Stock Items ───────────────────────────────────────────────────────
  stockItems: defineTable({
    itemCode: v.string(),
    name: v.string(),
    serialNumber: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    pricePerItem: v.number(),
    includesTax: v.boolean(),
    taxType: v.string(),              // "vat_16" | "zero_rated" | "exempt"
    taxRate: v.optional(v.number()),
    costPrice: v.number(),
    stockLevel: v.number(),
    reorderLevel: v.number(),
    expiryDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.string(),               // "active" | "discontinued"
    createdBy: v.string(),
    updatedBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_itemCode", ["itemCode"])
    .index("by_status", ["status"])
    .searchIndex("search_name", { searchField: "name" }),

  // ── Stock Adjustments ─────────────────────────────────────────────────
  stockAdjustments: defineTable({
    stockItemId: v.id("stockItems"),
    adjustmentType: v.string(),       // "increase" | "decrease"
    reason: v.string(),
    quantity: v.number(),
    previousLevel: v.number(),
    newLevel: v.number(),
    notes: v.optional(v.string()),
    adjustedBy: v.string(),
    adjustedAt: v.number(),
  }).index("by_stockItemId", ["stockItemId"])
    .index("by_adjustedAt", ["adjustedAt"]),

  // ── Suppliers ─────────────────────────────────────────────────────────
  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isFrequent: v.boolean(),
    orderCount: v.number(),
    lastOrderDate: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).searchIndex("search_name", { searchField: "name" }),

  // ── Invoices ──────────────────────────────────────────────────────────
  invoices: defineTable({
    invoiceNumber: v.string(),
    patientId: v.id("patients"),
    appointmentId: v.optional(v.id("appointments")), // linked appointment
    date: v.number(),
    dueDate: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    status: v.string(),               // "unpaid" | "paid" | "overdue" | "partial"
    notes: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_patientId", ["patientId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"])
    .index("by_invoiceNumber", ["invoiceNumber"])
    .index("by_appointmentId", ["appointmentId"]),

  // ── Invoice Line Items ────────────────────────────────────────────────
  invoiceLineItems: defineTable({
    invoiceId: v.id("invoices"),
    stockItemId: v.optional(v.id("stockItems")), // linked stock item for auto-deduction
    description: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    total: v.number(),
  }).index("by_invoiceId", ["invoiceId"]),

  // ── Payments ──────────────────────────────────────────────────────────
  payments: defineTable({
    invoiceId: v.id("invoices"),
    patientId: v.id("patients"),
    amount: v.number(),
    method: v.string(),               // "cash" | "mobile_money" | "card" | "insurance_nhima" | "bank_transfer" | "other"
    referenceNumber: v.optional(v.string()),
    status: v.string(),               // "completed" | "pending" | "failed"
    paymentDate: v.number(),
    notes: v.optional(v.string()),
    recordedBy: v.string(),
    createdAt: v.number(),
  }).index("by_invoiceId", ["invoiceId"])
    .index("by_patientId", ["patientId"])
    .index("by_paymentDate", ["paymentDate"]),

  // ── Expenses ──────────────────────────────────────────────────────────
  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.string(),             // "medical_supplies" | "equipment" | "utilities" | "salaries" | "maintenance" | "other"
    date: v.number(),
    vendorName: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_category", ["category"])
    .index("by_date", ["date"]),

  // ── Telehealth Sessions ──────────────────────────────────────────────
  telehealthSessions: defineTable({
    appointmentId: v.id("appointments"),
    patientId: v.id("patients"),
    providerId: v.string(),           // staff userId (doctor)
    status: v.string(),               // "waiting" | "active" | "completed" | "missed"
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // seconds
    callNotes: v.optional(v.string()),
    transcription: v.optional(v.string()),
    treatmentNoteId: v.optional(v.id("treatmentNotes")),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_appointmentId", ["appointmentId"])
    .index("by_providerId_and_status", ["providerId", "status"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // ── Departments ───────────────────────────────────────────────────────
  departments: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    headUserId: v.optional(v.string()),   // externalId of department head
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  // ── Treatment Notes ───────────────────────────────────────────────────
  treatmentNotes: defineTable({
    patientId: v.id("patients"),
    providerId: v.string(),           // staff userId
    appointmentId: v.optional(v.id("appointments")),
    template: v.string(),             // "General Consultation" | "Dialysis Session" | "Follow-up" | "Custom"
    subjective: v.optional(v.string()),
    objective: v.optional(v.string()),
    assessment: v.optional(v.string()),
    plan: v.optional(v.string()),
    vitals: v.optional(v.object({
      bp: v.optional(v.string()),
      heartRate: v.optional(v.number()),
      temperature: v.optional(v.number()),
      weight: v.optional(v.number()),
      o2Sat: v.optional(v.number()),
    })),
    isPrivate: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_patientId", ["patientId"])
    .index("by_providerId", ["providerId"])
    .index("by_createdAt", ["createdAt"]),
});
