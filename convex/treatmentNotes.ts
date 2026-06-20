import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { enforcePermission } from "./utils/permissions";

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
    templateId: v.optional(v.id("treatmentNoteTemplates")),
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
    customResponses: v.optional(
      v.array(
        v.object({
          questionId: v.string(),
          questionTitle: v.string(),
          value: v.string(),
        })
      )
    ),
    isPrivate: v.boolean(),
    status: v.optional(v.string()), // "draft" | "finalized" | "approved"
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.providerId, "createTreatmentNote");
    return await ctx.db.insert("treatmentNotes", {
      ...args,
      status: args.status || "finalized", // Default to finalized for legacy/unspecified
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
    customResponses: v.optional(
      v.array(
        v.object({
          questionId: v.string(),
          questionTitle: v.string(),
          value: v.string(),
        })
      )
    ),
    isPrivate: v.optional(v.boolean()),
    status: v.optional(v.string()),
    providerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, providerId, ...fields } = args;
    const note = await ctx.db.get(id);
    if (!note) throw new Error("Note not found");
    await enforcePermission(ctx.db, providerId || note.providerId, "editTreatmentNote");
    
    // Safety check: Only notes in "draft" status (or notes with no status, i.e. legacy) can be edited.
    if (note.status && note.status !== "draft") {
      throw new Error(`Only draft notes can be edited. This note is already ${note.status}.`);
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

// ── Approve note (admin only) ───────────────────────────────────────────
export const approve = mutation({
  args: {
    id: v.id("treatmentNotes"),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.approvedBy, "adminPanel");
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    
    // Safety check: only finalized notes can be approved
    if (note.status !== "finalized") {
      throw new Error("Only finalized notes can be approved by an administrator");
    }

    await ctx.db.patch(args.id, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
