import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { BarChart2, Users, CalendarCheck, FileText, Package } from 'lucide-react';
import { StatCard, Card, Spinner } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export default function AnalyticsScreen() {
  const staff = useQuery(api.auth.getAllStaffAccounts);
  const patients = useQuery(api.patients.list, {});
  const invoices = useQuery(api.invoices.list, {});
  const todayStats = useQuery(api.appointments.todayStats);
  const expSummary = useQuery(api.expenses.summary);
  const paymentSummary = useQuery(api.paymentsClinic.summary);

  const activeStaff = (staff || []).filter((s: any) => s.isActive).length;
  const totalPatients = patients?.length ?? 0;
  const paidInvoices = (invoices || []).filter((i: any) => i.status === 'paid');
  const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0);

  // Monthly revenue + expenses
  const monthlyMap: Record<string, { month: string; revenue: number; expenses: number }> = {};
  (invoices || []).forEach((inv: any) => {
    if (!inv.createdAt || inv.status !== 'paid') return;
    const d = new Date(inv.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    if (!monthlyMap[key]) monthlyMap[key] = { month: label, revenue: 0, expenses: 0 };
    monthlyMap[key].revenue += inv.total || 0;
  });
  const chartData = Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);

  // Role breakdown
  const roleBreakdown = (staff || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.role] = (acc[s.role] || 0) + 1;
    return acc;
  }, {});
  const roleData = Object.entries(roleBreakdown).map(([role, count]) => ({ role: role.charAt(0).toUpperCase() + role.slice(1), count }));

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <h2 className="text-base font-semibold text-gray-900">Analytics Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Staff" value={activeStaff} icon={<Users size={18} />} color="text-navy" />
        <StatCard label="Total Patients" value={totalPatients} icon={<Users size={18} />} color="text-blue-600" />
        <StatCard label="Revenue (Paid)" value={`K ${totalRevenue.toLocaleString()}`} icon={<FileText size={18} />} color="text-green-600" />
        <StatCard label="Today's Appointments" value={todayStats?.total ?? '—'} icon={<CalendarCheck size={18} />} color="text-peach" sub={`${todayStats?.completed ?? 0} completed`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue (Last 6 Months)</h3>
          {!invoices ? <div className="flex justify-center py-10"><Spinner /></div>
            : chartData.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No paid invoices yet</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `K${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [`K ${v.toLocaleString()}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#3B4B8A" strokeWidth={2.5} dot={{ fill: '#3B4B8A', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Staff by Role</h3>
          {!staff ? <div className="flex justify-center py-10"><Spinner /></div>
            : roleData.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No staff yet</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={roleData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis type="category" dataKey="role" tick={{ fontSize: 12, fill: '#6b7280' }} width={70} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F0A882" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Expenses" value={`K ${(expSummary?.total || 0).toLocaleString()}`} icon={<BarChart2 size={18} />} color="text-red-500" />
        <StatCard label="Payments Received" value={`K ${(paymentSummary?.totalReceived || 0).toLocaleString()}`} icon={<BarChart2 size={18} />} color="text-green-600" />
        <StatCard label="Pending Payments" value={`K ${(paymentSummary?.totalPending || 0).toLocaleString()}`} icon={<BarChart2 size={18} />} color="text-amber-600" />
        <StatCard label="Expense Categories" value={Object.keys(expSummary?.byCategory || {}).length} icon={<Package size={18} />} color="text-navy" />
      </div>
    </div>
  );
}
