import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { 
  Plus, CalendarCheck, CheckCircle, XCircle, ChevronDown, ChevronLeft, ChevronRight, 
  Calendar, FileText, Archive, AlertTriangle, Clock, User, MapPin, Check, MessageSquare
} from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Badge, EmptyState, Spinner, Card } from '../../components/ui';
import { format, startOfDay, subDays, subMonths, addYears, isSameDay } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const statusColor: Record<string, 'amber' | 'blue' | 'navy' | 'green' | 'red' | 'gray'> = {
  pending: 'amber', confirmed: 'blue', arrived: 'navy', completed: 'green', cancelled: 'red', open: 'gray',
};

const typeOptions = ['Consultation', 'Follow-up', 'Dialysis', 'Procedure', 'Lab Test', 'Telehealth', 'Check-up', 'Other'].map(v => ({ value: v, label: v }));
const statusOptions = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

const timeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

interface ApptForm {
  patientId: string; providerId: string; type: string; date: string; time: string;
  endTime: string;
  duration: string; location: string; notes: string; status: string;
  reasonForVisit: string; serviceTypeId: string;
  isRecurring: boolean; recurringPattern: string; recurringEndDate: string;
  recurringInterval: string; recurringOccurrences: string; recurringEndType: 'date' | 'occurrences';
  recurringDays?: number[];
}

export const getInitialForm = (): ApptForm => {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd');
  const startHours = String(now.getHours()).padStart(2, '0');
  const startMinutes = String(now.getMinutes()).padStart(2, '0');
  const startTime = `${startHours}:${startMinutes}`;
  
  // Default duration is 30 mins
  const endNow = new Date(now.getTime() + 30 * 60000);
  const endHours = String(endNow.getHours()).padStart(2, '0');
  const endMinutes = String(endNow.getMinutes()).padStart(2, '0');
  const endTime = `${endHours}:${endMinutes}`;

  return {
    patientId: '', providerId: '', type: 'Consultation', date: dateStr, time: startTime,
    endTime: endTime,
    duration: '30', location: '', notes: '', status: 'pending',
    reasonForVisit: '', serviceTypeId: '',
    isRecurring: false, recurringPattern: 'weekly', recurringEndDate: '',
    recurringInterval: '1', recurringOccurrences: '10', recurringEndType: 'date',
    recurringDays: [],
  };
};

const DAY_MS = 86400000;

