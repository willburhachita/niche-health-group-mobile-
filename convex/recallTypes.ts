import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("recallTypes").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("recallTypes").collect();
    return all.filter((r) => r.isActive);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    defaultDays: v.number(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recallTypes", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recallTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    defaultDays: v.optional(v.number()),
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
  args: { id: v.id("recallTypes") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});
