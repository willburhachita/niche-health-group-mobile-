import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { enforcePermission } from "./utils/permissions";

// ── List all invoices ───────────────────────────────────────────────────
export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const results = args.status
      ? await ctx.db
          .query("invoices")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .take(200)
      : await ctx.db.query("invoices").order("desc").take(200);

    const activeInvoices = results.filter((inv) => !inv.isArchived);

    const invoicesWithAppointments = [];
    for (const inv of activeInvoices) {
      const appointment = inv.appointmentId ? await ctx.db.get(inv.appointmentId) : null;
      invoicesWithAppointments.push({
        ...inv,
        appointment,
      });
    }
    return invoicesWithAppointments;
  },
});

// ── List invoices for a patient ─────────────────────────────────────────
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("invoices")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(100);
    
    const activeInvoices = results.filter((inv) => !inv.isArchived);

    const invoicesWithAppointments = [];
    for (const inv of activeInvoices) {
      const appointment = inv.appointmentId ? await ctx.db.get(inv.appointmentId) : null;
      invoicesWithAppointments.push({
        ...inv,
        appointment,
      });
    }
    return invoicesWithAppointments;
  },
});

// ── List invoices for an appointment ───────────────────────────────────────
export const listByAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .take(10);
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
    const appointment = invoice.appointmentId ? await ctx.db.get(invoice.appointmentId) : null;
    
    // Resolve attachment signed URLs
    const attachments = [];
    if (invoice.attachments) {
      for (const att of invoice.attachments) {
        const url = await ctx.storage.getUrl(att.storageId);
        attachments.push({ ...att, url });
      }
    }
    
    return { ...invoice, lineItems, payments, appointment, attachments };
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

// Shared helper function to deduct stock items and log adjustments for a given invoice
async function deductStockForInvoice(
  ctx: any,
  invoiceId: any,
  invoiceNumber: string,
  adjustedBy: string
) {
  const lineItems = await ctx.db
    .query("invoiceLineItems")
    .withIndex("by_invoiceId", (q: any) => q.eq("invoiceId", invoiceId))
    .collect();

  for (const item of lineItems) {
    if (item.stockItemId) {
      const stockItem = await ctx.db.get(item.stockItemId);
      if (stockItem) {
        const previousLevel = stockItem.stockLevel;
        const newLevel = Math.max(0, previousLevel - item.quantity);
        await ctx.db.patch(item.stockItemId, {
          stockLevel: newLevel,
          updatedBy: adjustedBy,
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
          notes: `Auto-deducted for invoice ${invoiceNumber}`,
          adjustedBy,
          adjustedAt: Date.now(),
          source: "invoice",
          invoiceId,
          invoiceNumber,
        });
      }
    }
  }
}

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
    status: v.optional(v.string()),
    createdBy: v.string(),
    businessName: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          fileType: v.string(),
          size: v.number(),
          storageId: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.createdBy, "createInvoice");
    const subtotal = args.lineItems.reduce(
      (s, item) => s + (item.stockItemId ? 0 : item.quantity * item.unitPrice),
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
      status: args.status || "unpaid",
      notes: args.notes,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      businessName: args.businessName,
      attachments: args.attachments,
    });

    const isDraft = (args.status || "unpaid") === "draft";

    // Insert line items
    for (const item of args.lineItems) {
      await ctx.db.insert("invoiceLineItems", {
        invoiceId,
        stockItemId: item.stockItemId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.stockItemId ? 0 : item.quantity * item.unitPrice,
      });
    }

    // Auto-deduct from stock if not draft
    if (!isDraft) {
      await deductStockForInvoice(ctx, invoiceId, args.invoiceNumber, args.createdBy);
    }

    return invoiceId;
  },
});

