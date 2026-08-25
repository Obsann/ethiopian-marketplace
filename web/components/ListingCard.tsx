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
      className="group block overflow-hidden rounded-2xl border border-black/8 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        <Image
          src={img}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute left-2 top-2">
          <Badge tone={conditionTone[listing.condition] || 'gray'}>
            {listing.condition.replace('_', ' ')}
          </Badge>
        </div>
      </div>
      <div className="space-y-2 p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand-700">
          {listing.title}
        </h3>
        <p className="text-lg font-bold tracking-tight text-brand-700">
          {listing.price.toLocaleString()} ETB
        </p>
        <div className="flex items-center justify-between gap-2 text-xs text-ink/60">
          <span className="truncate">{listing.location}</span>
          {listing.seller?.is_verified && (
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
              Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
