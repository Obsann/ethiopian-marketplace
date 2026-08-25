'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { User } from '@/types';

const exchangingCodes = new Set<string>();

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function OAuthCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const oauthError = params.get('error');
    const code = params.get('code');
    const next = safeNextPath(params.get('next'));
    if (oauthError) {
      setError(oauthError);
      return;
    }
    if (!code) {
      setError('Google sign-in did not return a session.');
      return;
    }
    if (exchangingCodes.has(code)) return;
    exchangingCodes.add(code);
    api<{ user: User; token: string }>('/api/auth/oauth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
      .then((res) => loginWithToken(res.data.token))
      .then(() => router.replace(next))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not complete Google sign-in');
      });
  }, [loginWithToken, params, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-8">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-ink">Google sign-in</h1>
          <p className="mt-2 text-sm text-muted">Something went wrong finishing sign-in.</p>
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
        <p className="text-sm text-muted">Finishing Google sign-in…</p>
      </div>
    </div>
  );
}

export default function OAuthPage() {
  return (
    <div className="page-shell pt-24 sm:pt-28 pb-16">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <OAuthCallback />
      </Suspense>
    </div>
  );
}
