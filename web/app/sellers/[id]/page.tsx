'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { SellerPresence } from '@/components/SellerPresence';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { demoSellerProfile } from '@/lib/demoCatalog';
import { usePeerPresence } from '@/lib/presence';
import type { Listing, Review } from '@/types';

type SellerPayload = {
  seller: {
    id: string;
    name: string;
    is_verified: boolean;
    created_at: string;
    role: string;
    is_online?: boolean;
    last_seen_at?: string | null;
  };
  stats: {
    active_listings: number;
    sold_count: number;
    rating_avg: number;
    rating_count: number;
  };
  listings: Listing[];
  reviews: Review[];
};

export default function SellerPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeURIComponent(Array.isArray(rawId) ? String(rawId[0] ?? '') : String(rawId || ''));
  const [data, setData] = useState<SellerPayload | null>(null);
  const [error, setError] = useState('');
  const presence = usePeerPresence(data?.seller.id || id, {
    is_online: data?.seller.is_online,
    last_seen_at: data?.seller.last_seen_at,
  });

  useEffect(() => {
    if (!id) return;
    const demo = demoSellerProfile(id);
    if (demo) {
      setData(demo);
      setError('');
      return;
    }
    api<SellerPayload>(`/api/sellers/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Not found'));
  }, [id]);

  if (error) {
    return (
      <div className="page-shell py-24">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="page-shell flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-10 pt-24 sm:pt-28 pb-16">
      <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-ink">
          Shop
        </Link>
        <span>/</span>
        <span className="text-ink">{data.seller.name}</span>
      </nav>
      <div>
        <p className="eyebrow">Seller</p>
        <h1 className="mt-3 flex flex-wrap items-center gap-2 font-display text-display font-medium">
          {data.seller.name}
          {data.seller.is_verified && <BadgeCheck className="h-7 w-7 text-accent-600" aria-hidden />}
        </h1>
        <p className="mt-3 text-sm text-muted">
          Joined {new Date(data.seller.created_at).toLocaleDateString()} · {data.stats.sold_count}{' '}
          completed sales
          {data.stats.rating_count
            ? ` · ${data.stats.rating_avg}★ (${data.stats.rating_count})`
            : ''}
        </p>
        <div className="mt-2">
          <SellerPresence isOnline={presence.isOnline} lastSeenAt={presence.lastSeenAt} />
        </div>
      </div>
      <section>
        <h2 className="font-display text-2xl font-medium">Listings</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {data.listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
        {data.listings.length === 0 && (
          <p className="mt-4 text-sm text-muted">No active listings.</p>
        )}
      </section>
      {data.reviews.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-medium">Reviews</h2>
          <ul className="mt-4 space-y-4">
            {data.reviews.map((r) => (
              <li key={r.id} className="border border-border bg-surface p-4">
                <p className="text-sm font-medium">
                  {r.rating}★ · {r.reviewer.name}
                </p>
                {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link href="/listings" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Back to shop
      </Link>
    </div>
  );
}
