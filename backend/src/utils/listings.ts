import { Prisma } from '@prisma/client';
import prisma from '../models/prisma';
import { toPublicMediaUrl } from './mediaUrl';
import { isUserOnline } from './presence';

export const sellerPublicSelect = {
  id: true,
  name: true,
  is_verified: true,
  created_at: true,
  last_seen_at: true,
} as const;

export function mapListing(listing: {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: Prisma.Decimal;
  condition: string;
  category_id: string;
  location: string;
  status: string;
  created_at: Date;
  images?: { url: string; is_primary: boolean }[];
  seller?: {
    id: string;
    name: string;
    is_verified: boolean;
    created_at?: Date;
    last_seen_at?: Date | null;
  };
  category?: { id: string; name: string } | null;
  view_count?: number;
  meetup_ok?: boolean;
  delivery_ok?: boolean;
  delivery_fee?: Prisma.Decimal | null;
  size?: string | null;
}) {
  const images = (listing.images ?? [])
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((i) => toPublicMediaUrl(i.url))
    .filter(Boolean);
  return {
    id: listing.id,
    seller_id: listing.seller_id,
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),
    condition: listing.condition,
    category_id: listing.category_id,
    location: listing.location,
    status: listing.status,
    images,
    created_at: listing.created_at.toISOString(),
    seller: listing.seller
      ? {
          id: listing.seller.id,
          name: listing.seller.name,
          is_verified: listing.seller.is_verified,
          created_at: listing.seller.created_at?.toISOString(),
          is_online: isUserOnline(listing.seller.id),
          last_seen_at: listing.seller.last_seen_at
            ? listing.seller.last_seen_at.toISOString()
            : null,
        }
      : undefined,
    category: listing.category ?? undefined,
    view_count: listing.view_count ?? 0,
    primary_image: images[0] ?? null,
    meetup_ok: listing.meetup_ok ?? true,
    delivery_ok: listing.delivery_ok ?? false,
    delivery_fee: listing.delivery_fee != null ? Number(listing.delivery_fee) : null,
    size: listing.size ?? null,
  };
}

/** PostgreSQL tsvector search over listing title + description. */
export async function idsMatchingFullText(query: string): Promise<string[] | 'skip'> {
  const q = query.trim();
  if (!q) return 'skip';
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Listing"
      WHERE to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
        @@ plainto_tsquery('simple', ${q})
    `;
    return rows.map((r) => r.id);
  } catch {
    const rows = await prisma.listing.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
