'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, Listing, Pagination } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Suspense } from 'react';

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(
    () => ({
      query: searchParams.get('query') || '',
      category_id: searchParams.get('category_id') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      condition: searchParams.get('condition') || '',
      location: searchParams.get('location') || '',
      sort: searchParams.get('sort') || 'newest',
      page: searchParams.get('page') || '1',
    }),
    [searchParams]
  );

  const [queryInput, setQueryInput] = useState(filters.query);

  useEffect(() => {
    setQueryInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (queryInput === filters.query) return;
      setParam('query', queryInput);
    }, 400);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`/listings?${params.toString()}`);
  }

  useEffect(() => {
    api<Category[]>('/api/listings/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    qs.set('limit', '20');
    api<{ items: Listing[]; pagination: Pagination }>(`/api/listings?${qs}`)
      .then((r) => {
        setListings(r.data.items);
        setPagination(r.data.pagination);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Browse listings</h1>
        <p className="mt-1 text-sm text-ink/70">Filter by category, price, condition, and location.</p>
      </div>

      <Input
        label="Search"
        value={queryInput}
        onChange={(e) => setQueryInput(e.target.value)}
        placeholder="e.g. phone, sofa, helmet"
      />

      <Button
        type="button"
        variant="ghost"
        className="lg:hidden"
        onClick={() => setFiltersOpen((v) => !v)}
      >
        {filtersOpen ? 'Hide filters' : 'Show filters'}
      </Button>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className={`space-y-4 rounded-lg border border-black/8 bg-white/80 p-4 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
              value={filters.category_id}
              onChange={(e) => setParam('category_id', e.target.value)}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Condition</label>
            <select
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
              value={filters.condition}
              onChange={(e) => setParam('condition', e.target.value)}
            >
              <option value="">Any</option>
              <option value="new">New</option>
              <option value="like_new">Like new</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          <Input
            label="Min price (ETB)"
            type="number"
            value={filters.min_price}
            onChange={(e) => setParam('min_price', e.target.value)}
          />
          <Input
            label="Max price (ETB)"
            type="number"
            value={filters.max_price}
            onChange={(e) => setParam('max_price', e.target.value)}
          />
          <Input
            label="Location"
            value={filters.location}
            onChange={(e) => setParam('location', e.target.value)}
            placeholder="Addis Ababa, Jimma…"
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Sort</label>
            <select
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
              value={filters.sort}
              onChange={(e) => setParam('sort', e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </aside>

        <div>
          {loading && (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          )}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && listings.length === 0 && (
            <EmptyState
              title="No listings found"
              description="Try different filters."
              actionHref="/"
              actionLabel="Back home"
            />
          )}
          {!loading && listings.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              {pagination && pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    disabled={pagination.page <= 1}
                    onClick={() => setParam('page', String(pagination.page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="ghost"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setParam('page', String(pagination.page + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
