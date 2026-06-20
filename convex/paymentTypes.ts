import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("paymentTypes").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("paymentTypes").collect();
    return all.filter((p) => p.isActive);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    requiresReference: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("paymentTypes", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("paymentTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    requiresReference: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch: Record<string, any> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("paymentTypes") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});