// ── Update invoice (admin only) ─────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("invoices"),
    callerRole: v.string(),
    dueDate: v.optional(v.number()),
    tax: v.optional(v.number()),
    notes: v.optional(v.string()),
    appointmentId: v.optional(v.union(v.id("appointments"), v.null())),
    businessName: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          fileType: v.string(),
          size: v.number(),
          storageId: v.string(),
        })
      )
    ),
    lineItems: v.optional(
      v.array(
        v.object({
          description: v.string(),
          quantity: v.number(),
          unitPrice: v.number(),
          stockItemId: v.optional(v.id("stockItems")),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.updatedBy, "editInvoice");
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");

    const updates: Record<string, unknown> = {};
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.appointmentId !== undefined) {
      updates.appointmentId = args.appointmentId ?? undefined;
    }
    if (args.businessName !== undefined) updates.businessName = args.businessName;
    if (args.attachments !== undefined) updates.attachments = args.attachments;

    // Recalculate totals if line items changed
    if (args.lineItems !== undefined) {
      // Get existing line items
      const existing = await ctx.db
        .query("invoiceLineItems")
        .withIndex("by_invoiceId", (q: any) => q.eq("invoiceId", args.id))
        .collect();

      // Reconcile stock levels if invoice is not draft
      if (invoice.status !== "draft") {
        const oldStock = new Map<string, number>();
        for (const item of existing) {
          if (item.stockItemId) {
            oldStock.set(item.stockItemId, (oldStock.get(item.stockItemId) || 0) + item.quantity);
          }
        }

        const newStock = new Map<string, number>();
        for (const item of args.lineItems) {
          if (item.stockItemId) {
            newStock.set(item.stockItemId, (newStock.get(item.stockItemId) || 0) + item.quantity);
          }
        }

        const allStockIds = new Set<string>([...oldStock.keys(), ...newStock.keys()]);
        for (const sId of allStockIds) {
          const oldQty = oldStock.get(sId) || 0;
          const newQty = newStock.get(sId) || 0;
          const diff = newQty - oldQty; // positive means we used more, negative means we used less (returned)

          if (diff !== 0) {
            const stockItem = await ctx.db.get(sId as Id<"stockItems">);
            if (stockItem) {
              const previousLevel = stockItem.stockLevel;
              const newLevel = Math.max(0, previousLevel - diff);
              const adjustedBy = args.updatedBy || invoice.createdBy || "admin";

              await ctx.db.patch(sId as Id<"stockItems">, {
                stockLevel: newLevel,
                updatedBy: adjustedBy,
                updatedAt: Date.now(),
              });

              // Log stock adjustment
              await ctx.db.insert("stockAdjustments", {
                stockItemId: sId as Id<"stockItems">,
                adjustmentType: diff > 0 ? "decrease" : "increase",
                reason: "invoice_updated",
                quantity: Math.abs(diff),
                previousLevel,
                newLevel,
                notes: `Adjusted due to update of invoice ${invoice.invoiceNumber}`,
                adjustedBy,
                adjustedAt: Date.now(),
                source: "invoice",
                invoiceId: args.id,
                invoiceNumber: invoice.invoiceNumber,
              });
            }
          }
        }
      }

      // Delete existing line items
      for (const item of existing) {
        await ctx.db.delete(item._id);
      }
      
      // Insert new line items
      let subtotal = 0;
      for (const item of args.lineItems) {
        const total = item.stockItemId ? 0 : item.quantity * item.unitPrice;
        subtotal += total;
        await ctx.db.insert("invoiceLineItems", {
          invoiceId: args.id,
          stockItemId: item.stockItemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total,
        });
      }
      updates.subtotal = subtotal;
      const tax = args.tax ?? invoice.tax;
      updates.tax = tax;
      updates.total = subtotal + tax;
    } else if (args.tax !== undefined) {
      updates.tax = args.tax;
      updates.total = invoice.subtotal + args.tax;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }
  },
});

// ── Update invoice status ───────────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.string(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.updatedBy || "admin", "editInvoice");
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");

    const oldStatus = invoice.status;
    const newStatus = args.status;

    // Transition from draft to unpaid/paid/etc triggers stock deduction
    if (oldStatus === "draft" && newStatus !== "draft") {
      await deductStockForInvoice(
        ctx,
        args.id,
        invoice.invoiceNumber,
        invoice.createdBy || "system"
      );
    }

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
    await enforcePermission(ctx.db, args.markedBy, "recordPayment");
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("Invoice is already marked as paid");

    // If transitioning directly from draft to paid, deduct stock
    if (invoice.status === "draft") {
      await deductStockForInvoice(
        ctx,
        args.id,
        invoice.invoiceNumber,
        args.markedBy
      );
    }

    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
      paidBy: args.markedBy,
    });
    return { success: true };
  },
});

