import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientCases")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    title: v.string(),
    description: v.optional(v.string()),
    openedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patientCases", {
      ...args,
      status: "open",
      openedAt: Date.now(),
    });
  },
});

export const closeCase = mutation({
  args: {
    id: v.id("patientCases"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "closed",
      closedAt: Date.now(),
    });
  },
});
