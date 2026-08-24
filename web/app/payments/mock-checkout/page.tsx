'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function MockCheckout() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const tx_ref = params.get('tx_ref') || '';
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

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
    try {
      await api('/api/payments/mock-confirm', {
        method: 'POST',
        token,
        body: JSON.stringify({ tx_ref }),
      });
      setMsg('Payment marked held. Redirecting to orders…');
      setTimeout(() => router.push('/orders?paid=1'), 1200);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
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
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-black/8 bg-white p-6 text-center">
      <h1 className="font-display text-2xl font-semibold">Local mock checkout</h1>
      <p className="text-sm text-ink/70">
        Chapa is not configured yet — <code className="text-xs">CHAPA_SECRET_KEY</code> is still a
        placeholder (contains <code className="text-xs">xxx</code>). Confirming only marks this
        payment held in the database. It does not open Chapa&apos;s test checkout or move money.
      </p>
      <p className="text-sm text-ink/70">
        To use official Chapa test/sandbox mobile money, put a real{' '}
        <code className="text-xs">CHASECK_TEST-</code> (or <code className="text-xs">CHASECK_TEST_</code>) secret from the Chapa dashboard (Test mode)
        in <code className="text-xs">backend/.env</code>, restart the API, then buy again. You will
        be sent to checkout.chapa.co — not this page.
      </p>
      <p className="break-all text-xs text-ink/50">{tx_ref}</p>
      {msg && <p className="text-sm text-brand-700">{msg}</p>}
      <Button onClick={confirm} loading={busy} className="w-full">
        Confirm payment
      </Button>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <MockCheckout />
    </Suspense>
  );
}