// ── Archive invoice (soft delete) ───────────────────────────────────────
export const archive = mutation({
  args: {
    id: v.id("invoices"),
    archivedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.archivedBy, "archiveInvoice");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");
    
    // Soft-delete the invoice
    await ctx.db.patch(args.id, {
      isArchived: true,
      archivedBy: args.archivedBy,
      archivedAt: Date.now(),
    });

    // If the invoice is NOT in draft status, it has already deducted stock.
    // We must automatically return the stock quantities to keep inventory accurate!
    if (existing.status !== "draft") {
      const lineItems = await ctx.db
        .query("invoiceLineItems")
        .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.id))
        .collect();

      for (const item of lineItems) {
        if (item.stockItemId) {
          const stockItem = await ctx.db.get(item.stockItemId);
          if (stockItem) {
            const previousLevel = stockItem.stockLevel;
            const newLevel = previousLevel + item.quantity;
            await ctx.db.patch(item.stockItemId, {
              stockLevel: newLevel,
              updatedBy: args.archivedBy,
              updatedAt: Date.now(),
            });
            // Record stock adjustment of type increase (stock returned)
            await ctx.db.insert("stockAdjustments", {
              stockItemId: item.stockItemId,
              adjustmentType: "increase",
              reason: "invoice_archived",
              quantity: item.quantity,
              previousLevel,
              newLevel,
              notes: `Returned stock because invoice ${existing.invoiceNumber} was archived`,
              adjustedBy: args.archivedBy,
              adjustedAt: Date.now(),
              source: "void",
              invoiceId: args.id,
              invoiceNumber: existing.invoiceNumber,
            });
          }
        }
      }
    }
  },
});

// ── Restore archived invoice ────────────────────────────────────────────
export const restore = mutation({
  args: { 
    id: v.id("invoices"),
    restoredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.restoredBy, "archiveInvoice");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");

    await ctx.db.patch(args.id, {
      isArchived: false,
      archivedBy: undefined,
      archivedAt: undefined,
    });

    // Re-deduct from stock if invoice is restored and status is not draft
    if (existing.status !== "draft") {
      await deductStockForInvoice(
        ctx,
        args.id,
        existing.invoiceNumber,
        args.restoredBy || "admin"
      );
    }
  },
});

// ── Submit NHIMA Claim ──────────────────────────────────────────────────
export const submitNhimaClaim = mutation({
  args: {
    id: v.id("invoices"),
    claimNumber: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, { id, claimNumber, adminEmail }) => {
    await enforcePermission(ctx.db, adminEmail, "recordPayment");
    const invoice = await ctx.db.get(id);
    if (!invoice) throw new Error("Invoice not found");

    await ctx.db.patch(id, {
      nhimaClaimNumber: claimNumber,
      nhimaStatus: "submitted",
      submitToNhimaAt: Date.now(),
    });

    await ctx.db.insert("activityLogs", {
      action: "NHIMA Claim Submitted",
      category: "invoice",
      performedBy: adminEmail,
      target: invoice.invoiceNumber,
      details: `NHIMA Claim #${claimNumber} submitted for Invoice ${invoice.invoiceNumber}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// ── Update NHIMA Claim Status ───────────────────────────────────────────
export const updateNhimaClaimStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.string(), // "approved" | "rejected" | "pending"
    adminEmail: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, adminEmail, notes }) => {
    await enforcePermission(ctx.db, adminEmail, "recordPayment");
    const invoice = await ctx.db.get(id);
    if (!invoice) throw new Error("Invoice not found");

    const patchData: Record<string, any> = { nhimaStatus: status };
    if (status === "approved") {
      // If approved, we can also auto-transition or record paid amount, but for now we just change claim status
    }

    await ctx.db.patch(id, patchData);

    await ctx.db.insert("activityLogs", {
      action: `NHIMA Claim ${status.toUpperCase()}`,
      category: "invoice",
      performedBy: adminEmail,
      target: invoice.invoiceNumber,
      details: `NHIMA Claim status updated to ${status} for Invoice ${invoice.invoiceNumber}. Notes: ${notes || 'none'}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
