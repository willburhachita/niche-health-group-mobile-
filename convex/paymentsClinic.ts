import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all payments ───────────────────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("payments")
      .order("desc")
      .take(200);
  },
});

// ── List payments for an invoice ────────────────────────────────────────
export const listByInvoice = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .take(50);
  },
});

// ── List payments for a patient ─────────────────────────────────────────
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(100);
  },
});

// ── Payment summary ─────────────────────────────────────────────────────
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("payments").take(500);
    const completed = all.filter((p) => p.status === "completed");
    const pending = all.filter((p) => p.status === "pending");
    return {
      totalReceived: completed.reduce((s, p) => s + p.amount, 0),
      totalPending: pending.reduce((s, p) => s + p.amount, 0),
      completedCount: completed.length,
      pendingCount: pending.length,
    };
  },
});

// ── Record a payment ────────────────────────────────────────────────────
export const create = mutation({
  args: {
    invoiceId: v.id("invoices"),
    patientId: v.id("patients"),
    amount: v.number(),
    method: v.string(),
    referenceNumber: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    recordedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("payments", {
      ...args,
      paymentDate: Date.now(),
      createdAt: Date.now(),
    });

    // Update invoice status based on total paid
    const invoice = await ctx.db.get(args.invoiceId);
    if (invoice && args.status === "completed") {
      const allPayments = await ctx.db
        .query("payments")
        .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
        .take(50);
      const totalPaid = allPayments
        .filter((p) => p.status === "completed")
        .reduce((s, p) => s + p.amount, 0) + args.amount;

      if (totalPaid >= invoice.total) {
        await ctx.db.patch(args.invoiceId, { status: "paid" });
      } else {
        await ctx.db.patch(args.invoiceId, { status: "partial" });
      }
    }

    return paymentId;
  },
});
