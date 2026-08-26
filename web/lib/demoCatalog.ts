import type { Category, Listing } from '@/types';
import { DEMO_CATALOG, type CatalogItem } from '@/lib/uiPhotos';

/** Stable IDs from the categories seed migration. */
export const DEMO_CATEGORY_IDS: Record<string, string> = {
  Electronics: 'a1b2c3d4-e5f6-7890-abcd-000000000001',
  Clothing: 'a1b2c3d4-e5f6-7890-abcd-000000000002',
  Furniture: 'a1b2c3d4-e5f6-7890-abcd-000000000003',
  Books: 'a1b2c3d4-e5f6-7890-abcd-000000000004',
  Vehicles: 'a1b2c3d4-e5f6-7890-abcd-000000000005',
  Kitchen: 'a1b2c3d4-e5f6-7890-abcd-000000000006',
  Tools: 'a1b2c3d4-e5f6-7890-abcd-000000000007',
  Other: 'a1b2c3d4-e5f6-7890-abcd-000000000008',
};

export const FALLBACK_CATEGORIES: Category[] = Object.entries(DEMO_CATEGORY_IDS).map(([name, id]) => ({
  id,
  name,
}));

export function isDemoListingId(id: string) {
  return /^demo-\d+$/.test(id);
}

function conditionLabel(condition: CatalogItem['condition']) {
  return condition.replace('_', ' ');
}

export function demoListingPath(index: number) {
  return `/listings/demo-${index}`;
}

export function catalogAsListing(item: CatalogItem, index: number): Listing {
  const category_id = DEMO_CATEGORY_IDS[item.category] || item.category;
  return {
    id: `demo-${index}`,
    seller_id: 'demo',
    title: item.title,
    description: `${item.title} in ${conditionLabel(item.condition)} condition, from ${item.location}. This is a sample catalog item so you can preview the shop while live listings are empty.`,
    price: item.price,
    condition: item.condition,
    category_id,
    location: item.location,
    status: 'active',
    images: [item.image],
    created_at: '',
    primary_image: item.image,
    meetup_ok: true,
    delivery_ok: false,
    category: { id: category_id, name: item.category },
    seller: { id: 'demo', name: 'SuqET sample', is_verified: false },
  };
}

export function allDemoListings(): Listing[] {
  return DEMO_CATALOG.map((item, i) => catalogAsListing(item, i));
}

export function demoListingById(id: string): Listing | null {
  const match = id.match(/^demo-(\d+)$/);
  if (!match) return null;
  const index = Number(match[1]);
  const item = DEMO_CATALOG[index];
  if (!item) return null;
  return catalogAsListing(item, index);
}

export function similarDemoListings(listing: Listing): Listing[] {
  return allDemoListings().filter((row) => row.id !== listing.id && row.category_id === listing.category_id);
}

export type DemoShopFilters = {
  query?: string;
  q?: string;
  search?: string;
  category_id?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  condition?: string;
  location?: string;
  sort?: string;
};

function namesEqual(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function categoryNameForFilter(raw: string, categories: Category[]): string | null {
  if (!raw) return null;
  const allCats = [...categories, ...FALLBACK_CATEGORIES];
  const byId = allCats.find((c) => c.id === raw);
  if (byId) return byId.name;
  const byName = allCats.find((c) => namesEqual(c.name, raw));
  if (byName) return byName.name;
  const fromSeed = Object.entries(DEMO_CATEGORY_IDS).find(
    ([name, id]) => id === raw || namesEqual(name, raw)
  );
  if (fromSeed) return fromSeed[0];
  return raw;
}

export function parseShopSearchParams(searchParams: { get: (key: string) => string | null }) {
  return {
    query: searchParams.get('query') || searchParams.get('q') || searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    condition: searchParams.get('condition') || '',
    location: searchParams.get('location') || '',
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') || '1',
  };
}

export function filterDemoListings(filters: DemoShopFilters, categories: Category[] = []): Listing[] {
  const query = (filters.query || filters.q || filters.search || '').trim().toLowerCase();
  const categoryRaw = (filters.category_id || filters.category || '').trim();
  const categoryName = categoryNameForFilter(categoryRaw, categories);
  const min = filters.min_price ? Number(filters.min_price) : NaN;
  const max = filters.max_price ? Number(filters.max_price) : NaN;
  const location = (filters.location || '').trim().toLowerCase();

  let items = allDemoListings().filter((listing) => {
    if (query) {
      const hay = `${listing.title} ${listing.description} ${listing.location} ${listing.category?.name || ''}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    if (categoryRaw) {
      const matchesId =
        listing.category_id === categoryRaw || listing.category?.id === categoryRaw;
      const matchesName = categoryName
        ? namesEqual(listing.category?.name || '', categoryName)
        : false;
      if (!matchesId && !matchesName) return false;
    }
    if (filters.condition && listing.condition !== filters.condition) return false;
    if (location && !listing.location.toLowerCase().includes(location)) return false;
    if (!Number.isNaN(min) && listing.price < min) return false;
    if (!Number.isNaN(max) && listing.price > max) return false;
    return true;
  });

  if (filters.sort === 'price_asc') {
    items = [...items].sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'price_desc') {
    items = [...items].sort((a, b) => b.price - a.price);
  }

  return items;
}
