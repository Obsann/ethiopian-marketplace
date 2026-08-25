'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Transaction } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

const tone: Record<string, 'green' | 'amber' | 'gray' | 'red' | 'blue'> = {
  held: 'amber',
  released: 'green',
  refunded: 'gray',
  pending: 'blue',
  failed: 'red',
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
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <section className="border-b border-border bg-ink text-white">
        <div className="page-shell pt-24 sm:pt-28 pb-10 sm:pb-12">
          <p className="eyebrow text-white/45">Escrow</p>
          <h1 className="mt-3 font-display text-display font-medium">Orders</h1>
          <p className="mt-3 max-w-lg text-sm text-white/60">
            Purchases and sales tied to your account.
          </p>
        </div>
      </section>

      <div className="page-shell space-y-6 py-10 pb-16">
        {paid && (
          <Alert tone="success">
            Payment submitted. This page updates when the payment is confirmed and held.
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="When you buy or sell, escrow transactions will appear here."
            actionHref="/listings"
            actionLabel="Browse listings"
          />
        ) : (
          <ul className="space-y-3">
            {items.map((tx) => {
              const role = tx.buyer_id === user.id ? 'Bought' : 'Sold';
              return (
                <li key={tx.id} className="border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">{role}</p>
                      <Link
                        href={`/listings/${tx.listing_id}`}
                        className="mt-2 block font-medium text-ink transition hover:underline"
                      >
                        {tx.listing?.title || 'Listing'}
                      </Link>
                      <p className="mt-2 font-medium text-accent-600">
                        {tx.amount.toLocaleString()} ETB
                      </p>
                    </div>
                    <Badge tone={tone[tx.status] || 'gray'}>{tx.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tx.status === 'held' && tx.seller_id === user.id && (
                      <Button loading={busyId === tx.id} onClick={() => act('release', tx.id)}>
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
          </ul>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
          <Spinner />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
