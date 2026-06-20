import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import {
  Home, MessageSquare, Hash, Calendar, Users, CalendarCheck,
  FileText, Package, Truck, CreditCard, Receipt, BarChart2,
  Video, Building2, Shield, UserCog, Monitor, Megaphone,
  Settings, LogOut, ChevronDown, ChevronRight, Layers,
  Clock, CalendarRange, Calculator, Settings2, Tag, DollarSign, Archive,
} from 'lucide-react';
import { cn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { type Permission } from '../utils/permissions';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
  permission?: Permission;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  permission?: Permission;
}

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: <Home size={16} />, to: '/dashboard' },
      { label: 'Messages', icon: <MessageSquare size={16} />, to: '/messages', permission: 'messaging' },
      { label: 'Channels', icon: <Hash size={16} />, to: '/channels', permission: 'channels' },
      { label: 'Schedule', icon: <Calendar size={16} />, to: '/schedule', permission: 'viewAppointments' },
    ],
  },
  {
    label: 'Clinic',
    permission: 'clinicDashboard',
    items: [
      { label: 'Patients', icon: <Users size={16} />, to: '/patients', permission: 'viewPatients' },
      { label: 'Appointments', icon: <CalendarCheck size={16} />, to: '/appointments', permission: 'viewAppointments' },
      { label: 'Invoices', icon: <FileText size={16} />, to: '/invoices', permission: 'viewFinancials' },
      { label: 'Treatment Notes', icon: <Layers size={16} />, to: '/treatment-notes', permission: 'viewTreatmentNote' },
      { label: 'Telehealth', icon: <Video size={16} />, to: '/telehealth', permission: 'manageTelehealth' },
      { label: 'Time Tracking', icon: <Clock size={16} />, to: '/time-tracking', permission: 'clockInOut' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Stock & Inventory', icon: <Package size={16} />, to: '/stock', permission: 'manageStock' },
      { label: 'Suppliers', icon: <Truck size={16} />, to: '/suppliers', permission: 'manageSuppliers' },
      { label: 'Payments', icon: <CreditCard size={16} />, to: '/payments', permission: 'managePayments' },
      { label: 'Expenses', icon: <Receipt size={16} />, to: '/expenses', permission: 'manageExpenses' },
      { label: 'Reports', icon: <BarChart2 size={16} />, to: '/reports', permission: 'viewReports' },
      { label: 'Accounting', icon: <Calculator size={16} />, to: '/accounting', permission: 'viewFinancials' },
      { label: 'Insurance Claims', icon: <Shield size={16} />, to: '/accounting/claims', permission: 'viewFinancials' },
      { label: 'Payroll System', icon: <DollarSign size={16} />, to: '/accounting/payroll', permission: 'viewFinancials' },
    ],
  },
  {
    label: 'Administration',
    permission: 'adminPanel',
    items: [
      { label: 'Staff Management', icon: <UserCog size={16} />, to: '/admin/staff', permission: 'manageStaff' },
      { label: 'Device Approvals', icon: <Monitor size={16} />, to: '/admin/devices', permission: 'approveDevices' },
      { label: 'Announcements', icon: <Megaphone size={16} />, to: '/admin/announcements', permission: 'sendAnnouncements' },
      { label: 'Manage Channels', icon: <Hash size={16} />, to: '/admin/channels', permission: 'manageChannels' },
      { label: 'Analytics', icon: <BarChart2 size={16} />, to: '/admin/analytics', permission: 'viewAnalytics' },
      { label: 'Shift Management', icon: <CalendarRange size={16} />, to: '/admin/shifts', permission: 'manageShifts' },
      { label: 'Note Templates', icon: <FileText size={16} />, to: '/admin/note-templates', permission: 'adminPanel' },
      { label: 'Service Types', icon: <Tag size={16} />, to: '/admin/service-types', permission: 'adminPanel' },
      { label: 'Configuration', icon: <Settings2 size={16} />, to: '/admin/configuration', permission: 'adminPanel' },
      { label: 'Archive Management', icon: <Archive size={16} />, to: '/admin/archive', permission: 'adminPanel' },
      { label: 'Activity Logs', icon: <Shield size={16} />, to: '/admin/logs', permission: 'viewActivityLogs' },
    ],
  },
];

export default function Sidebar() {
  const { account, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const unreadMessagesCount = useQuery(api.messages.unreadMessagesCount, account?.userId ? { userId: account.userId } : 'skip');
  const deviceRequests = useQuery(api.auth.listDeviceRequests);
  const stockAlerts = useQuery(api.stock.alerts);

  const getBadgeForPath = (to: string) => {
    if (to === '/messages') {
      const unreadCount = unreadMessagesCount ?? 0;
      if (unreadCount > 0) return unreadCount;
    }
    if (to === '/admin/devices') {
      const pendingCount = deviceRequests
        ? deviceRequests.filter((r: any) => r.status === 'pending').length
        : 0;
      if (pendingCount > 0) return pendingCount;
    }
    if (to === '/stock') {
      const alertCount = stockAlerts
        ? (stockAlerts.lowStockCount + stockAlerts.expiredCount)
        : 0;
      if (alertCount > 0) return alertCount;
    }
    return null;
  };

  const toggle = (label: string) =>
    setCollapsed(c => ({ ...c, [label]: !c[label] }));

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 bg-navy">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="NHL Connect"
            className="w-12 h-12 object-contain shrink-0 rounded-xl bg-white/10 p-1"
          />
          <div>
            <p className="text-base font-bold text-white leading-tight">NHL Connect</p>
            <p className="text-[11px] text-white/50 mt-0.5">Niche Healthcare Ltd</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {navGroups.map(group => {
          if (group.permission && !hasPermission(group.permission)) return null;
          const visibleItems = group.items.filter(i => !i.permission || hasPermission(i.permission));
          if (!visibleItems.length) return null;
          const isCollapsed = collapsed[group.label];

          return (
            <div key={group.label}>
              <button
                onClick={() => toggle(group.label)}
                className="flex items-center justify-between w-full px-2 py-1 mb-1"
              >
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{group.label}</span>
                {isCollapsed ? <ChevronRight size={12} className="text-gray-300" /> : <ChevronDown size={12} className="text-gray-300" />}
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn('flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive
                            ? 'bg-navy text-white font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {(() => {
                        const badge = getBadgeForPath(item.to);
                        if (!badge) return null;

                        const isStock = item.to === '/stock';
                        const isDevice = item.to === '/admin/devices';

                        let badgeBg = 'bg-peach text-white';
                        if (isStock) badgeBg = 'bg-amber-500 text-white';
                        if (isDevice) badgeBg = 'bg-blue-500 text-white';

                        return (
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center leading-none",
                            badgeBg
                          )}>
                            {badge}
                          </span>
                        );
                      })()}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'
            )
          }
        >
          <Settings size={16} />
          Settings
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