export default function AppointmentsScreen() {
  const { account, hasPermission } = useAuth();
  const navigate = useNavigate();

  // Selected date is the center of our week view
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  
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
    }, 4000);
  };

  // Accordion Toggles
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    skipAhead: false,
    practitioners: true,
    availability: false,
    waitList: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Practitioner Filters (Default all checked — initialized empty, then populated from staff)
  const [checkedPractitioners, setCheckedPractitioners] = useState<string[]>([]);
  const [practitionersInitialized, setPractitionersInitialized] = useState(false);
  
  const handleTogglePractitioner = (identifier: string) => {
    if (checkedPractitioners.includes(identifier)) {
      setCheckedPractitioners(checkedPractitioners.filter(p => p !== identifier));
    } else {
      setCheckedPractitioners([...checkedPractitioners, identifier]);
    }
  };

  // Mock Waitlist
  const [waitList, setWaitList] = useState<any[]>([
    { id: 'w1', name: 'Memory Mulenga', reason: 'High blood pressure follow-up', type: 'Follow-up', phone: '0977112233' },
    { id: 'w2', name: 'Bwalya Chanda', reason: 'Consultation with Oscar', type: 'Consultation', phone: '0966445566' },
    { id: 'w3', name: 'Kabaso Mwansa', reason: 'Routine dialysis check', type: 'Dialysis', phone: '0955778899' },
    { id: 'w4', name: 'Mutale Kapambwe', reason: 'General Check-up', type: 'Check-up', phone: '0974223344' }
  ]);

  // Appointment creation states
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null); // For detailed metadata view
  const [form, setForm] = useState<ApptForm>(getInitialForm());
  const [saving, setSaving] = useState(false);
  const [bookError, setBookError] = useState('');

  // Reschedule states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    endTime: '',
    duration: '30',
    providerId: '',
  });
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Confirmation/Warning Modal States
  const [showDuplicateInvoiceModal, setShowDuplicateInvoiceModal] = useState(false);
  const [existingInvoiceData, setExistingInvoiceData] = useState<any>(null);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);

  // Compute 7 days of the active week based on selectedDate (Starts on Sunday)
  const weekDays = useMemo(() => {
    const currentDay = selectedDate.getDay();
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - currentDay);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  // Fetch range covering the week
  const { startFrom, startTo } = useMemo(() => {
    const start = startOfDay(weekDays[0]).getTime();
    const end = startOfDay(weekDays[6]).getTime() + DAY_MS;
    return { startFrom: start, startTo: end };
  }, [weekDays]);

  const appointments = useQuery(api.appointments.listByDateRange, { startFrom, startTo });
  const patients = useQuery(api.patients.list, {});
  const staffAccounts = useQuery(api.auth.getAllStaffAccounts);

  // Practitioner color palette for dynamic assignment
  const staffColorPalette = [
    { bg: 'bg-emerald-500', key: 'emerald' },
    { bg: 'bg-violet-500', key: 'violet' },
    { bg: 'bg-sky-500', key: 'sky' },
    { bg: 'bg-rose-500', key: 'rose' },
    { bg: 'bg-amber-500', key: 'amber' },
    { bg: 'bg-indigo-500', key: 'indigo' },
    { bg: 'bg-teal-500', key: 'teal' },
    { bg: 'bg-pink-500', key: 'pink' },
  ];

  // Build the active practitioner list from real staff accounts
  const practitionerList = useMemo(() => {
    if (!staffAccounts) return [];
    return staffAccounts
      .filter((s: any) => s.isActive)
      .map((s: any, idx: number) => {
        const colorIdx = idx % staffColorPalette.length;
        const displayName = s.displayName || s.fullName || s.email?.split('@')[0] || 'Staff';
        const roleTitle = s.title ? `${s.title}` : s.role || 'Staff';
        return {
          identifier: s.email, // unique key for filtering
          displayName,
          roleTitle,
          color: staffColorPalette[colorIdx].bg,
          colorKey: staffColorPalette[colorIdx].key,
          email: s.email,
          userId: s.userId,
        };
      });
  }, [staffAccounts]);

  // Initialize checked practitioners once staff loads
  React.useEffect(() => {
    if (practitionerList.length > 0 && !practitionersInitialized) {
      setCheckedPractitioners(practitionerList.map(p => p.identifier));
      setPractitionersInitialized(true);
    }
  }, [practitionerList, practitionersInitialized]);
  const serviceTypes = useQuery(api.serviceTypes.listActive);
  const stockItems = useQuery(api.stock.list, {});
  const allInvoices = useQuery(api.invoices.list, {});

  const createAppt = useMutation(api.appointments.create);
  const markArrived = useMutation(api.appointments.markArrived);
  const complete = useMutation(api.appointments.complete);
  const cancel = useMutation(api.appointments.cancel);
  const archiveAppt = useMutation(api.appointments.archive);
  const updateAppt = useMutation(api.appointments.update);
  const createInvoice = useMutation(api.invoices.create);
  const nextInvNumber = useQuery(api.invoices.getNextNumber, {});

  // Uninvoiced filtering check
  const invoicedApptIds = new Set((allInvoices || []).map((inv: any) => inv.appointmentId).filter(Boolean));

  const handleDraftInvoice = async () => {
    if (!selected?.patientId) return;

    // Check if invoice already exists
    const existingInvoice = (allInvoices || []).find((inv: any) => inv.appointmentId === selected._id);
    if (existingInvoice) {
      setExistingInvoiceData(existingInvoice);
      setShowDuplicateInvoiceModal(true);
      return;
    }

    try {
      // Auto-populate from service type if available, using serviceTypeId or matching name
      const svcId = selected.serviceTypeId;
      const svc = (serviceTypes || []).find((s: any) => 
        (svcId && s._id === svcId) || 
        (selected.type && s.name.toLowerCase() === selected.type.toLowerCase())
      );
      
      const lineItems: { description: string; quantity: number; unitPrice: number; stockItemId?: any }[] = [];
      if (svc) {
        lineItems.push({ description: svc.name, quantity: 1, unitPrice: svc.fixedPrice });
        (svc.stockItems || []).forEach((si: any) => {
          const item = (stockItems || []).find((s: any) => s._id === si.stockItemId);
          if (item) lineItems.push({ description: `${item.name} (stock)`, quantity: si.quantity, unitPrice: item.pricePerItem, stockItemId: item._id });
        });
      } else {
        lineItems.push({ description: selected.type || 'Consultation', quantity: 1, unitPrice: 0 });
      }
      await createInvoice({
        invoiceNumber: nextInvNumber || 'INV-001',
        patientId: selected.patientId,
        appointmentId: selected._id,
        dueDate: Date.now() + 30 * 86400000,
        lineItems,
        tax: 0,
        status: 'draft',
        notes: `Draft from appointment ${format(new Date(selected.startTime), 'dd MMM yyyy HH:mm')}`,
        createdBy: account?.email || 'admin',
      });
      showToast('Invoice drafted successfully! Go to Invoices to view.', 'success');
      setSelected(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to draft invoice', 'error');
    }
  };

  const set = (k: keyof ApptForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const patientOptions = (patients || []).map((p: any) => ({ value: p._id, label: p.displayName || 'Unknown Patient' }));

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    reason: 'Feeling better',
    notes: '',
    cancelSeries: false,
  });

  const calculatedDates = useMemo(() => {
    if (!form.isRecurring || !form.date) return [];
    
    const startDateTime = new Date(`${form.date}T${form.time || '08:00'}`);
    if (isNaN(startDateTime.getTime())) return [];

    const dates: Date[] = [];
    
    if (form.recurringPattern === 'weekly' && form.recurringDays && form.recurringDays.length > 0) {
      const daysSet = new Set(form.recurringDays);
      let currentStart = new Date(startDateTime);
      
      let found = false;
      for (let i = 0; i < 7; i++) {
        if (daysSet.has(currentStart.getDay())) {
          found = true;
          break;
        }
        currentStart.setDate(currentStart.getDate() + 1);
      }
      
      if (!found) return [];

      const limitOccurrences = form.recurringEndType === 'occurrences' ? (parseInt(form.recurringOccurrences) || 10) : 100;
      const maxCheckedDays = 365;
      let count = 0;
      let daysCheck = 0;
      
      let endLimitTime = form.recurringEndType === 'date' && form.recurringEndDate ? new Date(`${form.recurringEndDate}T23:59:59`).getTime() : null;
      
      if (endLimitTime && currentStart.getTime() > endLimitTime) {
        return [];
      }
      
      dates.push(new Date(currentStart));
      count++;
      
      while (count < limitOccurrences && daysCheck < maxCheckedDays) {
        currentStart.setDate(currentStart.getDate() + 1);
        daysCheck++;
        
        if (endLimitTime && currentStart.getTime() > endLimitTime) {
          break;
        }
        
        if (daysSet.has(currentStart.getDay())) {
          dates.push(new Date(currentStart));
          count++;
        }
      }
    } else {
      let basePatternMs = 0;
      if (form.recurringPattern === 'daily') basePatternMs = 86400000;
      else if (form.recurringPattern === 'weekly') basePatternMs = 7 * 86400000;
      else if (form.recurringPattern === 'monthly') basePatternMs = 30 * 86400000;
      
      if (basePatternMs > 0) {
        const limitOccurrences = form.recurringEndType === 'occurrences' ? (parseInt(form.recurringOccurrences) || 10) : 100;
        let count = 0;
        let nextStart = startDateTime.getTime();
        let endLimitTime = form.recurringEndType === 'date' && form.recurringEndDate ? new Date(`${form.recurringEndDate}T23:59:59`).getTime() : null;
        
        while (count < limitOccurrences) {
          if (endLimitTime && nextStart > endLimitTime) {
            break;
          }
          dates.push(new Date(nextStart));
          nextStart += basePatternMs;
          count++;
        }
      }
    }
    
    return dates;
  }, [
    form.isRecurring,
    form.date,
    form.time,
    form.recurringPattern,
    form.recurringDays,
    form.recurringEndType,
    form.recurringEndDate,
    form.recurringOccurrences
  ]);

  const handleSave = async () => {
    setBookError('');
    if (!form.patientId) { setBookError('Please select a patient.'); return; }
    if (!form.date) { setBookError('Please select a date.'); return; }
    if (!form.time) { setBookError('Please select a time.'); return; }
    setSaving(true);
    try {
      const dt = new Date(`${form.date}T${form.time}`);
      const dur = parseInt(form.duration) || 30;
      const payload: any = {
        patientId: form.patientId as any,
        providerId: form.providerId || account?.email || 'staff',
        type: form.type || undefined,
        serviceTypeId: form.serviceTypeId || undefined,
        startTime: dt.getTime(),
        endTime: dt.getTime() + dur * 60000,
        duration: dur,
        location: form.location || undefined,
        status: form.status,
        notes: form.notes || undefined,
        reasonForVisit: form.reasonForVisit || undefined,
        isRecurring: form.isRecurring,
        recurringPattern: form.isRecurring ? form.recurringPattern : undefined,
        recurringEndDate: form.isRecurring && form.recurringEndType === 'date' && form.recurringEndDate ? new Date(`${form.recurringEndDate}T23:59:59`).getTime() : undefined,
        recurringInterval: form.isRecurring ? (parseInt(form.recurringInterval) || 1) : undefined,
        recurringOccurrences: form.isRecurring && form.recurringEndType === 'occurrences' ? (parseInt(form.recurringOccurrences) || 10) : undefined,
        recurringDays: form.isRecurring && form.recurringPattern === 'weekly' && form.recurringDays && form.recurringDays.length > 0
          ? form.recurringDays
          : undefined,
        createdBy: account?.email || 'admin',
      };
      await createAppt(payload);
      showToast('Appointment successfully scheduled!', 'success');
      setShowModal(false);
      setForm(getInitialForm());
      setBookError('');
    } catch (e: any) {
      setBookError(e?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRescheduleSave = async () => {
    setRescheduleError('');
    if (!rescheduleForm.date) { setRescheduleError('Please select a date.'); return; }
    if (!rescheduleForm.time) { setRescheduleError('Please select a time.'); return; }
    if (!rescheduleForm.providerId) { setRescheduleError('Please select a practitioner.'); return; }
    setRescheduleSaving(true);
    try {
      const dt = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`);
      const dur = parseInt(rescheduleForm.duration) || 30;
      await updateAppt({
        id: selected._id,
        startTime: dt.getTime(),
        endTime: dt.getTime() + dur * 60000,
        duration: dur,
        providerId: rescheduleForm.providerId,
        updatedBy: account?.email || 'admin',
      });
      showToast('Appointment successfully rescheduled!', 'success');
      setShowRescheduleModal(false);
      setSelected(null);
    } catch (e: any) {
      setRescheduleError(e?.message || 'Failed to reschedule appointment. Please try again.');
    } finally {
      setRescheduleSaving(false);
    }
  };

  // Navigations for calendar week
  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() - 7);
    setSelectedDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() + 7);
    setSelectedDate(d);
  };

  const handlePrevMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(calendarMonth.getMonth() - 1);
    setCalendarMonth(d);
  };

  const handleNextMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(calendarMonth.getMonth() + 1);
    setCalendarMonth(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
    setCalendarMonth(new Date());
  };

  // Mini-calendar days helper
  const daysInCalendar = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Fill previous month overlap days
    const padBefore = firstDayOfMonth.getDay();
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = padBefore - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLast - i),
        current: false,
      });
    }
    
    // Fill active month days
    const totalDays = lastDayOfMonth.getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        current: true,
      });
    }
    
    // Fill next month overlap days
    const padAfter = 42 - days.length;
    for (let i = 1; i <= padAfter; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        current: false,
      });
    }
    
    return days;
  }, [calendarMonth]);

  // Dynamic practitioner color mapping based on staff index
  const colorThemes: Record<string, { bg: string; text: string; border: string; labelBg: string }> = {
    emerald: { bg: 'bg-emerald-50/95 hover:bg-emerald-100/95', text: 'text-emerald-800', border: 'border-emerald-200 border-l-4 border-l-emerald-500 shadow-sm', labelBg: 'bg-emerald-100' },
    violet: { bg: 'bg-violet-50/95 hover:bg-violet-100/95', text: 'text-violet-800', border: 'border-violet-200 border-l-4 border-l-violet-500 shadow-sm', labelBg: 'bg-violet-100' },
    sky: { bg: 'bg-sky-50/95 hover:bg-sky-100/95', text: 'text-sky-800', border: 'border-sky-200 border-l-4 border-l-sky-500 shadow-sm', labelBg: 'bg-sky-100' },
    rose: { bg: 'bg-rose-50/95 hover:bg-rose-100/95', text: 'text-rose-800', border: 'border-rose-200 border-l-4 border-l-rose-500 shadow-sm', labelBg: 'bg-rose-100' },
    amber: { bg: 'bg-amber-50/95 hover:bg-amber-100/95', text: 'text-amber-800', border: 'border-amber-200 border-l-4 border-l-amber-500 shadow-sm', labelBg: 'bg-amber-100' },
    indigo: { bg: 'bg-indigo-50/95 hover:bg-indigo-100/95', text: 'text-indigo-800', border: 'border-indigo-200 border-l-4 border-l-indigo-500 shadow-sm', labelBg: 'bg-indigo-100' },
    teal: { bg: 'bg-teal-50/95 hover:bg-teal-100/95', text: 'text-teal-800', border: 'border-teal-200 border-l-4 border-l-teal-500 shadow-sm', labelBg: 'bg-teal-100' },
    pink: { bg: 'bg-pink-50/95 hover:bg-pink-100/95', text: 'text-pink-800', border: 'border-pink-200 border-l-4 border-l-pink-500 shadow-sm', labelBg: 'bg-pink-100' },
    default: { bg: 'bg-blue-50/95 hover:bg-blue-100/95', text: 'text-blue-800', border: 'border-blue-200 border-l-4 border-l-blue-500 shadow-sm', labelBg: 'bg-blue-100' },
  };

  // Get color theme for a practitioner by their providerId
  const getPractitionerTheme = (providerId: string) => {
    const prac = practitionerList.find(p => p.email === providerId || p.userId === providerId);
    if (prac) return colorThemes[prac.colorKey] || colorThemes.default;
    return colorThemes.default;
  };

  // Resolve providerId to a clean short display name
  const getPractitionerDisplayName = (providerId: string): string => {
    if (!providerId) return 'Staff';
    const staff = (staffAccounts || []).find((s: any) =>
      s.email === providerId || s.userId === providerId ||
      (s.displayName || '').toLowerCase() === providerId.toLowerCase()
    );
    if (staff) {
      const display = staff.displayName || staff.fullName || staff.email;
      if (display) {
        const parts = display.split(' ').filter(Boolean);
        return parts.length > 2 ? parts.slice(0, 2).join(' ') : display;
      }
    }
    // Fallback: format the raw providerId
    const raw = providerId.split('@')[0];
    const spaced = raw.replace(/([a-z])([A-Z])/g, '$1 $2');
    return spaced.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  // Get the staff title/role for a given providerId
  const getPractitionerTitle = (providerId: string): string => {
    if (!providerId) return '';
    const staff = (staffAccounts || []).find((s: any) =>
      s.email === providerId || s.userId === providerId
    );
    if (staff) return staff.title || staff.role || '';
    return '';
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    return appointments.filter((a: any) => {
      if (a.isArchived) return false;
      
      // Practitioner Checkbox Filter — match by email or userId
      const apptProvider = a.providerId || '';
      if (checkedPractitioners.length > 0 && practitionerList.length > 0) {
        const isChecked = checkedPractitioners.some(identifier => {
          const prac = practitionerList.find(p => p.identifier === identifier);
          if (!prac) return false;
          return prac.email === apptProvider || prac.userId === apptProvider;
        });
        if (!isChecked) return false;
      }
      
      return true;
    });
  }, [appointments, checkedPractitioners]);

  // Hourly grid markers (6:00 to 22:00)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
  const HOUR_HEIGHT = 60; // px per hour row
  const GRID_TOTAL_HEIGHT = hours.length * HOUR_HEIGHT; // 17 × 60 = 1020px

  return (
    <div className="flex h-full bg-gray-50/50">
      {/* Left side panel */}
      <div className="w-80 flex flex-col border-r border-gray-200 bg-white shrink-0 shadow-sm overflow-y-auto scrollbar-thin">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <CalendarCheck size={18} className="text-navy" />
            Scheduler
          </h2>
          {hasPermission('createAppointment') && (
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>Book</Button>
          )}
        </div>

        {/* 1. Mini Monthly Calendar Picker */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {format(calendarMonth, 'MMMM yyyy')}
            </span>
            <div className="flex gap-1">
              <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={idx}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center gap-y-1">
            {daysInCalendar.map((d, idx) => {
              const isSelected = isSameDay(d.date, selectedDate);
              const isTodayDate = isSameDay(d.date, new Date());
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(d.date);
                    if (!d.current) {
                      setCalendarMonth(d.date);
                    }
                  }}
                  className={`w-7 h-7 mx-auto rounded-full text-xs flex items-center justify-center transition-all ${
                    isSelected ? 'bg-navy text-white font-bold' : 
                    isTodayDate ? 'border-2 border-navy text-navy font-bold' : 
                    d.current ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {d.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Wait List Accordion */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleAccordion('waitList')} 
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50/50"
          >
            <div className="flex items-center gap-2">
              <span>Wait List</span>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {waitList.length}
              </span>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${openAccordions.waitList ? 'rotate-180' : ''}`} />
          </button>
          
          {openAccordions.waitList && (
            <div className="p-3 bg-gray-50/50 border-t border-gray-100 space-y-2">
              {waitList.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-2.5 border border-gray-100 shadow-sm space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-semibold text-gray-900">{item.name}</p>
                    <Badge label={item.type} color="blue" />
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-1 italic">"{item.reason}"</p>
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50 mt-1">
                    <span className="text-[10px] text-gray-400 font-mono">{item.phone}</span>
                    {hasPermission('createAppointment') && (
                      <button 
                        onClick={() => {
                          setForm({
                            ...getInitialForm(),
                            patientId: '', // Select patient in dropdown
                            type: item.type,
                            reasonForVisit: item.reason,
                            notes: `Waitlisted patient: ${item.name}`,
                          });
                          setShowModal(true);
                        }}
                        className="text-[11px] font-semibold text-navy hover:underline"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Skip Ahead Accordion */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleAccordion('skipAhead')} 
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50/50"
          >
            <span>Skip Ahead</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${openAccordions.skipAhead ? 'rotate-180' : ''}`} />
          </button>
          {openAccordions.skipAhead && (
            <div className="p-3 grid grid-cols-2 gap-2 bg-gray-50/50 border-t border-gray-100">
              {[
                { label: 'Today', shift: 0, relative: 'day' },
                { label: '+1 Day', shift: 1, relative: 'day' },
                { label: '+3 Days', shift: 3, relative: 'day' },
                { label: '+1 Week', shift: 7, relative: 'day' },
                { label: '+2 Weeks', shift: 14, relative: 'day' },
                { label: '+1 Month', shift: 1, relative: 'month' },
              ].map((jump, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const next = new Date(selectedDate);
                    if (jump.shift === 0) {
                      handleToday();
                    } else if (jump.relative === 'day') {
                      next.setDate(selectedDate.getDate() + jump.shift);
                      setSelectedDate(next);
                      setCalendarMonth(next);
                    } else {
                      next.setMonth(selectedDate.getMonth() + jump.shift);
                      setSelectedDate(next);
                      setCalendarMonth(next);
                    }
                  }}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-navy hover:text-navy transition shadow-sm text-center"
                >
                  {jump.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Practitioners Accordion */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleAccordion('practitioners')} 
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50/50"
          >
            <span>Practitioners</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${openAccordions.practitioners ? 'rotate-180' : ''}`} />
          </button>
          {openAccordions.practitioners && (
            <div className="p-3 bg-gray-50/50 border-t border-gray-100 space-y-2">
              {!staffAccounts ? (
                <div className="flex justify-center py-3"><Spinner /></div>
              ) : practitionerList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No active staff members found.</p>
              ) : practitionerList.map(p => (
                <label 
                  key={p.identifier} 
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={checkedPractitioners.includes(p.identifier)} 
                      onChange={() => handleTogglePractitioner(p.identifier)}
                      className="rounded text-navy focus:ring-navy"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{p.displayName}</p>
                        <p className="text-[10px] text-gray-400">{p.roleTitle}</p>
                      </div>
                    </div>
                  </div>
                  {checkedPractitioners.includes(p.identifier) && (
                    <Check size={14} className="text-navy" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 5. Availability Accordion */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleAccordion('availability')} 
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50/50"
          >
            <span>Availability</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${openAccordions.availability ? 'rotate-180' : ''}`} />
          </button>
          {openAccordions.availability && (
            <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500 space-y-2">
              <div className="flex justify-between items-center font-medium">
                <span>Working Hours:</span>
                <span className="text-navy font-bold">06:00 - 22:00</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Clinic scheduler is active from early morning to late evening to support all practitioner shifts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right calendar timeline area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navigation Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
              {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
            </h1>
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              <button onClick={handlePrevWeek} className="p-1.5 hover:bg-white rounded-md transition text-gray-600">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleToday} className="px-3 py-1 hover:bg-white rounded-md text-xs font-semibold transition text-gray-700">
                Today
              </button>
              <button onClick={handleNextWeek} className="p-1.5 hover:bg-white rounded-md transition text-gray-600">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {hasPermission('createAppointment') && (
            <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Book Appointment</Button>
          )}
        </div>

        {/* Weekly Column Grid Container */}
        <div className="flex-1 overflow-y-auto scrollbar-thin relative bg-white">
          <div className="min-w-[900px] h-full flex flex-col">
            
            {/* Grid Header days */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 select-none">
              {/* Hour columns placeholder */}
              <div className="w-16 border-r border-gray-200 shrink-0 bg-gray-50/50" />
              {weekDays.map((day, idx) => {
                const isTodayDate = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDate(day)}
                    className={`flex-1 py-3 text-center border-r border-gray-100 hover:bg-gray-50/40 cursor-pointer transition ${
                      isTodayDate ? 'bg-navy/[0.02]' : ''
                    }`}
                  >
                    <span className={`block text-xs font-semibold ${isTodayDate ? 'text-navy font-bold' : 'text-gray-400'}`}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={`inline-block mt-1 w-7 h-7 text-sm font-bold rounded-full leading-7 text-center transition-all ${
                      isTodayDate ? 'bg-navy text-white' : 
                      isSelected ? 'bg-gray-800 text-white' : 'text-gray-700'
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time lines & appointments blocks */}
            <div className="flex relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
              
              {/* Left Hour labels column */}
              <div className="w-16 border-r border-gray-200 bg-gray-50/50 shrink-0 select-none">
                {hours.map((hour, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] font-bold text-gray-400 text-right pr-2 border-b border-gray-100/50"
                    style={{ height: `${HOUR_HEIGHT}px`, lineHeight: `${HOUR_HEIGHT}px` }}
                  >
                    {hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                  </div>
                ))}
              </div>

              {/* Day Grid columns */}
              <div className="flex-1 flex relative">
                {/* Horizontal row background lines */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  {hours.map((_, idx) => (
                    <div 
                      key={idx} 
                      className="border-b border-gray-100" 
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}
                </div>

                {/* Day column areas */}
                {weekDays.map((dayDate, dayIdx) => {
                  const dayAppointments = filteredAppointments.filter((a: any) => isSameDay(new Date(a.startTime), dayDate));
                  return (
                    <div 
                      key={dayIdx} 
                      className="flex-1 border-r border-gray-100 relative z-1 hover:bg-gray-50/[0.08] transition"
                      style={{ height: `${GRID_TOTAL_HEIGHT}px` }}
                    >
                      {(() => {
                        // Group into overlapping clusters
                        const sorted = [...dayAppointments].sort((a: any, b: any) => a.startTime - b.startTime);
                        const clusters: any[][] = [];
                        for (const appt of sorted) {
                          let placed = false;
                          for (const cluster of clusters) {
                            const overlaps = cluster.some((c: any) => 
                              appt.startTime < c.endTime && c.startTime < appt.endTime
                            );
                            if (overlaps) {
                              cluster.push(appt);
                              placed = true;
                              break;
                            }
                          }
                          if (!placed) {
                            clusters.push([appt]);
                          }
                        }

                        return clusters.map((cluster: any[]) => {
                          const primaryAppt = cluster[0];
                          const clusterId = `cluster-${primaryAppt._id}-${dayIdx}`;
                          
                          // Calculate bounding box times for the entire cluster
                          const clusterStart = Math.min(...cluster.map((c: any) => c.startTime));
                          const clusterEnd = Math.max(...cluster.map((c: any) => c.endTime));
                          
                          // Pixel-based positioning aligned to 60px/hour grid
                          const startMin = timeToMinutes(format(new Date(clusterStart), 'HH:mm')) || 360;
                          const endMin = timeToMinutes(format(new Date(clusterEnd), 'HH:mm')) || (startMin + 30);
                          const gridStartMin = 6 * 60; // 6 AM
                          
                          const topPx = Math.max(0, ((startMin - gridStartMin) / 60) * HOUR_HEIGHT);
                          const heightPx = Math.max(28, ((endMin - startMin) / 60) * HOUR_HEIGHT);
                          const isCompact = heightPx < 48;
                          
                          // Visual details of primary appointment
                          const patName = patients?.find((p: any) => p._id === primaryAppt.patientId)?.displayName || 'Unknown Patient';
                          const theme = getPractitionerTheme(primaryAppt.providerId || '');
                          const practitionerLabel = getPractitionerDisplayName(primaryAppt.providerId || '');

                          const handleCardClick = (e: React.MouseEvent) => {
                            if (cluster.length > 1) {
                              e.stopPropagation();
                              setHoveredClusterId(hoveredClusterId === clusterId ? null : clusterId);
                            } else {
                              setSelected(primaryAppt);
                            }
                          };

                          return (
                            <div
                              key={primaryAppt._id}
                              className="absolute left-1 right-1 z-10 group"
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                              }}
                              onMouseEnter={() => {
                                if (cluster.length > 1) {
                                  setHoveredClusterId(clusterId);
                                }
                              }}
                              onMouseLeave={() => {
                                if (cluster.length > 1) {
                                  setHoveredClusterId(null);
                                }
                              }}
                            >
                              {/* Card Stack Background Visual Effect (Only for multiple appointments) */}
                              {cluster.length > 1 && (
                                <>
                                  {/* Bottom-most stack card */}
                                  <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-lg border border-gray-200/50 bg-white/40 shadow-sm -z-20 transition-all duration-300 group-hover:translate-x-2 group-hover:translate-y-2" />
                                  {/* Middle stack card */}
                                  <div className="absolute inset-0 translate-x-0.75 translate-y-0.75 rounded-lg border border-gray-200/60 bg-white/70 shadow-sm -z-10 transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
                                </>
                              )}

                              {/* Main Active Card */}
                              <div
                                onClick={handleCardClick}
                                className={`relative w-full h-full rounded-lg border cursor-pointer select-none transition-all hover:shadow-md hover:brightness-[0.97] overflow-hidden ${theme.bg} ${theme.text} ${theme.border}`}
                              >
                                {isCompact ? (
                                  /* Compact layout for short appointments (< ~45min) */
                                  <div className="flex items-center gap-1.5 px-2 h-full">
                                    <p className="text-[11px] font-bold truncate flex-1">{patName}</p>
                                    <span className="text-[9px] opacity-70 shrink-0">
                                      {format(new Date(primaryAppt.startTime), 'HH:mm')}
                                    </span>
                                  </div>
                                ) : (
                                  /* Full layout for longer appointments */
                                  <div className="flex flex-col justify-between h-full p-2">
                                    <div className="space-y-0.5 min-w-0 pr-6"> {/* Leave room for count speech bubble */}
                                      <p className="text-xs font-bold truncate leading-tight">{patName}</p>
                                      <p className="text-[10px] opacity-80 truncate">{primaryAppt.type || 'Consultation'}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] opacity-75 font-semibold">
                                      <span className="flex items-center gap-0.5">
                                        <Clock size={9} />
                                        {format(new Date(primaryAppt.startTime), 'HH:mm')} – {format(new Date(primaryAppt.endTime), 'HH:mm')}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${theme.labelBg}`}>
                                        {practitionerLabel}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Overlap Indicator Speech Bubble (Comment Bubble style) */}
                                {cluster.length > 1 && (
                                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/95 border border-gray-200/60 shadow-sm text-[9px] font-bold text-gray-800 transition hover:scale-105 hover:bg-white z-20">
                                    <MessageSquare size={9} className="text-navy shrink-0" />
                                    <span>{cluster.length}</span>
                                  </div>
                                )}
                              </div>

                              {/* Hover/Click Popover for Multiples */}
                              {hoveredClusterId === clusterId && (
                                <div 
                                  className={`absolute top-0 w-72 bg-white/98 backdrop-blur-lg rounded-xl border border-gray-200 shadow-2xl p-3 z-50 flex flex-col gap-2.5 transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
                                    dayIdx >= 5 ? 'right-[105%] left-auto' : 'left-[105%] right-auto'
                                  }`}
                                  onClick={(e) => e.stopPropagation()} // Prevent triggering card click
                                >
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <div className="flex items-center gap-1.5">
                                      <MessageSquare size={13} className="text-navy shrink-0" />
                                      <span className="text-xs font-bold text-gray-800">
                                        Multiple Bookings ({cluster.length})
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {format(dayDate, 'EEE, MMM d')}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
                                    {cluster.map((cAppt: any) => {
                                      const cPatName = patients?.find((p: any) => p._id === cAppt.patientId)?.displayName || 'Unknown Patient';
                                      const cTheme = getPractitionerTheme(cAppt.providerId || '');
                                      const cPractLabel = getPractitionerDisplayName(cAppt.providerId || '');
                                      
                                      return (
                                        <div
                                          key={cAppt._id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelected(cAppt);
                                            setHoveredClusterId(null);
                                          }}
                                          className="flex flex-col gap-1.5 p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-navy/30 hover:shadow-sm cursor-pointer transition-all"
                                        >
                                          <div className="flex items-start justify-between gap-1">
                                            <span className="text-xs font-bold text-gray-900 line-clamp-1">
                                              {cPatName}
                                            </span>
                                            <span className={`px-1.5 py-0.25 rounded text-[8px] font-bold ${
                                              cAppt.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                                              cAppt.status === 'completed' ? 'bg-green-50 text-green-700' :
                                              cAppt.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                              'bg-amber-50 text-amber-700'
                                            }`}>
                                              {cAppt.status}
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                                            <span className="flex items-center gap-1">
                                              <Clock size={10} className="text-gray-400 shrink-0" />
                                              {format(new Date(cAppt.startTime), 'HH:mm')} – {format(new Date(cAppt.endTime), 'HH:mm')}
                                            </span>
                                            <span className="flex items-center gap-1 text-[9px]">
                                              <span className={`w-1.5 h-1.5 rounded-full ${cTheme.bg.split(' ')[0]}`} />
                                              {cPractLabel}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  <div className="text-[9px] text-gray-400 text-center border-t border-gray-100 pt-1.5">
                                    Click an appointment to view record info
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>

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

      {/* Premium Detailed Metadata slide-over Modal */}
      <Modal 
        open={!!selected} 
        onClose={() => setSelected(null)} 
        title="Appointment Record Info"
        width="max-w-md"
      >
        {selected && (() => {
          const patName = patients?.find((p: any) => p._id === selected.patientId)?.displayName || 'Unknown Patient';
          const modalTheme = getPractitionerTheme(selected.providerId || '');
          const practName = getPractitionerDisplayName(selected.providerId || '');
          const practTitle = getPractitionerTitle(selected.providerId || '');
          
          return (
            <div className="space-y-4">
              {/* Patient & Practitioner Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient</p>
                  <h3 className="text-base font-bold text-gray-900">{patName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selected.type || 'Appointment'}
                  </p>
                </div>
                <Badge label={selected.status} color={statusColor[selected.status] || 'gray'} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar size={15} className="text-gray-400 shrink-0" />
                  <span className="font-medium">
                    {format(new Date(selected.startTime), 'EEEE, dd MMMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock size={15} className="text-gray-400 shrink-0" />
                  <span className="font-medium">
                    {format(new Date(selected.startTime), 'HH:mm')} – {format(new Date(selected.endTime), 'HH:mm')}
                  </span>
                  <span className="text-xs text-gray-400">({selected.duration} min)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User size={15} className="text-gray-400 shrink-0" />
                  <span className="font-medium">Practitioner:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${modalTheme?.labelBg} ${modalTheme?.text}`}>
                    {practName}{practTitle ? ` · ${practTitle}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-[15px] shrink-0" />
                  <span className="text-xs">Provider: <b className="text-gray-700">Niche Healthcare Group</b></span>
                </div>
                {selected.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin size={15} className="text-gray-400 shrink-0" />
                    <span>Location: <b>{selected.location}</b></span>
                  </div>
                )}
              </div>

              {selected.reasonForVisit && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Reason for Visit</p>
                  <p className="text-sm text-gray-700 mt-0.5">{selected.reasonForVisit}</p>
                </div>
              )}

              {selected.notes && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Clinical Notes</p>
                  <p className="text-sm text-gray-600 mt-0.5 italic">"{selected.notes}"</p>
                </div>
              )}

              {selected.status === 'cancelled' && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Cancellation Summary</p>
                  <p className="text-sm text-red-700 mt-1">
                    <b>Reason:</b> {selected.cancelReason || 'Not specified'}
                  </p>
                  {selected.cancelNotes && (
                    <p className="text-xs text-red-600 mt-1 italic">
                      <b>Notes:</b> {selected.cancelNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons inside detail modal */}
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  {selected.status === 'pending' && hasPermission('editAppointment') && (
                    <Button 
                      className="flex-1" 
                      variant="secondary" 
                      onClick={async () => { 
                        await markArrived({ id: selected._id, updatedBy: account?.email || 'admin' }); 
                        setSelected((s: any) => ({ ...s, status: 'arrived' })); 
                        showToast('Patient marked as Arrived.', 'info');
                      }}
                    >
                      Mark Arrived
                    </Button>
                  )}
                  {selected.status === 'confirmed' && hasPermission('editAppointment') && (
                    <Button 
                      className="flex-1" 
                      variant="secondary" 
                      onClick={async () => { 
                        await markArrived({ id: selected._id, updatedBy: account?.email || 'admin' }); 
                        setSelected((s: any) => ({ ...s, status: 'arrived' })); 
                        showToast('Patient marked as Arrived.', 'info');
                      }}
                    >
                      Mark Arrived
                    </Button>
                  )}
                  {(selected.status === 'arrived' || selected.status === 'pending' || selected.status === 'confirmed') && hasPermission('editAppointment') && (
                    <Button 
                      className="flex-1" 
                      variant="primary" 
                      icon={<CheckCircle size={14} />}
                      onClick={async () => { 
                        await complete({ id: selected._id, updatedBy: account?.email || 'admin' }); 
                        setSelected((s: any) => ({ ...s, status: 'completed' })); 
                        showToast('Appointment successfully marked completed.', 'success');
                      }}
                    >
                      Complete
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {(selected.status === 'arrived' || selected.status === 'completed') && hasPermission('createInvoice') && (
                    <Button 
                      className="flex-1" 
                      variant="outline" 
                      icon={<FileText size={14} />} 
                      onClick={handleDraftInvoice}
                    >
                      Draft Invoice
                    </Button>
                  )}
                  {selected.status !== 'cancelled' && selected.status !== 'completed' && hasPermission('editAppointment') && (
                    <>
                      <Button 
                        className="flex-1" 
                        variant="outline" 
                        icon={<Clock size={14} />}
                        onClick={() => {
                          const apptDate = new Date(selected.startTime);
                          const formattedDate = format(apptDate, 'yyyy-MM-dd');
                          const formattedTime = format(apptDate, 'HH:mm');
                          const formattedEndTime = format(new Date(selected.endTime), 'HH:mm');
                          setRescheduleForm({
                            date: formattedDate,
                            time: formattedTime,
                            endTime: formattedEndTime,
                            duration: String(selected.duration || 30),
                            providerId: selected.providerId || '',
                          });
                          setRescheduleError('');
                          setShowRescheduleModal(true);
                        }}
                      >
                        Reschedule
                      </Button>
                      <Button 
                        className="flex-1" 
                        variant="danger" 
                        icon={<XCircle size={14} />}
                        onClick={() => {
                          setCancelForm({
                            reason: 'Feeling better',
                            notes: '',
                            cancelSeries: false,
                          });
                          setShowCancelModal(true);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>

                {hasPermission('archiveAppointment') && (
                  <Button 
                    variant="outline" 
                    icon={<Archive size={14} />}
                    onClick={() => setShowArchiveConfirmModal(true)}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Book Appointment Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setBookError(''); }} title="Book Appointment" width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => { setShowModal(false); setBookError(''); }}>Cancel</Button><Button loading={saving} onClick={handleSave}>Book</Button></>}>
        <div className="space-y-4">
          {bookError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              {bookError}
            </div>
          )}
          {!patients && <p className="text-xs text-gray-400">Loading patients…</p>}
          <Select label="Patient *" options={patientOptions} placeholder={patients ? 'Select patient' : 'Loading…'} value={form.patientId} onChange={e => set('patientId', e.target.value)} />

          {/* Service Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select value={form.serviceTypeId} onChange={e => {
              const val = e.target.value;
              const svc = (serviceTypes || []).find((s: any) => s._id === val);
              if (svc) {
                setForm(f => {
                  const startMin = timeToMinutes(f.time);
                  const newEnd = startMin !== null ? minutesToTime(startMin + (svc.duration || 30)) : f.endTime;
                  return {
                    ...f,
                    serviceTypeId: val,
                    type: svc.name,
                    duration: String(svc.duration || 30),
                    endTime: newEnd
                  };
                });
              } else {
                setForm(f => ({
                  ...f,
                  serviceTypeId: val,
                }));
              }
            }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/20 focus:border-navy bg-white">
              <option value="">Select service type (optional)...</option>
              {(serviceTypes || []).map((s: any) => <option key={s._id} value={s._id}>{s.name} — K{s.fixedPrice}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Date *" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            <Input label="Start Time *" type="time" value={form.time} onChange={e => {
              const newStart = e.target.value;
              setForm(f => {
                const startMin = timeToMinutes(newStart);
                if (startMin === null) return { ...f, time: newStart };
                const dur = parseInt(f.duration) || 30;
                const newEnd = minutesToTime(startMin + dur);
                return { ...f, time: newStart, endTime: newEnd };
              });
            }} />
            <Input label="End Time *" type="time" value={form.endTime} onChange={e => {
              const newEnd = e.target.value;
              setForm(f => {
                const startMin = timeToMinutes(f.time);
                const endMin = timeToMinutes(newEnd);
                if (startMin === null || endMin === null) return { ...f, endTime: newEnd };
                const diff = endMin - startMin;
                const newDur = diff > 0 ? diff : 30;
                const finalEnd = diff > 0 ? newEnd : minutesToTime(startMin + 30);
                return { ...f, endTime: finalEnd, duration: String(newDur) };
              });
            }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" options={typeOptions} value={form.type} onChange={e => set('type', e.target.value)} />
            <Input
              label="Duration (min) *"
              type="number"
              min="1"
              value={form.duration}
              onChange={e => {
                const val = e.target.value;
                const dur = parseInt(val) || 0;
                setForm(f => {
                  const startMin = timeToMinutes(f.time);
                  const newEnd = startMin !== null ? minutesToTime(startMin + dur) : f.endTime;
                  return { ...f, duration: val, endTime: newEnd };
                });
              }}
            />
          </div>

          {/* Practitioner selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Practitioner *</label>
            <select value={form.providerId} onChange={e => set('providerId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/20 focus:border-navy bg-white">
              <option value="">Select practitioner...</option>
              {practitionerList.map(p => (
                <option key={p.identifier} value={p.email}>{p.displayName} — {p.roleTitle}</option>
              ))}
            </select>
          </div>

          <Input label="Location" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Room / office" />
          <Select label="Status" options={statusOptions} value={form.status} onChange={e => set('status', e.target.value)} />

          {/* Recurring appointment section */}
          <div className="border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50/50">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 select-none cursor-pointer">
              <input type="checkbox" checked={form.isRecurring} onChange={e => {
                const checked = e.target.checked;
                setForm(f => {
                  let days = f.recurringDays || [];
                  if (checked && days.length === 0 && f.date) {
                    const parsedDate = new Date(`${f.date}T${f.time || '08:00'}`);
                    if (!isNaN(parsedDate.getTime())) {
                      days = [parsedDate.getDay()];
                    }
                  }
                  return { ...f, isRecurring: checked, recurringDays: days };
                });
              }} className="rounded text-navy focus:ring-navy" />
              Recurring Appointment
            </label>
            {form.isRecurring && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Repeat Pattern" options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'monthly', label: 'Monthly' },
                  ]} value={form.recurringPattern} onChange={e => set('recurringPattern', e.target.value)} />
                  <Input 
                    label="Repeat every (frequency)" 
                    type="number" 
                    min="1"
                    value={form.recurringInterval} 
                    onChange={e => set('recurringInterval', e.target.value)} 
                  />
                </div>

                {form.recurringPattern === 'weekly' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Repeat on Days</label>
                    <div className="flex gap-2">
                      {[
                        { label: 'S', value: 0, fullName: 'Sunday' },
                        { label: 'M', value: 1, fullName: 'Monday' },
                        { label: 'T', value: 2, fullName: 'Tuesday' },
                        { label: 'W', value: 3, fullName: 'Wednesday' },
                        { label: 'T', value: 4, fullName: 'Thursday' },
                        { label: 'F', value: 5, fullName: 'Friday' },
                        { label: 'S', value: 6, fullName: 'Saturday' },
                      ].map(d => {
                        const isSelected = (form.recurringDays || []).includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            title={d.fullName}
                            onClick={() => {
                              setForm(f => {
                                const days = f.recurringDays || [];
                                const newDays = days.includes(d.value)
                                  ? days.filter(v => v !== d.value)
                                  : [...days, d.value].sort();
                                  return { ...f, recurringDays: newDays };
                              });
                            }}
                            className={`w-9 h-9 rounded-full text-xs font-semibold transition border flex items-center justify-center ${
                              isSelected
                                ? 'bg-navy text-white border-navy shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-navy/40 hover:text-navy'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500">End Recurrence</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="recurringEndType" 
                        checked={form.recurringEndType === 'date'} 
                        onChange={() => setForm(f => ({ ...f, recurringEndType: 'date' }))} 
                      />
                      On Specific Date
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="recurringEndType" 
                        checked={form.recurringEndType === 'occurrences'} 
                        onChange={() => setForm(f => ({ ...f, recurringEndType: 'occurrences' }))} 
                      />
                      After Occurrences
                    </label>
                  </div>

                  {form.recurringEndType === 'date' ? (
                    <Input label="End Date" type="date" value={form.recurringEndDate} onChange={e => set('recurringEndDate', e.target.value)} />
                  ) : (
                    <Input label="Occurrences (Count)" type="number" min="1" max="100" value={form.recurringOccurrences} onChange={e => set('recurringOccurrences', e.target.value)} />
                  )}
                </div>

                {/* Calculated dates preview */}
                {calculatedDates.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Calculated Dates Preview</p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {calculatedDates.map((d, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                          {format(d, 'EEE, MMM d, yyyy')}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      Total: {calculatedDates.length} appointment{calculatedDates.length !== 1 ? 's' : ''} will be scheduled.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal 
        open={showCancelModal} 
        onClose={() => setShowCancelModal(false)} 
        title="Cancel Appointment" 
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Go Back</Button>
            <Button variant="danger" onClick={async () => {
              if (!selected) return;
              try {
                await cancel({
                  id: selected._id,
                  cancelReason: cancelForm.reason,
                  cancelNotes: cancelForm.notes,
                  cancelSeries: cancelForm.cancelSeries,
                  cancelledBy: account?.email || 'admin',
                });
                setShowCancelModal(false);
                setSelected((s: any) => ({
                  ...s,
                  status: 'cancelled',
                  cancelReason: cancelForm.reason,
                  cancelNotes: cancelForm.notes,
                }));
                showToast('Appointment cancelled successfully.', 'info');
              } catch (e: any) {
                showToast(e.message || 'Failed to cancel appointment', 'error');
              }
            }}>Confirm Cancellation</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Please select a reason for cancelling this appointment. This action will be logged.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cancellation Reason</p>
            <div className="grid grid-cols-2 gap-2">
              {['Feeling better', 'Condition worse', 'Sick', 'Away', 'Work', 'Other'].map(r => (
                <label key={r} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer select-none text-sm font-medium text-gray-700">
                  <input 
                    type="radio" 
                    name="cancelReason" 
                    checked={cancelForm.reason === r} 
                    onChange={() => setCancelForm(f => ({ ...f, reason: r }))} 
                    className="text-navy focus:ring-navy"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <Textarea 
            label="Additional Notes (Optional)" 
            value={cancelForm.notes} 
            onChange={e => setCancelForm(f => ({ ...f, notes: e.target.value }))} 
            placeholder="Add any extra details here..."
            rows={3} 
          />

          {selected && (selected.isRecurring || selected.parentAppointmentId) && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-red-800">Recurring Series Detected</p>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm text-red-700 font-medium cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="cancelSeries" 
                    checked={cancelForm.cancelSeries === false} 
                    onChange={() => setCancelForm(f => ({ ...f, cancelSeries: false }))} 
                    className="text-navy focus:ring-navy"
                  />
                  Cancel this instance only
                </label>
                <label className="flex items-center gap-2 text-sm text-red-700 font-medium cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="cancelSeries" 
                    checked={cancelForm.cancelSeries === true} 
                    onChange={() => setCancelForm(f => ({ ...f, cancelSeries: true }))} 
                    className="text-navy focus:ring-navy"
                  />
                  Cancel this and all future instances in series
                </label>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Exists Invoice Warning Modal */}
      <Modal
        open={showDuplicateInvoiceModal}
        onClose={() => setShowDuplicateInvoiceModal(false)}
        title="Duplicate Invoice Warning"
        width="max-w-md"
      >
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-gray-900">Invoice Already Exists</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              An invoice has already been drafted or created for this appointment. Re-drafting is blocked to prevent duplication.
            </p>
          </div>

          {existingInvoiceData && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-left text-sm space-y-2.5 shadow-inner">
              <div className="flex justify-between">
                <span className="text-gray-400">Invoice Number:</span>
                <span className="font-semibold text-gray-800">{existingInvoiceData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Amount:</span>
                <span className="font-bold text-gray-900">K {(existingInvoiceData.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <Badge 
                  label={existingInvoiceData.status.toUpperCase()} 
                  color={
                    existingInvoiceData.status === 'paid' ? 'green' : 
                    existingInvoiceData.status === 'unpaid' ? 'amber' : 'gray'
                  } 
                />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Due Date:</span>
                <span className="text-gray-700">
                  {existingInvoiceData.dueDate ? format(new Date(existingInvoiceData.dueDate), 'dd MMM yyyy') : '—'}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" variant="outline" onClick={() => setShowDuplicateInvoiceModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" variant="primary" onClick={() => {
              setShowDuplicateInvoiceModal(false);
              setSelected(null); // Clear selected appt
              navigate('/invoices', { state: { selectedInvoiceId: existingInvoiceData?._id } });
            }}>
              View Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        open={showArchiveConfirmModal}
        onClose={() => setShowArchiveConfirmModal(false)}
        title="Archive Appointment"
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowArchiveConfirmModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={async () => {
              if (!selected) return;
              try {
                await archiveAppt({ id: selected._id, archivedBy: account?.email || 'admin' });
                showToast('Appointment archived successfully.', 'success');
                setShowArchiveConfirmModal(false);
                setSelected(null);
              } catch (e: any) {
                showToast(e.message || 'Failed to archive appointment', 'error');
              }
            }}>Archive</Button>
          </>
        }
      >
        <p className="text-sm text-gray-500 leading-relaxed">
          Are you sure you want to archive this appointment? It will be hidden from the active schedule but kept in the system for auditing and history.
        </p>
      </Modal>

      {/* Reschedule Modal */}
      <Modal 
        open={showRescheduleModal} 
        onClose={() => { setShowRescheduleModal(false); setRescheduleError(''); }} 
        title={`Reschedule Appointment — ${selected ? (patients?.find((p: any) => p._id === selected.patientId)?.displayName || 'Patient') : ''}`} 
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowRescheduleModal(false); setRescheduleError(''); }}>Cancel</Button>
            <Button loading={rescheduleSaving} onClick={handleRescheduleSave}>Save Reschedule</Button>
          </>
        }
      >
        <div className="space-y-4">
          {rescheduleError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              {rescheduleError}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Input 
                label="Date *" 
                type="date" 
                value={rescheduleForm.date} 
                onChange={e => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))} 
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Start Time *" 
                  type="time" 
                  value={rescheduleForm.time} 
                  onChange={e => {
                    const newStart = e.target.value;
                    setRescheduleForm(prev => {
                      const startMin = timeToMinutes(newStart);
                      if (startMin === null) return { ...prev, time: newStart };
                      const dur = parseInt(prev.duration) || 30;
                      const newEnd = minutesToTime(startMin + dur);
                      return { ...prev, time: newStart, endTime: newEnd };
                    });
                  }} 
                />
                
                <Input 
                  label="End Time *" 
                  type="time" 
                  value={rescheduleForm.endTime} 
                  onChange={e => {
                    const newEnd = e.target.value;
                    setRescheduleForm(prev => {
                      const startMin = timeToMinutes(prev.time);
                      const endMin = timeToMinutes(newEnd);
                      if (startMin === null || endMin === null) return { ...prev, endTime: newEnd };
                      const diff = endMin - startMin;
                      const newDur = diff > 0 ? diff : 30;
                      const finalEnd = diff > 0 ? newEnd : minutesToTime(startMin + 30);
                      return { ...prev, endTime: finalEnd, duration: String(newDur) };
                    });
                  }} 
                />
              </div>

              <Input
                label="Duration (min) *"
                type="number"
                min="1"
                value={rescheduleForm.duration}
                onChange={e => {
                  const val = e.target.value;
                  const dur = parseInt(val) || 0;
                  setRescheduleForm(prev => {
                    const startMin = timeToMinutes(prev.time);
                    const newEnd = startMin !== null ? minutesToTime(startMin + dur) : prev.endTime;
                    return { ...prev, duration: val, endTime: newEnd };
                  });
                }}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Practitioner *</label>
                <select 
                  value={rescheduleForm.providerId} 
                  onChange={e => setRescheduleForm(prev => ({ ...prev, providerId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/20 focus:border-navy bg-white"
                >
                  <option value="">Select practitioner...</option>
                  {practitionerList.map(p => (
                    <option key={p.identifier} value={p.email}>{p.displayName} — {p.roleTitle}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
