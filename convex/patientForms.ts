import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientForms")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    title: v.string(),
    responses: v.string(),
    submittedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patientForms", {
      ...args,
      status: "submitted",
      submittedAt: Date.now(),
    });
  },
});
