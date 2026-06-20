import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, Modal, Badge, Card, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';

const DEFAULT_SHIFT_TYPES = [
  { name: 'Morning', color: '#4CAF50', startTime: '07:00', endTime: '15:00' },
  { name: 'Afternoon', color: '#2196F3', startTime: '15:00', endTime: '23:00' },
  { name: 'Night', color: '#9C27B0', startTime: '23:00', endTime: '07:00' },
  { name: 'Off', color: '#9E9E9E', startTime: undefined, endTime: undefined },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ShiftManagementScreen() {
  const { account } = useAuth();
  const isAdmin = account?.role === 'admin';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAssign, setShowAssign] = useState(false);
  const [assignDate, setAssignDate] = useState('');
  const [assignUser, setAssignUser] = useState('');
  const [assignType, setAssignType] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#4CAF50');
  const [newTypeStart, setNewTypeStart] = useState('07:00');
  const [newTypeEnd, setNewTypeEnd] = useState('15:00');
  const [assignStart, setAssignStart] = useState('');
  const [assignEnd, setAssignEnd] = useState('');

  const monthStr = format(currentMonth, 'yyyy-MM');
  const shifts = useQuery(api.shifts.listByMonth, { month: monthStr });
  const shiftTypes = useQuery(api.shifts.listShiftTypes, {});
  const staff = useQuery(api.auth.listStaff, {});

  const setShift = useMutation(api.shifts.setShift);
  const removeShift = useMutation(api.shifts.removeShift);
  const createShiftType = useMutation(api.shifts.createShiftType);
  const deleteShiftType = useMutation(api.shifts.deleteShiftType);

  const types = shiftTypes && shiftTypes.length > 0 ? shiftTypes : DEFAULT_SHIFT_TYPES;
  const staffOptions = (staff || []).map((s: any) => ({ value: s.email, label: s.displayName || s.email }));
  const typeOptions = types.map((t: any) => ({ value: t.name, label: t.name }));

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const openAssign = (dateStr: string) => {
    setAssignDate(dateStr);
    setAssignUser('');
    setAssignType('');
    setAssignStart('');
    setAssignEnd('');
    setShowAssign(true);
  };

  const handleAssign = async () => {
    if (!assignUser || !assignType) return;
    setSaving(true);
    const t = types.find((t: any) => t.name === assignType);
    try {
      await setShift({
        userId: assignUser,
        date: assignDate,
        shiftType: assignType,
        color: t?.color || '#9E9E9E',
        startTime: assignStart || t?.startTime || undefined,
        endTime: assignEnd || t?.endTime || undefined,
        createdBy: account?.email || 'admin',
      });
      setShowAssign(false);
    } finally { setSaving(false); }
  };

  const handleCreateType = async () => {
    if (!newTypeName) return;
    await createShiftType({
      name: newTypeName,
      color: newTypeColor,
      startTime: newTypeStart || undefined,
      endTime: newTypeEnd || undefined,
      createdBy: account?.email || 'admin',
    });
    setNewTypeName(''); setNewTypeColor('#4CAF50');
    setShowTypeModal(false);
  };

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (shifts || []).forEach((s: any) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [shifts]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<ChevronLeft size={14} />} onClick={() => setCurrentMonth(m => subMonths(m, 1))} />
          <h2 className="text-base font-semibold text-gray-900 w-40 text-center">{format(currentMonth, 'MMMM yyyy')}</h2>
          <Button variant="outline" size="sm" icon={<ChevronRight size={14} />} onClick={() => setCurrentMonth(m => addMonths(m, 1))} />
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <Button size="sm" variant="outline" onClick={() => setShowTypeModal(true)}>Manage Types</Button>}
          <div className="flex gap-2">
            {types.map((t: any) => (
              <span key={t.name} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-gray-200">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_LABELS.map(d => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 border-r border-gray-50 last:border-r-0">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="min-h-[80px] border-r border-b border-gray-50 bg-gray-25" />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayShifts = shiftsByDate[dateStr] || [];
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
            return (
              <div key={dateStr}
                className={`min-h-[80px] border-r border-b border-gray-50 p-1 cursor-pointer hover:bg-blue-50/50 transition ${isToday ? 'bg-blue-50/30' : ''}`}
                onClick={() => isAdmin && openAssign(dateStr)}>
                <span className={`text-xs font-medium ${isToday ? 'bg-navy text-white w-5 h-5 rounded-full inline-flex items-center justify-center' : 'text-gray-600'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayShifts.map((s: any) => {
                    const name = (staff || []).find((st: any) => st.email === s.userId);
                    return (
                      <div key={s._id} className="text-[10px] leading-tight px-1 py-0.5 rounded" style={{ backgroundColor: s.color + '22', color: s.color, borderLeft: `2px solid ${s.color}` }}>
                        {name?.displayName?.split(' ')[0] || s.userId.split('@')[0]} · {s.shiftType}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign shift modal */}
      <Modal open={showAssign} onClose={() => setShowAssign(false)} title={`Assign Shift — ${assignDate}`}
        footer={<><Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button><Button loading={saving} onClick={handleAssign}>Assign</Button></>}>
        <div className="space-y-4">
          <Select label="Staff Member *" options={staffOptions} placeholder="Select staff" value={assignUser} onChange={e => setAssignUser(e.target.value)} />
          <Select label="Shift Type *" options={typeOptions} placeholder="Select shift" value={assignType} onChange={e => {
            setAssignType(e.target.value);
            const t = types.find((t: any) => t.name === e.target.value);
            if (t?.startTime) setAssignStart(t.startTime);
            if (t?.endTime) setAssignEnd(t.endTime);
          }} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" value={assignStart} onChange={e => setAssignStart(e.target.value)} />
            <Input label="End Time" type="time" value={assignEnd} onChange={e => setAssignEnd(e.target.value)} />
          </div>
          <p className="text-[11px] text-gray-400">Times are pre-filled from the shift type but can be adjusted.</p>
        </div>
      </Modal>

      {/* Manage shift types modal */}
      <Modal open={showTypeModal} onClose={() => setShowTypeModal(false)} title="Manage Shift Types"
        footer={<Button onClick={() => setShowTypeModal(false)}>Done</Button>}>
        <div className="space-y-4">
          <div className="space-y-2">
            {(shiftTypes || []).map((t: any) => (
              <div key={t._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-sm font-medium">{t.name}</span>
                  {t.startTime && <span className="text-xs text-gray-400">{t.startTime} – {t.endTime}</span>}
                </div>
                <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => deleteShiftType({ id: t._id })} />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500">Add New Type</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="e.g. Split Shift" />
              <Input label="Color" type="color" value={newTypeColor} onChange={e => setNewTypeColor(e.target.value)} />
              <Input label="Start Time" type="time" value={newTypeStart} onChange={e => setNewTypeStart(e.target.value)} />
              <Input label="End Time" type="time" value={newTypeEnd} onChange={e => setNewTypeEnd(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleCreateType} disabled={!newTypeName}>Add Type</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
