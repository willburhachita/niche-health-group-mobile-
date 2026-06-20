import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all stock items ────────────────────────────────────────────────
export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("stockItems")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(200);
    }
    const results = await ctx.db.query("stockItems").take(200);
    return results.filter((i) => !i.isArchived);
  },
});

// ── Search stock items ──────────────────────────────────────────────────
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length === 0) {
      return await ctx.db.query("stockItems").take(200);
    }
    return await ctx.db
      .query("stockItems")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(50);
  },
});

// ── Get single stock item ───────────────────────────────────────────────
export const get = query({
  args: { id: v.id("stockItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Low stock / expiring alerts ─────────────────────────────────────────
export const alerts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ninetyDays = now + 90 * 86400000;
    const items = await ctx.db
      .query("stockItems")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(200);
    const lowStock = items.filter((i) => i.stockLevel <= i.reorderLevel);
    const expiringSoon = items.filter(
      (i) => i.expiryDate && i.expiryDate <= ninetyDays && i.expiryDate > now
    );
    const expired = items.filter((i) => i.expiryDate && i.expiryDate <= now);
    return {
      lowStockCount: lowStock.length,
      expiringCount: expiringSoon.length,
      expiredCount: expired.length,
      lowStock,
      expiringSoon,
      expired,
    };
  },
});

// ── Create stock item ───────────────────────────────────────────────────
export const create = mutation({
  args: {
    itemCode: v.string(),
    name: v.string(),
    serialNumber: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    pricePerItem: v.number(),
    includesTax: v.boolean(),
    taxType: v.string(),
    taxRate: v.number(),
    costPrice: v.number(),
    stockLevel: v.number(),
    reorderLevel: v.number(),
    expiryDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stockItems", {
      ...args,
      status: "active",
      updatedBy: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ── Update stock item ───────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("stockItems"),
    name: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    pricePerItem: v.optional(v.number()),
    includesTax: v.optional(v.boolean()),
    taxType: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    updatedBy: v.string(),
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

// ── Adjust stock level ──────────────────────────────────────────────────
export const adjust = mutation({
  args: {
    stockItemId: v.id("stockItems"),
    adjustmentType: v.string(),
    reason: v.string(),
    quantity: v.number(),
    notes: v.optional(v.string()),
    adjustedBy: v.string(),
    newExpiryDate: v.optional(v.number()), // override expiry when adding new batch
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.stockItemId);
    if (!item) throw new Error("Stock item not found");

    const previousLevel = item.stockLevel;
    const newLevel =
      args.adjustmentType === "increase"
        ? previousLevel + args.quantity
        : Math.max(0, previousLevel - args.quantity);

    const patchData: Record<string, unknown> = {
      stockLevel: newLevel,
      updatedBy: args.adjustedBy,
      updatedAt: Date.now(),
    };
    if (args.adjustmentType === "increase" && args.newExpiryDate !== undefined) {
      patchData.expiryDate = args.newExpiryDate;
    }

    await ctx.db.patch(args.stockItemId, patchData as any);

    await ctx.db.insert("stockAdjustments", {
      stockItemId: args.stockItemId,
      adjustmentType: args.adjustmentType,
      reason: args.reason,
      quantity: args.quantity,
      previousLevel,
      newLevel,
      notes: args.notes,
      adjustedBy: args.adjustedBy,
      adjustedAt: Date.now(),
      source: "manual",
    });
  },
});

// ── Archive stock item (soft delete) ────────────────────────────────────
export const archive = mutation({
  args: {
    id: v.id("stockItems"),
    archivedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Stock item not found");
    await ctx.db.patch(args.id, {
      isArchived: true,
      archivedBy: args.archivedBy,
      archivedAt: Date.now(),
    });
  },
});

// ── Restore archived stock item ─────────────────────────────────────────
export const restore = mutation({
  args: { id: v.id("stockItems") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isArchived: false,
      archivedBy: undefined,
      archivedAt: undefined,
    });
  },
});

// ── Add note to stock item ──────────────────────────────────────────────
export const addNote = mutation({
  args: {
    id: v.id("stockItems"),
    text: v.string(),
    author: v.string(),
  },
  handler: async (ctx, { id, text, author }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Stock item not found");
    const existing = item.stockNotes || [];
    await ctx.db.patch(id, {
      stockNotes: [...existing, { text, author, timestamp: Date.now() }],
    });
  },
});

// ── List adjustments for an item ────────────────────────────────────────
export const listAdjustments = query({
  args: { stockItemId: v.id("stockItems") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stockAdjustments")
      .withIndex("by_stockItemId", (q) => q.eq("stockItemId", args.stockItemId))
      .order("desc")
      .take(50);
  },
});
