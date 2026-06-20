import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Monitor, CheckCircle, XCircle } from 'lucide-react';
import { Button, Badge, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

export default function DeviceApprovalsScreen() {
  const { account } = useAuth();
  const devices = useQuery(api.auth.listDeviceRequests);
  const approveDevice = useMutation(api.auth.approveDeviceRequest);
  const rejectDevice = useMutation(api.auth.rejectDeviceRequest);

  const sortedDevices = React.useMemo(() => {
    if (!devices) return [];
    return [...devices].sort((a: any, b: any) => {
      const statusA = a.status || 'pending';
      const statusB = b.status || 'pending';
      
      // 1. Prioritize pending requests
      if (statusA === 'pending' && statusB !== 'pending') return -1;
      if (statusA !== 'pending' && statusB === 'pending') return 1;
      
      // 2. Sort by request time descending (newest first)
      const timeA = a.requestedAt || a._creationTime || 0;
      const timeB = b.requestedAt || b._creationTime || 0;
      return timeB - timeA;
    });
  }, [devices]);

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Device Approvals</h2>
        <p className="text-sm text-gray-500">Review and approve new device sign-in requests from staff.</p>
      </div>

      {!devices ? <div className="flex justify-center py-10"><Spinner /></div>
        : devices.length === 0 ? <EmptyState icon={<Monitor size={32} />} title="No pending devices" description="All device requests have been reviewed" />
          : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Staff Email', 'Device', 'Platform', 'Requested', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedDevices.map((d: any) => (
                    <tr key={d._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-4 font-medium text-gray-800">{d.email || d.staffEmail}</td>
                      <td className="px-5 py-4 text-gray-600">{d.deviceName || 'Unknown Device'}</td>
                      <td className="px-5 py-4 text-gray-500">{d.platform || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-400 font-medium">
                        {d.requestedAt ? format(new Date(d.requestedAt), 'dd MMM yyyy HH:mm') : d._creationTime ? format(new Date(d._creationTime), 'dd MMM yyyy HH:mm') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <Badge label={d.status || 'pending'} color={d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'red' : 'blue'} />
                      </td>
                      <td className="px-5 py-4">
                        {(d.status === 'pending' || !d.status) && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => approveDevice({ requestId: d._id, adminId: account?.email || 'admin' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition-colors border border-green-200/40"
                            >
                              <CheckCircle size={12} className="stroke-[2.5px]" /> Approve
                            </button>
                            <button 
                              onClick={() => rejectDevice({ requestId: d._id, adminId: account?.email || 'admin' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors border border-red-200/40"
                            >
                              <XCircle size={12} className="stroke-[2.5px]" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
    </div>
  );
}
