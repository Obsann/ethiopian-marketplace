'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from './ui/Button';
import { NotificationsMenu } from './NotificationsMenu';

const navLink = 'shrink-0 py-1 text-ink/80 hover:text-ink';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link href="/listings" className={navLink} onClick={() => setOpen(false)}>
        Browse
      </Link>
      {!isLoading && user && (
        <>
          <Link href="/inbox" className={navLink} onClick={() => setOpen(false)}>
            Inbox
          </Link>
          <Link href="/orders" className={navLink} onClick={() => setOpen(false)}>
            Orders
          </Link>
        </>
      )}
      {!isLoading && user?.role === 'seller' && (
        <>
          <Link href="/sell" className={navLink} onClick={() => setOpen(false)}>
            Sell
          </Link>
          <Link href="/dashboard" className={navLink} onClick={() => setOpen(false)}>
            Dashboard
          </Link>
        </>
      )}
      {!isLoading && user?.role === 'admin' && (
        <Link href="/admin" className={navLink} onClick={() => setOpen(false)}>
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:py-3">
        <Link
          href="/"
          className="shrink-0 font-display text-lg font-bold tracking-tight text-brand-700 sm:text-xl"
        >
          Suq<span className="text-accent-500">ET</span>
        </Link>

        <nav className="ml-auto hidden min-w-0 items-center justify-end gap-4 text-sm sm:flex" aria-label="Main">
          {links}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:ml-3 sm:gap-1">
          {isLoading && <span className="h-8 w-16 animate-pulse rounded bg-black/5" aria-hidden />}
          {!isLoading && user && <NotificationsMenu />}
          {!isLoading && !user && (
            <>
              <Link href={`/auth/login${pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''}`}>
                <Button variant="ghost" className="px-2 py-1.5">
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
                href="/account"
                className="hidden rounded-md px-2 py-1.5 text-sm text-ink/70 hover:bg-black/5 hover:text-ink sm:inline"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-md px-2 py-1.5 text-sm text-ink/70 hover:bg-black/5 hover:text-ink"
              >
                Log out
              </button>
            </>
          )}
          <button
            type="button"
            className="rounded-md p-2 text-ink/80 hover:bg-black/5 sm:hidden"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-2 border-t border-black/8 px-4 py-3 text-sm sm:hidden" aria-label="Mobile">
          {links}
          {user && (
            <Link href="/account" className={navLink} onClick={() => setOpen(false)}>
              Account
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
