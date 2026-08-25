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
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="page-title">Email confirmation</h1>
          <p className="mt-1 text-sm text-muted">We could not confirm this link.</p>
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <Alert tone="error">{error}</Alert>
          <Link
            href="/auth/login"
            className="inline-block cursor-pointer text-sm text-brand-600 hover:underline"
          >
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 py-12">
        <Spinner />
        <p className="text-sm text-muted">Confirming your email…</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
