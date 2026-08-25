'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
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
      <div className="page-shell mx-auto max-w-md space-y-5 pt-24 sm:pt-28 pb-16">
        <div className="space-y-5 border border-border bg-surface p-6 text-center">
          <p className="eyebrow">Payment</p>
          <h1 className="font-display text-3xl font-medium text-ink">Payment status</h1>
          <Alert tone="error">{error}</Alert>
          <Link href="/orders">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex flex-col items-center gap-3 pt-24 sm:pt-28 pb-16">
      <Spinner />
      <p className="text-sm text-muted">Confirming your Chapa payment…</p>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
          <Spinner />
        </div>
      }
    >
      <PaymentReturn />
    </Suspense>
  );
}
