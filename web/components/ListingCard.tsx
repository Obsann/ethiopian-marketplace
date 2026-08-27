'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Heart } from 'lucide-react';
import { Listing } from '@/types';
import { SafeImage } from '@/components/SafeImage';
import { isSaved, toggleSaved } from '@/lib/saved';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const MEDIA_ASPECTS = ['aspect-square', 'aspect-[4/5]', 'aspect-[3/4]'] as const;

function mediaAspectClass(listing: Listing, size: 'default' | 'featured' | 'compact') {
  if (size === 'featured') return 'aspect-[4/5]';
  const category = listing.category?.name || '';
  if (category === 'Clothing') return 'aspect-[4/5]';
  if (category === 'Books' || category === 'Kitchen') return 'aspect-square';
  let hash = 0;
  for (let i = 0; i < listing.id.length; i += 1) {
    hash = (hash * 31 + listing.id.charCodeAt(i)) | 0;
  }
  return MEDIA_ASPECTS[Math.abs(hash) % MEDIA_ASPECTS.length];
}

function mediaMaxHeightClass(size: 'default' | 'featured' | 'compact') {
  if (size === 'featured') return 'max-h-80 md:max-h-[min(70svh,26rem)] lg:max-h-[min(65svh,32rem)]';
  return 'max-h-72 md:max-h-80 lg:max-h-[min(70svh,22rem)]';
}

export function ListingCard({
  listing,
  priority = false,
  size = 'default',
  href,
}: {
  listing: Listing;
  priority?: boolean;
  size?: 'default' | 'featured' | 'compact';
  href?: string;
}) {
  const { user, token } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(listing.id));
  }, [listing.id]);

  const imgs = [
    listing.primary_image || listing.images?.[0],
    listing.images?.[1],
  ].filter(Boolean) as string[];
  const primary = imgs[0] || '/placeholder-listing.svg';
  const secondary = imgs[1];

  const objectPos = listing.category?.name === 'Clothing' ? 'object-top' : 'object-center';

  return (
    <article className="group relative w-full min-w-0 max-w-full snap-start">
      <Link href={href || `/listings/${listing.id}`} className="block min-w-0 max-w-full cursor-pointer outline-none">
        <div
          className={`relative w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-stone-200 ${mediaMaxHeightClass(size)}`}
        >
          <div className={`relative w-full ${mediaAspectClass(listing, size)}`}>
            <SafeImage
              src={primary}
              alt={listing.title}
              fill
              priority={priority}
              sizes={size === 'featured' ? '420px' : '(max-width:640px) 50vw, 33vw'}
              className={`object-cover ${objectPos} transition duration-700 ease-out group-hover:scale-[1.04] ${
                secondary ? 'group-hover:opacity-0' : ''
              }`}
            />
            {secondary && (
              <SafeImage
                src={secondary}
                alt=""
                fill
                sizes="(max-width:640px) 50vw, 33vw"
                className={`object-cover ${objectPos} opacity-0 transition duration-700 group-hover:opacity-100`}
                aria-hidden
              />
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-80" />
          {listing.seller?.is_verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink backdrop-blur-sm">
              <BadgeCheck className="h-3 w-3 text-accent-600" aria-hidden />
              Verified
            </span>
          )}
          <span className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-wider text-white/90">
            {listing.condition.replace('_', ' ')}
            {listing.status === 'reserved' || listing.status === 'sold' ? ` · ${listing.status}` : ''}
          </span>
        </div>
        <div className="space-y-1 pt-3">
          <h3
            className={`font-display font-medium leading-snug text-ink ${
              size === 'featured' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
            }`}
          >
            <span className="line-clamp-2">{listing.title}</span>
          </h3>
          <p className="text-sm font-medium tracking-wide text-ink">
            {listing.price.toLocaleString()} <span className="text-muted">ETB</span>
          </p>
          <p className="truncate text-xs uppercase tracking-wider text-muted">{listing.location}</p>
        </div>
      </Link>
      <button
        type="button"
        className={`absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink opacity-100 transition duration-300 hover:bg-white md:h-9 md:w-9 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 ${
          saved ? 'text-et-red md:opacity-100' : ''
        }`}
        aria-label={saved ? 'Remove from saved' : 'Save for later'}
        aria-pressed={saved}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (listing.id.startsWith('demo-')) {
            setSaved(toggleSaved(listing.id));
            return;
          }
          const next = toggleSaved(listing.id);
          setSaved(next);
          if (user) {
            void api(`/api/listings/${listing.id}/save`, {
              method: next ? 'POST' : 'DELETE',
              token,
            }).catch(() => {});
          }
        }}
      >
        <Heart className="h-4 w-4" aria-hidden fill={saved ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
