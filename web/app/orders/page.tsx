'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Transaction } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const tone: Record<string, 'green' | 'amber' | 'gray'> = {
  held: 'amber',
  released: 'green',
  refunded: 'gray',
  pending: 'gray',
  failed: 'gray',
};

function OrdersContent() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [items, setItems] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const paid = params.get('paid') === '1';

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/orders');
  }, [user, isLoading, router]);

  function load() {
    if (!user) return;
    api<Transaction[]>('/api/payments/mine', token ? { token } : {})
      .then((r) => setItems(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  async function act(path: string, id: string) {
    if (!user) return;
    setBusyId(id);
    try {
      await api(`/api/payments/${path}/${id}`, { method: 'POST', token });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId('');
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Orders</h1>
        <p className="mt-1 text-sm text-ink/70">Purchases and sales tied to your account.</p>
      </div>
      {paid && (
        <p className="rounded-lg border border-brand-600/30 bg-brand-50 px-4 py-3 text-sm">
          Payment submitted. This page updates when the payment is confirmed and held.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-3">
        {items.map((tx) => {
          const role = tx.buyer_id === user.id ? 'Bought' : 'Sold';
          return (
            <li key={tx.id} className="rounded-lg border border-black/8 bg-white/90 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-ink/50">{role}</p>
                  <Link href={`/listings/${tx.listing_id}`} className="font-medium hover:underline">
                    {tx.listing?.title || 'Listing'}
                  </Link>
                  <p className="mt-1 text-sm">
                    {tx.amount.toLocaleString()} ETB
                  </p>
                </div>
                <Badge tone={tone[tx.status] || 'gray'}>{tx.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tx.status === 'held' && tx.seller_id === user.id && (
                  <Button
                    loading={busyId === tx.id}
                    onClick={() => act('release', tx.id)}
                  >
                    Confirm delivery
                  </Button>
                )}
                {tx.status === 'held' && tx.buyer_id === user.id && (
                  <Button
                    variant="ghost"
                    loading={busyId === tx.id}
                    onClick={() => act('refund', tx.id)}
                  >
                    Request refund
                  </Button>
                )}
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-ink/60">No orders yet.</p>
        )}
      </ul>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
