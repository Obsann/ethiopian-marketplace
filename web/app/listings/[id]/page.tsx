'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Listing } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ListingChat } from '@/components/ListingChat';

function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    api<Listing>(`/api/listings/${id}`)
      .then((r) => setListing(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function buyNow() {
    if (!user) {
      router.push(`/auth/login?next=/listings/${id}`);
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ checkout_url: string }>('/api/payments/initialize', {
        method: 'POST',
        token,
        body: JSON.stringify({ listing_id: id }),
      });
      window.location.href = res.data.checkout_url;
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  }

  async function sendOffer(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?next=/listings/${id}`);
      return;
    }
    setBusy(true);
    try {
      await api(`/api/listings/${id}/offer`, {
        method: 'POST',
        token,
        body: JSON.stringify({ amount: Number(offerAmount) }),
      });
      setNote('Offer sent to the seller.');
      setOfferOpen(false);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Offer failed');
    } finally {
      setBusy(false);
    }
  }

  async function reportListing() {
    if (!user) {
      router.push(`/auth/login?next=/listings/${id}`);
      return;
    }
    const reason = window.prompt('Why are you reporting this listing?');
    if (!reason) return;
    try {
      await api('/api/reports', {
        method: 'POST',
        token,
        body: JSON.stringify({ target_type: 'listing', target_id: id, reason }),
      });
      setNote('Thanks — your report was submitted.');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Report failed');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (error || !listing) {
    return <p className="text-red-600">{error || 'Listing not found'}</p>;
  }

  const images = listing.images?.length ? listing.images : ['/placeholder-listing.svg'];
  const isOwn = user?.id === listing.seller_id;
  const canBuy = listing.status === 'active' && !isOwn;
  const fromInbox = Boolean(searchParams.get('with'));
  const peerId = searchParams.get('with') || listing.seller_id;
  const showChat = Boolean(user && (listing.status === 'active' || fromInbox));

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
            <Image
              src={images[activeImg]}
              alt={listing.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border ${i === activeImg ? 'border-brand-600' : 'border-black/10'}`}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Badge tone="amber">{listing.condition.replace('_', ' ')}</Badge>
            {listing.status !== 'active' && (
              <Badge tone="gray">{listing.status}</Badge>
            )}
            <h1 className="font-display text-3xl font-semibold">{listing.title}</h1>
            <p className="text-2xl font-bold text-brand-700">
              {listing.price.toLocaleString()} ETB
            </p>
            <p className="text-sm text-ink/70">
              {listing.location}
              {listing.seller ? ` · Seller: ${listing.seller.name}` : ''}
              {listing.seller?.is_verified ? ' Verified' : ''}
            </p>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
            {listing.description}
          </p>

          {canBuy && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button onClick={buyNow} loading={busy}>
                Buy Now
              </Button>
              <Button variant="secondary" onClick={() => setOfferOpen(true)}>
                Make Offer
              </Button>
            </div>
          )}
          {isOwn && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-sm text-ink/60">This is your listing.</p>
              <Link
                href={`/listings/${listing.id}/edit`}
                className="text-sm font-medium text-brand-700 underline"
              >
                Edit listing
              </Link>
            </div>
          )}

          {note && <p className="text-sm text-brand-700">{note}</p>}

          {!isOwn && (
            <button
              type="button"
              onClick={reportListing}
              className="text-xs text-ink/50 underline hover:text-ink"
            >
              Report listing
            </button>
          )}
        </div>
      </div>

      {showChat ? (
        <ListingChat listingId={listing.id} sellerId={listing.seller_id} peerId={peerId} />
      ) : listing.status !== 'active' && !isOwn ? (
        <p className="text-sm text-ink/60">
          This listing is no longer available.{' '}
          {user ? (
            <Link href="/inbox" className="underline">
              Open inbox
            </Link>
          ) : (
            'Sign in to see past conversations in Inbox.'
          )}
        </p>
      ) : (
        !isOwn && (
          <p className="text-sm text-ink/60">
            <button
              type="button"
              className="underline"
              onClick={() => router.push(`/auth/login?next=/listings/${id}`)}
            >
              Sign in
            </button>{' '}
            to message the seller.
          </p>
        )
      )}

      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={sendOffer}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-5"
          >
            <h2 className="font-display text-xl font-semibold">Make an offer</h2>
            <Input
              label="Amount (ETB)"
              type="number"
              required
              min={1}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" loading={busy}>
                Send offer
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOfferOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ListingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <ListingDetail />
    </Suspense>
  );
}
