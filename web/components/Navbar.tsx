'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from './ui/Button';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-brand-700 sm:text-xl">
          Suq<span className="text-accent-500">ET</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/listings" className="hidden text-ink/80 hover:text-ink sm:inline">
            Browse
          </Link>
          {!isLoading && user?.role === 'seller' && (
            <>
              <Link href="/sell" className="text-ink/80 hover:text-ink">
                Sell
              </Link>
              <Link href="/dashboard" className="hidden text-ink/80 hover:text-ink sm:inline">
                Dashboard
              </Link>
            </>
          )}
          {!isLoading && user?.role === 'admin' && (
            <Link href="/admin" className="text-ink/80 hover:text-ink">
              Admin
            </Link>
          )}
          {!isLoading && !user && (
            <>
              <Link href="/auth/login">
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
            <button
              type="button"
              onClick={logout}
              className="rounded-md px-2 py-1.5 text-ink/70 hover:bg-black/5"
            >
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
