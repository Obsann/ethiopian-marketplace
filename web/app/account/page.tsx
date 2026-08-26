'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { User } from '@/types';

export default function AccountPage() {
  const { user, token, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/account');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone || '');
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    try {
      await api<{ user: User }>('/api/auth/me', {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ name, phone: phone.trim() || undefined }),
      });
      await refreshUser();
      setOk('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="page-shell pt-24 sm:pt-28 pb-16">
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell pt-24 sm:pt-28 pb-16">
      <div className="mx-auto max-w-md space-y-8">
        <div>
          <p className="eyebrow">Profile</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-ink">Account</h1>
          <p className="mt-2 text-sm text-muted">
            Update your name and phone. Google accounts can add a phone here.
          </p>
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            <Link href="/saved" className="hover:text-ink">
              Saved
            </Link>
            <Link href="/orders" className="hover:text-ink">
              Orders
            </Link>
            <Link href="/inbox" className="hover:text-ink">
              Inbox
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin" className="hover:text-ink">
                Admin
              </Link>
            )}
            {(user.role === 'seller' || user.role === 'admin') && (
              <Link href={`/sellers/${user.id}`} className="hover:text-ink">
                Public profile
              </Link>
            )}
          </nav>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 border border-border bg-surface p-6 sm:p-8">
          <Input id="account-email" label="Email" name="email" value={user.email} disabled />
          <Input
            id="account-name"
            label="Full name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <Input
            id="account-phone"
            label="Phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+2519…"
            autoComplete="tel"
          />
          {error && <Alert tone="error">{error}</Alert>}
          {ok && <Alert tone="success">{ok}</Alert>}
          <Button type="submit" variant="primary" className="w-full" loading={busy}>
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}
