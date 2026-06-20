import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Plus, FileText, DollarSign, Search, Printer, Edit2, Archive, Receipt, Package, Calendar, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Badge, EmptyState, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';

const statusColor: Record<string, 'gray' | 'amber' | 'green' | 'red' | 'blue'> = {
  draft: 'gray', unpaid: 'amber', paid: 'green', overdue: 'red', partial: 'blue', cancelled: 'gray',
};
const statusOptions = ['all', 'unpaid', 'paid', 'overdue', 'partial', 'draft'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

interface LineItem {
  type?: 'service' | 'stock' | 'custom';
  description: string;
  quantity: number;
  unitPrice: number;
  stockItemId?: string;
}

export default function InvoicesScreen() {
  const { account, hasPermission } = useAuth();
  const location = useLocation();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState('0');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ type: 'custom', description: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const activeInvoices = useQuery(api.invoices.list, filter !== 'all' ? { status: filter } : {});
  const archivedInvoices = useQuery(api.archive.listArchivedInvoices, {});
  const invoices = showArchived ? (archivedInvoices || []) : activeInvoices;

  // Pre-select invoice from location state (redirected from appointments scheduler)
  useEffect(() => {
    const routeSelectedId = location.state?.selectedInvoiceId;
    if (routeSelectedId && invoices) {
      const inv = invoices.find((i: any) => i._id === routeSelectedId);
      if (inv) {
        setSelected(inv);
        // Clean up location state to prevent sticky selection on subsequent navigations
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state?.selectedInvoiceId, invoices]);
  const invoiceDetail = useQuery(api.invoices.get, selected ? { id: selected._id } : 'skip');
  const patients = useQuery(api.patients.list, {});
  const nextNumber = useQuery(api.invoices.getNextNumber, {});
  const stockItems = useQuery(api.stock.list, {});
  const serviceTypes = useQuery(api.serviceTypes.listActive);
  const clinicConfig = useQuery(api.clinicConfig.getAll, {});

  const patientAppointments = useQuery(api.appointments.listByPatient, patientId ? { patientId: patientId as any } : 'skip');
  const editPatientAppointments = useQuery(api.appointments.listByPatient, invoiceDetail?.patientId ? { patientId: invoiceDetail.patientId as any } : 'skip');

  const createInvoice = useMutation(api.invoices.create);
  const updateInvoice = useMutation(api.invoices.update);
  const markPaid = useMutation(api.invoices.markAsPaid);
  const recordPayment = useMutation(api.paymentsClinic.recordPayment);
  const archiveInvoice = useMutation(api.invoices.archive);
  const restoreInvoice = useMutation(api.invoices.restore);
  const updateStatus = useMutation(api.invoices.updateStatus);

  const isAdmin = account?.role === 'admin';

  // NHIMA flag on create
  const [submitToNhima, setSubmitToNhima] = useState(false);

  // Record Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('mobile_money');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState('');

  // Cashless form sub-field states
  const [payMno, setPayMno] = useState('MTN');
  const [payCardNetwork, setPayCardNetwork] = useState('Visa');
  const [payCardLast4, setPayCardLast4] = useState('');
  const [payBankName, setPayBankName] = useState('Zanaco');
  const [payPolicyNumber, setPayPolicyNumber] = useState('');

  const paidSoFar = (invoiceDetail?.payments || [])
    .filter((p: any) => p.status === 'completed')
    .reduce((s: number, p: any) => s + p.amount, 0);
  const balanceDue = invoiceDetail ? Math.max(0, (invoiceDetail.total || 0) - paidSoFar) : 0;

  const openPaymentModal = () => {
    setPayAmount(balanceDue ? String(balanceDue) : '');
    setPayMethod('mobile_money');
    setPayReference('');
    setPayNotes('');
    setPayError('');
    setPayMno('MTN');
    setPayCardNetwork('Visa');
    setPayCardLast4('');
    setPayBankName('Zanaco');
    setPayPolicyNumber('');
    setShowPayment(true);
  };

  const handleRecordPayment = async () => {
    if (!invoiceDetail) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setPayError('Enter an amount greater than zero'); return; }
    if (amount > balanceDue + 0.001) { setPayError(`Amount exceeds balance due (K ${balanceDue.toLocaleString()})`); return; }
    
    // Custom cashless forms validations
    if (payMethod === 'mobile_money' && !payReference.trim()) { setPayError('Mobile Money Transaction Reference/ID is required'); return; }
    if (payMethod === 'card' && (!payReference.trim() || !payCardLast4.trim())) { setPayError('Card transaction reference and card last 4 digits are required'); return; }
    if (payMethod === 'bank_transfer' && !payReference.trim()) { setPayError('Bank transfer transaction reference is required'); return; }
    if ((payMethod === 'insurance_nhima' || payMethod === 'other') && (!payPolicyNumber.trim() || !payReference.trim())) { setPayError('Policy/Member Number and Claim Reference are required'); return; }

    setPayError('');
    setPaySaving(true);
    try {
      let finalReference = payReference.trim();
      let finalNotes = payNotes.trim();

      if (payMethod === 'mobile_money') {
        finalNotes = `[MNO: ${payMno}] ${finalNotes}`.trim();
      } else if (payMethod === 'card') {
        finalNotes = `[Card: ${payCardNetwork} (last 4: ${payCardLast4})] ${finalNotes}`.trim();
      } else if (payMethod === 'bank_transfer') {
        finalNotes = `[Bank: ${payBankName}] ${finalNotes}`.trim();
      } else if (payMethod === 'insurance_nhima') {
        finalReference = payPolicyNumber.trim();
        finalNotes = `[NHIMA Claim No: ${payReference}] ${finalNotes}`.trim();
      } else if (payMethod === 'other') {
        finalReference = payPolicyNumber.trim();
        finalNotes = `[Insurance Claim No: ${payReference}] ${finalNotes}`.trim();
      }

      await recordPayment({
        invoiceId: invoiceDetail._id,
        patientId: invoiceDetail.patientId,
        amount,
        method: payMethod,
        referenceNumber: finalReference || undefined,
        notes: finalNotes || undefined,
        recordedBy: account?.email || 'admin',
      });
      setShowPayment(false);
    } catch (e: any) {
      setPayError(e?.message || 'Failed to record payment');
    } finally { setPaySaving(false); }
  };

  const handleArchiveInvoice = async () => {
    if (!invoiceDetail) return;
    if (!isAdmin) { alert('Only admins can archive invoices.'); return; }
    if (!confirm('Archive this invoice? Archived invoices are hidden but kept for audit.')) return;
    await archiveInvoice({ id: invoiceDetail._id, archivedBy: account?.email || 'admin' });
    setSelected(null);
  };

  // Edit invoice state
  const [showEdit, setShowEdit] = useState(false);
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTax, setEditTax] = useState('0');
  const [editLines, setEditLines] = useState<LineItem[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editAppointmentId, setEditAppointmentId] = useState('');

  const openEditModal = () => {
    if (!invoiceDetail) return;
    setEditDueDate(invoiceDetail.dueDate ? format(new Date(invoiceDetail.dueDate), 'yyyy-MM-dd') : '');
    setEditNotes(invoiceDetail.notes || '');
    setEditTax(String(invoiceDetail.tax || 0));
    setEditAppointmentId(invoiceDetail.appointmentId || '');
    setEditLines((invoiceDetail.lineItems || []).map((l: any) => {
      let type: 'service' | 'stock' | 'custom' = 'custom';
      if (l.stockItemId) type = 'stock';
      else if ((serviceTypes || []).some((s: any) => s.name === l.description)) type = 'service';
      return {
        type,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        stockItemId: l.stockItemId,
      };
    }));
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    if (!invoiceDetail) return;
    setEditSaving(true);
    try {
      await updateInvoice({
        id: invoiceDetail._id,
        callerRole: account?.role || 'member',
        dueDate: new Date(editDueDate).getTime(),
        tax: parseFloat(editTax || '0'),
        notes: editNotes || undefined,
        appointmentId: editAppointmentId ? editAppointmentId as any : null,
        updatedBy: account?.email || 'admin',
        lineItems: editLines.map(l => ({ 
          description: l.description, 
          quantity: l.quantity, 
          unitPrice: l.unitPrice,
          stockItemId: (l.stockItemId || undefined) as any
        })),
      });
      setShowEdit(false);
    } catch (e: any) {
      alert(e.message || 'Failed to update invoice');
    } finally { setEditSaving(false); }
  };

  const editSubtotal = editLines.reduce((s, i) => s + (i.stockItemId ? 0 : i.quantity * i.unitPrice), 0);
  const editTotal = editSubtotal + parseFloat(editTax || '0');
  const addEditLine = () => setEditLines(l => [...l, { type: 'custom', description: '', quantity: 1, unitPrice: 0 }]);
  const removeEditLine = (i: number) => setEditLines(l => l.filter((_, idx) => idx !== i));
  const setEditLine = (i: number, k: keyof LineItem, v: any) =>
    setEditLines(l => l.map((item, idx) => idx === i ? { ...item, [k]: (k === 'quantity' || k === 'unitPrice') ? (parseFloat(v) || 0) : v } : item));

  const patientOptions = (patients || []).map((p: any) => ({ value: p._id, label: p.displayName }));

  const filtered = (invoices || []).filter((i: any) =>
    !search || (i.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (patients?.find((p: any) => p._id === i.patientId)?.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  const addLine = () => setLineItems(l => [...l, { type: 'custom', description: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (i: number) => setLineItems(l => l.filter((_, idx) => idx !== i));
  const setLine = (i: number, k: keyof LineItem, v: any) =>
    setLineItems(l => l.map((item, idx) => idx === i ? { ...item, [k]: (k === 'quantity' || k === 'unitPrice') ? (parseFloat(v) || 0) : v } : item));

  const subtotal = lineItems.reduce((s, i) => s + (i.stockItemId ? 0 : i.quantity * i.unitPrice), 0);
  const total = subtotal + parseFloat(tax || '0');

  const handleCreate = async () => {
    if (!patientId || lineItems.some(l => !l.description)) return;
    setSaving(true);
    try {
      const noteSuffix = submitToNhima ? '\n[NHIMA submission requested]' : '';
      await createInvoice({
        invoiceNumber: nextNumber || 'INV-001',
        patientId: patientId as any,
        appointmentId: appointmentId ? appointmentId as any : undefined,
        dueDate: new Date(dueDate).getTime(),
        lineItems: lineItems.map(l => ({ 
          description: l.description, 
          quantity: l.quantity, 
          unitPrice: l.unitPrice,
          stockItemId: (l.stockItemId || undefined) as any
        })),
        tax: parseFloat(tax || '0'),
        notes: (notes + noteSuffix).trim() || undefined,
        createdBy: account?.email || 'admin',
      });
      setShowCreate(false);
      setLineItems([{ type: 'custom', description: '', quantity: 1, unitPrice: 0 }]);
      setPatientId(''); setAppointmentId(''); setNotes(''); setTax('0'); setSubmitToNhima(false);
    } finally { setSaving(false); }
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex h-full">
      {/* List pane */}
      <div className="w-80 flex flex-col border-r border-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Invoices</h3>
            {hasPermission('createInvoice') && (
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>New</Button>
            )}
          </div>
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
          <div className="grid grid-cols-2 gap-2">
            <Select options={statusOptions} value={filter} onChange={e => { setFilter(e.target.value); setShowArchived(false); }} />
            <button
              onClick={() => { setShowArchived(p => !p); setSelected(null); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${showArchived ? 'bg-navy text-white border-navy font-bold shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Archived ({archivedInvoices?.length || 0})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!invoices ? <div className="flex justify-center py-10"><Spinner /></div>
            : filtered.length === 0 ? <EmptyState icon={<FileText size={28} />} title="No invoices" action={<Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus size={14} />}>Create</Button>} />
              : filtered.map((inv: any) => {
                const patName = patients?.find((p: any) => p._id === inv.patientId)?.displayName || 'Unknown';
                return (
                  <button key={inv._id} onClick={() => setSelected(inv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selected?._id === inv._id ? 'bg-navy-50 border-l-2 border-l-navy' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 truncate">{patName}</p>
                      {inv.appointment ? (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {inv.appointment.type || 'Appointment'} · {format(new Date(inv.appointment.startTime), 'dd MMM yyyy')}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          Invoice · {format(new Date(inv.date), 'dd MMM yyyy')}
                        </p>
                      )}
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">K {(inv.total || 0).toLocaleString()}</p>
                    </div>
                    <Badge label={inv.status} color={statusColor[inv.status] || 'gray'} />
                  </button>
                );
              })}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 overflow-y-auto bg-surface scrollbar-thin">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center"><FileText size={40} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select an invoice</p></div>
          </div>
        ) : !invoiceDetail ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{invoiceDetail.invoiceNumber}</h2>
                <p className="text-sm text-gray-500">{patients?.find((p: any) => p._id === invoiceDetail.patientId)?.displayName}</p>
                <p className="text-xs text-gray-400">Due: {invoiceDetail.dueDate ? format(new Date(invoiceDetail.dueDate), 'dd MMM yyyy') : 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={invoiceDetail.status} color={statusColor[invoiceDetail.status] || 'gray'} />
                {hasPermission('editInvoice') && invoiceDetail.status !== 'paid' && (
                  <Button size="sm" variant="outline" icon={<Edit2 size={14} />} onClick={openEditModal}>Edit</Button>
                )}
                <Button size="sm" variant="outline" icon={<Printer size={14} />} onClick={handlePrint}>Print</Button>
                {hasPermission('recordPayment') && invoiceDetail.status !== 'paid' && (
                  <Button size="sm" variant="primary" icon={<Receipt size={14} />} onClick={openPaymentModal}>
                    Record Payment
                  </Button>
                )}
                {hasPermission('recordPayment') && invoiceDetail.status === 'draft' && (
                  <Button size="sm" variant="outline"
                    onClick={async () => { await updateStatus({ id: invoiceDetail._id, status: 'unpaid', updatedBy: account?.email || 'admin' }); setSelected((s: any) => ({ ...s, status: 'unpaid' })); }}>
                    Mark Unpaid
                  </Button>
                )}
                {hasPermission('recordPayment') && invoiceDetail.status !== 'paid' && (
                  <Button size="sm" variant="outline"
                    onClick={async () => { await markPaid({ id: invoiceDetail._id, markedBy: account?.email || 'admin' }); setSelected((s: any) => ({ ...s, status: 'paid' })); }}>
                    Mark Paid
                  </Button>
                )}
                {hasPermission('archiveInvoice') && invoiceDetail.isArchived ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    icon={<RefreshCw size={12} />} 
                    onClick={async () => {
                      if (confirm('Restore this archived invoice? This will restore files and re-deduct stock if not draft.')) {
                        await restoreInvoice({ id: invoiceDetail._id, restoredBy: account?.email || 'admin' });
                        setSelected(null);
                        alert('Invoice restored successfully!');
                      }
                    }}
                  >
                    Restore
                  </Button>
                ) : (
                  hasPermission('archiveInvoice') && !invoiceDetail.isArchived && (
                    <Button size="sm" variant="danger" icon={<Archive size={14} />} onClick={handleArchiveInvoice}>Archive</Button>
                  )
                )}
              </div>
            </div>

            {invoiceDetail.appointment && (
              <div className="bg-navy-50/50 border border-navy-100 rounded-xl p-3 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-navy shadow-sm">
                  <Calendar size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Associated Appointment</p>
                  <p className="text-sm font-medium text-gray-800">
                    {invoiceDetail.appointment.type || 'General Appointment'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(invoiceDetail.appointment.startTime), 'dd MMM yyyy HH:mm')} · <span className="capitalize">{invoiceDetail.appointment.status}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Line items */}
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Total</th>
                </tr></thead>
                <tbody>
                  {(invoiceDetail.lineItems || []).map((item: any, i: number) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-800">{item.description}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-600">K {item.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">
                        {item.stockItemId ? (
                          <span className="text-xs text-navy font-semibold px-2 py-0.5 bg-navy-50 rounded-full inline-block">Inclusive</span>
                        ) : (
                          `K ${item.total.toLocaleString()}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-gray-100 px-4 py-3 space-y-1 bg-gray-50">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>K {(invoiceDetail.subtotal || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>K {(invoiceDetail.tax || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>K {(invoiceDetail.total || 0).toLocaleString()}</span></div>
                {paidSoFar > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-700 pt-1 border-t border-gray-100 mt-1"><span>Paid so far</span><span>K {paidSoFar.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm font-semibold text-amber-700"><span>Balance due</span><span>K {balanceDue.toLocaleString()}</span></div>
                  </>
                )}
              </div>
            </Card>

            {(invoiceDetail.payments && invoiceDetail.payments.length > 0) && (
              <Card className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payments</p>
                <div className="space-y-1.5">
                  {invoiceDetail.payments.map((p: any) => (
                    <div key={p._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{format(new Date(p.paymentDate), 'dd MMM yyyy')} · <span className="capitalize">{p.method.replace(/_/g, ' ')}</span>{p.referenceNumber ? ` · Ref ${p.referenceNumber}` : ''}</span>
                      <span className="font-medium text-gray-800">K {p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {invoiceDetail.notes && <Card className="p-4"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700">{invoiceDetail.notes}</p></Card>}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={`New Invoice — ${nextNumber || ''}`} width="max-w-2xl"
        footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleCreate}>Create Invoice</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Patient *" options={patientOptions} placeholder="Select patient" value={patientId} onChange={e => { setPatientId(e.target.value); setAppointmentId(''); }} />
            <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          {patientId && (
            <Select
              label="Associated Appointment"
              options={(patientAppointments || []).map((appt: any) => ({
                value: appt._id,
                label: `${format(new Date(appt.startTime), 'dd MMM yyyy HH:mm')} - ${appt.type || 'Appointment'}`
              }))}
              placeholder="None / Not Associated"
              value={appointmentId}
              onChange={e => setAppointmentId(e.target.value)}
            />
          )}

          <div>
            {/* Quick add from service type or stock */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-navy/20 focus:border-navy"
              value="" onChange={e => {
                if (!e.target.value) return;
                const svc = (serviceTypes || []).find((s: any) => s._id === e.target.value);
                if (svc) {
                  const newLines: LineItem[] = [{ type: 'service', description: svc.name, quantity: 1, unitPrice: svc.fixedPrice }];
                  // Add stock items from service type
                  (svc.stockItems || []).forEach((si: any) => {
                    const item = (stockItems || []).find((s: any) => s._id === si.stockItemId);
                    if (item) newLines.push({ type: 'stock', description: `${item.name} (stock)`, quantity: si.quantity, unitPrice: item.pricePerItem, stockItemId: item._id });
                  });
                  setLineItems(prev => [...prev.filter(l => l.description), ...newLines]);
                }
                e.target.value = '';
              }}>
              <option value="">+ Add from Service Type...</option>
              {(serviceTypes || []).map((s: any) => <option key={s._id} value={s._id}>{s.name} — K{s.fixedPrice}</option>)}
            </select>
            <select
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-navy/20 focus:border-navy"
              value="" onChange={e => {
                if (!e.target.value) return;
                const item = (stockItems || []).find((s: any) => s._id === e.target.value);
                if (item) setLineItems(prev => [...prev.filter(l => l.description), { type: 'stock', description: `${item.name} (stock)`, quantity: 1, unitPrice: item.pricePerItem, stockItemId: item._id }]);
                e.target.value = '';
              }}>
              <option value=""><Package size={12} /> + Add from Stock...</option>
              {(stockItems || []).filter((s: any) => !s.isArchived && s.stockLevel > 0).map((s: any) => <option key={s._id} value={s._id}>{s.name} — K{s.pricePerItem} ({s.stockLevel} in stock)</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <button onClick={addLine} className="text-sm text-navy hover:underline">+ Add custom line</button>
            </div>
            <div className="space-y-2 border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                <span className="col-span-2">Type</span>
                <span className="col-span-5">Item / Service</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Unit Price</span>
                <span className="col-span-1" />
              </div>
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-1 items-center">
                  <select 
                    className="col-span-2 border border-gray-200 rounded px-1.5 py-1 text-sm focus:outline-none focus:border-navy"
                    value={item.type || 'custom'}
                    onChange={e => {
                      const newType = e.target.value as any;
                      setLineItems(l => l.map((li, idx) => {
                        if (idx !== i) return li;
                        return { 
                          ...li, 
                          type: newType, 
                          description: '', 
                          unitPrice: 0, 
                          stockItemId: undefined 
                        };
                      }));
                    }}
                  >
                    <option value="custom">Custom</option>
                    <option value="service">Service</option>
                    <option value="stock">Stock Item</option>
                  </select>

                  {item.type === 'stock' ? (
                    <select
                      className="col-span-5 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy"
                      value={item.stockItemId || ''}
                      onChange={e => {
                        const sId = e.target.value;
                        const match = (stockItems || []).find((s: any) => s._id === sId);
                        if (match) {
                          setLineItems(l => l.map((li, idx) => {
                            if (idx !== i) return li;
                            return { 
                              ...li, 
                              description: `${match.name} (stock)`, 
                              stockItemId: match._id, 
                              unitPrice: match.pricePerItem 
                            };
                          }));
                        }
                      }}
                    >
                      <option value="">Select stock item...</option>
                      {(stockItems || []).filter((s: any) => !s.isArchived).map((s: any) => (
                        <option key={s._id} value={s._id}>{s.name} (Stock: {s.stockLevel})</option>
                      ))}
                    </select>
                  ) : item.type === 'service' ? (
                    <select
                      className="col-span-5 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy"
                      value={(serviceTypes || []).find((s: any) => s.name === item.description)?._id || ''}
                      onChange={e => {
                        const sId = e.target.value;
                        const match = (serviceTypes || []).find((s: any) => s._id === sId);
                        if (match) {
                          const newStockLines: LineItem[] = [];
                          (match.stockItems || []).forEach((si: any) => {
                            const stockItem = (stockItems || []).find((s: any) => s._id === si.stockItemId);
                            if (stockItem) {
                              newStockLines.push({
                                type: 'stock',
                                description: `${stockItem.name} (stock)`,
                                quantity: si.quantity,
                                unitPrice: stockItem.pricePerItem,
                                stockItemId: stockItem._id
                              });
                            }
                          });
                          setLineItems(l => {
                            const updated = l.map((li, idx) => {
                              if (idx !== i) return li;
                              return { 
                                ...li, 
                                description: match.name, 
                                unitPrice: match.fixedPrice 
                              };
                            });
                            return [...updated, ...newStockLines];
                          });
                        }
                      }}
                    >
                      <option value="">Select service type...</option>
                      {(serviceTypes || []).map((s: any) => (
                        <option key={s._id} value={s._id}>{s.name} (K{s.fixedPrice})</option>
                      ))}
                    </select>
                  ) : (
                    <input className="col-span-5 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy" value={item.description} onChange={e => setLine(i, 'description', e.target.value)} placeholder="e.g. Consultation" />
                  )}

                  <input className="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-navy" type="number" value={item.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} min="1" />
                  
                  <input 
                    className="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-navy disabled:bg-gray-50 disabled:text-gray-400" 
                    type="number" 
                    value={item.unitPrice} 
                    onChange={e => setLine(i, 'unitPrice', e.target.value)} 
                    min="0" 
                    disabled={item.type === 'stock'} 
                  />
                  <button onClick={() => removeLine(i)} className="col-span-1 text-gray-300 hover:text-red-400 text-lg leading-none">&times;</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Input label="Tax (K)" type="number" value={tax} onChange={e => setTax(e.target.value)} className="w-32" />
            <div className="text-right">
              <p className="text-xs text-gray-400">Subtotal: K {subtotal.toLocaleString()}</p>
              <p className="text-base font-bold text-gray-900">Total: K {total.toLocaleString()}</p>
            </div>
          </div>

          <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />

          <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
            <input type="checkbox" checked={submitToNhima} onChange={(e) => setSubmitToNhima(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-navy focus:ring-navy/30" />
            Submit this invoice to NHIMA (national insurance)
          </label>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        title={`Record Payment — ${invoiceDetail?.invoiceNumber || ''}`}
        footer={<><Button variant="outline" onClick={() => setShowPayment(false)}>Cancel</Button><Button loading={paySaving} onClick={handleRecordPayment}>Record Payment</Button></>}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 font-semibold">
            Balance due: K {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>

          {/* Locked Patient and Staff Fields */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3.5">
            <Input 
              label="Patient Name (Locked)" 
              value={(() => {
                const activePatient = patients?.find((p: any) => p._id === invoiceDetail?.patientId);
                return activePatient ? `${activePatient.firstName} ${activePatient.lastName}` : 'Patient';
              })()} 
              disabled 
              className="bg-white border-gray-200" 
            />
            <Input 
              label="Recorded By (Locked)" 
              value={account?.fullName || account?.email || 'System'} 
              disabled 
              className="bg-white border-gray-200" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (K) *" type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
            <Select label="Payment Method *" value={payMethod} onChange={e => setPayMethod(e.target.value)} options={[
              { value: 'mobile_money', label: 'Mobile Money' },
              { value: 'card', label: 'Card Payment' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'insurance_nhima', label: 'NHIMA (National Insurance)' },
              { value: 'other', label: 'Other Insurance' },
            ]} />
          </div>

          {/* Custom forms coordinates depending on chosen payment method */}
          {payMethod === 'mobile_money' && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <Select label="Mobile Money Network *" value={payMno} onChange={e => setPayMno(e.target.value)} options={[
                { value: 'MTN', label: 'MTN Mobile Money' },
                { value: 'Airtel', label: 'Airtel Money' },
                { value: 'Zamtel', label: 'Zamtel Kwacha' },
              ]} />
              <Input label="Transaction Reference ID *" value={payReference} onChange={e => setPayReference(e.target.value)} placeholder="e.g. MM-12345678" />
            </div>
          )}

          {payMethod === 'card' && (
            <div className="grid grid-cols-3 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <Select label="Card Network *" value={payCardNetwork} onChange={e => setPayCardNetwork(e.target.value)} options={[
                { value: 'Visa', label: 'Visa Card' },
                { value: 'MasterCard', label: 'MasterCard' },
                { value: 'AMEX', label: 'American Express' },
              ]} />
              <Input label="Transaction Ref *" value={payReference} onChange={e => setPayReference(e.target.value)} placeholder="e.g. TX-98765" />
              <Input label="Last 4 Digits *" value={payCardLast4} onChange={e => setPayCardLast4(e.target.value)} maxLength={4} placeholder="e.g. 4321" />
            </div>
          )}

          {payMethod === 'bank_transfer' && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <Select label="Destination Bank *" value={payBankName} onChange={e => setPayBankName(e.target.value)} options={[
                { value: 'Zanaco', label: 'Zanaco Bank' },
                { value: 'Absa', label: 'Absa Bank' },
                { value: 'Stanbic', label: 'Stanbic Bank' },
                { value: 'FNB', label: 'FNB Zambia' },
                { value: 'Stanchart', label: 'Standard Chartered' },
              ]} />
              <Input label="Transfer / Cheque Ref *" value={payReference} onChange={e => setPayReference(e.target.value)} placeholder="e.g. FT-839203" />
            </div>
          )}

          {(payMethod === 'insurance_nhima' || payMethod === 'other') && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <Input label="Member Policy / ID Number *" value={payPolicyNumber} onChange={e => setPayPolicyNumber(e.target.value)} placeholder="e.g. NH-83920" />
              <Input label="Insurance Claim Reference *" value={payReference} onChange={e => setPayReference(e.target.value)} placeholder="e.g. CL-29302" />
            </div>
          )}

          <Textarea label="Notes" rows={2} value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Add any details or reconciliation comments..." />
          {payError && <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">{payError}</p>}
        </div>
      </Modal>

      {/* Edit Invoice Modal (admin only) */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit Invoice — ${invoiceDetail?.invoiceNumber || ''}`} width="max-w-2xl"
        footer={<><Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button><Button loading={editSaving} onClick={handleEditSave}>Save Changes</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date" type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
            <Input label="Tax (K)" type="number" value={editTax} onChange={e => setEditTax(e.target.value)} />
          </div>

          <Select
            label="Associated Appointment"
            options={(editPatientAppointments || []).map((appt: any) => ({
              value: appt._id,
              label: `${format(new Date(appt.startTime), 'dd MMM yyyy HH:mm')} - ${appt.type || 'Appointment'}`
            }))}
            placeholder="None / Not Associated"
            value={editAppointmentId}
            onChange={e => setEditAppointmentId(e.target.value)}
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <button onClick={addEditLine} className="text-sm text-navy hover:underline">+ Add line</button>
            </div>
            <div className="space-y-2 border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                <span className="col-span-2">Type</span>
                <span className="col-span-5">Item / Service</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Unit Price</span>
                <span className="col-span-1" />
              </div>
              {editLines.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-1 items-center">
                  <select 
                    className="col-span-2 border border-gray-200 rounded px-1.5 py-1 text-sm focus:outline-none focus:border-navy"
                    value={item.type || 'custom'}
                    onChange={e => {
                      const newType = e.target.value as any;
                      setEditLines(l => l.map((li, idx) => {
                        if (idx !== i) return li;
                        return { 
                          ...li, 
                          type: newType, 
                          description: '', 
                          unitPrice: 0, 
                          stockItemId: undefined 
                        };
                      }));
                    }}
                  >
                    <option value="custom">Custom</option>
                    <option value="service">Service</option>
                    <option value="stock">Stock Item</option>
                  </select>

                  {item.type === 'stock' ? (
                    <select
                      className="col-span-5 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy"
                      value={item.stockItemId || ''}
                      onChange={e => {
                        const sId = e.target.value;
                        const match = (stockItems || []).find((s: any) => s._id === sId);
                        if (match) {
                          setEditLines(l => l.map((li, idx) => {
                            if (idx !== i) return li;
                            return { 
                              ...li, 
                              description: `${match.name} (stock)`, 
                              stockItemId: match._id, 
                              unitPrice: match.pricePerItem 
                            };
                          }));
                        }
                      }}
                    >
                      <option value="">Select stock item...</option>
                      {(stockItems || []).filter((s: any) => !s.isArchived).map((s: any) => (
                        <option key={s._id} value={s._id}>{s.name} (Stock: {s.stockLevel})</option>
                      ))}
                    </select>
                  ) : item.type === 'service' ? (
                    <select
                      className="col-span-5 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy"
                      value={(serviceTypes || []).find((s: any) => s.name === item.description)?._id || ''}
                      onChange={e => {
                        const sId = e.target.value;
                        const match = (serviceTypes || []).find((s: any) => s._id === sId);
                        if (match) {
                          const newStockLines: LineItem[] = [];
                          (match.stockItems || []).forEach((si: any) => {
                            const stockItem = (stockItems || []).find((s: any) => s._id === si.stockItemId);
                            if (stockItem) {
                              newStockLines.push({
                                type: 'stock',
                                description: `${stockItem.name} (stock)`,
                                quantity: si.quantity,
                                unitPrice: stockItem.pricePerItem,
                                stockItemId: stockItem._id
                              });
                            }
                          });
                          setEditLines(l => {
                            const updated = l.map((li, idx) => {
                              if (idx !== i) return li;
                              return { 
                                ...li, 
                                description: match.name, 
                                unitPrice: match.fixedPrice 
                              };
                            });
                            return [...updated, ...newStockLines];
                          });
                        }
                      }}
                    >
                      <option value="">Select service type...</option>
                      {(serviceTypes || []).map((s: any) => (
                        <option key={s._id} value={s._id}>{s.name} (K{s.fixedPrice})</option>
                      ))}
                    </select>
                  ) : (
                    <input className="col-span-5 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy" value={item.description} onChange={e => setEditLine(i, 'description', e.target.value)} />
                  )}

                  <input className="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-navy" type="number" value={item.quantity} onChange={e => setEditLine(i, 'quantity', e.target.value)} min="1" />
                  
                  <input 
                    className="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-navy disabled:bg-gray-50 disabled:text-gray-400" 
                    type="number" 
                    value={item.unitPrice} 
                    onChange={e => setEditLine(i, 'unitPrice', e.target.value)} 
                    min="0" 
                    disabled={item.type === 'stock'} 
                  />
                  <button onClick={() => removeEditLine(i)} className="col-span-1 text-gray-300 hover:text-red-400 text-lg leading-none">&times;</button>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Subtotal: K {editSubtotal.toLocaleString()}</p>
            <p className="text-base font-bold text-gray-900">Total: K {editTotal.toLocaleString()}</p>
          </div>
          <Textarea label="Notes" value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} />
        </div>
      </Modal>

      {/* Printable Invoice Container (only visible in print mode) */}
      {invoiceDetail && (() => {
        const patientInfo = patients?.find((p: any) => p._id === invoiceDetail.patientId);
        const printableLineItems = (invoiceDetail.lineItems || []).filter((item: any) => !item.stockItemId);
        
        return (
          <>
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                /* Hide everything */
                body * {
                  visibility: hidden !important;
                }
                /* Show print container and its contents */
                #invoice-print-area, #invoice-print-area * {
                  visibility: visible !important;
                }
                #invoice-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  color: black !important;
                  padding: 24px !important;
                  margin: 0 !important;
                  box-sizing: border-box !important;
                }
              }
            ` }} />

            <div id="invoice-print-area" className="hidden print:block bg-white text-black p-8 font-sans">
              {/* Logo and company info */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Company Logo" className="w-16 h-16 object-contain" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {invoiceDetail.businessName || clinicConfig?.clinicName || "Niche Healthcare Group"}
                    </h2>
                    <p className="text-xs text-gray-500">{clinicConfig?.clinicAddress || "Lusaka, Zambia"}</p>
                    <p className="text-xs text-gray-500">Phone: {clinicConfig?.clinicPhone || "+260 977 123456"}</p>
                    <p className="text-xs text-gray-500">Email: {clinicConfig?.clinicEmail || "billing@nichehealthcare.com"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold text-gray-800 tracking-wider">INVOICE</h1>
                  <p className="text-sm font-semibold text-gray-700 mt-1">No: {invoiceDetail.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">Date: {invoiceDetail.date ? format(new Date(invoiceDetail.date), 'dd MMM yyyy') : ''}</p>
                  <p className="text-xs text-gray-500 mt-1">Due Date: {invoiceDetail.dueDate ? format(new Date(invoiceDetail.dueDate), 'dd MMM yyyy') : ''}</p>
                  <div className="mt-2">
                    <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      invoiceDetail.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {invoiceDetail.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</h3>
                <p className="text-sm font-bold text-gray-800">{patientInfo?.displayName || 'Unknown Patient'}</p>
                <p className="text-xs text-gray-500">Patient Code: {patientInfo?.patientCode || '—'}</p>
                {patientInfo?.phone && <p className="text-xs text-gray-500">Phone: {patientInfo.phone}</p>}
                {patientInfo?.email && <p className="text-xs text-gray-500">Email: {patientInfo.email}</p>}
                {patientInfo?.address && <p className="text-xs text-gray-500">Address: {patientInfo.address}</p>}
              </div>

              {/* Table of Line Items (excluding stock items) */}
              <table className="w-full text-left text-sm mb-6 border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="py-2.5 px-3 text-left font-semibold text-gray-600">Description</th>
                    <th className="py-2.5 px-3 text-center font-semibold text-gray-600 w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-gray-600 w-32">Unit Price</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-gray-600 w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {printableLineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-gray-800 font-medium">{item.description}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-gray-600">K {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-800">
                        K {(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Summary */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2 border-t pt-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>K {invoiceDetail.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tax</span>
                    <span>K {invoiceDetail.tax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-1.5">
                    <span>Total</span>
                    <span>K {invoiceDetail.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {paidSoFar > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-green-700 border-t pt-1">
                        <span>Total Paid</span>
                        <span>K {paidSoFar.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-amber-700">
                        <span>Balance Due</span>
                        <span>K {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {invoiceDetail.notes && (
                <div className="border-t pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Notes</h4>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{invoiceDetail.notes}</p>
                </div>
              )}

              {/* Footer info */}
              <div className="text-center text-[10px] text-gray-400 mt-12 border-t pt-4">
                Thank you for choosing {invoiceDetail.businessName || clinicConfig?.clinicName || "Niche Healthcare Group"}. If you have any questions regarding this invoice, please contact us.
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
