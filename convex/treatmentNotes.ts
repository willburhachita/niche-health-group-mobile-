import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List notes for a patient ────────────────────────────────────────────
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("treatmentNotes")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(100);
  },
});

// ── List recent notes (for pending count) ───────────────────────────────
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("treatmentNotes")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// ── Count pending notes (created today without assessment) ──────────────
export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const notes = await ctx.db
      .query("treatmentNotes")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", dayStart.getTime()))
      .take(100);
    return notes.filter((n) => !n.assessment || n.assessment.trim().length === 0).length;
  },
});

// ── Get single note ─────────────────────────────────────────────────────
export const get = query({
  args: { id: v.id("treatmentNotes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Create note ─────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    patientId: v.id("patients"),
    providerId: v.string(),
    appointmentId: v.optional(v.id("appointments")),
    template: v.string(),
    subjective: v.optional(v.string()),
    objective: v.optional(v.string()),
    assessment: v.optional(v.string()),
    plan: v.optional(v.string()),
    vitals: v.optional(
      v.object({
        bp: v.optional(v.string()),
        heartRate: v.optional(v.number()),
        temperature: v.optional(v.number()),
        weight: v.optional(v.number()),
        o2Sat: v.optional(v.number()),
      })
    ),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("treatmentNotes", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ── Update note ─────────────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("treatmentNotes"),
    subjective: v.optional(v.string()),
    objective: v.optional(v.string()),
    assessment: v.optional(v.string()),
    plan: v.optional(v.string()),
    vitals: v.optional(
      v.object({
        bp: v.optional(v.string()),
        heartRate: v.optional(v.number()),
        temperature: v.optional(v.number()),
        weight: v.optional(v.number()),
        o2Sat: v.optional(v.number()),
      })
    ),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});
