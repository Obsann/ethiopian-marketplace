'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Notification } from '@/types';
import { Button } from './ui/Button';

function NotificationsBell() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token) {
      setItems([]);
      return;
    }
    api<Notification[]>('/api/notifications', { token })
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, [token, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const unread = items.some((n) => !n.is_read);

  async function markRead(note: Notification) {
    if (!token || note.is_read) {
      setOpen(false);
      return;
    }
    try {
      await api(`/api/notifications/${note.id}/read`, { method: 'PATCH', token });
      setItems((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_read: true } : n)));
    } catch {
      // keep dropdown open so the user can retry
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-ink/80 transition hover:bg-black/5 hover:text-ink"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unread && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-paper" aria-hidden />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lift">
          <p className="border-b border-black/8 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink/50">
            Notifications
          </p>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-ink/50">No notifications yet.</li>
            )}
            {items.slice(0, 12).map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n)}
                  className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-brand-50 ${
                    n.is_read ? 'text-ink/60' : 'font-medium text-ink'
                  }`}
                >
                  <span className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                    )}
                    <span className="min-w-0">
                      <span className="block break-words">{n.message}</span>
                      <span className="mt-0.5 block text-xs font-normal text-ink/45">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-brand-700 sm:text-xl">
          Suq<span className="text-accent-500">ET</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/listings"
            className="rounded-xl px-2.5 py-1.5 text-ink/80 transition hover:bg-black/5 hover:text-ink"
          >
            Browse
          </Link>
          {!isLoading && user?.role === 'seller' && (
            <Link
              href="/sell"
              className="hidden rounded-xl px-2.5 py-1.5 text-ink/80 transition hover:bg-black/5 hover:text-ink sm:inline"
            >
              Sell
            </Link>
          )}
          {!isLoading && user?.role === 'seller' && (
            <Link
              href="/dashboard"
              className="hidden rounded-xl px-2.5 py-1.5 text-ink/80 transition hover:bg-black/5 hover:text-ink sm:inline"
            >
              Dashboard
            </Link>
          )}
          {!isLoading && user?.role === 'admin' && (
            <Link
              href="/admin"
              className="hidden rounded-xl px-2.5 py-1.5 text-ink/80 transition hover:bg-black/5 hover:text-ink sm:inline"
            >
              Admin
            </Link>
          )}
          {!isLoading && !user && (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="px-2.5 py-1.5">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="px-3 py-1.5">Sign up</Button>
              </Link>
            </>
          )}
          {!isLoading && user && (
            <>
              <Link
                href="/chat"
                className="rounded-xl px-2.5 py-1.5 text-ink/80 transition hover:bg-black/5 hover:text-ink"
              >
                Messages
              </Link>
              <NotificationsBell />
              <span className="hidden max-w-[8rem] truncate text-xs font-medium text-ink/70 sm:inline">
                {user.name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-xl px-2.5 py-1.5 text-ink/70 transition hover:bg-black/5 sm:inline"
              >
                Log out
              </button>
              <button
                type="button"
                className="rounded-xl p-2 hover:bg-black/5 sm:hidden"
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  {open ? (
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  ) : (
                    <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                  )}
                </svg>
              </button>
            </>
          )}
        </nav>
      </div>
      {open && user && (
        <div className="border-t border-black/8 bg-paper px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1 text-sm">
            <p className="px-2 pb-1 text-xs text-ink/50">{user.name}</p>
            <Link href="/chat" className="rounded-xl px-2 py-2 hover:bg-black/5" onClick={() => setOpen(false)}>
              Messages
            </Link>
            {user.role === 'seller' && (
              <>
                <Link href="/sell" className="rounded-xl px-2 py-2 hover:bg-black/5" onClick={() => setOpen(false)}>
                  Sell an item
                </Link>
                <Link href="/dashboard" className="rounded-xl px-2 py-2 hover:bg-black/5" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link href="/admin" className="rounded-xl px-2 py-2 hover:bg-black/5" onClick={() => setOpen(false)}>
                Admin
              </Link>
            )}
            <button type="button" onClick={logout} className="rounded-xl px-2 py-2 text-left hover:bg-black/5">
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
