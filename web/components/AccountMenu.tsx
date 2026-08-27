'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const item =
  'block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink hover:bg-paper';

export function AccountMenu({ inverted = false }: { inverted?: boolean }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  if (!user) return null;

  const canDashboard = user.role === 'seller' || user.role === 'admin';
  const trigger = inverted
    ? 'text-white/80 hover:bg-white/10 hover:text-white'
    : 'text-muted hover:bg-stone-100 hover:text-ink';

  return (
    <div className="relative hidden md:inline-block" ref={root}>
      <button
        type="button"
        className={`cursor-pointer rounded-lg p-2 transition duration-300 ${trigger}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        onClick={() => setOpen((v) => !v)}
      >
        <User className="h-5 w-5" aria-hidden strokeWidth={1.8} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-1 min-w-[10rem] border border-border bg-surface py-1 shadow-float"
        >
          <Link role="menuitem" href="/account" className={item} onClick={() => setOpen(false)}>
            Account
          </Link>
          {canDashboard && (
            <Link role="menuitem" href="/dashboard" className={item} onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          )}
          {user.role === 'admin' && (
            <Link
              role="menuitem"
              href="/admin"
              className={`${item} text-muted hover:text-ink`}
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            className={`${item} border-t border-border`}
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
