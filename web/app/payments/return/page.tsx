'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

function PaymentReturn() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const tx_ref = params.get('trx_ref') || params.get('tx_ref') || '';
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const next = `/payments/return?${params.toString()}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!tx_ref) {
      router.replace('/orders');
      return;
    }

    let cancelled = false;
    api<{ status: string }>('/api/payments/sync', {
      method: 'POST',
      token,
      body: JSON.stringify({ tx_ref }),
    })
      .then((res) => {
        if (cancelled) return;
        const status = res.data?.status;
        if (status === 'held' || status === 'already') {
          router.replace('/orders?paid=1');
          return;
        }
        router.replace('/orders?paid=1');
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not confirm payment');
      });

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, token, tx_ref, router, params]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Payment status</h1>
        <Alert tone="error">{error}</Alert>
        <Link
          href="/orders"
          className="inline-block cursor-pointer text-sm font-medium text-brand-600 transition duration-180 hover:text-brand-700"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <Spinner />
      <p className="text-sm text-muted">Confirming your Chapa payment…</p>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <PaymentReturn />
    </Suspense>
  );
}
