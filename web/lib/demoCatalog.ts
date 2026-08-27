import type { Category, Listing, Review } from '@/types';
import { DEMO_CATALOG, type CatalogItem, type DemoSellerKey } from '@/lib/uiPhotos';

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

/** Catalog order (Electronics first). API `/categories` is A–Z, which puts Books + Clothing on the left. */
export function orderShopCategories(cats: Category[]): Category[] {
  const rank = new Map(Object.keys(DEMO_CATEGORY_IDS).map((name, i) => [name.toLowerCase(), i]));
  return [...cats].sort((a, b) => {
    const ra = rank.get(a.name.toLowerCase()) ?? 1000;
    const rb = rank.get(b.name.toLowerCase()) ?? 1000;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

export const DEMO_SELLERS: Record<
  DemoSellerKey,
  { id: string; name: string; is_verified: boolean; created_at: string; role: 'seller' }
> = {
  abebe: {
    id: 'demo-abebe',
    name: 'Abebe Kebede',
    is_verified: true,
    created_at: '2025-11-02T08:00:00.000Z',
    role: 'seller',
  },
  tigist: {
    id: 'demo-tigist',
    name: 'Tigist Haile',
    is_verified: true,
    created_at: '2025-09-18T08:00:00.000Z',
    role: 'seller',
  },
};

export type DemoSellerProfile = {
  seller: {
    id: string;
    name: string;
    is_verified: boolean;
    created_at: string;
    role: string;
    is_online?: boolean;
    last_seen_at?: string | null;
  };
  stats: {
    active_listings: number;
    sold_count: number;
    rating_avg: number;
    rating_count: number;
  };
  listings: Listing[];
  reviews: Review[];
};

export function isDemoListingId(id: string) {
  return /^demo-\d+$/.test(id);
}

export function isDemoSellerId(id: string) {
  return id === DEMO_SELLERS.abebe.id || id === DEMO_SELLERS.tigist.id;
}

export function demoListingPath(index: number) {
  return `/listings/demo-${index}`;
}

export function catalogAsListing(item: CatalogItem, index: number): Listing {
  const category_id = DEMO_CATEGORY_IDS[item.category] || item.category;
  const seller = DEMO_SELLERS[item.seller];
  return {
    id: `demo-${index}`,
    seller_id: seller.id,
    title: item.title,
    description: item.description,
    price: item.price,
    condition: item.condition,
    category_id,
    location: item.location,
    status: 'active',
    images: [item.image],
    created_at: new Date(Date.now() - index * 8 * 60 * 60 * 1000).toISOString(),
    primary_image: item.image,
    meetup_ok: item.meetup_ok !== false,
    delivery_ok: Boolean(item.delivery_ok),
    delivery_fee: item.delivery_ok ? item.delivery_fee ?? null : null,
    size: item.size ?? null,
    category: { id: category_id, name: item.category },
    seller: {
      id: seller.id,
      name: seller.name,
      is_verified: seller.is_verified,
      created_at: seller.created_at,
    },
  };
}

export function allDemoListings(): Listing[] {
  return DEMO_CATALOG.map((item, i) => catalogAsListing(item, i));
}

/** Newest-first grids should open on the Amharic books card (catalog #1). */
export function pinAmharicBooksFirst(items: Listing[], sort = 'newest'): Listing[] {
  if (sort && sort !== 'newest') return items;
  const i = items.findIndex((l) => l.title === 'Amharic Novel Bundle');
  if (i <= 0) return items;
  return [items[i], ...items.slice(0, i), ...items.slice(i + 1)];
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

export function listingsByDemoSeller(sellerId: string): Listing[] {
  return allDemoListings().filter((row) => row.seller_id === sellerId);
}

export function demoSellerProfile(id: string): DemoSellerProfile | null {
  const seller = Object.values(DEMO_SELLERS).find((row) => row.id === id);
  if (!seller) return null;
  const listings = listingsByDemoSeller(id);
  return {
    seller: {
      id: seller.id,
      name: seller.name,
      is_verified: seller.is_verified,
      created_at: seller.created_at,
      role: seller.role,
      is_online: false,
      last_seen_at: null,
    },
    stats: {
      active_listings: listings.length,
      sold_count: 0,
      rating_avg: 0,
      rating_count: 0,
    },
    listings,
    reviews: [],
  };
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
      const hay = `${listing.title} ${listing.description} ${listing.location} ${listing.category?.name || ''} ${listing.seller?.name || ''}`.toLowerCase();
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
  } else {
    items = [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    items = pinAmharicBooksFirst(items, 'newest');
  }

  return items;
}
