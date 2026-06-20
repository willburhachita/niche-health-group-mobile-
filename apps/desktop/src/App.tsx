import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppShell from './layouts/AppShell';

import LoginScreen from './screens/auth/LoginScreen';
import OTPScreen from './screens/auth/OTPScreen';
import PasswordScreen from './screens/auth/PasswordScreen';

import DashboardScreen from './screens/home/DashboardScreen';
import MessagesScreen from './screens/messages/MessagesScreen';
import ChannelsScreen from './screens/channels/ChannelsScreen';
import ScheduleScreen from './screens/schedule/ScheduleScreen';

import PatientsScreen from './screens/clinic/PatientsScreen';
import AppointmentsScreen from './screens/clinic/AppointmentsScreen';
import InvoicesScreen from './screens/clinic/InvoicesScreen';
import TreatmentNotesScreen from './screens/clinic/TreatmentNotesScreen';
import TelehealthScreen from './screens/clinic/TelehealthScreen';
import DepartmentsScreen from './screens/clinic/DepartmentsScreen';

import StockScreen from './screens/operations/StockScreen';
import SuppliersScreen from './screens/operations/SuppliersScreen';
import PaymentsScreen from './screens/operations/PaymentsScreen';
import ExpensesScreen from './screens/operations/ExpensesScreen';
import ReportsScreen from './screens/operations/ReportsScreen';

import StaffScreen from './screens/admin/StaffScreen';
import DeviceApprovalsScreen from './screens/admin/DeviceApprovalsScreen';
import AnnouncementsScreen from './screens/admin/AnnouncementsScreen';
import ManageChannelsScreen from './screens/admin/ManageChannelsScreen';
import AnalyticsScreen from './screens/admin/AnalyticsScreen';
import ActivityLogsScreen from './screens/admin/ActivityLogsScreen';
import TimeTrackingScreen from './screens/admin/TimeTrackingScreen';
import ShiftManagementScreen from './screens/admin/ShiftManagementScreen';
import ServiceTypesScreen from './screens/admin/ServiceTypesScreen';
import ConfigurationScreen from './screens/admin/ConfigurationScreen';
import ArchiveManagementScreen from './screens/admin/ArchiveManagementScreen';
import TemplateDesignerScreen from './screens/clinic/TemplateDesignerScreen';
import AccountingScreen from './screens/operations/AccountingScreen';
import InsuranceClaimsScreen from './screens/accounting/InsuranceClaimsScreen';
import PayrollScreen from './screens/accounting/PayrollScreen';

import SettingsScreen from './screens/settings/SettingsScreen';
import AccessDeniedScreen from './screens/AccessDeniedScreen';
import { type Permission } from './utils/permissions';

function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: Permission }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <img src="/logo.png" alt="NHL Connect" className="w-28 h-28 object-contain drop-shadow-md" />
        <div className="w-7 h-7 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Connecting…</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/otp" element={<OTPScreen />} />
      <Route path="/password" element={<PasswordScreen />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardScreen />} />
        
        {/* Main section */}
        <Route path="messages" element={<ProtectedRoute permission="messaging"><MessagesScreen /></ProtectedRoute>} />
        <Route path="channels" element={<ProtectedRoute permission="channels"><ChannelsScreen /></ProtectedRoute>} />
        <Route path="schedule" element={<ProtectedRoute permission="viewAppointments"><ScheduleScreen /></ProtectedRoute>} />

        {/* Clinic section */}
        <Route path="patients" element={<ProtectedRoute permission="viewPatients"><PatientsScreen /></ProtectedRoute>} />
        <Route path="appointments" element={<ProtectedRoute permission="viewAppointments"><AppointmentsScreen /></ProtectedRoute>} />
        <Route path="invoices" element={<ProtectedRoute permission="viewFinancials"><InvoicesScreen /></ProtectedRoute>} />
        <Route path="treatment-notes" element={<ProtectedRoute permission="viewTreatmentNote"><TreatmentNotesScreen /></ProtectedRoute>} />
        <Route path="telehealth" element={<ProtectedRoute permission="manageTelehealth"><TelehealthScreen /></ProtectedRoute>} />
        <Route path="departments" element={<ProtectedRoute permission="clinicDashboard"><DepartmentsScreen /></ProtectedRoute>} />

        {/* Operations section */}
        <Route path="stock" element={<ProtectedRoute permission="manageStock"><StockScreen /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute permission="manageSuppliers"><SuppliersScreen /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute permission="managePayments"><PaymentsScreen /></ProtectedRoute>} />
        <Route path="expenses" element={<ProtectedRoute permission="manageExpenses"><ExpensesScreen /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute permission="viewReports"><ReportsScreen /></ProtectedRoute>} />
        <Route path="accounting" element={<ProtectedRoute permission="viewFinancials"><AccountingScreen /></ProtectedRoute>} />
        <Route path="accounting/claims" element={<ProtectedRoute permission="viewFinancials"><InsuranceClaimsScreen /></ProtectedRoute>} />
        <Route path="accounting/payroll" element={<ProtectedRoute permission="viewFinancials"><PayrollScreen /></ProtectedRoute>} />

        {/* Administration section */}
        <Route path="admin/staff" element={<ProtectedRoute permission="manageStaff"><StaffScreen /></ProtectedRoute>} />
        <Route path="admin/devices" element={<ProtectedRoute permission="approveDevices"><DeviceApprovalsScreen /></ProtectedRoute>} />
        <Route path="admin/announcements" element={<ProtectedRoute permission="sendAnnouncements"><AnnouncementsScreen /></ProtectedRoute>} />
        <Route path="admin/channels" element={<ProtectedRoute permission="manageChannels"><ManageChannelsScreen /></ProtectedRoute>} />
        <Route path="admin/analytics" element={<ProtectedRoute permission="viewAnalytics"><AnalyticsScreen /></ProtectedRoute>} />
        <Route path="admin/logs" element={<ProtectedRoute permission="viewActivityLogs"><ActivityLogsScreen /></ProtectedRoute>} />
        <Route path="admin/shifts" element={<ProtectedRoute permission="manageShifts"><ShiftManagementScreen /></ProtectedRoute>} />
        <Route path="admin/service-types" element={<ProtectedRoute permission="adminPanel"><ServiceTypesScreen /></ProtectedRoute>} />
        <Route path="admin/configuration" element={<ProtectedRoute permission="adminPanel"><ConfigurationScreen /></ProtectedRoute>} />
        <Route path="admin/archive" element={<ProtectedRoute permission="adminPanel"><ArchiveManagementScreen /></ProtectedRoute>} />
        <Route path="admin/note-templates" element={<ProtectedRoute permission="adminPanel"><TemplateDesignerScreen /></ProtectedRoute>} />
        <Route path="time-tracking" element={<ProtectedRoute permission="clockInOut"><TimeTrackingScreen /></ProtectedRoute>} />

        <Route path="settings" element={<SettingsScreen />} />
        <Route path="access-denied" element={<AccessDeniedScreen />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
