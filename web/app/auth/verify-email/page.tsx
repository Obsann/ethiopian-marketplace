'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
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
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="font-display text-2xl font-semibold">Email confirmation</h1>
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <Spinner />
      <p className="text-sm text-ink/70">Confirming your email…</p>
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
