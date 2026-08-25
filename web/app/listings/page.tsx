'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Filter, SlidersHorizontal, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Category, Listing, Pagination } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';

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
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
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

  const activeFilterCount = [
    filters.category_id,
    filters.condition,
    filters.min_price,
    filters.max_price,
    filters.location,
    filters.sort !== 'newest' ? filters.sort : '',
  ].filter(Boolean).length;

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

  function clearFilters() {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    router.push(params.toString() ? `/listings?${params.toString()}` : '/listings');
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

  const filterPanel = (
    <aside className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden strokeWidth={2} />
          Filters
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear
          </button>
        )}
      </div>

      <FilterSelect
        id="filter-category"
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
        id="filter-condition"
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

      <Input
        id="filter-min-price"
        label="Min price (ETB)"
        type="number"
        value={filters.min_price}
        onChange={(e) => setParam('min_price', e.target.value)}
      />
      <Input
        id="filter-max-price"
        label="Max price (ETB)"
        type="number"
        value={filters.max_price}
        onChange={(e) => setParam('max_price', e.target.value)}
      />
      <Input
        id="filter-location"
        label="Location"
        value={filters.location}
        onChange={(e) => setParam('location', e.target.value)}
        placeholder="Addis Ababa, Jimma…"
      />

      <FilterSelect
        id="filter-sort"
        label="Sort"
        value={filters.sort}
        onChange={(v) => setParam('sort', v)}
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </FilterSelect>
    </aside>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Browse listings</h1>
        <p className="muted mt-1">Filter by category, price, condition, and location.</p>
      </div>

      <Input
        id="listings-search"
        label="Search"
        value={queryInput}
        onChange={(e) => setQueryInput(e.target.value)}
        placeholder="e.g. phone, sofa, helmet"
      />

      <Button
        type="button"
        variant="outline"
        className="w-full lg:hidden"
        onClick={() => setFiltersOpen((v) => !v)}
        aria-expanded={filtersOpen}
        aria-controls="listings-filters"
      >
        <Filter className="h-4 w-4" aria-hidden strokeWidth={2} />
        {filtersOpen ? 'Hide filters' : 'Show filters'}
        {activeFilterCount > 0 && (
          <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-800">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div
          id="listings-filters"
          className={filtersOpen ? 'block' : 'hidden lg:block'}
        >
          {filterPanel}
        </div>

        <div className="min-w-0 space-y-4">
          {!loading && !error && pagination && (
            <p className="text-sm text-muted">
              {pagination.total.toLocaleString()} result{pagination.total === 1 ? '' : 's'}
            </p>
          )}

          {loading && (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              aria-busy="true"
              aria-label="Loading listings"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          {!loading && !error && listings.length === 0 && (
            <EmptyState
              title="No listings found"
              description="Try different filters or clear your search."
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
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page <= 1}
                    onClick={() => setParam('page', String(pagination.page - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </Button>
                  <span className="text-sm text-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setParam('page', String(pagination.page + 1))}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
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
