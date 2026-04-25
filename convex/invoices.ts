import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all invoices ───────────────────────────────────────────────────
export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("invoices")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(200);
    }
    return await ctx.db.query("invoices").order("desc").take(200);
  },
});

// ── List invoices for a patient ─────────────────────────────────────────
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(100);
  },
});

// ── Get invoice with line items ─────────────────────────────────────────
export const get = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) return null;
    const lineItems = await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.id))
      .take(50);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.id))
      .take(50);
    return { ...invoice, lineItems, payments };
  },
});

// ── Outstanding total ───────────────────────────────────────────────────
export const outstandingTotal = query({
  args: {},
  handler: async (ctx) => {
    const unpaid = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "unpaid"))
      .take(200);
    const overdue = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "overdue"))
      .take(200);
    const partial = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "partial"))
      .take(200);
    const all = [...unpaid, ...overdue, ...partial];
    return all.reduce((sum, inv) => sum + inv.total, 0);
  },
});

// ── Get next invoice number ─────────────────────────────────────────────
export const getNextNumber = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("invoices").order("desc").take(1);
    if (invoices.length === 0) return "INV-001";
    const lastNum = invoices[0].invoiceNumber;
    const num = parseInt(lastNum.replace("INV-", ""), 10) || 0;
    return `INV-${String(num + 1).padStart(3, "0")}`;
  },
});

// ── Create invoice with line items + auto stock deduction ──────────────
export const create = mutation({
  args: {
    invoiceNumber: v.string(),
    patientId: v.id("patients"),
    appointmentId: v.optional(v.id("appointments")),
    dueDate: v.number(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        stockItemId: v.optional(v.id("stockItems")),
      })
    ),
    tax: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const subtotal = args.lineItems.reduce(
      (s, item) => s + item.quantity * item.unitPrice,
      0
    );
    const total = subtotal + args.tax;

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber: args.invoiceNumber,
      patientId: args.patientId,
      appointmentId: args.appointmentId,
      date: Date.now(),
      dueDate: args.dueDate,
      subtotal,
      tax: args.tax,
      total,
      status: "unpaid",
      notes: args.notes,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    // Insert line items and auto-deduct stock
    for (const item of args.lineItems) {
      await ctx.db.insert("invoiceLineItems", {
        invoiceId,
        stockItemId: item.stockItemId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      });

      // Auto-deduct from stock if linked to a stock item
      if (item.stockItemId) {
        const stockItem = await ctx.db.get(item.stockItemId);
        if (stockItem) {
          const previousLevel = stockItem.stockLevel;
          const newLevel = Math.max(0, previousLevel - item.quantity);
          await ctx.db.patch(item.stockItemId, {
            stockLevel: newLevel,
            updatedBy: args.createdBy,
            updatedAt: Date.now(),
          });
          // Record stock adjustment
          await ctx.db.insert("stockAdjustments", {
            stockItemId: item.stockItemId,
            adjustmentType: "decrease",
            reason: "used",
            quantity: item.quantity,
            previousLevel,
            newLevel,
            notes: `Auto-deducted for invoice ${args.invoiceNumber}`,
            adjustedBy: args.createdBy,
            adjustedAt: Date.now(),
          });
        }
      }
    }

    return invoiceId;
  },
});

// ── Update invoice status ───────────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ── Mark invoice as paid (irreversible) ─────────────────────────────────
export const markAsPaid = mutation({
  args: {
    id: v.id("invoices"),
    markedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("Invoice is already marked as paid");
    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
      paidBy: args.markedBy,
    } as any);
    return { success: true };
  },
});
