import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { 
  CreditCard, Plus, CheckCircle, XCircle, AlertTriangle, 
  ChevronRight, Calendar, ArrowLeft, User, Link2, DollarSign, Clock,
  Smartphone, Building, ShieldAlert as ShieldIcon
} from 'lucide-react';
import { Button, Select, Input, Modal, Badge, EmptyState, Spinner, StatCard, Card, Textarea } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const statusColor: Record<string, 'green' | 'amber' | 'red' | 'gray'> = { 
  completed: 'green', 
  pending: 'amber', 
  failed: 'red', 
  refunded: 'gray' 
};

export default function PaymentsScreen() {
  const { account } = useAuth();
  
  // Navigation & modals
  const [view, setView] = useState<'list' | 'new'>('list');
  const [listSubTab, setListSubTab] = useState<'transactions' | 'statements'>('transactions');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedStatementPatient, setSelectedStatementPatient] = useState<any>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [statementSearchQuery, setStatementSearchQuery] = useState('');

  // New Payment Form States
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  // Date & Time Picker states
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paidHour, setPaidHour] = useState(() => {
    let h = new Date().getHours();
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return String(h).padStart(2, '0');
  });
  const [paidMinute, setPaidMinute] = useState(String(new Date().getMinutes()).padStart(2, '0'));
  const [paidMeridiem, setPaidMeridiem] = useState(new Date().getHours() >= 12 ? 'PM' : 'AM');

  // Active method selection (Single cashless method)
  type PaymentMethod = 'bankTransfer' | 'mobileMoney' | 'creditCard' | 'eftpos' | 'hicaps' | 'nhimaInsurance' | 'otherInsurance' | 'other';
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('bankTransfer');

  // Method-specific metadata states
  const [receivingBank, setReceivingBank] = useState('Standard Chartered');
  const [momoProvider, setMomoProvider] = useState('MTN Money');
  const [momoPhone, setMomoPhone] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardHolder, setCardHolder] = useState('');
  const [terminalId, setTerminalId] = useState('');
  const [hicapsMemberId, setHicapsMemberId] = useState('');

  // Multi-source payment amounts (strictly NO cash)
  const [sources, setSources] = useState({
    hicaps: 0,
    creditCard: 0,
    eftpos: 0,
    nhimaInsurance: 0,
    otherInsurance: 0,
    bankTransfer: 0,
    mobileMoney: 0,
    other: 0,
  });

  // Manual payment allocations (invoiceId -> amount)
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Custom Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // Queries
  const payments = useQuery(api.paymentsClinic.list);
  const summary = useQuery(api.paymentsClinic.summary);
  const patients = useQuery(api.patients.list, {});
  const invoices = useQuery(api.invoices.list, {});
  const staffAccounts = useQuery(api.auth.getAllStaffAccounts);

  // Invoices specifically for the selected patient
  const patientInvoices = useQuery(
    api.invoices.listByPatient,
    patientId ? { patientId: patientId as any } : 'skip'
  );

  // Invoice Details Modal Query
  const invoiceDetail = useQuery(
    api.invoices.get,
    selectedInvoiceId ? { id: selectedInvoiceId as any } : 'skip'
  );

  // Mutations
  const recordMultiPayment = useMutation(api.paymentsClinic.recordMultiPayment);

  // Form selections and data mapping
  const patientOptions = useMemo(() => {
    return (patients || []).map((p: any) => ({ value: p._id, label: p.displayName }));
  }, [patients]);

  const selectedPatient = useMemo(() => {
    if (!patientId || !patients) return null;
    return patients.find((p: any) => p._id === patientId);
  }, [patientId, patients]);

  // Outstanding/unpaid invoices for the selected patient
  const outstandingInvoices = useMemo(() => {
    if (!patientInvoices) return [];
    return patientInvoices.filter(
      (inv: any) => inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'partial'
    );
  }, [patientInvoices]);

  const totalOutstanding = useMemo(() => {
    return outstandingInvoices.reduce((sum, inv) => sum + (inv.total - (inv.paidAmount || 0)), 0);
  }, [outstandingInvoices]);

  // Source totals
  const totalPayment = useMemo(() => {
    return (
      sources.hicaps +
      sources.creditCard +
      sources.eftpos +
      sources.nhimaInsurance +
      sources.otherInsurance +
      sources.bankTransfer +
      sources.mobileMoney +
      sources.other
    );
  }, [sources]);

  // Allocated payment total
  const totalApplied = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0);
  }, [allocations]);

  const unappliedPayment = useMemo(() => {
    return Math.max(0, totalPayment - totalApplied);
  }, [totalPayment, totalApplied]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, totalOutstanding - totalApplied);
  }, [totalOutstanding, totalApplied]);

  const patientSummaries = useMemo(() => {
    if (!patients) return [];
    
    const rawSummaries = patients.map((pat: any) => {
      const patInvoices = (invoices || []).filter((i: any) => i.patientId === pat._id && !i.isArchived);
      const patPayments = (payments || []).filter((p: any) => p.patientId === pat._id);
      
      const totalInvoiced = patInvoices.reduce((s: number, i: any) => s + i.total, 0);
      const totalPaid = patPayments.reduce((s: number, p: any) => s + p.amount, 0);
      const outstanding = Math.max(0, totalInvoiced - totalPaid);
      
      return {
        patient: pat,
        totalInvoiced,
        totalPaid,
        outstanding,
        invoices: patInvoices,
        payments: patPayments,
      };
    });

    if (!statementSearchQuery.trim()) return rawSummaries;
    const q = statementSearchQuery.toLowerCase();
    return rawSummaries.filter((s: any) => 
      s.patient.displayName?.toLowerCase().includes(q) || 
      s.patient.patientCode?.toLowerCase().includes(q)
    );
  }, [patients, invoices, payments, statementSearchQuery]);

  // Handlers
  const handleSelectActiveMethod = (method: PaymentMethod) => {
    const currentAmount = sources[activeMethod];
    setActiveMethod(method);
    setSources({
      hicaps: 0,
      creditCard: 0,
      eftpos: 0,
      nhimaInsurance: 0,
      otherInsurance: 0,
      bankTransfer: 0,
      mobileMoney: 0,
      other: 0,
      [method]: currentAmount,
    });
  };

  const handleActiveAmountChange = (valStr: string) => {
    const numericVal = Math.max(0, parseFloat(valStr) || 0);
    setSources({
      hicaps: 0,
      creditCard: 0,
      eftpos: 0,
      nhimaInsurance: 0,
      otherInsurance: 0,
      bankTransfer: 0,
      mobileMoney: 0,
      other: 0,
      [activeMethod]: numericVal,
    });
  };

  const handleManualAllocate = (invoiceId: string, valStr: string) => {
    const val = Math.max(0, parseFloat(valStr) || 0);
    const nextAllocations = {
      ...allocations,
      [invoiceId]: val
    };
    setAllocations(nextAllocations);

    // If totalPayment is 0, auto-populate the active method to match the total applied!
    if (totalPayment === 0) {
      const nextApplied = Object.values(nextAllocations).reduce((sum, v) => sum + v, 0);
      setSources({
        hicaps: 0,
        creditCard: 0,
        eftpos: 0,
        nhimaInsurance: 0,
        otherInsurance: 0,
        bankTransfer: 0,
        mobileMoney: 0,
        other: 0,
        [activeMethod]: nextApplied,
      });
    }
  };

  // Automatically allocate payment amounts chronologically across outstanding invoices
  const handleAutoAllocate = () => {
    let currentTotalPayment = totalPayment;
    if (currentTotalPayment === 0) {
      currentTotalPayment = totalOutstanding;
      setSources({
        hicaps: 0,
        creditCard: 0,
        eftpos: 0,
        nhimaInsurance: 0,
        otherInsurance: 0,
        bankTransfer: 0,
        mobileMoney: 0,
        other: 0,
        [activeMethod]: totalOutstanding,
      });
    }

    const sorted = [...outstandingInvoices].sort((a, b) => a.date - b.date);
    let remainingPayment = currentTotalPayment;
    const nextAllocations: Record<string, number> = {};

    for (const inv of sorted) {
      if (remainingPayment <= 0) {
        nextAllocations[inv._id] = 0;
        continue;
      }
      const outstanding = inv.total - (inv.paidAmount || 0);
      const toAllocate = Math.min(remainingPayment, outstanding);
      nextAllocations[inv._id] = parseFloat(toAllocate.toFixed(2));
      remainingPayment -= toAllocate;
    }

    setAllocations(nextAllocations);
    showToast("Chronological auto-allocation computed successfully!", "info");
  };

  const parsePaidTimestamp = () => {
    try {
      const [year, month, day] = paidDate.split('-').map(Number);
      let hourNum = parseInt(paidHour, 10);
      const minNum = parseInt(paidMinute, 10);
      if (paidMeridiem === 'PM' && hourNum < 12) hourNum += 12;
      if (paidMeridiem === 'AM' && hourNum === 12) hourNum = 0;
      
      const dateObj = new Date(year, month - 1, day, hourNum, minNum);
      return dateObj.getTime();
    } catch (e) {
      return Date.now();
    }
  };

  const handleResetForm = () => {
    setPatientId('');
    setNotes('');
    setReference('');
    setActiveMethod('bankTransfer');
    setReceivingBank('Standard Chartered');
    setMomoProvider('MTN Money');
    setMomoPhone('');
    setCardBrand('Visa');
    setCardHolder('');
    setTerminalId('');
    setHicapsMemberId('');
    setSources({
      hicaps: 0,
      creditCard: 0,
      eftpos: 0,
      nhimaInsurance: 0,
      otherInsurance: 0,
      bankTransfer: 0,
      mobileMoney: 0,
      other: 0,
    });
    setAllocations({});
  };

  const handleSubmitMultiPayment = async () => {
    if (!patientId) {
      showToast("Please select a patient first", "error");
      return;
    }
    if (totalPayment <= 0) {
      showToast("Total payment amount must be greater than zero", "error");
      return;
    }
    if (totalApplied > totalPayment) {
      showToast("Allocated payment cannot exceed total payment received", "error");
      return;
    }

    setSaving(true);
    try {
      // Build active allocations array
      const activeAllocations = Object.entries(allocations)
        .map(([invoiceId, amount]) => ({
          invoiceId: invoiceId as any,
          amount,
        }))
        .filter(a => a.amount > 0);

      const paymentTimestamp = parsePaidTimestamp();

      // Enrich notes with specific metadata of the chosen single source
      let enrichedNotes = notes.trim();
      let enrichedRef = reference.trim();

      if (activeMethod === 'bankTransfer') {
        const meta = `[Bank Transfer] Bank: ${receivingBank} | Pre-populated details: Bank ${selectedPatient?.bankName || 'N/A'}, Acc ${selectedPatient?.bankAccountNumber || 'N/A'}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes}\n${meta}` : meta;
      } else if (activeMethod === 'mobileMoney') {
        const meta = `[Mobile Money] Provider: ${momoProvider} | Phone: ${momoPhone}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes}\n${meta}` : meta;
      } else if (activeMethod === 'creditCard') {
        const meta = `[Credit Card] Brand: ${cardBrand} | Holder: ${cardHolder}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes}\n${meta}` : meta;
      } else if (activeMethod === 'eftpos') {
        const meta = `[EFTPOS] Terminal ID: ${terminalId}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes}\n${meta}` : meta;
      } else if (activeMethod === 'hicaps') {
        const meta = `[HICAPS] Member ID: ${hicapsMemberId}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes}\n${meta}` : meta;
      } else if (activeMethod === 'nhimaInsurance') {
        const meta = `[NHIMA] Member No: ${selectedPatient?.nhimaMemberNo || 'N/A'} | Scheme: ${selectedPatient?.nhimaScheme || 'Formal'}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes}\n${meta}` : meta;
      } else if (activeMethod === 'otherInsurance') {
        const meta = `[Private Insurance] Provider: ${selectedPatient?.insuranceProvider || 'N/A'} | Policy: ${selectedPatient?.policyNumber || 'N/A'}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes}\n${meta}` : meta;
      }

      await recordMultiPayment({
        patientId: patientId as any,
        paymentDate: paymentTimestamp,
        notes: enrichedNotes || undefined,
        referenceNumber: enrichedRef || undefined,
        recordedBy: account?.email || 'admin',
        sources,
        allocations: activeAllocations,
      });

      showToast("Payment transaction successfully recorded and applied!", "success");
      handleResetForm();
      setView('list');
    } catch (e: any) {
      showToast(e.message || "Failed to record payment transaction", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* breadcrumb row */}
      {view === 'new' && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 select-none -mb-3">
          <button onClick={() => { setView('list'); handleResetForm(); }} className="hover:text-navy hover:underline transition">Payments</button>
          <ChevronRight size={10} />
          <span className="text-gray-600">New payment</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        {view === 'list' ? (
          <div className="flex items-center justify-between w-full flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Payment Records</h3>
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setListSubTab('transactions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${listSubTab === 'transactions' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Transactions List
                </button>
                <button
                  onClick={() => setListSubTab('statements')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${listSubTab === 'statements' ? 'bg-white text-navy shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Grouped Patient Accounts
                </button>
              </div>
            </div>
            <Button icon={<Plus size={15} />} onClick={() => setView('new')}>Record Payment</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setView('list'); handleResetForm(); }} 
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">New payment</h2>
          </div>
        )}
      </div>

      {view === 'list' ? (
        <>
          {listSubTab === 'transactions' ? (
            <>
              {/* Summary cards */}
              {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Received" value={`K ${(summary.totalReceived || 0).toLocaleString()}`} icon={<CreditCard size={18} />} color="text-green-600" />
                  <StatCard label="Pending" value={`K ${(summary.totalPending || 0).toLocaleString()}`} icon={<CreditCard size={18} />} color="text-amber-600" />
                  <StatCard label="Completed" value={summary.completedCount} icon={<CreditCard size={18} />} color="text-navy" />
                  <StatCard label="Pending Count" value={summary.pendingCount} icon={<CreditCard size={18} />} color="text-gray-600" />
                </div>
              )}

              {!payments ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : payments.length === 0 ? (
                <EmptyState 
                  icon={<CreditCard size={32} />} 
                  title="No payments yet" 
                  action={<Button onClick={() => setView('new')} icon={<Plus size={15} />}>Record Payment</Button>} 
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Date', 'Invoice', 'Patient', 'Amount', 'Method', 'Status', 'Received By'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => {
                        const patName = patients?.find((pt: any) => pt._id === p.patientId)?.displayName || 'Unknown';
                        const invNum = invoices?.find((i: any) => i._id === p.invoiceId)?.invoiceNumber || p.invoiceId;
                        return (
                          <tr key={p._id} className="border-t border-gray-50 hover:bg-navy-50/40 cursor-pointer transition" onClick={() => setSelectedPayment(p)}>
                            <td className="px-4 py-3 text-gray-600">{p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '—'}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{invNum}</td>
                            <td className="px-4 py-3 text-gray-700">{patName}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">K {(p.amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[150px]">{p.method}</td>
                            <td className="px-4 py-3"><Badge label={p.status || 'completed'} color={statusColor[p.status] || 'green'} /></td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{p.recordedBy || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Grouped Patient Statements Tab */}
              <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                  <Input
                    placeholder="Search patients by name or code..."
                    value={statementSearchQuery}
                    onChange={e => setStatementSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {!patients ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : patientSummaries.length === 0 ? (
                <EmptyState 
                  icon={<User size={32} />} 
                  title="No patient statements" 
                  action={undefined} 
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Patient Info', 'Total Invoiced', 'Total Paid', 'Outstanding Bal', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {patientSummaries.map((summary: any) => {
                        const { patient, totalInvoiced, totalPaid, outstanding } = summary;
                        const isSettled = outstanding <= 0;
                        return (
                          <tr key={patient._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">{patient.displayName}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{patient.patientCode} · {patient.phone}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">K {totalInvoiced.toLocaleString()}</td>
                            <td className="px-4 py-3 text-green-600 font-medium">K {totalPaid.toLocaleString()}</td>
                            <td className={`px-4 py-3 font-semibold ${isSettled ? 'text-gray-400' : 'text-amber-600'}`}>
                              K {outstanding.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                label={isSettled ? 'Fully Settled' : 'Outstanding Bal'} 
                                color={isSettled ? 'green' : 'amber'} 
                              />
                            </td>
                            <td className="px-4 py-3 flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedStatementPatient(summary)}
                                className="text-navy font-semibold"
                              >
                                Statement
                              </Button>
                              {!isSettled && (
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setPatientId(patient._id);
                                    setView('new');
                                  }}
                                  className="font-semibold"
                                >
                                  Apply Payment
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* New Payment Screen Overhaul */
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6 items-start">
          
          {/* Left Column Form (col-span-8) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Patient & DateTime Picker */}
            <Card className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                  label="Client Patient *" 
                  options={patientOptions} 
                  placeholder="Select a patient..." 
                  value={patientId} 
                  onChange={e => {
                    setPatientId(e.target.value);
                    setAllocations({}); // clear allocations when patient changes
                  }} 
                />
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Paid At *</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input 
                      type="date" 
                      value={paidDate} 
                      onChange={e => setPaidDate(e.target.value)} 
                      className="w-40" 
                    />
                    <span className="text-xs font-bold text-gray-400 uppercase select-none">at</span>
                    
                    <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      <Clock size={14} className="text-gray-400 mr-1.5" />
                      {/* Hour */}
                      <select 
                        className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                        value={paidHour}
                        onChange={e => setPaidHour(e.target.value)}
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="mx-0.5 text-gray-400 font-bold">:</span>
                      {/* Minute */}
                      <select 
                        className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                        value={paidMinute}
                        onChange={e => setPaidMinute(e.target.value)}
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {/* AM/PM */}
                      <select 
                        className="bg-transparent text-sm font-semibold text-navy ml-1.5 focus:outline-none cursor-pointer"
                        value={paidMeridiem}
                        onChange={e => setPaidMeridiem(e.target.value)}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Source Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-[#E6F4F8] border-b border-[#C7E5ED] flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1D5E75] uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={15} /> Payment Source (Strictly Cashless)
                </h4>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Method Segmented Tiles */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Select Cashless Method</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { key: 'bankTransfer', label: 'Bank Transfer', icon: Building },
                      { key: 'mobileMoney', label: 'Mobile Money', icon: Smartphone },
                      { key: 'creditCard', label: 'Credit Card', icon: CreditCard },
                      { key: 'eftpos', label: 'EFTPOS POS', icon: CreditCard },
                      { key: 'hicaps', label: 'HICAPS Fund', icon: CreditCard },
                      { key: 'nhimaInsurance', label: 'NHIMA Insurance', icon: ShieldIcon },
                      { key: 'otherInsurance', label: 'Other Insurance', icon: ShieldIcon },
                      { key: 'other', label: 'Other Cashless', icon: Plus },
                    ].map(item => {
                      const isActive = activeMethod === item.key;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSelectActiveMethod(item.key as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center select-none ${
                            isActive
                              ? 'border-navy bg-navy/5 text-navy font-bold shadow-xs scale-[0.98]'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-600 font-medium'
                          }`}
                        >
                          <Icon size={18} className={`mb-1.5 ${isActive ? 'text-navy' : 'text-gray-400'}`} />
                          <span className="text-[11px] leading-tight">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Amount</label>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded uppercase tracking-wider">
                      {activeMethod.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm font-bold">K</span>
                    </div>
                    <input
                      type="number"
                      className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-lg font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                      placeholder="0.00"
                      value={sources[activeMethod] || ''}
                      onChange={e => handleActiveAmountChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Method Specific Metadata Fields */}
                <div className="space-y-4 pt-1">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                    Method Metadata Details
                  </h5>

                  {activeMethod === 'bankTransfer' && (
                    <div className="space-y-3">
                      {/* Saved Details Banner */}
                      {(selectedPatient?.bankName || selectedPatient?.bankAccountNumber) && (
                        <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 font-medium">
                          <CheckCircle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-900">Client Bank Details Found:</span>
                            <div className="text-[10px] text-blue-600/90 mt-0.5">
                              Bank: {selectedPatient.bankName || 'N/A'} · Acc: {selectedPatient.bankAccountNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Receiving Bank Account *"
                          options={[
                            { value: 'Standard Chartered', label: 'Standard Chartered (Main Account)' },
                            { value: 'Zambia National Commercial Bank', label: 'Zambia National Commercial Bank (Ops)' },
                            { value: 'Absa Bank', label: 'Absa Bank (Trust Account)' },
                          ]}
                          value={receivingBank}
                          onChange={e => setReceivingBank(e.target.value)}
                        />
                        <Input
                          label="Transaction Reference / Receipt #"
                          placeholder="Enter EFT transaction number"
                          value={reference}
                          onChange={e => setReference(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {activeMethod === 'mobileMoney' && (
                    <div className="space-y-3">
                      {/* Saved Details Banner */}
                      {selectedPatient?.phone && (
                        <div className="flex items-start gap-2 text-xs text-purple-700 bg-purple-50/80 p-2.5 rounded-lg border border-purple-100 font-medium">
                          <CheckCircle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-purple-900">Client Contact Phone Found:</span>
                            <div className="text-[10px] text-purple-600/90 mt-0.5">
                              Phone Number: {selectedPatient.phone}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                          label="Mobile Network *"
                          options={[
                            { value: 'MTN Money', label: 'MTN Mobile Money' },
                            { value: 'Airtel Money', label: 'Airtel Money' },
                            { value: 'Zamtel Kv3', label: 'Zamtel Kv3 Pay' },
                          ]}
                          value={momoProvider}
                          onChange={e => setMomoProvider(e.target.value)}
                        />
                        <Input
                          label="Sender's Phone Number *"
                          placeholder="e.g. +26097xxxxxxx"
                          value={momoPhone}
                          onChange={e => setMomoPhone(e.target.value)}
                        />
                        <Input
                          label="TXN Reference Code"
                          placeholder="Enter Mobile Money reference"
                          value={reference}
                          onChange={e => setReference(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {activeMethod === 'creditCard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        label="Card Gateway Brand *"
                        options={[
                          { value: 'Visa', label: 'Visa Card Gateway' },
                          { value: 'MasterCard', label: 'MasterCard Gateway' },
                          { value: 'UnionPay', label: 'UnionPay Gateway' },
                          { value: 'American Express', label: 'American Express' },
                        ]}
                        value={cardBrand}
                        onChange={e => setCardBrand(e.target.value)}
                      />
                      <Input
                        label="Cardholder Name *"
                        placeholder="Name on card"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value)}
                      />
                      <Input
                        label="Auth Reference Code"
                        placeholder="e.g. Merchant auth number"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                      />
                    </div>
                  )}

                  {activeMethod === 'eftpos' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="EFTPOS Terminal ID *"
                        placeholder="e.g. POS-9908"
                        value={terminalId}
                        onChange={e => setTerminalId(e.target.value)}
                      />
                      <Input
                        label="Receipt Number / Auth Code"
                        placeholder="Enter merchant receipt reference"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                      />
                    </div>
                  )}

                  {activeMethod === 'hicaps' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="HICAPS Member ID *"
                        placeholder="Enter claim card ID"
                        value={hicapsMemberId}
                        onChange={e => setHicapsMemberId(e.target.value)}
                      />
                      <Input
                        label="HICAPS Claim Reference"
                        placeholder="Enter approval txn reference"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                      />
                    </div>
                  )}

                  {activeMethod === 'nhimaInsurance' && (
                    <div className="space-y-3">
                      {selectedPatient?.nhimaMemberNo ? (
                        <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100 font-medium">
                          <CheckCircle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-900">Client NHIMA Account Found:</span>
                            <div className="text-[10px] text-emerald-600/90 mt-0.5">
                              No: {selectedPatient.nhimaMemberNo} · Scheme: {selectedPatient.nhimaScheme || 'Formal'} · Employer: {selectedPatient.nhimaEmployer || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-100 font-medium">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-900">No Saved NHIMA Details:</span>
                            <div className="text-[10px] text-amber-600/90 mt-0.5">
                              Please specify the claim reference. Configure NHIMA details on the patient folder first.
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="NHIMA Claim Authorization Code *"
                          placeholder="Enter insurance claim number"
                          value={reference}
                          onChange={e => setReference(e.target.value)}
                        />
                        <div className="flex items-end">
                          <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-2.5 w-full">
                            NHIMA claims automatically audit patient records and clear invoice balances at pre-defined clinical rates.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'otherInsurance' && (
                    <div className="space-y-3">
                      {selectedPatient?.insuranceProvider ? (
                        <div className="flex items-start gap-2 text-xs text-purple-700 bg-purple-50/80 p-2.5 rounded-lg border border-purple-100 font-medium">
                          <CheckCircle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-purple-900">Client Private Insurance Found:</span>
                            <div className="text-[10px] text-purple-600/90 mt-0.5">
                              Provider: {selectedPatient.insuranceProvider} · Policy No: {selectedPatient.policyNumber || 'No Policy #'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-100 font-medium">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-900">No Saved Insurance Details:</span>
                            <div className="text-[10px] text-amber-600/90 mt-0.5">
                              Please specify the pre-auth reference. Configure insurance details on the patient folder first.
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Insurance Pre-Authorization Reference *"
                          placeholder="Enter authorization reference"
                          value={reference}
                          onChange={e => setReference(e.target.value)}
                        />
                        <div className="flex items-end">
                          <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-2.5 w-full">
                            Invoices covered by private insurers are tracked under specific claims reporting ledgers.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'other' && (
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        label="Description of Cashless Channel *"
                        placeholder="e.g. Promo voucher, credit adjustment"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Sub-total summary row */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-500">Payment total</span>
                  <span className="text-lg font-extrabold text-navy">
                    K {totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column Summary (col-span-4) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Payment Summary Panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-[#E6F4F8] border-b border-[#C7E5ED]">
                <h4 className="text-sm font-bold text-[#1D5E75] uppercase tracking-wider">Payment Summary</h4>
              </div>
              
              <div className="p-5 space-y-5">
                <div className="text-center py-2 bg-gray-50/50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Remaining Balance</span>
                  <span className="text-2xl font-black text-navy mt-1 block">
                    K {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500">after applied payments</span>
                </div>

                <div className="space-y-3.5 text-sm pt-2">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Outstanding balance</span>
                    <span className="font-semibold text-gray-900">K {totalOutstanding.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Payment applied</span>
                    <span className="font-bold text-navy">K {totalApplied.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 border-t border-gray-100 pt-3">
                    <span>Unapplied payment</span>
                    <span className={`font-bold ${unappliedPayment > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                      K {unappliedPayment.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Input 
                    label="Reference Number" 
                    placeholder="e.g. Bank receipt ref, claim ID" 
                    value={reference} 
                    onChange={e => setReference(e.target.value)} 
                  />
                </div>

                <div>
                  <Textarea 
                    label="Internal Notes" 
                    placeholder="Optional transaction remarks..." 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={3}
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <Button 
                    variant="primary" 
                    className="w-full py-2.5 font-bold shadow-sm"
                    loading={saving} 
                    disabled={patientId === '' || totalPayment <= 0 || totalApplied > totalPayment} 
                    onClick={handleSubmitMultiPayment}
                  >
                    Record Payment
                  </Button>

                  {totalApplied > totalPayment && (
                    <div className="bg-red-50 text-red-800 border border-red-100 rounded-lg p-3 text-xs flex items-start gap-2.5 font-medium leading-normal animate-pulse">
                      <XCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                      <span>Allocated sum (K{totalApplied.toLocaleString()}) cannot exceed total payment (K{totalPayment.toLocaleString()}).</span>
                    </div>
                  )}

                  {unappliedPayment > 0 && totalPayment > 0 && totalApplied <= totalPayment && (
                    <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-lg p-3 text-xs flex items-start gap-2.5 font-medium leading-normal">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>Unapplied amount (K{unappliedPayment.toLocaleString()}) will remain as unallocated patient balance credit.</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Apply to Invoices — full width below the form+summary columns */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Apply to invoices</h3>
            <Button
              size="sm"
              variant="outline"
              disabled={totalPayment <= 0 || outstandingInvoices.length === 0}
              onClick={handleAutoAllocate}
            >
              Auto-Allocate Chronologically
            </Button>
          </div>

          {!patientId ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm font-medium">
              Select a patient above to load outstanding invoices.
            </div>
          ) : outstandingInvoices.length === 0 ? (
            <div className="bg-emerald-50 rounded-xl border border-dashed border-emerald-200 p-8 text-center text-emerald-800 text-sm font-semibold">
              🎉 Selected patient has no unpaid or outstanding invoices.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 select-none">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap" style={{ width: '100px' }}>Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap" style={{ width: '110px' }}>Issue Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Practitioner</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap" style={{ width: '110px' }}>Total</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap" style={{ width: '120px' }}>Outstanding</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap" style={{ width: '160px' }}>Apply Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap" style={{ width: '120px' }}>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingInvoices.map((inv: any) => {
                      const outstanding = inv.total - (inv.paidAmount || 0);
                      const allocated = allocations[inv._id] || 0;
                      const remaining = Math.max(0, outstanding - allocated);
                      const providerName = staffAccounts?.find(
                        (s: any) => s.userId === inv.createdBy || s.email === inv.createdBy
                      )?.displayName || inv.createdBy || 'Practitioner';
                      return (
                        <tr key={inv._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedInvoiceId(inv._id)}
                              className="text-red-500 hover:text-red-700 font-bold hover:underline transition text-xs flex items-center gap-1"
                            >
                              <Link2 size={11} /> {inv.invoiceNumber}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                            {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium text-xs">{providerName}</td>
                          <td className="px-4 py-3 text-right text-gray-600 text-xs whitespace-nowrap">
                            K {(inv.total || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800 text-xs whitespace-nowrap">
                            K {outstanding.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="relative rounded-md mx-auto" style={{ width: '140px' }}>
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px] font-bold">K</span>
                              <input
                                type="number"
                                className="block w-full pl-6 pr-3 py-1.5 border border-gray-200 rounded-lg text-right text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                                placeholder="0.00"
                                value={allocations[inv._id] || ''}
                                onChange={e => handleManualAllocate(inv._id, e.target.value)}
                                min="0"
                                max={outstanding}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs whitespace-nowrap">
                            K {remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        </div>
      )}

      {/* Floating Animated Toast Banner */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 bg-white ${
          toast.type === 'success' ? 'border-green-100 text-green-800 bg-green-50' : 
          toast.type === 'error' ? 'border-red-100 text-red-800 bg-red-50' : 
          'border-blue-100 text-blue-800 bg-blue-50'
        }`}>
          {toast.type === 'success' && <CheckCircle size={16} className="text-green-600" />}
          {toast.type === 'error' && <XCircle size={16} className="text-red-600" />}
          {toast.type === 'info' && <AlertTriangle size={16} className="text-blue-600" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Payment details modal (from row clicks) */}
      <Modal 
        open={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)} 
        title="Payment Record Details"
        footer={<Button onClick={() => setSelectedPayment(null)}>Close</Button>}
      >
        {selectedPayment && (() => {
          const patName = patients?.find((pt: any) => pt._id === selectedPayment.patientId)?.displayName || 'Unknown';
          const invNum = invoices?.find((i: any) => i._id === selectedPayment.invoiceId)?.invoiceNumber || selectedPayment.invoiceId;
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-xs text-gray-400">Payment ID</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedPayment._id}</p>
                </div>
                <Badge label={selectedPayment.status || 'completed'} color={statusColor[selectedPayment.status] || 'green'} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Patient</p>
                  <p className="text-sm font-medium text-gray-800">{patName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Invoice Number</p>
                  <p className="text-sm font-medium text-gray-800">{invNum}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="text-lg font-bold text-navy">K {(selectedPayment.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Method</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Recorded Date</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedPayment.createdAt ? format(new Date(selectedPayment.createdAt), 'dd MMM yyyy HH:mm') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Recorded By</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPayment.recordedBy || '—'}</p>
                </div>
              </div>

              {selectedPayment.referenceNumber && (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-400">Reference Number</p>
                  <p className="text-sm font-mono font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded mt-1 inline-block">
                    {selectedPayment.referenceNumber}
                  </p>
                </div>
              )}

              {selectedPayment.notes && (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-400">Notes / Memo</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-1 italic">
                    "{selectedPayment.notes}"
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Invoice details modal (from links clicks in Apply table) */}
      <Modal 
        open={!!selectedInvoiceId} 
        onClose={() => setSelectedInvoiceId(null)} 
        title="Invoice Details"
        footer={<Button onClick={() => setSelectedInvoiceId(null)}>Close</Button>}
        width="max-w-xl"
      >
        {invoiceDetail ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs text-gray-400">Invoice Number</p>
                <p className="text-sm font-semibold text-gray-900">{invoiceDetail.invoiceNumber}</p>
              </div>
              <Badge 
                label={invoiceDetail.status} 
                color={invoiceDetail.status === 'paid' ? 'green' : invoiceDetail.status === 'unpaid' ? 'amber' : 'blue'} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Date Issued</p>
                <p className="text-sm font-medium text-gray-800">
                  {invoiceDetail.date ? format(new Date(invoiceDetail.date), 'dd MMM yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Due Date</p>
                <p className="text-sm font-medium text-gray-800">
                  {invoiceDetail.dueDate ? format(new Date(invoiceDetail.dueDate), 'dd MMM yyyy') : '—'}
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden mt-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-gray-500">Item Description</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Price</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceDetail.lineItems || []).map((item: any, idx: number) => (
                    <tr key={idx} className="border-t border-gray-50">
                      <td className="px-3 py-2 text-gray-800 font-medium">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-600">K {item.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-900 font-semibold">
                        {item.stockItemId ? (
                          <span className="text-[10px] text-navy font-semibold px-1.5 py-0.5 bg-navy-50 rounded-full inline-block">Inclusive</span>
                        ) : (
                          `K ${item.total.toLocaleString()}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="bg-gray-50 p-3 space-y-1 text-xs border-t border-gray-100">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>K {(invoiceDetail.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span>K {(invoiceDetail.tax || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-extrabold border-t border-gray-100 pt-1.5 mt-1">
                  <span>Total Due</span>
                  <span>K {(invoiceDetail.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {invoiceDetail.notes && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 italic">
                "{invoiceDetail.notes}"
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
      </Modal>

      {/* Grouped Patient Statements Detailed Modal */}
      {selectedStatementPatient && (
        <Modal 
          open={!!selectedStatementPatient} 
          onClose={() => setSelectedStatementPatient(null)} 
          title={`Statement of Account · ${selectedStatementPatient.patient.displayName}`}
          width="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Header / Info details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Patient Name</span>
                <p className="text-sm font-semibold text-gray-800">{selectedStatementPatient.patient.displayName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Patient Code</span>
                <p className="text-sm font-mono text-gray-700">{selectedStatementPatient.patient.patientCode || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Total Billed</span>
                <p className="text-sm font-bold text-navy">K {selectedStatementPatient.totalInvoiced.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Outstanding Balance</span>
                <p className="text-sm font-bold text-amber-600">K {selectedStatementPatient.outstanding.toLocaleString()}</p>
              </div>
            </div>

            {/* Ledger Items Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Historical Transaction Ledger</h4>
              
              {(() => {
                // Combine invoices and payments chronologically
                const items: any[] = [];
                selectedStatementPatient.invoices.forEach((i: any) => {
                  items.push({
                    date: i.date,
                    type: 'invoice',
                    ref: i.invoiceNumber,
                    debit: i.total,
                    credit: 0,
                    status: i.status,
                  });
                });
                selectedStatementPatient.payments.forEach((p: any) => {
                  items.push({
                    date: p.paymentDate || p.createdAt,
                    type: 'payment',
                    ref: p.referenceNumber || 'PAYMENT_REC',
                    debit: 0,
                    credit: p.amount,
                    status: 'completed',
                  });
                });

                // Sort ascending by date
                items.sort((a, b) => a.date - b.date);

                // Compute running balance
                let runBal = 0;
                const ledger = items.map(item => {
                  runBal += (item.debit - item.credit);
                  return { ...item, runningBalance: runBal };
                });

                if (ledger.length === 0) {
                  return <p className="text-sm text-gray-400 py-6 text-center">No billing activity logged for this account.</p>;
                }

                return (
                  <div className="border border-gray-150 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 border-b border-gray-150">
                        <tr>
                          {['Transaction Date', 'Ref / Invoice #', 'Type', 'Debit (Invoice)', 'Credit (Payment)', 'Running Balance'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left font-bold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {ledger.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-500">{format(new Date(row.date), 'dd MMM yyyy, HH:mm')}</td>
                            <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">{row.ref}</td>
                            <td className="px-4 py-2.5">
                              <Badge 
                                label={row.type} 
                                color={row.type === 'invoice' ? 'navy' : 'green'} 
                              />
                            </td>
                            <td className="px-4 py-2.5 font-medium text-gray-800">
                              {row.debit > 0 ? `K ${row.debit.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-green-600">
                              {row.credit > 0 ? `K ${row.credit.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-gray-900">
                              K {row.runningBalance.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button variant="outline" onClick={() => setSelectedStatementPatient(null)}>Close Statement</Button>
              {selectedStatementPatient.outstanding > 0 && (
                <Button 
                  onClick={() => {
                    const pat = selectedStatementPatient.patient;
                    setSelectedStatementPatient(null);
                    setPatientId(pat._id);
                    setView('new');
                  }}
                  className="font-bold"
                >
                  Record Payment
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
