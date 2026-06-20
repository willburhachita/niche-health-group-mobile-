import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { BarChart2, TrendingUp } from 'lucide-react';
import { StatCard, Card, Spinner } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B4B8A', '#F0A882', '#10b981', '#f59e0b', '#6366f1', '#ef4444'];

export default function ReportsScreen() {
  const invoices = useQuery(api.invoices.list, {});
  const patients = useQuery(api.patients.list, {});
  const expSummary = useQuery(api.expenses.summary);
  const paymentSummary = useQuery(api.paymentsClinic.summary);
  const stockAlerts = useQuery(api.stock.alerts);

  const totalRevenue = (invoices || []).filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || 0), 0);
  const unpaidRevenue = (invoices || []).filter((i: any) => i.status === 'unpaid' || i.status === 'overdue').reduce((s: number, i: any) => s + (i.total || 0), 0);
  const profit = totalRevenue - (expSummary?.total || 0);

  // Group invoices by month for chart
  const monthlyData: Record<string, { month: string; revenue: number; invoices: number }> = {};
  (invoices || []).forEach((inv: any) => {
    if (!inv.createdAt) return;
    const d = new Date(inv.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    if (!monthlyData[key]) monthlyData[key] = { month: label, revenue: 0, invoices: 0 };
    if (inv.status === 'paid') monthlyData[key].revenue += inv.total || 0;
    monthlyData[key].invoices++;
  });
  const chartData = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);

  // Expense by category for pie chart
  const pieData = Object.entries(expSummary?.byCategory || {}).map(([name, value]) => ({ name, value: value as number }));

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <h2 className="text-base font-semibold text-gray-900">Financial Reports</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue (Paid)" value={`K ${totalRevenue.toLocaleString()}`} icon={<TrendingUp size={18} />} color="text-green-600" />
        <StatCard label="Outstanding" value={`K ${unpaidRevenue.toLocaleString()}`} icon={<BarChart2 size={18} />} color="text-amber-600" />
        <StatCard label="Total Expenses" value={`K ${(expSummary?.total || 0).toLocaleString()}`} icon={<BarChart2 size={18} />} color="text-red-500" />
        <StatCard label="Net Profit" value={`K ${profit.toLocaleString()}`} icon={<TrendingUp size={18} />} color={profit >= 0 ? 'text-green-600' : 'text-red-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="col-span-2 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue (Last 6 Months)</h3>
          {!invoices ? <div className="flex justify-center py-10"><Spinner /></div>
            : chartData.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `K${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [`K ${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3B4B8A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
        </Card>

        {/* Expense breakdown */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</h3>
          {!expSummary ? <div className="flex justify-center py-10"><Spinner /></div>
            : pieData.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No expenses yet</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `K ${v.toLocaleString()}`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
        </Card>
      </div>

      {/* Stock & Patient summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Total Patients" value={patients?.length ?? '—'} icon={<BarChart2 size={18} />} color="text-navy" />
        <StatCard label="Low Stock Items" value={stockAlerts?.lowStockCount ?? '—'} icon={<BarChart2 size={18} />} color="text-amber-600" />
        <StatCard label="Expired Stock" value={stockAlerts?.expiredCount ?? '—'} icon={<BarChart2 size={18} />} color="text-red-500" />
      </div>
    </div>
  );
}
