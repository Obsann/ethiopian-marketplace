'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface HeldTransaction {
  id: string;
  listing_id: string;
  listing_title: string;
  buyer_name: string;
  amount: number;
  chapa_ref: string;
  status: string;
  created_at: string;
}

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
  held_transactions: HeldTransaction[];
  recent_messages: {
    id: string;
    content: string;
    sender_id?: string;
    receiver_id?: string;
    sender: { id: string; name: string };
    receiver?: { id: string; name: string };
    listing: { id: string; title: string };
  }[];
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/dashboard');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    api<DashboardData>('/api/dashboard', { token })
      .then((r) =>
        setData({
          ...r.data,
          held_transactions: r.data.held_transactions ?? [],
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function releaseFunds(transactionId: string) {
    if (!token || !confirm('Confirm delivery and release funds to yourself?')) return;
    setReleasingId(transactionId);
    setNote('');
    try {
      await api(`/api/payments/release/${transactionId}`, {
        method: 'POST',
        token,
      });
      setData((d) =>
        d
          ? {
              ...d,
              held_transactions: d.held_transactions.filter((t) => t.id !== transactionId),
            }
          : d
      );
      setNote('Funds released.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not release funds');
    } finally {
      setReleasingId(null);
    }
  }

  async function removeListing(id: string) {
    if (!token || !confirm('Remove this listing?')) return;
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

  if (isLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Seller dashboard</h1>
          <p className="text-sm text-ink/70">Manage listings and messages</p>
        </div>
        <Link href="/sell">
          <Button>New listing</Button>
        </Link>
      </div>

      {!data.is_verified && (
        <div className="rounded-lg border border-accent-400/40 bg-accent-400/10 px-4 py-3 text-sm">
          Get verified to build buyer trust.{' '}
          <Link href="/verify" className="font-semibold underline">
            Start verification
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Active', data.stats.active_listings],
          ['Sold', data.stats.total_sold],
          ['Unread', data.stats.unread_messages],
          ['Pending verify', data.stats.pending_verifications],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-black/8 bg-white p-4 shadow-card">
            <p className="text-xs text-ink/60">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {note && <p className="text-sm text-brand-700">{note}</p>}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Held payments</h2>
        <p className="text-sm text-ink/60">
          Funds stay in escrow until you confirm the buyer received the item.
        </p>
        {data.held_transactions.length === 0 ? (
          <p className="text-sm text-ink/60">No payments waiting for release.</p>
        ) : (
          <ul className="space-y-3">
            {data.held_transactions.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 rounded-lg border border-black/8 bg-white/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/listings/${t.listing_id}`}
                    className="font-medium hover:underline"
                  >
                    {t.listing_title}
                  </Link>
                  <p className="text-sm text-ink/70">
                    {t.amount.toLocaleString()} ETB · {t.buyer_name}
                  </p>
                  <p className="break-all text-xs text-ink/50">{t.chapa_ref}</p>
                </div>
                <Button
                  onClick={() => releaseFunds(t.id)}
                  loading={releasingId === t.id}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Confirm Delivery / Release Funds
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">My listings</h2>
        <div className="overflow-x-auto rounded-lg border border-black/8 bg-white/90">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/8 text-ink/60">
              <tr>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Views</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.listings.map((l) => (
                <tr key={l.id} className="border-b border-black/5">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="relative h-10 w-10 overflow-hidden rounded bg-stone-100">
                        {l.image && (
                          <Image src={l.image} alt="" fill className="object-cover" sizes="40px" />
                        )}
                      </div>
                      <Link href={`/listings/${l.id}`} className="font-medium hover:underline">
                        {l.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={l.status === 'active' ? 'green' : 'gray'}>{l.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{l.price.toLocaleString()} ETB</td>
                  <td className="px-3 py-2">{l.view_count}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/listings/${l.id}/edit`} className="text-brand-600 hover:underline">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => removeListing(l.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Recent messages</h2>
          <Link href="/chat" className="text-sm font-medium text-brand-600 hover:underline">
            Open inbox
          </Link>
        </div>
        <ul className="space-y-2">
          {data.recent_messages.map((m) => {
            const otherId =
              m.sender.id === user?.id ? m.receiver?.id : m.sender.id;
            return (
              <li key={m.id} className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm shadow-card">
                <p className="font-medium">
                  {m.sender.id === user?.id ? m.receiver?.name || 'You' : m.sender.name} · {m.listing.title}
                </p>
                <p className="text-ink/70">{m.content}</p>
                {otherId && (
                  <Link
                    href={`/chat/${m.listing.id}?with=${otherId}`}
                    className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
                  >
                    Reply
                  </Link>
                )}
              </li>
            );
          })}
          {data.recent_messages.length === 0 && (
            <p className="text-sm text-ink/60">No messages yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
