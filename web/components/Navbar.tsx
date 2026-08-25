'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from './ui/Button';
import { NotificationsMenu } from './NotificationsMenu';

const navLink = 'shrink-0 py-1 text-ink/75 hover:text-brand-600 font-medium transition-colors';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/listings?query=${encodeURIComponent(q.trim())}` : '/listings');
  }

  const links = (
    <>
      <Link href="/listings" className={navLink} onClick={() => setOpen(false)}>Browse</Link>
      {!isLoading && user && (
        <>
          <Link href="/inbox" className={navLink} onClick={() => setOpen(false)}>Inbox</Link>
          <Link href="/orders" className={navLink} onClick={() => setOpen(false)}>Orders</Link>
        </>
      )}
      {!isLoading && user?.role === 'seller' && (
        <>
          <Link href="/sell" className={navLink} onClick={() => setOpen(false)}>Sell</Link>
          <Link href="/dashboard" className={navLink} onClick={() => setOpen(false)}>Dashboard</Link>
        </>
      )}
      {!isLoading && user?.role === 'admin' && (
        <Link href="/admin" className={navLink} onClick={() => setOpen(false)}>Admin</Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-paper/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {/* Brand */}
        <Link href="/" className="notranslate shrink-0 font-display text-xl font-bold tracking-tight text-brand-700">
          Suq<span className="text-accent-500">ET</span>
        </Link>

        {/* Inline search — hidden on mobile */}
        <form onSubmit={onSearch} className="mx-4 hidden flex-1 sm:flex">
          <div className="relative w-full max-w-md">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search phones, furniture, bikes…"
              className="w-full rounded-xl border border-black/10 bg-white/80 py-2 pl-4 pr-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-brand-600 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-4 text-sm sm:flex" aria-label="Main">
          {links}
        </nav>

        {/* Auth + utils */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-3">
          <div id="google_translate_header_target" className="flex max-w-[9.5rem] items-center sm:max-w-none" />
          {isLoading && <span className="h-8 w-16 animate-pulse rounded-xl bg-black/5" aria-hidden />}
          {!isLoading && user && <NotificationsMenu />}
          {!isLoading && !user && (
            <>
              <Link href={`/auth/login${pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''}`}>
                <Button variant="ghost" className="px-3 py-1.5 text-sm">Log in</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="px-4 py-1.5 text-sm">Sign up</Button>
              </Link>
            </>
          )}
          {!isLoading && user && (
            <>
              <Link href="/account" className="hidden rounded-xl px-2 py-1.5 text-sm text-muted hover:bg-black/5 hover:text-ink sm:inline transition-colors">Account</Link>
              <button type="button" onClick={() => void logout()} className="rounded-xl px-2 py-1.5 text-sm text-muted hover:bg-black/5 hover:text-ink transition-colors">Log out</button>
            </>
          )}
          {/* Mobile hamburger */}
          <button type="button" className="rounded-xl p-2 text-ink/70 hover:bg-black/5 sm:hidden transition-colors" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(v => !v)}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              {open ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18"/> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="flex flex-col gap-2 border-t border-black/8 bg-paper px-4 py-4 text-sm sm:hidden" aria-label="Mobile">
          <form onSubmit={onSearch} className="mb-2 flex gap-2">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/>
            <Button type="submit" className="px-4 py-2">Go</Button>
          </form>
          {links}
          {user && <Link href="/account" className={navLink} onClick={() => setOpen(false)}>Account</Link>}
        </nav>
      )}
    </header>
  );
}
