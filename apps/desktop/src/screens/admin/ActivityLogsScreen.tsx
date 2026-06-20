import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Shield, Search } from 'lucide-react';
import { Input, Select, Badge, EmptyState, Spinner } from '../../components/ui';
import { format } from 'date-fns';

const categoryColor: Record<string, 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'gray'> = {
  auth: 'navy', patient: 'blue', appointment: 'green', invoice: 'amber', stock: 'peach' as any, admin: 'red', message: 'gray',
};

const categoryOptions = [
  { value: '', label: 'All Categories' },
  ...['auth','patient','appointment','invoice','stock','admin','message'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))
];

export default function ActivityLogsScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const allLogs = useQuery(api.activityLogs.listActivityLogs, { limit: 200 });
  const catLogs = useQuery(
    api.activityLogs.listActivityLogsByCategory,
    category ? { category, limit: 200 } : 'skip'
  );
  const logs = category ? catLogs : allLogs;

  const filtered = (logs || []).filter((l: any) =>
    !search ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.performedBy || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.performedByName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-900">Activity Logs</h2>
        <div className="flex items-center gap-2">
          <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} className="w-56" />
          <Select options={categoryOptions} value={category} onChange={e => setCategory(e.target.value)} className="w-40" />
        </div>
      </div>

      {!logs ? <div className="flex justify-center py-10"><Spinner /></div>
        : filtered.length === 0 ? <EmptyState icon={<Shield size={32} />} title="No activity logs" description="Actions will appear here" />
          : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Time', 'Action', 'Category', 'Performed By', 'Target', 'Details'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log: any) => (
                    <tr key={log._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {log.createdAt ? format(new Date(log.createdAt), 'dd MMM, HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{log.action}</td>
                      <td className="px-4 py-3">
                        <Badge label={log.category || 'system'} color={categoryColor[log.category] || 'gray'} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.performedByName || log.performedBy}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-32">{log.target || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-48">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
    </div>
  );
}
