'use client';

import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/swr';
import { Listing, Category } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';
import { useState } from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  electronics: 'devices',
  clothing: 'checkroom',
  furniture: 'chair',
  books: 'menu_book',
  vehicles: 'two_wheeler',
  kitchen: 'cooking',
  tools: 'construction',
  other: 'category',
};

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const {
    data: listData,
    error: listError,
    isLoading: listLoading,
  } = useSWR('/api/listings?limit=6&sort=newest', swrFetcher<{ items: Listing[] }>);
  const {
    data: categories,
    error: catError,
    isLoading: catLoading,
  } = useSWR('/api/listings/categories', swrFetcher<Category[]>);

  const loading = listLoading || catLoading;
  const error = (listError || catError)?.message || '';
  const listings = listData?.items ?? [];
  const cats = categories ?? [];

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/listings?query=${encodeURIComponent(q)}` : '/listings');
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-brand-900 px-5 py-12 text-white sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/70 to-brand-900/40" />
        <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/80">
            Ethiopia · Escrow protected
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Buy and sell with trust
          </h1>
          <p className="text-balance text-base text-white/85 sm:text-lg">
            SuqET is Ethiopia&apos;s second-hand marketplace — verified sellers and held payments until delivery.
          </p>
          <form onSubmit={onSearch} className="flex flex-col gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-sm sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phones, furniture, bikes…"
              className="w-full flex-1 rounded-xl border-0 px-4 py-3 text-ink outline-none ring-0"
              aria-label="Search listings"
            />
            <Button type="submit" variant="secondary" className="sm:px-8">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['lock', 'Escrow payments', 'Funds stay held until you confirm delivery.'],
          ['verified_user', 'Verified sellers', 'ID-checked sellers so you can buy with confidence.'],
          ['chat', 'Direct chat', 'Message the seller about condition, meetup, and price.'],
        ].map(([icon, title, body]) => (
          <div key={title} className="rounded-2xl border border-black/8 bg-white/80 px-4 py-5 shadow-card">
            <Icon name={icon} className="text-brand-700" />
            <p className="mt-2 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-ink/65">{body}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Browse categories</h2>
        {loading && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200" />
        ))}</div>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && cats.length === 0 && (
          <p className="text-sm text-ink/70">No categories in the database yet.</p>
        )}
        {!loading && !error && cats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cats.map((cat) => (
              <Link
                key={cat.id}
                href={`/listings?category_id=${cat.id}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-black/8 bg-white px-3 py-6 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lift"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon name={CATEGORY_ICONS[cat.name.toLowerCase()] || 'category'} className="text-[26px]" />
                </span>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Featured listings</h2>
          <Link href="/listings" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && listings.length === 0 && (
          <EmptyState title="No listings yet" description="Listings come from the live database." />
        )}
        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
