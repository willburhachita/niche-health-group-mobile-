import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientCommunications")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    type: v.string(), // "SMS" | "Email" | "Phone Call" | "Letter"
    direction: v.string(), // "inbound" | "outbound"
    subject: v.optional(v.string()),
    message: v.string(),
    sentBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patientCommunications", {
      ...args,
      status: "logged",
      sentAt: Date.now(),
    });
  },
});
