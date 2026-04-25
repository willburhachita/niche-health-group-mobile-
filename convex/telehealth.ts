import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// ── Start a telehealth session ──────────────────────────────────────────
export const startSession = mutation({
  args: {
    appointmentId: v.id("appointments"),
    patientId: v.id("patients"),
    providerId: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active session for this appointment
    const existing = await ctx.db
      .query("telehealthSessions")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .take(10);
    const active = existing.find((s) => s.status === "active" || s.status === "waiting");
    if (active) return active._id;

    const sessionId = await ctx.db.insert("telehealthSessions", {
      appointmentId: args.appointmentId,
      patientId: args.patientId,
      providerId: args.providerId,
      status: "active",
      startedAt: Date.now(),
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    // Mark appointment as in-progress (confirmed → active)
    await ctx.db.patch(args.appointmentId, { status: "confirmed" });

    return sessionId;
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

    // Mark appointment as completed
    await ctx.db.patch(session.appointmentId, { status: "completed" });

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
