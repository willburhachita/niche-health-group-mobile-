import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { cn, Avatar } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import GlobalSearch from '../components/GlobalSearch';
import NotificationsPanel from '../components/NotificationsPanel';

export default function TopBar({ title }: { title?: string }) {
  const { account, session, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const userId = session?.accountId || account?.email || '';
  const unreadCount = useQuery(api.inAppNotifs.unreadCount, userId ? { userId } : 'skip');

  const unreadDMsCount = useQuery(api.messages.unreadMessagesCount, account?.userId ? { userId: account.userId } : 'skip');

  const prevUnreadCountRef = useRef<number | undefined>(undefined);
  const prevUnreadDMsRef = useRef<number | undefined>(undefined);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.08);
      gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.10);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(audioCtx.currentTime + 0.08);
      osc2.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio Context failed to play chime', e);
    }
  };

  useEffect(() => {
    if (unreadCount !== undefined && prevUnreadCountRef.current !== undefined) {
      if (unreadCount > prevUnreadCountRef.current) {
        playChime();
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (unreadDMsCount !== undefined && prevUnreadDMsRef.current !== undefined) {
      if (unreadDMsCount > prevUnreadDMsRef.current) {
        playChime();
      }
    }
    prevUnreadDMsRef.current = unreadDMsCount;
  }, [unreadDMsCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const displayName = account?.displayName || account?.fullName || account?.email || 'User';
  const role = account?.role ? account.role.charAt(0).toUpperCase() + account.role.slice(1) : '';

  return (
    <>
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative z-30">
      <div className="flex items-center gap-3">
        {title && <h1 className="text-base font-semibold text-gray-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 w-56 cursor-pointer hover:border-navy/40 hover:bg-gray-100 transition">
          <Search size={14} />
          <span className="flex-1 text-left">Search…</span>
          <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-500">⌘K</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <Bell size={18} />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-peach text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} anchorRef={bellRef} />
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-50 transition"
          >
            <Avatar name={displayName} size="sm" />
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-800 leading-none">{displayName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-modal z-20 py-1 overflow-hidden">
                <button onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Profile & Settings
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
