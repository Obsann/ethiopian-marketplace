'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUnreadMessages } from '@/lib/unreadMessages';
import { Button } from './ui/Button';
import { NotificationsMenu } from './NotificationsMenu';
import { UnreadBadge } from './UnreadBadge';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const unreadMessages = useUnreadMessages();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/listings?query=${encodeURIComponent(q.trim())}` : '/listings');
  }

  const solid = scrolled || !isHome || open;
  const link =
    solid
      ? 'text-xs font-semibold uppercase tracking-[0.16em] text-ink/70 transition hover:text-ink'
      : 'text-xs font-semibold uppercase tracking-[0.16em] text-white/75 transition hover:text-white';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition duration-500 ${
        solid ? 'border-b border-border bg-paper/95 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="flex h-1 w-full" aria-hidden>
        <span className="flex-1 bg-et-green" />
        <span className="flex-1 bg-et-yellow" />
        <span className="flex-1 bg-et-red" />
      </div>
      <div className="page-shell flex h-16 items-center gap-4 sm:h-20">
        <Link
          href="/"
          className={`notranslate shrink-0 font-display text-2xl font-medium tracking-tight sm:text-3xl ${
            solid ? 'text-ink' : 'text-white'
          }`}
        >
          Suq<span className="text-accent-500">ET</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Main">
          <Link href="/listings" className={link}>
            Shop
          </Link>
          <Link href="/new" className={link}>
            New
          </Link>
          <Link href="/saved" className={link}>
            Saved
          </Link>
          {!isLoading && user?.role === 'seller' && (
            <Link href="/sell" className={link}>
              Sell
            </Link>
          )}
          {!isLoading && (user?.role === 'seller' || user?.role === 'admin') && (
            <Link href="/dashboard" className={link}>
              Dashboard
            </Link>
          )}
          {!isLoading && user?.role === 'admin' && (
            <Link href="/admin" className={link}>
              Admin
            </Link>
          )}
          {!isLoading && user && (
            <Link
              href="/inbox"
              className={`relative inline-flex items-center ${link}`}
              aria-label={unreadMessages > 0 ? `Inbox, ${unreadMessages} unread` : 'Inbox'}
            >
              Inbox
              <UnreadBadge count={unreadMessages} inverted={!solid} />
            </Link>
          )}
        </nav>

        <form onSubmit={onSearch} className="mx-auto hidden max-w-sm flex-1 md:block">
          <label htmlFor="nav-search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                solid ? 'text-muted' : 'text-white/60'
              }`}
              aria-hidden
            />
            <input
              id="nav-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the market…"
              className={`w-full border-0 border-b bg-transparent py-2 pl-10 pr-3 text-sm outline-none transition ${
                solid
                  ? 'border-border text-ink placeholder:text-muted focus:border-ink'
                  : 'border-white/30 text-white placeholder:text-white/50 focus:border-white'
              }`}
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div id="google_translate_header_target" className="hidden max-w-[8.5rem] sm:flex" />
          {isLoading && <span className="h-8 w-16 animate-pulse bg-stone-200/40" aria-hidden />}
          {!isLoading && user && <NotificationsMenu inverted={!solid} />}
          {!isLoading && !user && (
            <>
              <Link
                href={`/auth/login${pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''}`}
                className={`hidden px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] sm:inline ${
                  solid ? 'text-ink' : 'text-white'
                }`}
              >
                Log in
              </Link>
              <Link href="/auth/register" className="hidden sm:inline">
                <Button variant={solid ? 'primary' : 'inverse'} className="px-4 py-2.5">
                  Join
                </Button>
              </Link>
            </>
          )}
          {!isLoading && user && (
            <>
              <Link
                href="/account"
                className={`hidden px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] md:inline ${
                  solid ? 'text-ink/70 hover:text-ink' : 'text-white/80 hover:text-white'
                }`}
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className={`hidden px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] md:inline ${
                  solid ? 'text-ink/70 hover:text-ink' : 'text-white/80 hover:text-white'
                }`}
              >
                Log out
              </button>
            </>
          )}
          <button
            type="button"
            className={`rounded-lg p-2 lg:hidden ${solid ? 'text-ink' : 'text-white'}`}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-paper px-4 py-6 lg:hidden">
          <form onSubmit={onSearch} className="mb-5 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="field flex-1"
              aria-label="Search listings"
            />
            <Button type="submit">Go</Button>
          </form>
          <nav className="flex flex-col gap-3 text-sm font-semibold uppercase tracking-[0.16em]" aria-label="Mobile">
            <Link href="/listings">Shop</Link>
            <Link href="/new">New arrivals</Link>
            <Link href="/saved">Saved</Link>
            {user && (
              <Link href="/inbox" className="relative inline-flex items-center gap-2">
                Inbox
                {unreadMessages > 0 && (
                  <span className="bg-accent-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}
            {user && <Link href="/orders">Orders</Link>}
            {user?.role === 'seller' && <Link href="/sell">Sell</Link>}
            {(user?.role === 'seller' || user?.role === 'admin') && <Link href="/dashboard">Dashboard</Link>}
            {user?.role === 'admin' && <Link href="/admin">Admin</Link>}
            {user ? <Link href="/account">Account</Link> : <Link href="/auth/login">Log in</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
