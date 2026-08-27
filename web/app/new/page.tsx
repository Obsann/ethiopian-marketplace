'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { allDemoListings, pinAmharicBooksFirst } from '@/lib/demoCatalog';
import type { Listing } from '@/types';

export default function NewArrivalsPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<{ items: Listing[] }>('/api/listings?limit=24&sort=newest')
      .then((r) => {
        if (cancelled) return;
        const live = Array.isArray(r.data?.items) ? r.data.items : [];
        setItems(pinAmharicBooksFirst(live.length > 0 ? live : allDemoListings()));
      })
      .catch(() => {
        if (!cancelled) setItems(pinAmharicBooksFirst(allDemoListings()));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-paper">
      <section className="border-b border-border bg-ink text-white">
        <div className="page-shell py-20 sm:py-28">
          <p className="eyebrow text-white/45">Just listed</p>
          <h1 className="mt-3 font-display text-hero font-medium">New arrivals</h1>
          <p className="mt-4 max-w-lg text-sm text-white/60 sm:text-base">
            Fresh finds from sellers in Addis Ababa, Jimma, Hawassa, Mekelle, Bahir Dar, Dire Dawa,
            and Gondar.
          </p>
        </div>
      </section>

      <div className="page-shell py-10 sm:py-14">
        {loading && (
          <div className="product-tray">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && items.length === 0 && (
          <EmptyState
            title="No new listings yet"
            description="Check the shop for pieces already on the suq."
            actionHref="/listings"
            actionLabel="Browse the shop"
          />
        )}
        {!loading && items.length > 0 && (
          <div className="product-tray">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} href={`/listings/${l.id}`} />
            ))}
          </div>
        )}
        {!loading && (
          <p className="mt-10">
            <Link
              href="/listings"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-muted hover:text-ink"
            >
              Shop all listings
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
