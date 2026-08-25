'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Listing, Category } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

const FALLBACK_CATEGORIES = [
  { id: 'Electronics',  name: 'Electronics',  emoji: '📱' },
  { id: 'Clothing',     name: 'Clothing',      emoji: '👕' },
  { id: 'Furniture',    name: 'Furniture',     emoji: '🛋️' },
  { id: 'Books',        name: 'Books',         emoji: '📚' },
  { id: 'Vehicles',     name: 'Vehicles',      emoji: '🚗' },
  { id: 'Kitchen',      name: 'Kitchen',       emoji: '🍳' },
  { id: 'Tools',        name: 'Tools',         emoji: '🔧' },
  { id: 'Other',        name: 'Other',         emoji: '📦' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  electronics: '📱', clothing: '👕', furniture: '🛋️',
  books: '📚', vehicles: '🚗', kitchen: '🍳', tools: '🔧', other: '📦',
};

const TRUST_ITEMS = [
  { icon: '🔒', label: 'Secure checkout' },
  { icon: '✅', label: 'Verified sellers' },
  { icon: '💬', label: 'Direct messaging' },
  { icon: '🇪🇹', label: 'Made for Ethiopia' },
];

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
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/listings?query=${encodeURIComponent(q)}` : '/listings');
  }

  return (
    <div className="space-y-14">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-14 text-white sm:px-12 sm:py-20">
        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(232,163,23,0.28),transparent_48%),radial-gradient(circle_at_88%_8%,rgba(255,255,255,0.07),transparent_42%)]" />
        {/* Subtle geometric pattern */}
        <div className="pattern-mesh pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center">
          <span className="inline-block rounded-full border border-accent-400/40 bg-accent-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-accent-300">
            Ethiopia&apos;s marketplace
          </span>
          <p className="notranslate font-display text-4xl font-bold tracking-tight sm:text-6xl">
            SuqET
          </p>
          <h1 className="text-balance text-lg leading-relaxed text-white/85 sm:text-xl">
            Browse second-hand goods locally, message sellers directly, and pay safely through our checkout.
          </h1>
          <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search phones, furniture, bikes…"
              className="w-full flex-1 rounded-xl border-0 bg-white/10 px-5 py-3.5 text-white placeholder:text-white/50 outline-none ring-1 ring-white/20 backdrop-blur focus:bg-white/15 focus:ring-accent-400 transition"
              aria-label="Search listings"
            />
            <Button type="submit" variant="secondary" className="shrink-0 px-8 py-3.5 text-base font-bold">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
        {TRUST_ITEMS.map(t => (
          <div key={t.label} className="flex items-center gap-2 text-sm text-muted">
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* ── Categories ── */}
      <section className="space-y-5">
        <h2 className="font-display text-2xl font-semibold">Browse categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(categories.length
            ? categories
            : FALLBACK_CATEGORIES
          ).map(cat => {
            const emoji = CATEGORY_EMOJI[cat.name.toLowerCase()] ?? '📦';
            return (
              <Link
                key={cat.id}
                href={`/listings?category_id=${cat.id}`}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-black/8 bg-white px-3 py-6 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lift"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-xl transition group-hover:bg-brand-100" aria-hidden>
                  {emoji}
                </span>
                <span className="text-sm font-semibold text-ink group-hover:text-brand-700 transition-colors">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Featured listings</h2>
          <Link href="/listings" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors">
            View all →
          </Link>
        </div>
        {loading && <div className="flex justify-center py-16"><Spinner /></div>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

    </div>
  );
}
