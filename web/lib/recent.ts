import type { Listing } from '@/types';

const KEY = 'suqet_recent_v1';

export type RecentItem = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  location: string;
};

export function getRecent(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recentAsListing(item: RecentItem): Listing {
  return {
    id: item.id,
    seller_id: '',
    title: item.title,
    description: '',
    price: item.price,
    condition: 'good',
    category_id: '',
    location: item.location,
    status: 'active',
    images: item.image ? [item.image] : [],
    created_at: '',
    primary_image: item.image,
  };
}

export function pushRecent(listing: Listing): void {
  if (typeof window === 'undefined' || listing.id.startsWith('demo-')) return;
  const item: RecentItem = {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    image: listing.primary_image || listing.images?.[0] || null,
    location: listing.location,
  };
  const next = [item, ...getRecent().filter((r) => r.id !== listing.id)].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(next));
}
