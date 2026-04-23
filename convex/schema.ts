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
    unreadCount: v.number(),
    unreadBy: v.optional(v.record(v.string(), v.boolean())),
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
});
