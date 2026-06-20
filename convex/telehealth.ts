import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ── Start a telehealth session ──────────────────────────────────────────
export const startSession = mutation({
  args: {
    appointmentId: v.optional(v.id("appointments")),
    patientId: v.id("patients"),
    providerId: v.string(),
    invitees: v.optional(v.array(v.string())),
    createdBy: v.string(),
    platform: v.optional(v.string()),
    customRoomUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for existing active session on same appointment
    if (args.appointmentId) {
      const existing = await ctx.db
        .query("telehealthSessions")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId!))
        .take(10);
      const active = existing.find((s) => s.status === "active" || s.status === "waiting");
      if (active) return { sessionId: active._id, roomUrl: active.roomUrl };
    }

    // Determine platform and room URL
    const platform = args.platform || "jitsi";
    let roomUrl = "";
    if (platform === "jitsi") {
      const roomId = `nhl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      roomUrl = `https://meet.jit.si/${roomId}`;
    } else {
      roomUrl = args.customRoomUrl || "";
    }

    const sessionId = await ctx.db.insert("telehealthSessions", {
      appointmentId: args.appointmentId,
      patientId: args.patientId,
      providerId: args.providerId,
      status: "active",
      startedAt: Date.now(),
      roomUrl,
      platform,
      invitees: args.invitees || [],
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    // Mark appointment as confirmed if linked
    if (args.appointmentId) {
      await ctx.db.patch(args.appointmentId, { status: "confirmed" });
    }

    // Notify each invitee
    for (const invitee of args.invitees || []) {
      await ctx.db.insert("inAppNotifications", {
        userId: invitee,
        type: "telehealth",
        title: "You've been invited to a session",
        body: `${args.providerId} started a telehealth session and invited you to join.`,
        link: "/telehealth",
        entityId: sessionId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { sessionId, roomUrl };
  },
});

// ── End a telehealth session ────────────────────────────────────────────
export const endSession = mutation({
  args: {
    sessionId: v.id("telehealthSessions"),
    callNotes: v.optional(v.string()),
    transcription: v.optional(v.string()),
    createTreatmentNote: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const now = Date.now();
    const duration = session.startedAt ? Math.round((now - session.startedAt) / 1000) : 0;

    const updates: Record<string, unknown> = {
      status: "completed",
      endedAt: now,
      duration,
    };
    if (args.callNotes !== undefined) updates.callNotes = args.callNotes;
    if (args.transcription !== undefined) updates.transcription = args.transcription;

    // Auto-create treatment note from call notes + transcription
    if (args.createTreatmentNote) {
      const subjective = args.transcription
        ? `[Telehealth Transcription]\n${args.transcription}`
        : undefined;
      const plan = args.callNotes || undefined;

      const noteId = await ctx.db.insert("treatmentNotes", {
        patientId: session.patientId,
        providerId: session.providerId,
        appointmentId: session.appointmentId,
        template: "Telehealth Consultation",
        subjective,
        plan,
        isPrivate: false,
        createdAt: now,
        updatedAt: now,
      });
      updates.treatmentNoteId = noteId;
    }

    await ctx.db.patch(args.sessionId, updates);

    // Mark linked appointment as completed (if any)
    if (session.appointmentId) {
      await ctx.db.patch(session.appointmentId, { status: "completed" });
    }

    return args.sessionId;
  },
});

// ── Update call notes (live, during the call) ───────────────────────────
export const updateNotes = mutation({
  args: {
    sessionId: v.id("telehealthSessions"),
    callNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { callNotes: args.callNotes });
  },
});

// ── Update transcription (live, during the call) ────────────────────────
export const updateTranscription = mutation({
  args: {
    sessionId: v.id("telehealthSessions"),
    transcription: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { transcription: args.transcription });
  },
});

// ── Get a single session ────────────────────────────────────────────────
export const get = query({
  args: { id: v.id("telehealthSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Get session by appointment ──────────────────────────────────────────
export const getByAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("telehealthSessions")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .order("desc")
      .take(1)
      .then((r) => r[0] ?? null);
  },
});

// ── Get active session for a provider ───────────────────────────────────
export const getActiveForProvider = query({
  args: { providerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("telehealthSessions")
      .withIndex("by_providerId_and_status", (q) =>
        q.eq("providerId", args.providerId).eq("status", "active")
      )
      .take(1)
      .then((r) => r[0] ?? null);
  },
});

// ── List active sessions ───────────────────────────────────────────────
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("telehealthSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// ── Get sessions where user is an invitee ───────────────────────────────
export const getInvitedSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("telehealthSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return active.filter(
      (s) => s.invitees?.includes(args.userId) && s.providerId !== args.userId
    );
  },
});

// ── List completed sessions (recent) ────────────────────────────────────
export const listCompleted = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("telehealthSessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);
    return all.filter((s) => s.status === "completed");
  },
});

// ── List sessions by provider ───────────────────────────────────────────
export const listByProvider = query({
  args: { providerId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("telehealthSessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 100);
    return all.filter((s) => s.providerId === args.providerId);
  },
});

// ── Track who joined the call ────────────────────────────────────────────
export const joinSession = mutation({
  args: {
    sessionId: v.id("telehealthSessions"),
    userId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    const existing = (session.participants || []);
    if (existing.find((p) => p.userId === args.userId)) return args.sessionId;
    await ctx.db.patch(args.sessionId, {
      participants: [...existing, {
        userId: args.userId,
        displayName: args.displayName,
        joinedAt: Date.now(),
      }],
    });
    return args.sessionId;
  },
});

// ── Remove participant when they leave ──────────────────────────────────
export const leaveSession = mutation({
  args: {
    sessionId: v.id("telehealthSessions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    await ctx.db.patch(args.sessionId, {
      participants: (session.participants || []).filter((p) => p.userId !== args.userId),
    });
  },
});
