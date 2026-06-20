import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '@convex/_generated/api';
import {
  Search, X, Home, MessageSquare, Hash, Calendar, Users, CalendarCheck,
  FileText, Package, Truck, CreditCard, Receipt, BarChart2, Video,
  Building2, Settings, UserCog, Megaphone, Shield, Layers, ArrowRight,
  User, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { type Permission } from '../utils/permissions';

interface SearchResult {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
  perm: Permission | null;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <Home size={15} />, to: '/dashboard', perm: null },
  { label: 'Messages', icon: <MessageSquare size={15} />, to: '/messages', perm: 'messaging' },
  { label: 'Channels', icon: <Hash size={15} />, to: '/channels', perm: 'channels' },
  { label: 'Schedule', icon: <Calendar size={15} />, to: '/schedule', perm: null },
  { label: 'Patients', icon: <Users size={15} />, to: '/patients', perm: 'clinicDashboard' },
  { label: 'Appointments', icon: <CalendarCheck size={15} />, to: '/appointments', perm: 'clinicDashboard' },
  { label: 'Invoices', icon: <FileText size={15} />, to: '/invoices', perm: 'clinicDashboard' },
  { label: 'Treatment Notes', icon: <Layers size={15} />, to: '/treatment-notes', perm: 'createTreatmentNote' },
  { label: 'Telehealth', icon: <Video size={15} />, to: '/telehealth', perm: 'manageTelehealth' },
  { label: 'Departments', icon: <Building2 size={15} />, to: '/departments', perm: 'clinicDashboard' },
  { label: 'Stock & Inventory', icon: <Package size={15} />, to: '/stock', perm: 'manageStock' },
  { label: 'Suppliers', icon: <Truck size={15} />, to: '/suppliers', perm: 'manageSuppliers' },
  { label: 'Payments', icon: <CreditCard size={15} />, to: '/payments', perm: 'managePayments' },
  { label: 'Expenses', icon: <Receipt size={15} />, to: '/expenses', perm: 'manageExpenses' },
  { label: 'Reports', icon: <BarChart2 size={15} />, to: '/reports', perm: 'viewReports' },
  { label: 'Staff Management', icon: <UserCog size={15} />, to: '/admin/staff', perm: 'manageStaff' },
  { label: 'Announcements', icon: <Megaphone size={15} />, to: '/admin/announcements', perm: 'sendAnnouncements' },
  { label: 'Analytics', icon: <BarChart2 size={15} />, to: '/admin/analytics', perm: 'viewAnalytics' },
  { label: 'Activity Logs', icon: <Shield size={15} />, to: '/admin/logs', perm: 'viewActivityLogs' },
  { label: 'Settings', icon: <Settings size={15} />, to: '/settings', perm: null },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const q = query.trim();

  // Convex search queries — skip when empty or no permission
  const patientResults = useQuery(
    api.patients.search,
    q.length >= 2 && hasPermission('clinicDashboard') ? { query: q } : 'skip'
  );
  const stockResults = useQuery(
    api.stock.search,
    q.length >= 2 && hasPermission('manageStock') ? { query: q } : 'skip'
  );
  const supplierResults = useQuery(
    api.suppliers.search,
    q.length >= 2 && hasPermission('manageSuppliers') ? { query: q } : 'skip'
  );

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const go = useCallback((action: () => void) => {
    action();
    onClose();
  }, [onClose]);

  // Build result groups
  const results: SearchResult[] = [];

  // Navigation matches
  const navMatches = NAV_ITEMS.filter(n =>
    (!n.perm || hasPermission(n.perm)) &&
    (q === '' || n.label.toLowerCase().includes(q.toLowerCase()))
  );
  navMatches.slice(0, q ? 4 : 6).forEach(n =>
    results.push({
      id: `nav-${n.to}`,
      group: 'Go to',
      title: n.label,
      subtitle: n.to,
      icon: n.icon,
      action: () => navigate(n.to),
    })
  );

  // Patient results
  if (q.length >= 2 && hasPermission('clinicDashboard')) {
    (patientResults || []).slice(0, 5).forEach((p: any) =>
      results.push({
        id: `pat-${p._id}`,
        group: 'Patients',
        title: p.displayName || p.fullName || 'Patient',
        subtitle: `${p.nhid || ''} · ${p.phone || p.email || ''}`.replace(/^·\s*/, '').trim(),
        icon: <User size={15} />,
        action: () => navigate('/patients'),
      })
    );
  }

  // Stock results
  if (q.length >= 2 && hasPermission('manageStock')) {
    (stockResults || []).slice(0, 4).forEach((s: any) =>
      results.push({
        id: `stock-${s._id}`,
        group: 'Stock & Inventory',
        title: s.name,
        subtitle: `${s.itemCode} · ${s.stockLevel} ${s.unit || 'units'} in stock`,
        icon: <Package size={15} />,
        action: () => navigate('/stock'),
      })
    );
  }

  // Supplier results
  if (q.length >= 2 && hasPermission('manageSuppliers')) {
    (supplierResults || []).slice(0, 4).forEach((s: any) =>
      results.push({
        id: `sup-${s._id}`,
        group: 'Suppliers',
        title: s.name,
        subtitle: s.contactPerson || s.phone || '',
        icon: <Truck size={15} />,
        action: () => navigate('/suppliers'),
      })
    );
  }

  // Reset active index when results change
  useEffect(() => setActiveIdx(0), [q]);

  // Keyboard navigation
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) { go(results[activeIdx].action); }
    if (e.key === 'Escape') onClose();
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  // Group results for rendering
  const groups: Record<string, SearchResult[]> = {};
  results.forEach(r => {
    if (!groups[r.group]) groups[r.group] = [];
    groups[r.group].push(r);
  });
  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[70vh]">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search patients, stock, pages, messages…"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto scrollbar-thin">
          {results.length === 0 && q.length > 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">No results for &ldquo;{q}&rdquo;</div>
          )}

          {results.length === 0 && q.length === 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Quick Navigation</p>
              {navMatches.slice(0, 6).map((n, i) => (
                <button key={n.to} data-idx={i}
                  onClick={() => go(() => navigate(n.to))}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${i === activeIdx ? 'bg-navy text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <span className={i === activeIdx ? 'text-white' : 'text-gray-400'}>{n.icon}</span>
                  <span className="flex-1 text-left">{n.label}</span>
                  <ChevronRight size={13} className="opacity-40" />
                </button>
              ))}
              <p className="text-xs text-gray-300 text-center mt-3">Type to search across the app</p>
            </div>
          )}

          {Object.entries(groups).map(([group, items]) => {
            return (
              <div key={group} className="px-4 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1 px-1">{group}</p>
                {items.map(item => {
                  const idx = flatIdx++;
                  const isActive = activeIdx === idx;
                  return (
                    <button key={item.id} data-idx={idx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => go(item.action)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left ${isActive ? 'bg-navy text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}>{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>{item.title}</p>
                        {item.subtitle && (
                          <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{item.subtitle}</p>
                        )}
                      </div>
                      <ArrowRight size={13} className={isActive ? 'text-white/60' : 'text-gray-200'} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-50 px-4 py-2 flex items-center gap-4 text-[11px] text-gray-300">
          <span><kbd className="bg-gray-100 text-gray-400 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="bg-gray-100 text-gray-400 rounded px-1">↵</kbd> open</span>
          <span><kbd className="bg-gray-100 text-gray-400 rounded px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
