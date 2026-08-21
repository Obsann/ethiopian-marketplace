'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function MockCheckout() {
  const params = useSearchParams();
  const router = useRouter();
  const tx_ref = params.get('tx_ref') || '';
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function confirm() {
    setBusy(true);
    try {
      await api('/api/payments/mock-confirm', {
        method: 'POST',
        body: JSON.stringify({ tx_ref }),
      });
      setMsg('Payment held in escrow. Redirecting…');
      setTimeout(() => router.push('/'), 1200);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-black/8 bg-white p-6 text-center">
      <h1 className="font-display text-2xl font-semibold">Mock Chapa Checkout</h1>
      <p className="text-sm text-ink/70">
        Dev mode — no real Chapa key configured. Confirm to simulate a successful payment.
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
