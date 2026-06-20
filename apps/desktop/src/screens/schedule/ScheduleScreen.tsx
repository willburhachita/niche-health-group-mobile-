import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X, Clock, Users, Repeat } from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am – 7pm
const PX_PER_HOUR = 90; // width per hour in horizontal layout
const ROW_H = 72;       // height of each day row

const EVENT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  shift:    { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-800' },
  meeting:  { bg: 'bg-purple-50',  border: 'border-purple-400',  text: 'text-purple-800' },
  training: { bg: 'bg-amber-50',   border: 'border-amber-400',   text: 'text-amber-800' },
  other:    { bg: 'bg-gray-50',    border: 'border-gray-400',    text: 'text-gray-700' },
  appt:     { bg: 'bg-navy/10',    border: 'border-navy',        text: 'text-navy' },
};

const typeOptions = [
  { value: 'shift', label: 'Work Shift' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other Event' },
];
const recurOptions = [
  { value: '', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

interface EventForm {
  title: string; type: string; description: string; location: string;
  date: string; startTime: string; endTime: string; isAllDay: boolean;
  recurringPattern: string; recurringEndDate: string;
  attendees: string[]; // userId strings
}

const emptyForm: EventForm = {
  title: '', type: 'shift', description: '', location: '',
  date: format(new Date(), 'yyyy-MM-dd'), startTime: '08:00', endTime: '17:00',
  isAllDay: false, recurringPattern: '', recurringEndDate: '', attendees: [],
};

export default function ScheduleScreen() {
  const { account, session } = useAuth();
  const canCreate = account?.role === 'admin' || account?.role === 'moderator';

  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tooltip, setTooltip] = useState<any>(null);
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['appt', 'shift', 'meeting', 'training', 'other']);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rangeStart = weekStart.getTime();
  const rangeEnd = addDays(weekStart, 7).getTime();

  const appointments = useQuery(api.appointments.listByDateRange, { startFrom: rangeStart, startTo: rangeEnd });
  const scheduleEvents = useQuery(api.scheduleEvents.listByDateRange, { startFrom: rangeStart, startTo: rangeEnd });
  const patients = useQuery(api.patients.list, {});
  const allUsers = useQuery(api.auth.getAllUsers);
  const createEvent = useMutation(api.scheduleEvents.create);
  const removeEvent = useMutation(api.scheduleEvents.remove);

  const set = (k: keyof EventForm, v: any) => setForm(f => ({ ...f, [k]: v }));

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleCreateEvent = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const startDt = new Date(`${form.date}T${form.startTime}`);
      const endDt = new Date(`${form.date}T${form.endTime}`);
      await createEvent({
        title: form.title.trim(),
        type: form.type,
        description: form.description || undefined,
        location: form.location || undefined,
        startTime: startDt.getTime(),
        endTime: endDt.getTime(),
        isAllDay: form.isAllDay,
        organizer: session?.accountId || account?.email || '',
        attendees: form.attendees,
        isRecurring: !!form.recurringPattern,
        recurringPattern: form.recurringPattern || undefined,
        recurringEndDate: form.recurringEndDate ? new Date(form.recurringEndDate).getTime() : undefined,
        createdBy: account?.email || '',
      });
      setShowModal(false);
      setForm(emptyForm);
    } finally { setSaving(false); }
  };

  const toggleAttendee = (userId: string) => {
    setForm(f => ({
      ...f,
      attendees: f.attendees.includes(userId)
        ? f.attendees.filter(id => id !== userId)
        : [...f.attendees, userId],
    }));
  };

  const getItemsForDay = (day: Date) => {
    const appts = (appointments || [])
      .filter((a: any) => isSameDay(new Date(a.startTime), day) && a.status !== 'cancelled')
      .map((a: any) => ({ ...a, _kind: 'appt' }));
    const evts = (scheduleEvents || [])
      .filter((e: any) => isSameDay(new Date(e.startTime), day))
      .map((e: any) => ({ ...e, _kind: 'event' }));
    
    return [...appts, ...evts]
      .filter((item: any) => {
        const typeKey = item._kind === 'appt' ? 'appt' : (item.type || 'other');
        return visibleTypes.includes(typeKey);
      })
      .sort((a, b) => a.startTime - b.startTime);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={prevWeek} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={18} /></button>
          <button onClick={goToday} className="px-3 py-1 text-sm font-medium text-navy border border-navy/30 rounded-lg hover:bg-navy-50 transition">Today</button>
          <button onClick={nextWeek} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={18} /></button>
        </div>
        <h2 className="text-sm font-semibold text-gray-700">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>

        {/* Legend */}
        <div className="flex items-center gap-4 ml-4 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100">
          {[['appt','Appointments'],['shift','Shifts'],['meeting','Meetings'],['training','Training']].map(([k,label]) => {
            const s = EVENT_STYLES[k];
            const isChecked = visibleTypes.includes(k);
            return (
              <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setVisibleTypes(prev =>
                      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
                    );
                  }}
                  className="rounded border-gray-300 text-navy focus:ring-navy h-3.5 w-3.5 cursor-pointer"
                />
                <span className={`w-2.5 h-2.5 rounded-full ${s.bg} border ${s.border}`} />
                <span className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">{label}</span>
              </label>
            );
          })}
        </div>

        {canCreate && (
          <button onClick={() => { setForm({ ...emptyForm, date: format(new Date(), 'yyyy-MM-dd') }); setShowModal(true); }}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition">
            <Plus size={15} /> Create Event
          </button>
        )}
      </div>

      {/* Calendar grid — dates on left, times across top */}
      <div className="flex-1 overflow-auto relative bg-surface">
        {(!appointments || !scheduleEvents) && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><Spinner /></div>
        )}

        <div className="min-w-max">
          {/* Top-left corner + time headers */}
          <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
            {/* Corner */}
            <div className="w-28 shrink-0 border-r border-gray-200" />
            {/* Hour labels */}
            <div className="flex">
              {HOURS.map(h => (
                <div key={h} style={{ width: PX_PER_HOUR }} className="border-r border-gray-100 px-2 py-2 text-center">
                  <span className="text-xs font-medium text-gray-500">
                    {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day rows */}
          {days.map(day => {
            const isToday = isSameDay(day, new Date());
            const items = getItemsForDay(day);

            // Compute visual lanes for overlapping events
            const sortedItems = [...items].sort((a, b) => a.startTime - b.startTime);
            const lanesList: number[][] = [];
            const itemsWithLanes = sortedItems.map(item => {
              let laneIndex = 0;
              const foundLane = lanesList.findIndex(laneEnds => {
                const lastEnd = laneEnds[laneEnds.length - 1];
                return item.startTime >= lastEnd;
              });
              if (foundLane !== -1) {
                laneIndex = foundLane;
                lanesList[foundLane].push(item.endTime);
              } else {
                laneIndex = lanesList.length;
                lanesList.push([item.endTime]);
              }
              return { item, laneIndex };
            });

            const lanesCount = Math.max(1, lanesList.length);
            const rowHeight = lanesCount * 44 + 20;

            return (
              <div key={day.toISOString()} className={`flex border-b border-gray-100 ${isToday ? 'bg-navy/5' : 'bg-white hover:bg-gray-50/50'}`}
                style={{ height: rowHeight }}>

                {/* Date label */}
                <div
                  className={`w-28 shrink-0 border-r border-gray-200 flex flex-col items-center justify-center cursor-pointer gap-0 ${isToday ? 'bg-navy/10' : ''}`}
                  onClick={() => { if (canCreate) { setForm(f => ({ ...f, date: format(day, 'yyyy-MM-dd') })); setShowModal(true); } }}>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-navy' : 'text-gray-400'}`}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-2xl font-bold leading-none ${isToday ? 'text-navy' : 'text-gray-800'}`}>
                    {format(day, 'd')}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{format(day, 'MMM')}</p>
                </div>

                {/* Hour cells + events */}
                <div className="relative flex flex-1">
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <div key={h} style={{ width: PX_PER_HOUR }} className="h-full border-r border-gray-100 shrink-0" />
                  ))}

                  {/* Events absolutely positioned in parallel vertical lanes */}
                  {itemsWithLanes.map(({ item, laneIndex }) => {
                    const startH = new Date(item.startTime).getHours() + new Date(item.startTime).getMinutes() / 60;
                    const endH   = new Date(item.endTime).getHours()   + new Date(item.endTime).getMinutes()   / 60;
                    const clampedStart = Math.max(startH, 7);
                    const clampedEnd   = Math.min(endH, 7 + HOURS.length);
                    const durMins = item._kind === 'appt' ? item.duration : (endH - startH) * 60;
                    const left   = (clampedStart - 7) * PX_PER_HOUR;
                    const width  = Math.max((item._kind === 'appt' ? durMins / 60 : (clampedEnd - clampedStart)) * PX_PER_HOUR, 60);
                    const st     = EVENT_STYLES[item._kind === 'appt' ? 'appt' : (item.type || 'other')];
                    const label  = item._kind === 'appt'
                      ? (patients?.find((p: any) => p._id === item.patientId)?.displayName || 'Patient')
                      : item.title;

                    const itemTop = laneIndex * 44 + 10;
                    const itemHeight = 36;

                    return (
                      <div key={item._id}
                        style={{ left, width, top: itemTop, height: itemHeight, position: 'absolute' }}
                        onClick={e => { e.stopPropagation(); setTooltip(tooltip?._id === item._id ? null : item); }}
                        className={`${st.bg} border-t-2 ${st.border} rounded-lg px-2 py-0.5 overflow-hidden cursor-pointer hover:brightness-95 transition z-10 flex flex-col justify-center`}
                        title={label}>
                        <p className={`text-[11px] font-semibold ${st.text} leading-tight truncate`}>{label}</p>
                        <p className={`text-[9px] ${st.text} opacity-70 truncate mt-0.5`}>
                          {format(new Date(item.startTime), 'HH:mm')}–{format(new Date(item.endTime), 'HH:mm')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip/popup for clicked event */}
        {tooltip && (
          <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 w-72" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{tooltip._kind === 'appt' ? (patients?.find((p: any) => p._id === tooltip.patientId)?.displayName || 'Patient') : tooltip.title}</p>
                <p className="text-xs text-gray-500">{tooltip._kind === 'appt' ? tooltip.type : tooltip.type?.charAt(0).toUpperCase() + tooltip.type?.slice(1)}</p>
              </div>
              <button onClick={() => setTooltip(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <p><Clock size={11} className="inline mr-1" />{format(new Date(tooltip.startTime), 'HH:mm')} – {format(new Date(tooltip.endTime), 'HH:mm')}</p>
              {tooltip.location && <p>📍 {tooltip.location}</p>}
              {tooltip.description && <p className="text-gray-500 mt-1">{tooltip.description}</p>}
              {tooltip._kind === 'event' && tooltip.attendees?.length > 0 && (
                <p><Users size={11} className="inline mr-1" />{tooltip.attendees.length} attendee{tooltip.attendees.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {canCreate && tooltip._kind === 'event' && (
              <button onClick={async () => { await removeEvent({ id: tooltip._id }); setTooltip(null); }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 transition">Delete event</button>
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Schedule Event" width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleCreateEvent} disabled={!form.title.trim()}>Create Event</Button></>}>
        <div className="space-y-4">
          <Input label="Event Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Morning Shift, Team Meeting" />
          <Select label="Event Type" options={typeOptions} value={form.type} onChange={e => set('type', e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3"><Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="col-span-3 flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isAllDay} onChange={e => set('isAllDay', e.target.checked)} className="rounded" />
                All day
              </label>
            </div>
            {!form.isAllDay && (
              <>
                <Input label="Start Time" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                <Input label="End Time" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </>
            )}
          </div>
          <Input label="Location (optional)" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Conference Room A" />
          <Textarea label="Description (optional)" value={form.description} onChange={e => set('description', e.target.value)} rows={2} />

          {/* Recurring */}
          <Select label="Recurrence" options={recurOptions} value={form.recurringPattern} onChange={e => set('recurringPattern', e.target.value)} />
          {form.recurringPattern && (
            <Input label="Repeat Until" type="date" value={form.recurringEndDate} onChange={e => set('recurringEndDate', e.target.value)} />
          )}

          {/* Staff Attendees */}
          {allUsers && allUsers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Assign Staff Attendees</p>
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {allUsers.map((u: any) => (
                  <label key={u._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.attendees.includes(u.externalId || u._id)}
                      onChange={() => toggleAttendee(u.externalId || u._id)} className="rounded" />
                    <span className="text-sm text-gray-800">{u.displayName}</span>
                    <span className="text-xs text-gray-400 ml-auto">{u.role || u.department || ''}</span>
                  </label>
                ))}
              </div>
              {form.attendees.length > 0 && (
                <p className="text-xs text-navy mt-1">{form.attendees.length} staff selected</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
