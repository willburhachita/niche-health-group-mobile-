import { query } from "./_generated/server";

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const patients = await ctx.db.query("patients").collect();
    const invoices = await ctx.db.query("invoices").collect();
    const expenses = await ctx.db.query("expenses").collect();
    const stockItems = await ctx.db.query("stockItems").collect();
    const suppliers = await ctx.db.query("suppliers").collect();

    const archivedPatients = patients.filter(p => p.isArchived).map(p => ({ ...p, _type: "patient" }));
    const archivedInvoices = invoices.filter(i => i.isArchived).map(i => ({ ...i, _type: "invoice" }));
    const archivedExpenses = expenses.filter(e => e.isArchived).map(e => ({ ...e, _type: "expense" }));
    const archivedStock = stockItems.filter(s => s.isArchived).map(s => ({ ...s, _type: "stock" }));
    const archivedSuppliers = suppliers.filter(s => s.isArchived).map(s => ({ ...s, _type: "supplier" }));

    return {
      patients: archivedPatients,
      invoices: archivedInvoices,
      expenses: archivedExpenses,
      stock: archivedStock,
      suppliers: archivedSuppliers,
    };
  }
});

export const listArchivedPatients = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("patients").collect();
    return items.filter(i => i.isArchived);
  }
});

export const listArchivedInvoices = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("invoices").collect();
    return items.filter(i => i.isArchived);
  }
});

export const listArchivedExpenses = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("expenses").collect();
    return items.filter(i => i.isArchived);
  }
});

export const listArchivedStock = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("stockItems").collect();
    return items.filter(i => i.isArchived);
  }
});

export const listArchivedSuppliers = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("suppliers").collect();
    return items.filter(i => i.isArchived);
  }
});
