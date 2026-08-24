'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const footerLink = 'text-white/75 hover:text-white';

export function Footer() {
  const { user, isLoading } = useAuth();

  return (
    <footer className="mt-auto border-t border-black/8 bg-brand-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg font-bold tracking-tight">
              Suq<span className="text-accent-400">ET</span>
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">
              Ethiopia&apos;s second-hand marketplace. Browse locally, message sellers, and check out in the app.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/listings" className={footerLink}>
                  Browse listings
                </Link>
              </li>
              <li>
                <Link href={user?.role === 'seller' || user?.role === 'admin' ? '/sell' : '/auth/register'} className={footerLink}>
                  Sell an item
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              {!isLoading && user ? (
                <>
                  <li>
                    <Link href="/account" className={footerLink}>
                      Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/inbox" className={footerLink}>
                      Inbox
                    </Link>
                  </li>
                  <li>
                    <Link href="/orders" className={footerLink}>
                      Orders
                    </Link>
                  </li>
                  {user.role === 'seller' && (
                    <li>
                      <Link href="/dashboard" className={footerLink}>
                        Dashboard
                      </Link>
                    </li>
                  )}
                  {user.role === 'admin' && (
                    <li>
                      <Link href="/admin" className={footerLink}>
                        Admin
                      </Link>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li>
                    <Link href="/auth/login" className={footerLink}>
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/register" className={footerLink}>
                      Create an account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-white/10 pt-4 text-xs text-white/45">
          © {new Date().getFullYear()} SuqET. Built for buyers and sellers in Ethiopia.
        </p>
      </div>
    </footer>
  );
}
