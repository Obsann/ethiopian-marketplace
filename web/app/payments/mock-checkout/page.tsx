'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function MockCheckout() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const tx_ref = params.get('tx_ref') || '';
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(
        `/auth/login?next=${encodeURIComponent(`/payments/mock-checkout?tx_ref=${tx_ref}`)}`
      );
    }
  }, [isLoading, user, router, tx_ref]);

  async function confirm() {
    if (!user) return;
    setBusy(true);
    setIsError(false);
    try {
      await api('/api/payments/mock-confirm', {
        method: 'POST',
        token,
        body: JSON.stringify({ tx_ref }),
      });
      setMsg('Payment marked held. Redirecting to orders…');
      setTimeout(() => router.push('/orders?paid=1'), 1200);
    } catch (e) {
      setIsError(true);
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-md space-y-5 pt-24 sm:pt-28 pb-16">
      <div className="space-y-5 border border-border bg-surface p-6 text-center">
        <div>
          <p className="eyebrow">Dev only</p>
          <h1 className="mt-3 font-display text-3xl font-medium text-ink">Local mock checkout</h1>
        </div>
        <p className="text-sm text-muted">
          Chapa is not configured yet — <code className="text-xs text-ink">CHAPA_SECRET_KEY</code> is
          still a placeholder (contains <code className="text-xs text-ink">xxx</code>). Confirming only
          marks this payment held in the database. It does not open Chapa&apos;s test checkout or move
          money.
        </p>
        <p className="text-sm text-muted">
          To use official Chapa test/sandbox mobile money, put a real{' '}
          <code className="text-xs text-ink">CHASECK_TEST-</code> (or{' '}
          <code className="text-xs text-ink">CHASECK_TEST_</code>) secret from the Chapa dashboard
          (Test mode) in <code className="text-xs text-ink">backend/.env</code>, restart the API, then
          buy again. You will be sent to checkout.chapa.co — not this page.
        </p>
        <p className="break-all text-xs text-muted">{tx_ref}</p>
        {msg && <Alert tone={isError ? 'error' : 'success'}>{msg}</Alert>}
        <Button onClick={confirm} loading={busy} className="w-full">
          Confirm payment
        </Button>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
          <Spinner />
        </div>
      }
    >
      <MockCheckout />
    </Suspense>
  );
}
