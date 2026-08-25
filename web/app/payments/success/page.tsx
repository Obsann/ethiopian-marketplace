'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
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
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-green-800">Payment Confirmed!</h1>
      <p className="text-sm text-ink/70">
        Your payment is held in escrow until the seller confirms delivery.
      </p>
      {tx_ref && (
        <p className="break-all text-xs text-ink/60">
          Transaction reference:{' '}
          <span className="font-medium text-ink">{tx_ref}</span>
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        {listing_id && (
          <Link href={`/listings/${listing_id}`} className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              Back to listing
            </Button>
          </Link>
        )}
        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button className="w-full">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <PaymentSuccess />
    </Suspense>
  );
}
