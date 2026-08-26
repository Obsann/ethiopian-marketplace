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
import {
  FALLBACK_CATEGORIES,
  filterDemoListings,
  parseShopSearchParams,
} from '@/lib/demoCatalog';
import { getRecent, recentAsListing } from '@/lib/recent';

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
  const [liveItems, setLiveItems] = useState<Listing[]>([]);
  const [liveShopHasItems, setLiveShopHasItems] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recent, setRecent] = useState<Listing[]>([]);

  const filters = useMemo(() => parseShopSearchParams(searchParams), [searchParams]);

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
    if (key === 'category_id') params.delete('category');
    if (key !== 'page') params.set('page', '1');
    router.push(`/listings?${params.toString()}`);
  }

  useEffect(() => {
    let cancelled = false;
    api<{ items: Listing[]; pagination: Pagination }>('/api/listings?limit=1')
      .then((r) => {
        if (cancelled) return;
        const total = Number(r.data?.pagination?.total ?? r.data?.items?.length ?? 0);
        setLiveShopHasItems(Number.isFinite(total) && total > 0);
      })
      .catch(() => {
        if (!cancelled) setLiveShopHasItems(false);
      });
    api<Category[]>('/api/listings/categories')
      .then((catRes) => {
        if (!cancelled && Array.isArray(catRes.data) && catRes.data.length) {
          setCategories(catRes.data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!liveShopHasItems) {
      setLiveItems([]);
      setPagination(null);
      setLoadingLive(false);
      setError('');
      return;
    }
    let cancelled = false;
    setLoadingLive(true);
    const qs = new URLSearchParams();
    (['query', 'category_id', 'min_price', 'max_price', 'condition', 'location', 'sort', 'page'] as const).forEach(
      (k) => {
        const v = filters[k];
        if (v) qs.set(k, v);
      }
    );
    qs.set('limit', '12');
    api<{ items: Listing[]; pagination: Pagination }>(`/api/listings?${qs}`)
      .then((listRes) => {
        if (cancelled) return;
        setLiveItems(Array.isArray(listRes.data?.items) ? listRes.data.items : []);
        setPagination(listRes.data?.pagination ?? null);
        setError('');
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Failed to load');
        setLiveItems([]);
        setPagination(null);
        setLiveShopHasItems(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, liveShopHasItems]);

  useEffect(() => {
    setRecent(getRecent().slice(0, 4).map(recentAsListing));
  }, []);

  const cats = categories.length ? categories : FALLBACK_CATEGORIES;
  const useDemo = !liveShopHasItems;
  const demoFiltered = useMemo(() => filterDemoListings(filters, cats), [filters, cats]);
  const pageNum = Math.max(1, Number(filters.page) || 1);
  const pageSize = 12;
  const demoPages = Math.max(1, Math.ceil(demoFiltered.length / pageSize));
  const demoPage = Math.min(pageNum, demoPages);
  const displayPage = useDemo ? demoPage : pageNum;
  const displayListings = useDemo
    ? demoFiltered.slice((demoPage - 1) * pageSize, demoPage * pageSize)
    : liveItems;
  const displayTotal = useDemo ? demoFiltered.length : pagination?.total;
  const displayPages = useDemo ? demoPages : pagination?.pages || 0;
  const waiting = liveShopHasItems && loadingLive;

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
        value={
          filters.category_id ||
          cats.find((c) => c.name.toLowerCase() === filters.category.toLowerCase())?.id ||
          ''
        }
        onChange={(v) => setParam('category_id', v)}
      >
        <option value="">All</option>
        {cats.map((c) => (
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
            {useDemo
              ? 'Preview catalog while the live shop is empty. Sample items are not for sale.'
              : 'Browse live listings across Ethiopia — filter by category, condition, and place.'}
          </p>
        </div>
      </section>

      <div className="page-shell py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm text-muted">
            {waiting ? 'Loading…' : `${displayTotal ?? 0} pieces`}
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
            {error && !useDemo && (
              <div className="mb-4">
                <Alert tone="error">{error}</Alert>
              </div>
            )}
            {useDemo && !waiting && (
              <div className="mb-4">
                <Alert tone="info">
                  Showing a sample catalog. Live listings will appear here after sellers post (and after the
                  shop is seeded on the server).
                </Alert>
              </div>
            )}
            {waiting && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!waiting && displayListings.length === 0 && (
              <EmptyState
                title="No pieces found"
                description={
                  useDemo
                    ? 'No sample matches this search. Clear filters to browse the preview catalog.'
                    : 'Try clearing filters or search with a broader keyword.'
                }
                actionHref="/listings"
                actionLabel="Reset shop"
              />
            )}
            {!waiting && displayListings.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {displayListings.map((l) => (
                  <ListingCard key={l.id} listing={l} href={`/listings/${l.id}`} />
                ))}
              </div>
            )}
            {!waiting && displayPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={displayPage <= 1}
                  onClick={() => setParam('page', String(displayPage - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs uppercase tracking-[0.14em] text-muted">
                  {displayPage} / {displayPages}
                </span>
                <Button
                  variant="outline"
                  disabled={displayPage >= displayPages}
                  onClick={() => setParam('page', String(displayPage + 1))}
                >
                  Next
                </Button>
              </div>
            )}
            {recent.length > 0 && (
              <section className="mt-12 border-t border-border pt-10">
                <h2 className="font-display text-2xl font-medium">Recently viewed</h2>
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {recent.map((l) => (
                    <ListingCard key={l.id} listing={l} size="compact" />
                  ))}
                </div>
              </section>
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
