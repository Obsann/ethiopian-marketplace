'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from './ui/Button';
import { NotificationsMenu } from './NotificationsMenu';

const navLink =
  'shrink-0 cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium text-muted transition duration-180 hover:bg-slate-100 hover:text-ink';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/listings?query=${encodeURIComponent(q.trim())}` : '/listings');
    setOpen(false);
  }

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
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link
          href="/"
          className="notranslate shrink-0 cursor-pointer font-display text-xl font-bold tracking-tight text-brand-700"
        >
          Suq<span className="text-accent-600">ET</span>
        </Link>

        <form onSubmit={onSearch} className="mx-2 hidden min-w-0 flex-1 sm:flex">
          <div className="relative w-full max-w-md">
            <label htmlFor="nav-search" className="sr-only">
              Search listings
            </label>
            <input
              id="nav-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search phones, furniture, bikes…"
              className="field py-2 pl-3 pr-10"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-muted transition hover:text-brand-600"
              aria-label="Search"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-1 text-sm sm:flex" aria-label="Main">
          {links}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-2">
          <div id="google_translate_header_target" className="flex max-w-[9.5rem] items-center sm:max-w-none" />
          {isLoading && <span className="h-8 w-16 animate-pulse rounded-lg bg-slate-100" aria-hidden />}
          {!isLoading && user && <NotificationsMenu />}
          {!isLoading && !user && (
            <>
              <Link
                href={`/auth/login${pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''}`}
              >
                <Button variant="ghost" className="px-3 py-1.5 text-sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="px-3 py-1.5 text-sm">Sign up</Button>
              </Link>
            </>
          )}
          {!isLoading && user && (
            <>
              {(user.role === 'seller' || user.role === 'admin') && (
                <Link href="/sell" className="hidden sm:inline">
                  <Button className="px-3 py-1.5 text-sm">List an item</Button>
                </Link>
              )}
              <Link
                href="/account"
                className="hidden cursor-pointer rounded-md px-2 py-1.5 text-sm text-muted transition hover:bg-slate-100 hover:text-ink sm:inline"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-muted transition hover:bg-slate-100 hover:text-ink"
              >
                Log out
              </button>
            </>
          )}
          <button
            type="button"
            className="cursor-pointer rounded-md p-2 text-ink transition hover:bg-slate-100 sm:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="flex flex-col gap-1 border-t border-border bg-surface px-4 py-4 text-sm sm:hidden"
          aria-label="Mobile"
        >
          <form onSubmit={onSearch} className="mb-2 flex gap-2">
            <label htmlFor="nav-search-mobile" className="sr-only">
              Search listings
            </label>
            <input
              id="nav-search-mobile"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="field flex-1"
            />
            <Button type="submit" className="px-4 py-2">
              Go
            </Button>
          </form>
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
