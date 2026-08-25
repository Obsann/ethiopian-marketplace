'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';
import type { Notification } from '@/types';

function hrefForType(type: Notification['type']): string {
  switch (type) {
    case 'new_message':
    case 'new_offer':
      return '/inbox';
    case 'listing_sold':
    case 'payment_failed':
    case 'payment_refunded':
    case 'funds_released':
      return '/orders';
    case 'verification_approved':
    case 'verification_rejected':
      return '/verify';
    default:
      return '/dashboard';
  }
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsMenu() {
  const { token, user } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    try {
      const res = await api<Notification[]>('/api/notifications', token ? { token } : {});
      setItems(res.data);
    } catch {
      /* ignore polling errors */
    }
  }

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setItems([]);
      setOpen(false);
      return;
    }
    load();
    const socket = connectSocket(token);
    socket.on('notification', load);
    socket.on('receive_message', load);
    const poll = window.setInterval(load, 20000);
    return () => {
      socket.off('notification', load);
      socket.off('receive_message', load);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function markRead(id: string) {
    if (!user) return;
    await api(`/api/notifications/${id}/read`, { method: 'PATCH', token: token || undefined });
    setItems((rows) => rows.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  if (!user) return null;

  const unread = items.filter((n) => !n.is_read).length;
  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className="relative cursor-pointer rounded-md p-2 text-muted transition duration-180 hover:bg-slate-100 hover:text-ink"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" aria-hidden strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 min-w-[1.05rem] rounded-full bg-brand-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-card"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            <button
              type="button"
              className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-muted transition hover:bg-slate-100 hover:text-ink"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <ul className="max-h-[min(70vh,22rem)] overflow-y-auto">
            {items.slice(0, 12).map((n) => (
              <li key={n.id} className="border-b border-border last:border-0">
                <Link
                  href={hrefForType(n.type)}
                  className={`block cursor-pointer px-3 py-2.5 text-left transition ${
                    n.is_read ? 'text-muted' : 'bg-brand-50 text-ink'
                  }`}
                  onClick={() => {
                    void markRead(n.id);
                    setOpen(false);
                  }}
                >
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted">{timeAgo(n.created_at)}</p>
                </Link>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-muted">No notifications yet.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
