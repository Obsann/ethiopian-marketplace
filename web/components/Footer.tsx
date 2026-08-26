'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function Footer() {
  const { user, isLoading } = useAuth();

  return (
    <footer className="mt-auto border-t border-border bg-ink text-white">
      <div className="page-shell grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="notranslate font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Suq<span className="text-accent-400">ET</span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
            Ethiopia&apos;s second-hand suq — buy and sell used goods in ETB, message sellers, and
            check out in-app.
          </p>
        </div>
        <div>
          <p className="eyebrow text-white/40">Explore</p>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>
              <Link href="/listings" className="hover:text-white">
                Shop all
              </Link>
            </li>
            <li>
              <Link href="/listings?sort=newest" className="hover:text-white">
                New arrivals
              </Link>
            </li>
            <li>
              <Link
                href={user?.role === 'seller' || user?.role === 'admin' ? '/sell' : '/auth/register'}
                className="hover:text-white"
              >
                List an item
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-white/40">Account</p>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {!isLoading && user ? (
              <>
                <li>
                  <Link href="/account" className="hover:text-white">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="hover:text-white">
                    Orders
                  </Link>
                </li>
                <li>
                  <Link href="/inbox" className="hover:text-white">
                    Inbox
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/auth/login" className="hover:text-white">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="hover:text-white">
                    Join SuqET
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      <div className="page-shell border-t border-white/10 py-5 text-xs text-white/35">
        © {new Date().getFullYear()} SuqET · Ethiopia
      </div>
    </footer>
  );
}
