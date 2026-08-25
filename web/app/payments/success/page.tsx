'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function PaymentSuccess() {
  const params = useSearchParams();
  const tx_ref = params.get('tx_ref') || '';
  const listing_id = params.get('listing_id') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      if (process.env.NODE_ENV !== 'production') {
        if (!tx_ref) {
          if (!cancelled) {
            setError('Missing transaction reference.');
            setLoading(false);
          }
          return;
        }
        try {
          await api('/api/payments/mock-confirm', {
            method: 'POST',
            body: JSON.stringify({ tx_ref }),
          });
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Could not confirm payment');
            setLoading(false);
          }
          return;
        }
      }

      if (!cancelled) setLoading(false);
    }

    confirm();
    return () => {
      cancelled = true;
    };
  }, [tx_ref]);

  if (loading) {
    return (
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell pt-24 sm:pt-28 pb-16">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-md space-y-5 pt-24 sm:pt-28 pb-16">
      <div className="space-y-5 border border-border bg-surface p-6 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center bg-accent-50 text-accent-600"
          aria-hidden
        >
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div>
          <p className="eyebrow">Escrow</p>
          <h1 className="mt-3 font-display text-3xl font-medium text-ink">Payment confirmed</h1>
        </div>
        <p className="text-sm text-muted">
          Your payment is held in escrow until the seller confirms delivery.
        </p>
        {tx_ref && (
          <p className="break-all text-xs text-muted">
            Transaction reference: <span className="font-medium text-ink">{tx_ref}</span>
          </p>
        )}
        <Alert tone="success">Funds are secured until delivery is confirmed.</Alert>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {listing_id && (
            <Link href={`/listings/${listing_id}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Back to listing
              </Button>
            </Link>
          )}
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
          <Spinner />
        </div>
      }
    >
      <PaymentSuccess />
    </Suspense>
  );
}
