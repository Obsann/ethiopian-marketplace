import Image from 'next/image';
import Link from 'next/link';
import { Listing } from '@/types';
import { Badge } from './ui/Badge';

const conditionTone: Record<string, 'green' | 'amber' | 'gray'> = {
  new: 'green',
  like_new: 'green',
  good: 'amber',
  fair: 'gray',
};

export function ListingCard({ listing }: { listing: Listing }) {
  const img = listing.primary_image || listing.images?.[0] || '/placeholder-listing.svg';
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-lg border border-black/8 bg-white transition hover:border-brand-500/40"
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        <Image
          src={img}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition group-hover:scale-[1.02]"
        />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{listing.title}</h3>
          <Badge tone={conditionTone[listing.condition] || 'gray'}>
            {listing.condition.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-base font-bold text-brand-700">
          {listing.price.toLocaleString()} ETB
        </p>
        <p className="text-xs text-ink/60">
          {listing.location}
          {listing.seller?.is_verified ? ' · Verified seller' : ''}
        </p>
      </div>
    </Link>
  );
}
