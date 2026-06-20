import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Clock, LogIn, LogOut, Timer } from 'lucide-react';
import { Button, Card, Badge, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimeTrackingScreen() {
  const { account } = useAuth();
  const userId = account?.email || '';
  const isAdmin = account?.role === 'admin';
  const status = useQuery(api.timeEntries.currentStatus, userId ? { userId } : 'skip');
  const myEntries = useQuery(api.timeEntries.listByUser, userId ? { userId } : 'skip');
  const allEntries = useQuery(api.timeEntries.listAll, isAdmin ? {} : 'skip');

  const clockIn = useMutation(api.timeEntries.clockIn);
  const clockOut = useMutation(api.timeEntries.clockOut);

  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!status?.clockedIn) { setElapsed(''); return; }
    const tick = () => {
      const mins = Math.floor((Date.now() - status.since!) / 60000);
      setElapsed(fmtDuration(mins));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [status]);

  const entries = isAdmin ? allEntries : myEntries;

  const totalToday = (myEntries || [])
    .filter(e => {
      const d = new Date(e.clockIn);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })
    .reduce((sum, e) => sum + (e.totalMinutes || 0), 0);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Time Tracking</h2>
          <p className="text-sm text-gray-500">Clock in/out to track your working hours</p>
        </div>
        <div className="flex items-center gap-3">
          {status?.clockedIn && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <Timer size={16} className="text-green-600 animate-pulse" />
              <span className="text-sm font-medium text-green-700">Active: {elapsed}</span>
            </div>
          )}
          {!status?.clockedIn ? (
            <Button icon={<LogIn size={15} />} onClick={() => clockIn({ userId })}>Clock In</Button>
          ) : (
            <Button variant="danger" icon={<LogOut size={15} />} onClick={() => clockOut({ userId })}>Clock Out</Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-400">Today</p>
          <p className="text-lg font-bold text-gray-900">{fmtDuration(totalToday + (status?.clockedIn ? Math.floor((Date.now() - status.since!) / 60000) : 0))}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-400">Status</p>
          <Badge label={status?.clockedIn ? 'Clocked In' : 'Clocked Out'} color={status?.clockedIn ? 'green' : 'gray'} />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-400">Entries (30 days)</p>
          <p className="text-lg font-bold text-gray-900">{(entries || []).length}</p>
        </Card>
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {(isAdmin ? ['Staff', 'Date', 'Clock In', 'Clock Out', 'Duration'] : ['Date', 'Clock In', 'Clock Out', 'Duration']).map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!entries ? (
              <tr><td colSpan={5} className="text-center py-8"><Spinner /></td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No time entries yet</td></tr>
            ) : entries.map((e: any) => (
              <tr key={e._id} className="border-t border-gray-50 hover:bg-gray-50">
                {isAdmin && <td className="px-4 py-2 text-gray-700">{e.userId}</td>}
                <td className="px-4 py-2 text-gray-800">{format(new Date(e.clockIn), 'dd MMM yyyy')}</td>
                <td className="px-4 py-2 text-gray-600">{format(new Date(e.clockIn), 'HH:mm')}</td>
                <td className="px-4 py-2 text-gray-600">{e.clockOut ? format(new Date(e.clockOut), 'HH:mm') : <Badge label="Active" color="green" />}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{e.totalMinutes != null ? fmtDuration(e.totalMinutes) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
