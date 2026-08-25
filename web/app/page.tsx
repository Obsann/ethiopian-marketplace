'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck,
  BookOpen,
  Car,
  ChefHat,
  Laptop,
  MessageSquare,
  Package,
  Search,
  ShieldCheck,
  Shirt,
  Sofa,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Listing, Category } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';

const FALLBACK_CATEGORIES = [
  { id: 'Electronics', name: 'Electronics' },
  { id: 'Clothing', name: 'Clothing' },
  { id: 'Furniture', name: 'Furniture' },
  { id: 'Books', name: 'Books' },
  { id: 'Vehicles', name: 'Vehicles' },
  { id: 'Kitchen', name: 'Kitchen' },
  { id: 'Tools', name: 'Tools' },
  { id: 'Other', name: 'Other' },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Laptop,
  clothing: Shirt,
  furniture: Sofa,
  books: BookOpen,
  vehicles: Car,
  kitchen: ChefHat,
  tools: Wrench,
  other: Package,
};

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Secure checkout' },
  { icon: BadgeCheck, label: 'Verified sellers' },
  { icon: MessageSquare, label: 'Direct messaging' },
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
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/listings?query=${encodeURIComponent(q)}` : '/listings');
  }

  const categoryList = categories.length ? categories : FALLBACK_CATEGORIES;

  return (
    <div className="space-y-12 sm:space-y-14">
      <section className="rounded-xl border border-border bg-brand-600 px-5 py-12 text-white sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl space-y-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">
            Ethiopia&apos;s marketplace
          </p>
          <h1 className="notranslate font-display text-4xl font-bold tracking-tight sm:text-5xl">
            SuqET
          </h1>
          <p className="text-balance text-base leading-relaxed text-brand-50 sm:text-lg">
            Find second-hand goods nearby, message sellers, and check out securely.
          </p>
          <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="home-search" className="sr-only">
              Search listings
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="home-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search phones, furniture, bikes…"
                className="w-full rounded-lg border-0 bg-white py-3 pl-10 pr-4 text-ink outline-none ring-2 ring-transparent placeholder:text-muted focus:ring-accent-500"
              />
            </div>
            <Button type="submit" variant="secondary" className="shrink-0 px-8 py-3 text-base">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
        {TRUST_ITEMS.map((t) => (
          <div key={t.label} className="flex items-center gap-2 text-sm text-muted">
            <t.icon className="h-4 w-4 text-brand-600" aria-hidden strokeWidth={2} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      <section className="space-y-5">
        <h2 className="section-title">Browse categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categoryList.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name.toLowerCase()] ?? Package;
            return (
              <Link
                key={cat.id}
                href={`/listings?category_id=${cat.id}`}
                className="group flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-5 text-center transition duration-180 hover:border-brand-300 hover:bg-brand-50"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-semibold text-ink">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="section-title">Featured listings</h2>
          <Link
            href="/listings"
            className="cursor-pointer text-sm font-medium text-brand-600 transition hover:text-brand-700 hover:underline"
          >
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
        {error && <Alert tone="error">{error}</Alert>}
        {!loading && !error && listings.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-muted">
            No listings yet. Be the first to{' '}
            <Link href="/auth/register" className="font-medium text-brand-600 hover:underline">
              list an item
            </Link>
            .
          </p>
        )}
        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface px-5 py-8 text-center sm:px-8">
        <h2 className="section-title">Sell what you no longer need</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Create a listing in minutes, chat with buyers, and get paid through secure checkout.
        </p>
        <div className="mt-5">
          <Link href="/auth/register">
            <Button>Start selling</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
