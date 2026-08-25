'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Category, Listing, Pagination } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { swrFetcher } from '@/lib/swr';

const PRICE_MAX = 500000;

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const [searchDraft, setSearchDraft] = useState(filters.query);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    p.set('limit', '10');
    return p.toString();
  }, [filters]);

  const { data: catData } = useSWR('/api/listings/categories', swrFetcher<Category[]>);
  const {
    data,
    error: swrError,
    isLoading: loading,
  } = useSWR(`/api/search?${qs}`, swrFetcher<{ items: Listing[]; pagination: Pagination }>);

  const categories = catData ?? [];
  const listings = data?.items ?? [];
  const pagination = data?.pagination ?? null;
  const error = swrError instanceof Error ? swrError.message : '';

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`/listings?${params.toString()}`);
  }

  useEffect(() => {
    setSearchDraft(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== filters.query) setParam('query', searchDraft);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const minSlider = Number(filters.min_price) || 0;
  const maxSlider = filters.max_price ? Number(filters.max_price) : PRICE_MAX;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Browse listings</h1>
          <p className="mt-1 text-sm text-ink/70">Filter by category, price, condition, and location.</p>
        </div>
        <Button
          variant="ghost"
          className="lg:hidden"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          {filtersOpen ? 'Hide filters' : 'Filters'}
        </Button>
      </div>

      <Input
        label="Search"
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
        placeholder="e.g. phone, sofa, helmet"
        className="rounded-2xl"
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside
          className={`space-y-4 rounded-2xl border border-black/8 bg-white p-4 shadow-card ${filtersOpen ? 'block' : 'hidden'} lg:block`}
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              className="field"
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
              className="field"
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
          <div>
            <label className="mb-1 block text-sm font-medium">Price range (ETB)</label>
            <p className="mb-2 text-xs text-ink/60">
              {minSlider.toLocaleString()} – {filters.max_price ? maxSlider.toLocaleString() : 'any'}
            </p>
            <div className="space-y-3">
              <label className="block text-xs text-ink/50">
                Min
                <input
                  type="range"
                  min={0}
                  max={PRICE_MAX}
                  step={500}
                  value={minSlider}
                  className="mt-1 w-full accent-brand-600"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setParam('min_price', v === 0 ? '' : String(v));
                  }}
                />
              </label>
              <label className="block text-xs text-ink/50">
                Max
                <input
                  type="range"
                  min={0}
                  max={PRICE_MAX}
                  step={500}
                  value={maxSlider}
                  className="mt-1 w-full accent-brand-600"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setParam('max_price', v >= PRICE_MAX ? '' : String(v));
                  }}
                />
              </label>
            </div>
          </div>
          <Input
            label="Location"
            value={filters.location}
            onChange={(e) => setParam('location', e.target.value)}
            placeholder="Addis Ababa, Jimma…"
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Sort</label>
            <select
              className="field"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
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
