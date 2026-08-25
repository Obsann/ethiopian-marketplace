import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Listing } from '@/types';
import { Badge } from './ui/Badge';

const conditionTone: Record<string, 'green' | 'amber' | 'gray' | 'blue'> = {
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
      className="group block cursor-pointer overflow-hidden rounded-xl border border-border bg-surface transition duration-180 hover:border-brand-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={img}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-180 group-hover:opacity-95"
        />
        <div className="absolute left-2 top-2">
          <Badge tone={conditionTone[listing.condition] || 'gray'}>
            {listing.condition.replace('_', ' ')}
          </Badge>
        </div>
        {listing.seller?.is_verified && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              Verified
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-700">
          {listing.title}
        </h3>
        <p className="text-lg font-bold tracking-tight text-accent-600">
          {listing.price.toLocaleString()} <span className="text-sm font-semibold text-muted">ETB</span>
        </p>
        <p className="truncate text-xs text-muted">{listing.location}</p>
      </div>
    </Link>
  );
}
