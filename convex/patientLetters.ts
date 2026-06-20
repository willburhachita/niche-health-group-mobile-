import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientLetters")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    recipient: v.string(),
    subject: v.string(),
    body: v.string(),
    sentBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patientLetters", {
      ...args,
      status: "sent",
      sentAt: Date.now(),
    });
  },
});
