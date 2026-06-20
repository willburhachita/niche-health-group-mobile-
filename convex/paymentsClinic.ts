import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { enforcePermission } from "./utils/permissions";

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
// Captures method + amount + reference, updates invoice paidAmount and status.
// `recordPayment` is the canonical name. `create` is kept as an alias.
export const recordPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    patientId: v.id("patients"),
    amount: v.number(),
    method: v.string(),                 // "cash" | "mobile_money" | "card" | "insurance_nhima" | "bank_transfer" | "other"
    referenceNumber: v.optional(v.string()),
    status: v.optional(v.string()),     // defaults to "completed"
    notes: v.optional(v.string()),
    paymentDate: v.optional(v.number()),
    recordedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.recordedBy, "recordPayment");
    if (args.amount <= 0) throw new Error("Payment amount must be greater than zero");
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const status = args.status ?? "completed";
    const paymentId = await ctx.db.insert("payments", {
      invoiceId: args.invoiceId,
      patientId: args.patientId,
      amount: args.amount,
      method: args.method,
      referenceNumber: args.referenceNumber,
      status,
      notes: args.notes,
      paymentDate: args.paymentDate ?? Date.now(),
      recordedBy: args.recordedBy,
      createdAt: Date.now(),
    });

    // Update invoice paidAmount + status when payment is completed
    if (status === "completed") {
      const allPayments = await ctx.db
        .query("payments")
        .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
        .take(100);
      const totalPaid = allPayments
        .filter((p) => p.status === "completed")
        .reduce((s, p) => s + p.amount, 0);

      const patch: Record<string, unknown> = { paidAmount: totalPaid };
      if (totalPaid >= invoice.total) {
        patch.status = "paid";
        patch.paidAt = Date.now();
        patch.paidBy = args.recordedBy;
      } else if (totalPaid > 0) {
        patch.status = "partial";
      }
      await ctx.db.patch(args.invoiceId, patch);
    }

    return paymentId;
  },
});

// Backwards-compatible alias
export const create = recordPayment;

// ── Record a multi-allocation payment ───────────────────────────────────
export const recordMultiPayment = mutation({
  args: {
    patientId: v.id("patients"),
    paymentDate: v.number(),
    notes: v.optional(v.string()),
    recordedBy: v.string(),
    referenceNumber: v.optional(v.string()),
    sources: v.object({
      hicaps: v.number(),
      creditCard: v.number(),
      eftpos: v.number(),
      nhimaInsurance: v.number(),
      otherInsurance: v.number(),
      bankTransfer: v.number(),
      mobileMoney: v.number(),
      other: v.number(),
    }),
    allocations: v.array(
      v.object({
        invoiceId: v.id("invoices"),
        amount: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.recordedBy, "recordPayment");
    const totalPaymentAmount = 
      args.sources.hicaps + 
      args.sources.creditCard + 
      args.sources.eftpos + 
      args.sources.nhimaInsurance + 
      args.sources.otherInsurance + 
      args.sources.bankTransfer + 
      args.sources.mobileMoney + 
      args.sources.other;

    if (totalPaymentAmount <= 0) {
      throw new Error("Total payment amount must be greater than zero");
    }

    const totalApplied = args.allocations.reduce((s, a) => s + a.amount, 0);
    if (totalApplied > totalPaymentAmount) {
      throw new Error("Allocated amount cannot exceed total payment amount");
    }

    // Resolve methods string
    const activeSources = [];
    if (args.sources.hicaps > 0) activeSources.push("HICAPS");
    if (args.sources.creditCard > 0) activeSources.push("Credit Card");
    if (args.sources.eftpos > 0) activeSources.push("EFTPOS");
    if (args.sources.nhimaInsurance > 0) activeSources.push("NHIMA Insurance");
    if (args.sources.otherInsurance > 0) activeSources.push("Other Insurance");
    if (args.sources.bankTransfer > 0) activeSources.push("Bank Transfer");
    if (args.sources.mobileMoney > 0) activeSources.push("Mobile Money");
    if (args.sources.other > 0) activeSources.push("Other");
    const method = activeSources.join(", ") || "Other";

    const paymentIds: string[] = [];

    // Create payment records for each allocation and update invoice status
    for (const alloc of args.allocations) {
      if (alloc.amount <= 0) continue;

      const invoice = await ctx.db.get(alloc.invoiceId);
      if (!invoice) throw new Error(`Invoice ${alloc.invoiceId} not found`);

      const paymentId = await ctx.db.insert("payments", {
        invoiceId: alloc.invoiceId,
        patientId: args.patientId,
        amount: alloc.amount,
        method,
        referenceNumber: args.referenceNumber,
        status: "completed",
        notes: args.notes,
        paymentDate: args.paymentDate,
        recordedBy: args.recordedBy,
        createdAt: Date.now(),
      });
      paymentIds.push(paymentId);

      // Recalculate total paid for this invoice
      const allPayments = await ctx.db
        .query("payments")
        .withIndex("by_invoiceId", (q) => q.eq("invoiceId", alloc.invoiceId))
        .collect();
      const totalPaid = allPayments
        .filter((p) => p.status === "completed")
        .reduce((s, p) => s + p.amount, 0);

      const patch: Record<string, any> = { paidAmount: totalPaid };
      if (totalPaid >= invoice.total) {
        patch.status = "paid";
        patch.paidAt = Date.now();
        patch.paidBy = args.recordedBy;
      } else if (totalPaid > 0) {
        patch.status = "partial";
      } else {
        patch.status = "unpaid";
      }
      await ctx.db.patch(alloc.invoiceId, patch);
    }

    return paymentIds;
  },
});
