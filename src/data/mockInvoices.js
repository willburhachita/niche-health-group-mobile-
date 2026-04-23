const now = Date.now();
const day = 86400000;

export const mockInvoices = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-001',
    patientId: 'pt-004',
    date: now,
    dueDate: now + 14 * day,
    lineItems: [
      { description: 'Dialysis Session', quantity: 1, unitPrice: 2000, total: 2000 },
      { description: 'Consultation Fee', quantity: 1, unitPrice: 500, total: 500 },
    ],
    subtotal: 2500,
    tax: 0,
    total: 2500,
    status: 'unpaid',
    payments: [],
    notes: 'Dialysis follow-up session and consultation.',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-002',
    patientId: 'pt-002',
    date: now - day,
    dueDate: now + 13 * day,
    lineItems: [
      { description: 'Initial Consultation', quantity: 1, unitPrice: 800, total: 800 },
      { description: 'Blood Panel (CBC + KFT)', quantity: 1, unitPrice: 1000, total: 1000 },
    ],
    subtotal: 1800,
    tax: 0,
    total: 1800,
    status: 'paid',
    payments: [{ date: now - day, amount: 1800, method: 'Mobile Money' }],
    notes: 'Paid in full via mobile money.',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-003',
    patientId: 'pt-006',
    date: now - 3 * day,
    dueDate: now - 1 * day,
    lineItems: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 500, total: 500 },
      { description: 'Iron Panel Test', quantity: 1, unitPrice: 700, total: 700 },
      { description: 'Full Blood Count', quantity: 1, unitPrice: 500, total: 500 },
      { description: 'Iron Infusion (IV)', quantity: 1, unitPrice: 1500, total: 1500 },
    ],
    subtotal: 3200,
    tax: 0,
    total: 3200,
    status: 'overdue',
    payments: [],
    notes: 'Invoice overdue. Patient requested payment plan.',
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-004',
    patientId: 'pt-003',
    date: now - 7 * day,
    dueDate: now + 7 * day,
    lineItems: [
      { description: 'Haemodialysis Session x3', quantity: 3, unitPrice: 1500, total: 4500 },
      { description: 'Erythropoietin Injection', quantity: 1, unitPrice: 450, total: 450 },
    ],
    subtotal: 4950,
    tax: 0,
    total: 4950,
    status: 'unpaid',
    payments: [],
    notes: 'Weekly dialysis sessions. Insurance claim submitted.',
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-005',
    patientId: 'pt-005',
    date: now - 7 * day,
    dueDate: now - 3 * day,
    lineItems: [
      { description: 'Post-Op Consultation', quantity: 1, unitPrice: 600, total: 600 },
      { description: 'Wound Dressing', quantity: 2, unitPrice: 150, total: 300 },
      { description: 'Medications', quantity: 1, unitPrice: 600, total: 600 },
    ],
    subtotal: 1500,
    tax: 0,
    total: 1500,
    status: 'paid',
    payments: [{ date: now - 5 * day, amount: 1500, method: 'Cash' }],
    notes: 'Self-pay patient. Paid cash.',
  },
  {
    id: 'inv-006',
    invoiceNumber: 'INV-006',
    patientId: 'pt-001',
    date: now - 14 * day,
    dueDate: now - 7 * day,
    lineItems: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 500, total: 500 },
      { description: 'HbA1c Test', quantity: 1, unitPrice: 600, total: 600 },
      { description: 'Prescription (3 months)', quantity: 1, unitPrice: 1000, total: 1000 },
    ],
    subtotal: 2100,
    tax: 0,
    total: 2100,
    status: 'paid',
    payments: [{ date: now - 12 * day, amount: 2100, method: 'Insurance' }],
    notes: 'Covered by NHIMA insurance.',
  },
];

export function getInvoiceById(id) {
  return mockInvoices.find(inv => inv.id === id);
}

export function getInvoicesByPatient(patientId) {
  return mockInvoices
    .filter(inv => inv.patientId === patientId)
    .sort((a, b) => b.date - a.date);
}

export function getInvoicesByStatus(status) {
  return mockInvoices.filter(inv => inv.status === status);
}

export function getTotalOutstanding() {
  return mockInvoices
    .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);
}

export function getOverdueInvoices() {
  return mockInvoices.filter(inv => inv.status === 'overdue');
}

export function formatCurrency(amount) {
  return `K ${amount.toLocaleString()}`;
}
