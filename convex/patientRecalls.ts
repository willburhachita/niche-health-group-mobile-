import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientRecalls")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    recallType: v.string(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
    scheduledBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patientRecalls", {
      ...args,
      status: "pending",
      scheduledAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("patientRecalls"),
    status: v.string(), // "completed" | "cancelled" | "pending"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
    });
  },
});
