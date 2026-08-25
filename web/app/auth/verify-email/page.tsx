'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { User } from '@/types';

function VerifyEmailInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('This confirmation link is missing a token.');
      return;
    }
    api<{ user: User; token: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((res) => loginWithToken(res.data.token))
      .then(() => router.replace('/'))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not confirm email');
      });
  }, [params, loginWithToken, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-8">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-ink">Email confirmation</h1>
          <p className="mt-2 text-sm text-muted">We could not confirm this link.</p>
        </div>
        <div className="space-y-5 border border-border bg-surface p-6 sm:p-8">
          <Alert tone="error">{error}</Alert>
          <Link
            href="/auth/login"
            className="inline-block cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-ink"
          >
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="flex flex-col items-center gap-3 border border-border bg-surface p-6 py-16 sm:p-8">
        <Spinner />
        <p className="text-sm text-muted">Confirming your email…</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="page-shell pt-24 sm:pt-28 pb-16">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <VerifyEmailInner />
      </Suspense>
    </div>
  );
}
