import Image from 'next/image';
import Link from 'next/link';
import { Listing } from '@/types';
import { Badge } from './ui/Badge';

const conditionTone: Record<string, 'green' | 'amber' | 'gray'> = {
  new: 'green', like_new: 'green', good: 'amber', fair: 'gray',
};

export function ListingCard({ listing }: { listing: Listing }) {
  const img = listing.primary_image || listing.images?.[0] || '/placeholder-listing.svg';
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-black/8 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <Image
          src={img}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute left-2 top-2">
          <Badge tone={conditionTone[listing.condition] || 'gray'}>
            {listing.condition.replace('_', ' ')}
          </Badge>
        </div>
        {listing.seller?.is_verified && (
          <div className="absolute bottom-2 right-2">
            <span className="rounded-full bg-brand-600/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              ✓ Verified
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-700 transition-colors">
          {listing.title}
        </h3>
        <p className="text-xl font-bold tracking-tight text-brand-700">
          {listing.price.toLocaleString()} <span className="text-sm font-semibold text-muted">ETB</span>
        </p>
        <p className="truncate text-xs text-muted">{listing.location}</p>
      </div>
    </Link>
  );
}
