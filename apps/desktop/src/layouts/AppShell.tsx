import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/messages': 'Messages',
  '/channels': 'Channels',
  '/schedule': 'Schedule',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/invoices': 'Invoices',
  '/treatment-notes': 'Treatment Notes',
  '/telehealth': 'Telehealth',
  '/departments': 'Departments',
  '/stock': 'Stock & Inventory',
  '/suppliers': 'Suppliers',
  '/payments': 'Payments',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/admin/staff': 'Staff Management',
  '/admin/devices': 'Device Approvals',
  '/admin/announcements': 'Announcements',
  '/admin/channels': 'Manage Channels',
  '/admin/analytics': 'Analytics',
  '/admin/logs': 'Activity Logs',
  '/admin/shifts': 'Shift Management',
  '/admin/note-templates': 'Note Templates',
  '/admin/service-types': 'Service Types',
  '/admin/configuration': 'Clinic Configuration',
  '/accounting': 'Accounting',
  '/time-tracking': 'Time Tracking',
  '/settings': 'Settings',
};

export default function AppShell() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'NHL Connect';

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
