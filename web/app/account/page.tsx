'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Account</h1>
        <p className="mt-1 text-sm text-ink/70">Update your name and phone. Google accounts can add a phone here.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-black/8 bg-white/90 p-5">
        <Input label="Email" value={user.email} disabled />
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+2519…"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-brand-700">{ok}</p>}
        <Button type="submit" className="w-full" loading={busy}>
          Save
        </Button>
      </form>
    </div>
  );
}
