import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, FileText, Package, TrendingUp, Clock, CheckCircle, AlertCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { StatCard, Card, Badge, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const statusColor: Record<string, 'gray' | 'amber' | 'blue' | 'green' | 'navy' | 'red'> = {
  pending: 'amber', confirmed: 'blue', arrived: 'navy', completed: 'green', cancelled: 'red', open: 'gray',
};

export default function DashboardScreen() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const todayStats = useQuery(api.appointments.todayStats);
  const patients = useQuery(api.patients.list, {});
  const invoices = useQuery(api.invoices.list, {});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = account?.displayName || account?.fullName || 'there';

  const stockItems = useQuery(api.stock.list, {});

  const totalPatients = patients?.length ?? 0;
  const outstandingInvoices = invoices?.filter((i: any) => !i.isArchived && (i.status === 'unpaid' || i.status === 'open' || i.status === 'overdue' || i.status === 'partial')) ?? [];
  const unpaidInvoices = outstandingInvoices.length;
  const overdueInvoices = outstandingInvoices.filter((i: any) => i.status === 'overdue');
  const totalOutstanding = outstandingInvoices.reduce((s: number, i: any) => s + (i.total || 0) - (i.paidAmount || 0), 0);
  const lowStockCount = (stockItems || []).filter((s: any) => !s.isArchived && s.stockLevel <= (s.reorderPoint || 5)).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{greeting}, {displayName}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={totalPatients} icon={<Users size={18} />} color="text-navy" sub="All time" onClick={() => navigate('/patients')} />
        <StatCard
          label="Today's Appointments"
          value={todayStats?.total ?? '—'}
          icon={<CalendarCheck size={18} />}
          color="text-navy"
          sub={todayStats ? `${todayStats.completed} completed` : 'Loading...'}
          onClick={() => navigate('/appointments')}
        />
        <StatCard label="Unpaid Invoices" value={unpaidInvoices} icon={<FileText size={18} />} color="text-amber-600" sub="Awaiting payment" onClick={() => navigate('/invoices')} />
        <StatCard label="Stock Alerts" value={lowStockCount || 0} icon={<Package size={18} />} color={lowStockCount > 0 ? 'text-red-600' : 'text-green-600'} sub={lowStockCount > 0 ? `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} low` : 'All stocked'} onClick={() => navigate('/stock')} />
      </div>

      {/* Today row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointment status breakdown */}
        <Card className="p-5 col-span-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Today's Appointment Status</h3>
          {!todayStats ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Pending', value: todayStats.pending, color: 'bg-amber-400' },
                { label: 'Confirmed', value: todayStats.confirmed, color: 'bg-blue-400' },
                { label: 'Arrived', value: todayStats.arrived, color: 'bg-navy' },
                { label: 'Completed', value: todayStats.completed, color: 'bg-green-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.color}`} />
                  <span className="text-sm text-gray-600 flex-1">{s.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                  {todayStats.total > 0 && (
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${(s.value / todayStats.total) * 100}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'New Patient', icon: <Users size={16} />, to: '/patients' },
              { label: 'Book Appointment', icon: <CalendarCheck size={16} />, to: '/appointments' },
              { label: 'Create Invoice', icon: <FileText size={16} />, to: '/invoices' },
              { label: 'Adjust Stock', icon: <Package size={16} />, to: '/stock' },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-navy/30 hover:bg-navy-50 transition text-center"
              >
                <span className="text-navy">{a.icon}</span>
                <span className="text-xs font-medium text-gray-700">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Outstanding invoices widget */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Outstanding Invoices</h3>
            <button onClick={() => navigate('/accounting')} className="text-xs text-navy hover:underline">Accounting</button>
          </div>
          {!invoices ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : outstandingInvoices.length === 0 ? (
            <div className="flex flex-col items-center py-4 gap-1">
              <CheckCircle size={20} className="text-green-400" />
              <p className="text-sm text-gray-400">All invoices settled</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /><span className="text-xs font-medium text-amber-700">Total Outstanding</span></div>
                <span className="text-sm font-bold text-amber-700">K{totalOutstanding.toLocaleString()}</span>
              </div>
              {overdueInvoices.length > 0 && (
                <div className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2"><AlertCircle size={14} className="text-red-500" /><span className="text-xs font-medium text-red-600">Overdue</span></div>
                  <span className="text-sm font-bold text-red-600">{overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {outstandingInvoices.slice(0, 8).map((inv: any) => {
                  const pat = patients?.find((p: any) => p._id === inv.patientId);
                  return (
                    <div key={inv._id} className="flex items-center justify-between py-1 cursor-pointer hover:bg-gray-50 rounded px-1" onClick={() => navigate('/invoices')}>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-400">{pat?.displayName || 'Patient'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-amber-600">K{((inv.total || 0) - (inv.paidAmount || 0)).toLocaleString()}</p>
                        <Badge label={inv.status} color={inv.status === 'overdue' ? 'red' : 'amber'} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {outstandingInvoices.length > 8 && <p className="text-xs text-center text-gray-400">+{outstandingInvoices.length - 8} more</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
