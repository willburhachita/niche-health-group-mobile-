import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("serviceTypes").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("serviceTypes").collect();
    return all.filter((s) => s.isActive && !s.isArchived);
  },
});

export const get = query({
  args: { id: v.id("serviceTypes") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    fixedPrice: v.number(),
    duration: v.optional(v.number()),
    stockItems: v.array(v.object({
      stockItemId: v.id("stockItems"),
      quantity: v.number(),
    })),
    treatmentTemplate: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("serviceTypes", {
      name: args.name,
      description: args.description,
      fixedPrice: args.fixedPrice,
      duration: args.duration,
      stockItems: args.stockItems,
      treatmentTemplate: args.treatmentTemplate,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("serviceTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    fixedPrice: v.optional(v.number()),
    duration: v.optional(v.number()),
    stockItems: v.optional(v.array(v.object({
      stockItemId: v.id("stockItems"),
      quantity: v.number(),
    }))),
    treatmentTemplate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    updatedBy: v.string(),
  },
  handler: async (ctx, { id, updatedBy, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Service type not found");
    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.fixedPrice !== undefined) patch.fixedPrice = fields.fixedPrice;
    if (fields.duration !== undefined) patch.duration = fields.duration;
    if (fields.stockItems !== undefined) patch.stockItems = fields.stockItems;
    if (fields.treatmentTemplate !== undefined) patch.treatmentTemplate = fields.treatmentTemplate;
    if (fields.isActive !== undefined) patch.isActive = fields.isActive;
    await ctx.db.patch(id, patch);
  },
});

export const archive = mutation({
  args: {
    id: v.id("serviceTypes"),
    archivedBy: v.string(),
  },
  handler: async (ctx, { id, archivedBy }) => {
    await ctx.db.patch(id, {
      isArchived: true,
      archivedBy,
      archivedAt: Date.now(),
      isActive: false,
    });
  },
});
