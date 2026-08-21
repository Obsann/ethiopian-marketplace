'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Listing, Category } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '⚡',
  Clothing: '👗',
  Furniture: '🪑',
  Books: '📚',
  Vehicles: '🛵',
  Kitchen: '🍲',
  Tools: '🔧',
  Other: '📦',
};

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<{ items: Listing[] }>('/api/listings?limit=6&sort=newest'),
      api<Category[]>('/api/listings/categories'),
    ])
      .then(([listRes, catRes]) => {
        setListings(listRes.data.items);
        setCategories(catRes.data);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/listings?query=${encodeURIComponent(q)}` : '/listings');
  }

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-brand-900 px-5 py-12 text-white sm:px-10 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl space-y-5 text-center">
          <p className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            SuqET
          </p>
          <h1 className="text-balance text-lg text-white/90 sm:text-xl">
            Ethiopia&apos;s trusted second-hand marketplace — verified sellers, escrow payments.
          </h1>
          <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phones, furniture, bikes…"
              className="w-full flex-1 rounded-md border-0 px-4 py-3 text-ink outline-none ring-2 ring-white/30 focus:ring-accent-400"
              aria-label="Search listings"
            />
            <Button type="submit" variant="secondary" className="sm:px-8">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Browse categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(categories.length
            ? categories
            : Object.keys(CATEGORY_ICONS).map((name) => ({ id: name, name }))
          ).map((cat) => (
            <Link
              key={cat.id}
              href={`/listings?category_id=${cat.id}`}
              className="flex flex-col items-center gap-2 rounded-lg border border-black/8 bg-white/80 px-3 py-5 text-center transition hover:border-brand-500/50"
            >
              <span className="text-2xl" aria-hidden>
                {CATEGORY_ICONS[cat.name] || '📦'}
              </span>
              <span className="text-sm font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Featured listings</h2>
          <Link href="/listings" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && (
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
