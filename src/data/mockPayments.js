const now = Date.now();
const day = 86400000;

export const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: 'dollar-sign' },
  { key: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
  { key: 'card', label: 'Card', icon: 'credit-card' },
  { key: 'insurance_nhima', label: 'Insurance (NHIMA)', icon: 'shield' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'arrow-right' },
  { key: 'other', label: 'Other', icon: 'more-horizontal' },
];

export const mockPayments = [
  {
    id: 'pay-001',
    invoiceId: 'inv-002',
    patientId: 'pt-002',
    amount: 1800,
    method: 'mobile_money',
    referenceNumber: 'MM-20260411-001',
    status: 'completed',
    paymentDate: now - day,
    notes: 'Paid in full via mobile money.',
    recordedBy: 'user-001',
    createdAt: now - day,
  },
  {
    id: 'pay-002',
    invoiceId: 'inv-005',
    patientId: 'pt-005',
    amount: 1500,
    method: 'cash',
    referenceNumber: null,
    status: 'completed',
    paymentDate: now - 5 * day,
    notes: 'Self-pay patient. Cash received at reception.',
    recordedBy: 'user-005',
    createdAt: now - 5 * day,
  },
  {
    id: 'pay-003',
    invoiceId: 'inv-006',
    patientId: 'pt-001',
    amount: 2100,
    method: 'insurance_nhima',
    referenceNumber: 'NHIMA-CLM-88234-01',
    status: 'completed',
    paymentDate: now - 12 * day,
    notes: 'Covered by NHIMA insurance.',
    recordedBy: 'user-005',
    createdAt: now - 12 * day,
  },
  {
    id: 'pay-004',
    invoiceId: 'inv-001',
    patientId: 'pt-004',
    amount: 1000,
    method: 'mobile_money',
    referenceNumber: 'MM-20260413-005',
    status: 'completed',
    paymentDate: now,
    notes: 'Partial payment. K1,500 outstanding.',
    recordedBy: 'user-001',
    createdAt: now,
  },
  {
    id: 'pay-005',
    invoiceId: 'inv-004',
    patientId: 'pt-003',
    amount: 4950,
    method: 'insurance_nhima',
    referenceNumber: 'NHIMA-CLM-55102-03',
    status: 'pending',
    paymentDate: now - 2 * day,
    notes: 'Insurance claim submitted. Awaiting approval.',
    recordedBy: 'user-005',
    createdAt: now - 2 * day,
  },
];

export function getPaymentsForInvoice(invoiceId) {
  return mockPayments.filter(p => p.invoiceId === invoiceId).sort((a, b) => b.paymentDate - a.paymentDate);
}

export function getPaymentsForPatient(patientId) {
  return mockPayments.filter(p => p.patientId === patientId).sort((a, b) => b.paymentDate - a.paymentDate);
}

export function getPaymentsSummary() {
  const completed = mockPayments.filter(p => p.status === 'completed');
  const pending = mockPayments.filter(p => p.status === 'pending');
  return {
    totalReceived: completed.reduce((s, p) => s + p.amount, 0),
    totalPending: pending.reduce((s, p) => s + p.amount, 0),
    completedCount: completed.length,
    pendingCount: pending.length,
  };
}

export function getMethodLabel(key) {
  return PAYMENT_METHODS.find(m => m.key === key)?.label || key;
}

export function getMethodIcon(key) {
  return PAYMENT_METHODS.find(m => m.key === key)?.icon || 'dollar-sign';
}
