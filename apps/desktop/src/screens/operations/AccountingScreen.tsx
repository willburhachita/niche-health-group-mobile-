import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Calculator, TrendingUp, TrendingDown, DollarSign, FileText, CreditCard, Receipt, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Button, Badge, Spinner, Card, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import LedgerWorkbook from './LedgerWorkbook';

type Tab = 'overview' | 'pnl' | 'cashflow' | 'outstanding' | 'tax' | 'workbook';

export default function AccountingScreen() {
  const { account } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const invoices = useQuery(api.invoices.list, {});
  const payments = useQuery(api.paymentsClinic.list, {});
  const expenses = useQuery(api.expenses.list, {});

  const fromTs = new Date(dateFrom).getTime();
  const toTs = new Date(dateTo).getTime() + 86400000;

  const periodInvoices = useMemo(() =>
    (invoices || []).filter((i: any) => i.date >= fromTs && i.date < toTs && !i.isArchived), [invoices, fromTs, toTs]);
  const periodPayments = useMemo(() =>
    (payments || []).filter((p: any) => p.paymentDate >= fromTs && p.paymentDate < toTs), [payments, fromTs, toTs]);
  const periodExpenses = useMemo(() =>
    (expenses || []).filter((e: any) => e.date >= fromTs && e.date < toTs && !e.isArchived), [expenses, fromTs, toTs]);

  const totalRevenue = periodPayments.reduce((s: number, p: any) => s + p.amount, 0);
  const totalInvoiced = periodInvoices.reduce((s: number, i: any) => s + i.total, 0);
  const totalExpenses = periodExpenses.reduce((s: number, e: any) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalTax = periodInvoices.reduce((s: number, i: any) => s + (i.tax || 0), 0);

  const outstandingInvoices = (invoices || []).filter((i: any) =>
    !i.isArchived && (i.status === 'unpaid' || i.status === 'overdue' || i.status === 'partial'));
  const totalOutstanding = outstandingInvoices.reduce((s: number, i: any) => s + i.total - (i.paidAmount || 0), 0);
  const overdueCount = outstandingInvoices.filter((i: any) => i.status === 'overdue').length;

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    periodExpenses.forEach((e: any) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [periodExpenses]);

  const paymentsByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    periodPayments.forEach((p: any) => {
      map[p.method] = (map[p.method] || 0) + p.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [periodPayments]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Calculator size={14} /> },
    { key: 'pnl', label: 'Profit & Loss', icon: <TrendingUp size={14} /> },
    { key: 'cashflow', label: 'Cash Flow', icon: <DollarSign size={14} /> },
    { key: 'outstanding', label: 'Outstanding', icon: <AlertTriangle size={14} /> },
    { key: 'tax', label: 'Tax Summary', icon: <Receipt size={14} /> },
    { key: 'workbook', label: 'Interactive Ledger', icon: <FileSpreadsheet size={14} /> },
  ];

  const isLoading = !invoices || !payments || !expenses;

  const fmtK = (n: number) => `K${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString();

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">Accounting</h2>
        <div className="flex items-center gap-2 text-sm">
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
          <span className="text-gray-400">to</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <>
          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Invoiced" value={fmtK(totalInvoiced)} icon={<FileText size={16} />} color="text-blue-600" bg="bg-blue-50" />
                <SummaryCard label="Revenue Collected" value={fmtK(totalRevenue)} icon={<TrendingUp size={16} />} color="text-green-600" bg="bg-green-50" />
                <SummaryCard label="Total Expenses" value={fmtK(totalExpenses)} icon={<TrendingDown size={16} />} color="text-red-600" bg="bg-red-50" />
                <SummaryCard label="Net Profit" value={fmtK(netProfit)} icon={<DollarSign size={16} />} color={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} bg={netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SummaryCard label="Outstanding Balance" value={fmtK(totalOutstanding)} icon={<AlertTriangle size={16} />} color="text-amber-600" bg="bg-amber-50" />
                <SummaryCard label="Tax Owed" value={fmtK(totalTax)} icon={<Receipt size={16} />} color="text-purple-600" bg="bg-purple-50" />
                <SummaryCard label="Overdue Invoices" value={String(overdueCount)} icon={<AlertTriangle size={16} />} color="text-red-600" bg="bg-red-50" />
              </div>
            </div>
          )}

          {/* ── Profit & Loss ── */}
          {tab === 'pnl' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Profit & Loss Statement</h3>
              <p className="text-xs text-gray-400">{dateFrom} to {dateTo}</p>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Revenue</span>
                  <span className="font-semibold text-green-600">{fmtK(totalRevenue)}</span>
                </div>

                <div className="pl-4 space-y-1">
                  {paymentsByMethod.map(([method, amount]) => (
                    <div key={method} className="flex justify-between text-sm">
                      <span className="text-gray-500">{method.replace(/_/g, ' ')}</span>
                      <span className="text-gray-700">{fmtK(amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100 mt-4">
                  <span className="font-semibold text-gray-700">Expenses</span>
                  <span className="font-semibold text-red-600">({fmtK(totalExpenses)})</span>
                </div>

                <div className="pl-4 space-y-1">
                  {expensesByCategory.map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-gray-500">{cat.replace(/_/g, ' ')}</span>
                      <span className="text-gray-700">({fmtK(amount)})</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between py-3 border-t-2 border-gray-200 mt-4">
                  <span className="font-bold text-gray-900">Net Profit / (Loss)</span>
                  <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtK(netProfit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Cash Flow ── */}
          {tab === 'cashflow' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Cash In" value={fmtK(totalRevenue)} icon={<TrendingUp size={16} />} color="text-green-600" bg="bg-green-50" />
                <SummaryCard label="Cash Out" value={fmtK(totalExpenses)} icon={<TrendingDown size={16} />} color="text-red-600" bg="bg-red-50" />
                <SummaryCard label="Net Cash Flow" value={fmtK(totalRevenue - totalExpenses)} icon={<DollarSign size={16} />}
                  color={totalRevenue - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}
                  bg={totalRevenue - totalExpenses >= 0 ? 'bg-green-50' : 'bg-red-50'} />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Collections</h3>
                {periodPayments.length === 0 ? <p className="text-sm text-gray-400">No payments in this period.</p> : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100">
                      <tr>{['Date', 'Method', 'Reference', 'Amount'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {periodPayments.slice(0, 50).map((p: any) => (
                        <tr key={p._id} className="border-t border-gray-50">
                          <td className="px-3 py-2">{fmtDate(p.paymentDate)}</td>
                          <td className="px-3 py-2"><Badge label={p.method.replace(/_/g, ' ')} color="gray" /></td>
                          <td className="px-3 py-2 text-gray-400">{p.referenceNumber || '-'}</td>
                          <td className="px-3 py-2 font-medium text-green-600">{fmtK(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Outstanding ── */}
          {tab === 'outstanding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Total Outstanding" value={fmtK(totalOutstanding)} icon={<AlertTriangle size={16} />} color="text-amber-600" bg="bg-amber-50" />
                <SummaryCard label="Overdue" value={String(overdueCount)} icon={<AlertTriangle size={16} />} color="text-red-600" bg="bg-red-50" />
                <SummaryCard label="Pending Invoices" value={String(outstandingInvoices.length)} icon={<FileText size={16} />} color="text-blue-600" bg="bg-blue-50" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {outstandingInvoices.length === 0 ? <div className="p-6 text-center text-sm text-gray-400">No outstanding invoices</div> : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>{['Invoice #', 'Date', 'Total', 'Paid', 'Balance', 'Status'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {outstandingInvoices.map((inv: any) => {
                        const balance = inv.total - (inv.paidAmount || 0);
                        return (
                          <tr key={inv._id} className="border-t border-gray-50">
                            <td className="px-4 py-2.5 font-medium">{inv.invoiceNumber}</td>
                            <td className="px-4 py-2.5">{fmtDate(inv.date)}</td>
                            <td className="px-4 py-2.5">{fmtK(inv.total)}</td>
                            <td className="px-4 py-2.5 text-green-600">{fmtK(inv.paidAmount || 0)}</td>
                            <td className="px-4 py-2.5 font-semibold text-amber-600">{fmtK(balance)}</td>
                            <td className="px-4 py-2.5">
                              <Badge label={inv.status} color={inv.status === 'overdue' ? 'peach' : 'gray'} />
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

          {/* ── Tax Summary ── */}
          {tab === 'tax' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Total Tax Collected" value={fmtK(totalTax)} icon={<Receipt size={16} />} color="text-purple-600" bg="bg-purple-50" />
                <SummaryCard label="Taxable Revenue" value={fmtK(totalInvoiced)} icon={<FileText size={16} />} color="text-blue-600" bg="bg-blue-50" />
                <SummaryCard label="Effective Rate" value={totalInvoiced > 0 ? `${((totalTax / totalInvoiced) * 100).toFixed(1)}%` : '0%'} icon={<DollarSign size={16} />} color="text-gray-600" bg="bg-gray-50" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
                <h3 className="font-semibold text-gray-900">Tax Liability</h3>
                <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-600">Total tax charged on invoices</span>
                  <span className="font-semibold">{fmtK(totalTax)}</span>
                </div>
                <p className="text-xs text-gray-400">
                  This represents the total tax collected on invoices in the selected period. 
                  Consult your accountant for filing requirements.
                </p>
              </div>
            </div>
          )}

          {/* ── Interactive Ledger Workbook ── */}
          {tab === 'workbook' && (
            <LedgerWorkbook />
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <div className={`${bg} ${color} p-1.5 rounded-lg`}>{icon}</div>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
