'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Category, Listing, Pagination } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/Reveal';

const selectClass = 'field cursor-pointer';

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </label>
      <select id={id} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

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
    setLoading(true);
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    qs.set('limit', '12');
    Promise.all([
      api<{ items: Listing[]; pagination: Pagination }>(`/api/listings?${qs}`),
      api<Category[]>('/api/listings/categories'),
    ])
      .then(([listRes, catRes]) => {
        setListings(listRes.data.items);
        setPagination(listRes.data.pagination);
        setCategories(catRes.data);
        setError('');
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filters]);

  const filterPanel = (
    <aside className="space-y-5 border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink">Filters</p>
      <Input
        id="shop-query"
        label="Search"
        value={queryInput}
        onChange={(e) => setQueryInput(e.target.value)}
        placeholder="Keyword…"
      />
      <FilterSelect
        id="shop-category"
        label="Category"
        value={filters.category_id}
        onChange={(v) => setParam('category_id', v)}
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="shop-condition"
        label="Condition"
        value={filters.condition}
        onChange={(v) => setParam('condition', v)}
      >
        <option value="">Any</option>
        <option value="new">New</option>
        <option value="like_new">Like new</option>
        <option value="good">Good</option>
        <option value="fair">Fair</option>
      </FilterSelect>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="min-price"
          label="Min ETB"
          type="number"
          value={filters.min_price}
          onChange={(e) => setParam('min_price', e.target.value)}
        />
        <Input
          id="max-price"
          label="Max ETB"
          type="number"
          value={filters.max_price}
          onChange={(e) => setParam('max_price', e.target.value)}
        />
      </div>
      <Input
        id="location"
        label="Location"
        value={filters.location}
        onChange={(e) => setParam('location', e.target.value)}
      />
      <FilterSelect id="shop-sort" label="Sort" value={filters.sort} onChange={(v) => setParam('sort', v)}>
        <option value="newest">Newest</option>
        <option value="price_asc">Price ↑</option>
        <option value="price_desc">Price ↓</option>
      </FilterSelect>
    </aside>
  );

  return (
    <div className="bg-paper">
      <section className="border-b border-border bg-ink text-white">
        <div className="page-shell py-20 sm:py-28">
          <p className="eyebrow text-white/45">Shop</p>
          <h1 className="mt-3 font-display text-hero font-medium">The collection</h1>
          <p className="mt-4 max-w-lg text-sm text-white/60 sm:text-base">
            Browse live listings across Ethiopia — filter by category, condition, and place.
          </p>
        </div>
      </section>

      <div className="page-shell py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm text-muted">
            {pagination ? `${pagination.total} pieces` : 'Loading…'}
          </p>
          <Button
            type="button"
            variant="outline"
            className="px-3 py-2"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
            Filters
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className={`lg:col-span-3 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            {filterPanel}
          </div>
          <div className="lg:col-span-9">
            {error && <Alert tone="error">{error}</Alert>}
            {loading && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!loading && !error && listings.length === 0 && (
              <EmptyState
                title="No pieces found"
                description="Try clearing filters or search with a broader keyword."
                actionHref="/listings"
                actionLabel="Reset shop"
              />
            )}
            {!loading && listings.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {listings.map((l, i) => (
                  <Reveal key={l.id} delayMs={(i % 6) * 40}>
                    <ListingCard listing={l} />
                  </Reveal>
                ))}
              </div>
            )}
            {pagination && pagination.pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={Number(filters.page) <= 1}
                  onClick={() => setParam('page', String(Number(filters.page) - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs uppercase tracking-[0.14em] text-muted">
                  {filters.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={Number(filters.page) >= pagination.pages}
                  onClick={() => setParam('page', String(Number(filters.page) + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell grid grid-cols-2 gap-4 py-24 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
