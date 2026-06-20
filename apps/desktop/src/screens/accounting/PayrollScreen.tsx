import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { DollarSign, Plus, Edit2, Calendar, CheckCircle2, FileText, Printer, UserCog, User, Percent, Clock, CreditCard } from 'lucide-react';
import { Button, Input, Select, Modal, Badge, Avatar, EmptyState, Spinner, Card, Textarea } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

type Tab = 'configs' | 'runs' | 'history';

export default function PayrollScreen() {
  const { account } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('runs');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Database queries
  const staff = useQuery(api.auth.listStaff);
  const salaryConfigs = useQuery(api.payroll.listSalaryConfigs);
  const payrollSlips = useQuery(api.payroll.listPayrollByPeriod, { period: selectedMonth });

  // Database mutations
  const saveConfig = useMutation(api.payroll.saveSalaryConfig);
  const generatePayroll = useMutation(api.payroll.generatePayroll);
  const approvePayroll = useMutation(api.payroll.approvePayroll);
  const markPaidPayroll = useMutation(api.payroll.markPaid);
  const updateDraftPayroll = useMutation(api.payroll.updateDraftPayrollRecord);

  // UI state variables
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [baseSalary, setBaseSalary] = useState('');
  const [allowances, setAllowances] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [processingRun, setProcessingRun] = useState(false);

  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [editingSlipRecord, setEditingSlipRecord] = useState<any>(null);
  const [editBaseSalary, setEditBaseSalary] = useState('');
  const [editAllowances, setEditAllowances] = useState('');
  const [editHoursWorked, setEditHoursWorked] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingDraftEdit, setSavingDraftEdit] = useState(false);

  const formatK = (n: number) => `K${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleOpenConfig = (st: any) => {
    const config = (salaryConfigs || []).find((c: any) => c.userId === st.email);
    setEditingStaff(st);
    setBaseSalary(config ? String(config.baseSalary) : '5000');
    setAllowances(config ? String(config.allowances) : '1500');
    setBankName(config?.bankName || '');
    setBankAccount(config?.bankAccountNumber || '');
    setBankBranch(config?.bankBranchCode || '');
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!editingStaff) return;
    setSavingConfig(true);
    try {
      await saveConfig({
        userId: editingStaff.email,
        baseSalary: Number(baseSalary) || 0,
        allowances: Number(allowances) || 0,
        napsaRate: 0.05, // 5% employer-matched ZRA napsa standard rate
        nhimaRate: 0.01, // 1% NHIMA standard rate
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccount.trim() || undefined,
        bankBranchCode: bankBranch.trim() || undefined,
        createdBy: account?.email || 'admin',
      });
      setShowConfigModal(false);
    } catch (e) {
      alert('Error saving salary config');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleGenerateRun = async () => {
    setProcessingRun(true);
    try {
      const res = await generatePayroll({
        period: selectedMonth,
        createdBy: account?.email || 'admin',
      });
      alert(`Successfully generated draft payslips for ${res.count} staff members.`);
    } catch (e: any) {
      alert(e.message || 'Error generating payroll');
    } finally {
      setProcessingRun(false);
    }
  };

  const handleApproveRun = async () => {
    if (!confirm('Approve all payroll draft records for this period?')) return;
    try {
      const res = await approvePayroll({
        period: selectedMonth,
        adminEmail: account?.email || 'admin',
      });
      alert(`Approved ${res.approvedCount} payslips.`);
    } catch (e) {
      alert('Error approving payroll');
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm('Process payouts? This will payout net salaries and log salary expenses in the general ledger.')) return;
    try {
      const res = await markPaidPayroll({
        period: selectedMonth,
        adminEmail: account?.email || 'admin',
      });
      alert(`Completed payouts for ${res.paidCount} staff members! Expenses have been logged.`);
    } catch (e) {
      alert('Error processing payouts');
    }
  };

  const handleOpenDraftEdit = (p: any) => {
    setEditingSlipRecord(p);
    setEditBaseSalary(String(p.baseSalary));
    setEditAllowances(String(p.allowances));
    setEditHoursWorked(String(p.hoursWorked || 0));
    setEditNotes(p.notes || '');
  };

  const handleSaveDraftEdit = async () => {
    if (!editingSlipRecord) return;
    setSavingDraftEdit(true);
    try {
      await updateDraftPayroll({
        id: editingSlipRecord._id,
        baseSalary: Number(editBaseSalary) || 0,
        allowances: Number(editAllowances) || 0,
        hoursWorked: Number(editHoursWorked) || 0,
        notes: editNotes.trim() || undefined,
      });
      setEditingSlipRecord(null);
      alert('Draft payslip updated and recalculated successfully!');
    } catch (e: any) {
      alert(e.message || 'Error updating draft payroll record');
    } finally {
      setSavingDraftEdit(false);
    }
  };

  const loading = !staff || !salaryConfigs || !payrollSlips;

  const totalGross = (payrollSlips || []).reduce((s, p) => s + p.grossPay, 0);
  const totalDeductions = (payrollSlips || []).reduce((s, p) => s + p.napsaDeduction + p.nhimaDeduction + p.payeDeduction, 0);
  const totalNet = (payrollSlips || []).reduce((s, p) => s + p.netPay, 0);

  const getStatusColor = (st: string) => {
    if (st === 'paid') return 'green';
    if (st === 'approved') return 'blue';
    return 'amber';
  };

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Payroll System</h2>
          <p className="text-xs text-gray-400">Configure salaries, calculate deductions, and process net payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
        <button onClick={() => setActiveTab('runs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'runs' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Calendar size={14} /> Monthly runs
        </button>
        <button onClick={() => setActiveTab('configs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'configs' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <UserCog size={14} /> Salary profiles
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'history' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <FileText size={14} /> Payslip history
        </button>
      </div>

      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <>
          {/* TAB 1: SALARY CONFIGS */}
          {activeTab === 'configs' && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Staff member', 'Role', 'Base salary', 'Allowances', 'Gross pay', 'NAPSA (5%)', 'NHIMA (1%)', 'Bank Details', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(staff || []).map((st: any) => {
                    const config = (salaryConfigs || []).find((c: any) => c.userId === st.email);
                    return (
                      <tr key={st._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                          <Avatar name={st.fullName || st.email} size="sm" />
                          <div>
                            <span>{st.fullName || st.email}</span>
                            <span className="block text-[10px] text-gray-400">{st.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{st.role}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{config ? formatK(config.baseSalary) : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{config ? formatK(config.allowances) : '—'}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{config ? formatK(config.baseSalary + config.allowances) : '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">5.0%</td>
                        <td className="px-4 py-3 text-xs text-gray-400">1.0%</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {config?.bankName ? `${config.bankName} - ${config.bankAccountNumber}` : <span className="text-amber-500">Missing details</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleOpenConfig(st)} className="p-1 hover:bg-gray-100 rounded text-navy"><Edit2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: MONTHLY RUNS */}
          {activeTab === 'runs' && (
            <div className="space-y-4">
              {/* Summary of current period */}
              {payrollSlips && payrollSlips.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4 bg-white border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Staff Count</p>
                      <p className="text-xl font-extrabold text-navy mt-1">{payrollSlips.length}</p>
                    </div>
                    <User className="text-gray-300 shrink-0" size={24} />
                  </Card>
                  <Card className="p-4 bg-white border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Gross Salaries</p>
                      <p className="text-xl font-extrabold text-gray-800 mt-1">{formatK(totalGross)}</p>
                    </div>
                    <DollarSign className="text-gray-300 shrink-0" size={24} />
                  </Card>
                  <Card className="p-4 bg-white border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Deductions Owed</p>
                      <p className="text-xl font-extrabold text-red-600 mt-1">{formatK(totalDeductions)}</p>
                    </div>
                    <Percent className="text-gray-300 shrink-0" size={24} />
                  </Card>
                  <Card className="p-4 bg-white border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Net payout</p>
                      <p className="text-xl font-extrabold text-green-600 mt-1">{formatK(totalNet)}</p>
                    </div>
                    <CheckCircle2 className="text-gray-300 shrink-0" size={24} />
                  </Card>
                </div>
              )}

              {/* Status Header / Control Row */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Badge label={payrollSlips?.length === 0 ? 'Not generated' : payrollSlips[0]?.status} color={getStatusColor(payrollSlips[0]?.status || 'draft')} />
                  <span className="text-xs text-gray-400">Period: {selectedMonth}</span>
                </div>
                <div className="flex items-center gap-2">
                  {payrollSlips?.length === 0 ? (
                    <Button loading={processingRun} onClick={handleGenerateRun} icon={<Plus size={14} />}>Generate Runs</Button>
                  ) : (
                    <>
                      {payrollSlips[0]?.status === 'draft' && (
                        <>
                          <Button variant="outline" onClick={handleGenerateRun} loading={processingRun}>Re-run calculations</Button>
                          <Button onClick={handleApproveRun} icon={<CheckCircle2 size={14} />}>Approve runs</Button>
                        </>
                      )}
                      {payrollSlips[0]?.status === 'approved' && (
                        <Button onClick={handleMarkPaid} icon={<DollarSign size={14} />}>Process Net Payouts</Button>
                      )}
                      {payrollSlips[0]?.status === 'paid' && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 size={13} /> Payouts processed</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Slips table */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {payrollSlips?.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400 bg-white">
                    <DollarSign size={32} className="mx-auto text-gray-200 mb-2" />
                    <span>No payroll slips processed for {selectedMonth} yet. Click Generate Runs above to calculate.</span>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Staff', 'Hours Worked', 'Gross pay', 'NAPSA (5%)', 'NHIMA (1%)', 'PAYE Tax', 'Deductions', 'Net Salary', 'Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payrollSlips.map((p: any) => {
                        const totalDeduct = p.napsaDeduction + p.nhimaDeduction + p.payeDeduction;
                        return (
                          <tr key={p._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-gray-900">{p.userId}</td>
                            <td className="px-4 py-3 text-gray-500 font-semibold">{p.hoursWorked || 0} hrs</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{formatK(p.grossPay)}</td>
                            <td className="px-4 py-3 text-red-500">{formatK(p.napsaDeduction)}</td>
                            <td className="px-4 py-3 text-red-500">{formatK(p.nhimaDeduction)}</td>
                            <td className="px-4 py-3 text-red-600">{formatK(p.payeDeduction)}</td>
                            <td className="px-4 py-3 font-semibold text-red-600">({formatK(totalDeduct)})</td>
                            <td className="px-4 py-3 font-extrabold text-green-600">{formatK(p.netPay)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => setSelectedSlip(p)} className="text-xs font-semibold text-navy hover:underline">View slip</button>
                                {p.status === 'draft' && (
                                  <button 
                                    onClick={() => handleOpenDraftEdit(p)} 
                                    className="text-xs font-semibold text-amber-600 hover:underline"
                                  >
                                    Adjust
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYSLIP HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Period', 'Employee', 'Gross pay', 'Total Deductions', 'Net Salary', 'Payout status', 'Processed'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(payrollSlips || []).filter(p => p.status === 'paid').map((p: any) => {
                    const totalDeduct = p.napsaDeduction + p.nhimaDeduction + p.payeDeduction;
                    return (
                      <tr key={p._id} className="border-t border-gray-50 hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedSlip(p)}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{p.period}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{p.userId}</td>
                        <td className="px-4 py-3">{formatK(p.grossPay)}</td>
                        <td className="px-4 py-3 text-red-500">{formatK(totalDeduct)}</td>
                        <td className="px-4 py-3 font-bold text-green-600">{formatK(p.netPay)}</td>
                        <td className="px-4 py-3"><Badge label="Paid" color="green" /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
                      </tr>
                    );
                  })}
                  {(payrollSlips || []).filter(p => p.status === 'paid').length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No completed payouts recorded in {selectedMonth} yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Edit Salary Profile Modal ── */}
      <Modal open={showConfigModal} onClose={() => setShowConfigModal(false)} title={`Salary configuration: ${editingStaff?.fullName || editingStaff?.email}`} width="max-w-md"
        footer={<><Button variant="outline" onClick={() => setShowConfigModal(false)}>Cancel</Button><Button loading={savingConfig} onClick={handleSaveConfig}>Save settings</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monthly base salary (ZMW) *" type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} />
            <Input label="Monthly allowances (ZMW) *" type="number" value={allowances} onChange={e => setAllowances(e.target.value)} />
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Percent size={12} className="text-amber-500" />
              Zambian statutory deductions (Auto-locked)
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>• NAPSA contribution: <span className="font-semibold text-gray-800">5.0%</span></div>
              <div>• NHIMA subscription: <span className="font-semibold text-gray-800">1.0%</span></div>
              <div className="col-span-2">• ZRA PAYE income tax: <span className="font-semibold text-gray-800">PAYE 2024/2026 sliding brackets</span></div>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Payout Banking details</p>
          <Input label="Bank Name" placeholder="e.g. Standard Chartered Bank" value={bankName} onChange={e => setBankName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Account Number" placeholder="e.g. 01001234567" value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
            <Input label="Branch Code" placeholder="e.g. 060012" value={bankBranch} onChange={e => setBankBranch(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* ── Payslip View Modal ── */}
      <Modal open={!!selectedSlip} onClose={() => setSelectedSlip(null)} title="Staff Payslip" width="max-w-lg"
        footer={<><Button variant="outline" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button><Button onClick={() => setSelectedSlip(null)}>Close</Button></>}>
        {selectedSlip && (
          <div className="space-y-6 text-sm text-gray-800">
            {/* Header branding */}
            <div className="flex justify-between border-b border-gray-200 pb-4">
              <div>
                <p className="font-extrabold text-navy text-lg uppercase leading-tight">Niche Healthcare Group</p>
                <p className="text-xs text-gray-400">Financial Payout Payslip Statement</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xs text-gray-500 uppercase tracking-wider">Payroll period</p>
                <p className="font-mono font-bold text-navy text-sm">{selectedSlip.period}</p>
              </div>
            </div>

            {/* Employee metadata */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs">
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Staff employee</span>
                <span className="font-bold text-gray-800 text-sm">{selectedSlip.userId}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Payout date</span>
                <span className="font-bold text-gray-800">{selectedSlip.paidAt ? format(new Date(selectedSlip.paidAt), 'dd MMM yyyy, HH:mm') : 'Draft status'}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Clocked hours</span>
                <span className="font-bold text-gray-800">{selectedSlip.hoursWorked || 0} verified working hours</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Record Status</span>
                <Badge label={selectedSlip.status} color={getStatusColor(selectedSlip.status)} />
              </div>
            </div>

            {/* Pay components breakdown */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Breakdown of gross earnings</p>
              <div className="space-y-1.5 border border-gray-100 rounded-lg p-3 bg-white">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Monthly base salary</span>
                  <span className="font-semibold text-gray-800">{formatK(selectedSlip.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-gray-100">
                  <span className="text-gray-500">Monthly allowances (housing, transport)</span>
                  <span className="font-semibold text-gray-800">{formatK(selectedSlip.allowances)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 font-bold">
                  <span className="text-gray-800">Total Gross Earnings</span>
                  <span className="text-navy">{formatK(selectedSlip.grossPay)}</span>
                </div>
              </div>
            </div>

            {/* Deductions breakdown */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Statutory & income tax deductions</p>
              <div className="space-y-1.5 border border-gray-100 rounded-lg p-3 bg-white">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">NAPSA Pension contribution (5.0%)</span>
                  <span className="font-semibold text-red-600">-{formatK(selectedSlip.napsaDeduction)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">NHIMA Medical subscription (1.0%)</span>
                  <span className="font-semibold text-red-600">-{formatK(selectedSlip.nhimaDeduction)}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-gray-100">
                  <span className="text-gray-500">ZRA PAYE Income Tax</span>
                  <span className="font-semibold text-red-600">-{formatK(selectedSlip.payeDeduction)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 font-bold">
                  <span className="text-gray-800">Total Deductions</span>
                  <span className="text-red-600">-{formatK(selectedSlip.napsaDeduction + selectedSlip.nhimaDeduction + selectedSlip.payeDeduction)}</span>
                </div>
              </div>
            </div>

            {/* Net Payout footer banner */}
            <div className="bg-navy rounded-xl p-4 flex items-center justify-between text-white">
              <div>
                <p className="text-[10px] uppercase font-bold text-white/50">Net payout salary</p>
                <p className="text-xs text-white/80 mt-0.5">Calculated net bank credit transfer</p>
              </div>
              <p className="text-2xl font-black text-green-400">{formatK(selectedSlip.netPay)}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Adjust Draft Payroll Modal ── */}
      {editingSlipRecord && (
        <Modal 
          open={!!editingSlipRecord} 
          onClose={() => setEditingSlipRecord(null)} 
          title={`Adjust Draft Payslip: ${editingSlipRecord?.userId}`} 
          width="max-w-md"
          footer={<><Button variant="outline" onClick={() => setEditingSlipRecord(null)}>Cancel</Button><Button loading={savingDraftEdit} onClick={handleSaveDraftEdit}>Save Adjustments</Button></>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input 
                label="Base Salary (K) *" 
                type="number" 
                value={editBaseSalary} 
                onChange={e => setEditBaseSalary(e.target.value)} 
              />
              <Input 
                label="Allowances (K) *" 
                type="number" 
                value={editAllowances} 
                onChange={e => setEditAllowances(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input 
                label="Clocked Hours *" 
                type="number" 
                value={editHoursWorked} 
                onChange={e => setEditHoursWorked(e.target.value)} 
              />
              <div className="flex flex-col justify-end text-xs text-gray-400 pb-1 italic">
                * Recalculates ZRA PAYE tax & matches NAPSA/NHIMA deductions automatically.
              </div>
            </div>

            {/* Reasoning checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Reasoning Log Checklist</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Adjusted worked hours based on timesheet audit",
                  "Added performance/clinical bonus incentive",
                  "Added transport allowance adjustment",
                  "Deducted unpaid leaves / absences",
                  "Applied manual statutory overrides"
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setEditNotes(prev => prev ? `${prev}\n- ${reason}` : `- ${reason}`);
                    }}
                    className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-full hover:bg-navy-50 hover:text-navy hover:border-navy/20 transition text-[10px] font-semibold"
                  >
                    + {reason}
                  </button>
                ))}
              </div>
            </div>

            <Textarea 
              label="Adjustment Reasoning Notes" 
              placeholder="Write detail audit logs or reasoning details here..." 
              value={editNotes} 
              onChange={e => setEditNotes(e.target.value)} 
              rows={3} 
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
