'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, MessageSquare, HandCoins } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

interface DashboardData {
  stats: {
    active_listings: number;
    total_sold: number;
    unread_messages: number;
    pending_verifications: number;
  };
  is_verified: boolean;
  listings: {
    id: string;
    title: string;
    status: string;
    price: number;
    view_count: number;
    image: string | null;
  }[];
  recent_messages: {
    id: string;
    content: string;
    sender: { id: string; name: string };
    listing: { id: string; title: string };
  }[];
  held_sales: {
    id: string;
    amount: number;
    status: string;
    listing: { id: string; title: string };
    created_at: string;
  }[];
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const canManage = user?.role === 'seller' || user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login?next=/dashboard');
      return;
    }
    if (!canManage) router.replace('/');
  }, [user, isLoading, router, canManage]);

  useEffect(() => {
    if (!user || !canManage) return;
    api<DashboardData>('/api/dashboard', token ? { token } : {})
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, token, canManage]);

  async function releaseSale(id: string) {
    if (!user) return;
    setBusyId(id);
    try {
      await api(`/api/payments/release/${id}`, { method: 'POST', token });
      setData((d) =>
        d ? { ...d, held_sales: d.held_sales.filter((s) => s.id !== id) } : d
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not release');
    } finally {
      setBusyId('');
    }
  }

  async function removeListing(id: string) {
    if (!user || !confirm('Remove this listing?')) return;
    await api(`/api/listings/${id}`, { method: 'DELETE', token });
    setData((d) =>
      d
        ? {
            ...d,
            listings: d.listings.filter((l) => l.id !== id),
            stats: {
              ...d.stats,
              active_listings: Math.max(0, d.stats.active_listings - 1),
            },
          }
        : d
    );
  }

  if (isLoading || !canManage || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return error ? (
      <Alert tone="error" className="mt-4">
        {error}
      </Alert>
    ) : null;
  }

  const kpis: [string, number][] = [
    ['Active', data.stats.active_listings],
    ['Sold', data.stats.total_sold],
    ['Unread', data.stats.unread_messages],
    ['Pending verify', data.stats.pending_verifications],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Seller dashboard</h1>
          <p className="mt-1 text-sm text-muted">Manage listings and messages</p>
        </div>
        <Link href="/sell">
          <Button>New listing</Button>
        </Link>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {!data.is_verified && (
        <Alert tone="info">
          Get verified to build buyer trust.{' '}
          <Link href="/verify" className="font-semibold underline underline-offset-2">
            Start verification
          </Link>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">My listings</h2>
        {data.listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No listings yet"
            description="Create your first listing to start selling on the marketplace."
            actionHref="/sell"
            actionLabel="New listing"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Item</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Price</th>
                  <th className="px-3 py-2.5 font-medium">Views</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.listings.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border last:border-0 transition duration-180 hover:bg-paper"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-border bg-paper">
                          {l.image && (
                            <Image src={l.image} alt="" fill className="object-cover" sizes="40px" />
                          )}
                        </div>
                        <Link
                          href={`/listings/${l.id}`}
                          className="cursor-pointer font-medium text-ink transition duration-180 hover:text-brand-600"
                        >
                          {l.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={l.status === 'active' ? 'green' : 'gray'}>{l.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-accent-600">
                      {l.price.toLocaleString()} ETB
                    </td>
                    <td className="px-3 py-2.5 text-muted">{l.view_count}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        className="cursor-pointer text-danger-600 transition duration-180 hover:underline"
                        onClick={() => removeListing(l.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Held payments</h2>
        {(data.held_sales ?? []).length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="No held payments"
            description="Escrowed sales will appear here until you confirm delivery."
          />
        ) : (
          <ul className="space-y-2">
            {(data.held_sales ?? []).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <div>
                  <Link
                    href={`/listings/${s.listing.id}`}
                    className="cursor-pointer font-medium text-ink transition duration-180 hover:text-brand-600"
                  >
                    {s.listing.title}
                  </Link>
                  <p className="mt-0.5 font-medium text-accent-600">
                    {s.amount.toLocaleString()} ETB held
                  </p>
                </div>
                <Button loading={busyId === s.id} onClick={() => releaseSale(s.id)}>
                  Confirm delivery
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Recent messages</h2>
        {data.recent_messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Buyer inquiries about your listings will show up here."
          />
        ) : (
          <ul className="space-y-2">
            {data.recent_messages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm transition duration-180 hover:border-brand-300"
              >
                <Link
                  href={`/listings/${m.listing.id}?with=${m.sender.id}`}
                  className="cursor-pointer font-medium text-ink transition duration-180 hover:text-brand-600"
                >
                  {m.sender.name} · {m.listing.title}
                </Link>
                <p className="mt-1 text-muted">{m.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
