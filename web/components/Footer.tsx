'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const footerLink = 'text-white/70 hover:text-white transition-colors';

export function Footer() {
  const { user, isLoading } = useAuth();

  return (
    <footer className="mt-auto border-t border-black/8 bg-brand-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="space-y-3">
            <p className="notranslate font-display text-2xl font-bold tracking-tight">
              Suq<span className="text-accent-400">ET</span>
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-white/65">
              Ethiopia&apos;s second-hand marketplace. Browse locally, message sellers, and check out in the app.
            </p>
            <p className="text-xs text-white/40">🇪🇹 Built for buyers and sellers in Ethiopia</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Shop</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/listings" className={footerLink}>Browse listings</Link></li>
              <li><Link href={user?.role === 'seller' || user?.role === 'admin' ? '/sell' : '/auth/register'} className={footerLink}>Sell an item</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {!isLoading && user ? (
                <>
                  <li><Link href="/account" className={footerLink}>Account</Link></li>
                  <li><Link href="/inbox" className={footerLink}>Inbox</Link></li>
                  <li><Link href="/orders" className={footerLink}>Orders</Link></li>
                  {user.role === 'seller' && <li><Link href="/dashboard" className={footerLink}>Dashboard</Link></li>}
                  {user.role === 'admin' && <li><Link href="/admin" className={footerLink}>Admin</Link></li>}
                </>
              ) : (
                <>
                  <li><Link href="/auth/login" className={footerLink}>Log in</Link></li>
                  <li><Link href="/auth/register" className={footerLink}>Create an account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          © {new Date().getFullYear()} SuqET. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
