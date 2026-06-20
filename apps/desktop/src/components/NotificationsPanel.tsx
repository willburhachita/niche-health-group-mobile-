import React, { useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '@convex/_generated/api';
import {
  Bell, X, CheckCheck, Calendar, FileText, Package,
  Video, MessageSquare, Megaphone, Info, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const typeIcon: Record<string, React.ReactNode> = {
  appointment:  <Calendar size={14} className="text-blue-500" />,
  invoice:      <FileText size={14} className="text-amber-500" />,
  stock:        <Package size={14} className="text-red-500" />,
  telehealth:   <Video size={14} className="text-green-500" />,
  message:      <MessageSquare size={14} className="text-purple-500" />,
  announcement: <Megaphone size={14} className="text-peach" />,
  system:       <Info size={14} className="text-gray-400" />,
};

const typeBg: Record<string, string> = {
  appointment:  'bg-blue-50',
  invoice:      'bg-amber-50',
  stock:        'bg-red-50',
  telehealth:   'bg-green-50',
  message:      'bg-purple-50',
  announcement: 'bg-orange-50',
  system:       'bg-gray-50',
};

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export default function NotificationsPanel({ open, onClose, anchorRef }: Props) {
  const { session, account, hasPermission } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const userId = session?.accountId || account?.email || '';

  const notifications = useQuery(api.inAppNotifs.listForUser, userId ? { userId } : 'skip');
  const stockAlerts   = useQuery(api.stock.alerts, hasPermission('manageStock') ? {} : 'skip');

  const markRead     = useMutation(api.inAppNotifs.markRead);
  const markAllRead  = useMutation(api.inAppNotifs.markAllRead);
  const removeNotif  = useMutation(api.inAppNotifs.remove);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const handleGo = async (id: string, link?: string) => {
    await markRead({ id: id as any });
    onClose();
    if (link) navigate(link);
  };

  const storedNotifs = notifications || [];
  const unread = storedNotifs.filter(n => !n.isRead).length;

  // Computed stock alerts as pseudo-notifications
  const stockNotifItems = hasPermission('manageStock')
    ? [
        ...(stockAlerts?.lowStock || []).map((s: any) => ({
          _id: `low-${s._id}`,
          type: 'stock',
          title: 'Low stock alert',
          body: `${s.name} — only ${s.stockLevel} ${s.unit || 'units'} left (reorder at ${s.reorderLevel})`,
          link: '/stock',
          isRead: false,
          createdAt: Date.now(),
          computed: true,
        })),
        ...(stockAlerts?.expired || []).map((s: any) => ({
          _id: `exp-${s._id}`,
          type: 'stock',
          title: 'Expired stock',
          body: `${s.name} has expired and should be removed from inventory`,
          link: '/stock',
          isRead: false,
          createdAt: Date.now(),
          computed: true,
        })),
        ...(stockAlerts?.expiringSoon || []).map((s: any) => ({
          _id: `soon-${s._id}`,
          type: 'stock',
          title: 'Expiring soon',
          body: `${s.name} is expiring within 90 days`,
          link: '/stock',
          isRead: false,
          createdAt: Date.now(),
          computed: true,
        })),
      ]
    : [];

  const allItems = [...storedNotifs, ...stockNotifItems].sort(
    (a, b) => (b.createdAt as number) - (a.createdAt as number)
  );

  const totalUnread = unread + stockNotifItems.length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl border border-gray-100 shadow-modal z-50 flex flex-col max-h-[80vh] overflow-hidden"
      style={{ minWidth: 340 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-navy" />
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {totalUnread > 0 && (
            <span className="bg-peach text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={() => markAllRead({ userId })}
              className="flex items-center gap-1 text-xs text-navy hover:underline px-2 py-1 rounded hover:bg-gray-50"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto scrollbar-thin flex-1">
        {allItems.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          allItems.map((n: any) => (
            <div
              key={n._id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition ${!n.isRead ? 'bg-blue-50/30' : ''}`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${typeBg[n.type] || 'bg-gray-50'}`}>
                {typeIcon[n.type] || <Info size={14} className="text-gray-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-tight ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {n.title}
                  </p>
                  {!n.computed && (
                    <button onClick={() => removeNotif({ id: n._id })} className="text-gray-200 hover:text-gray-400 shrink-0">
                      <X size={11} />
                    </button>
                  )}
                </div>
                {n.body && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-gray-300">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                  {n.link && (
                    <button
                      onClick={() => n.computed ? (onClose(), navigate(n.link)) : handleGo(n._id, n.link)}
                      className="flex items-center gap-1 text-[11px] text-navy font-medium hover:underline"
                    >
                      View details <ArrowRight size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* Unread dot */}
              {!n.isRead && (
                <div className="w-1.5 h-1.5 bg-peach rounded-full shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {allItems.length > 0 && (
        <div className="border-t border-gray-50 px-4 py-2 text-center">
          <p className="text-[11px] text-gray-300">{allItems.length} notification{allItems.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}
