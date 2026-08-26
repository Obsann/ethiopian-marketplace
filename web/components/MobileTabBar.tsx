'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, MessageSquare, PlusCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const item =
  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition';

export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  function active(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const sellHref = user?.role === 'seller' || user?.role === 'admin' ? '/sell' : '/auth/register';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Mobile tabs"
    >
      <div className="flex items-stretch">
        <Link href="/" className={`${item} ${active('/') ? 'text-ink' : 'text-muted'}`}>
          <Home className="h-5 w-5" aria-hidden />
          Home
        </Link>
        <Link href="/listings" className={`${item} ${active('/listings') ? 'text-ink' : 'text-muted'}`}>
          <LayoutGrid className="h-5 w-5" aria-hidden />
          Shop
        </Link>
        <Link href={sellHref} className={`${item} ${active('/sell') ? 'text-ink' : 'text-muted'}`}>
          <PlusCircle className="h-5 w-5" aria-hidden />
          Sell
        </Link>
        <Link
          href={user ? '/inbox' : '/auth/login'}
          className={`${item} ${active('/inbox') || active('/chat') ? 'text-ink' : 'text-muted'}`}
        >
          <MessageSquare className="h-5 w-5" aria-hidden />
          Inbox
        </Link>
        <Link
          href={user?.role === 'admin' ? '/admin' : user ? '/account' : '/auth/login'}
          className={`${item} ${active('/account') || active('/admin') || active('/auth') ? 'text-ink' : 'text-muted'}`}
        >
          <User className="h-5 w-5" aria-hidden />
          You
        </Link>
      </div>
    </nav>
  );
}
