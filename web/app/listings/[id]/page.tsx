'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Share2,
  ShoppingBag,
  Tag,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Listing } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ListingChat } from '@/components/ListingChat';
import { Reveal } from '@/components/Reveal';
import { SafeImage } from '@/components/SafeImage';
import { ListingCard } from '@/components/ListingCard';
import { pushRecent, getRecent, recentAsListing } from '@/lib/recent';
import { isSaved, toggleSaved } from '@/lib/saved';

type OfferRow = { id: string; amount: number; created_at: string; sender: { id: string; name: string } };

function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  const [recent, setRecent] = useState<Listing[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Listing>(`/api/listings/${id}`)
      .then((r) => {
        setListing(r.data);
        pushRecent(r.data);
        setRecent(
          getRecent()
            .filter((x) => x.id !== r.data.id)
            .slice(0, 4)
            .map(recentAsListing)
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    setSaved(isSaved(id));
  }, [id]);

  useEffect(() => {
    if (!listing) return;
    api<Listing[]>(`/api/listings/${id}/similar`)
      .then((r) => setSimilar(r.data))
      .catch(() => {});
    api<OfferRow[]>(`/api/listings/${id}/offers`)
      .then((r) => setOffers(r.data))
      .catch(() => {});
    api<{ listings: Listing[] }>(`/api/sellers/${listing.seller_id}`)
      .then((r) => setSellerListings(r.data.listings.filter((l) => l.id !== listing.id).slice(0, 4)))
      .catch(() => {});
  }, [id, listing]);

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
      const rows = await api<OfferRow[]>(`/api/listings/${id}/offers`);
      setOffers(rows.data);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Offer failed');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: 'reserved' | 'sold' | 'active') {
    setBusy(true);
    try {
      const res = await api<Listing>(`/api/listings/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ status }),
      });
      setListing(res.data);
      setNote(status === 'sold' ? 'Marked as sold.' : status === 'reserved' ? 'Marked as reserved.' : 'Listing is active.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not update');
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
      <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
        <Spinner />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="page-shell py-24">
        <Alert tone="error">{error || 'Listing not found'}</Alert>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : ['/placeholder-listing.svg'];
  const isOwn = user?.id === listing.seller_id;
  const canBuy = listing.status === 'active' && !isOwn;
  const fromInbox = Boolean(searchParams.get('with'));
  const peerId = searchParams.get('with') || listing.seller_id;
  const showChat = Boolean(user && (listing.status === 'active' || listing.status === 'reserved' || fromInbox));
  const noteIsSuccess =
    note.includes('sent') || note.includes('Thanks') || note.includes('submitted') || note.includes('Marked');
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `${listing.title} — ${listing.price.toLocaleString()} ETB on SuqET`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.location}, Ethiopia`)}`;
  const isClothing = listing.category?.name?.toLowerCase() === 'clothing';

  return (
    <div className="bg-paper">
      <div className="page-shell pt-24 sm:pt-28">
        <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-ink">
            Shop
          </Link>
          {listing.category && (
            <>
              <span>/</span>
              <Link href={`/listings?category_id=${listing.category.id}`} className="hover:text-ink">
                {listing.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="max-w-[12rem] truncate text-ink sm:max-w-xs">{listing.title}</span>
        </nav>
      </div>

      <div className="page-shell grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-12">
        <div className="lg:col-span-7">
          <Reveal>
            <button
              type="button"
              className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-stone-200 sm:aspect-[5/6]"
              onClick={() => setZoom(true)}
              aria-label="Zoom photo"
            >
              <SafeImage
                src={images[activeImg]}
                alt={listing.title}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
                priority
              />
            </button>
          </Reveal>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Listing photos">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border transition sm:h-24 sm:w-20 ${
                    i === activeImg ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={src} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 lg:space-y-6">
            <Reveal delayMs={60}>
              <p className="eyebrow">
                {listing.condition.replace('_', ' ')}
                {listing.status !== 'active' ? ` · ${listing.status}` : ''}
                {listing.size ? ` · Size ${listing.size}` : ''}
              </p>
              <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
                {listing.title}
              </h1>
              <p className="mt-4 font-display text-3xl font-medium text-ink">
                {listing.price.toLocaleString()}{' '}
                <span className="text-lg font-sans font-medium text-muted">ETB</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
                <a href={mapsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {listing.location}
                </a>
                {listing.seller && (
                  <Link href={`/sellers/${listing.seller.id}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                    {listing.seller.is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-accent-600" aria-hidden />
                    )}
                    {listing.seller.name}
                    {listing.seller.is_verified ? ' · Verified' : ''}
                  </Link>
                )}
              </div>
            </Reveal>

            <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
              <p>
                {listing.meetup_ok !== false ? 'Meetup OK' : 'No meetup'}
                {listing.delivery_ok
                  ? ` · Delivery${listing.delivery_fee ? ` (${listing.delivery_fee.toLocaleString()} ETB)` : ''}`
                  : ' · Pickup only unless you agree in chat'}
              </p>
              <p>
                Buyer protection: pay in-app (Chapa TEST). Held is a database hold, not live escrow.{' '}
                <span className="notranslate">ይህ ግዢ በ SuqET ይከታተላል።</span>
              </p>
              <p>Pay with Telebirr, CBE Birr, or card on Chapa&apos;s TEST checkout.</p>
            </div>

            {isClothing && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Check size{listing.size ? ` (listed: ${listing.size})` : ''} and fabric in photos.</li>
                <li>Ask in chat about stains, smell, and whether it was tailored.</li>
                <li>Try on at meetup before you pay cash.</li>
              </ul>
            )}

            <Reveal delayMs={120}>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ink/80 sm:text-base">
                {listing.description}
              </p>
            </Reveal>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden />
                WhatsApp
              </a>
              <a
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
              >
                Telegram
              </a>
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                  saved ? 'border-et-red text-et-red' : 'border-border'
                }`}
                onClick={() => {
                  const next = toggleSaved(listing.id);
                  setSaved(next);
                  if (user && !listing.id.startsWith('demo-')) {
                    void api(`/api/listings/${listing.id}/save`, {
                      method: next ? 'POST' : 'DELETE',
                      token,
                    }).catch(() => {});
                  }
                }}
              >
                <Heart className="h-3.5 w-3.5" aria-hidden fill={saved ? 'currentColor' : 'none'} />
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>

            {canBuy && (
              <div className="mt-8 space-y-3 border-t border-border pt-6">
                <Button variant="secondary" className="w-full" onClick={buyNow} loading={busy}>
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  Buy now
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setOfferOpen(true)}>
                  <Tag className="h-4 w-4" aria-hidden />
                  Make an offer
                </Button>
              </div>
            )}

            {isOwn && (
              <div className="mt-8 space-y-3 border border-border bg-surface p-5">
                <p className="text-sm text-muted">This is your listing. {listing.view_count ?? 0} views.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/listings/${listing.id}/edit`}>
                    <Button variant="outline" type="button">
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit
                    </Button>
                  </Link>
                  {listing.status === 'active' && (
                    <Button type="button" variant="ghost" loading={busy} onClick={() => setStatus('reserved')}>
                      Reserve
                    </Button>
                  )}
                  {listing.status === 'reserved' && (
                    <Button type="button" variant="ghost" loading={busy} onClick={() => setStatus('active')}>
                      Unreserve
                    </Button>
                  )}
                  {listing.status !== 'sold' && (
                    <Button type="button" variant="danger" loading={busy} onClick={() => setStatus('sold')}>
                      Mark sold
                    </Button>
                  )}
                </div>
              </div>
            )}

            {note && (
              <div className="mt-4">
                <Alert tone={noteIsSuccess ? 'success' : 'error'}>{note}</Alert>
              </div>
            )}

            {offers.length > 0 && (
              <div className="mt-6">
                <p className="eyebrow">Offers</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {offers.map((o) => (
                    <li key={o.id} className="flex justify-between gap-3 border-b border-border pb-2">
                      <span>{o.sender.name}</span>
                      <span className="font-medium">{o.amount.toLocaleString()} ETB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isOwn && (
              <button
                type="button"
                onClick={reportListing}
                className="mt-6 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden />
                Report
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-shell space-y-8 pb-20">
        {showChat ? (
          <ListingChat listingId={listing.id} sellerId={listing.seller_id} peerId={peerId} />
        ) : listing.status !== 'active' && listing.status !== 'reserved' && !isOwn ? (
          <Alert tone="info">
            This listing is no longer available.{' '}
            {user ? (
              <Link href="/inbox" className="font-semibold underline">
                Open inbox
              </Link>
            ) : (
              'Sign in to see past conversations in Inbox.'
            )}
          </Alert>
        ) : (
          !isOwn && (
            <Alert tone="info">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 font-semibold underline"
                onClick={() => router.push(`/auth/login?next=/listings/${id}`)}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Sign in
              </button>{' '}
              to message the seller.
            </Alert>
          )
        )}

        {sellerListings.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-medium">More from this seller</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {sellerListings.map((l) => (
                <ListingCard key={l.id} listing={l} size="compact" />
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-medium">Similar items</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              {similar.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-medium">Recently viewed</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {recent.map((l) => (
                <ListingCard key={l.id} listing={l} size="compact" />
              ))}
            </div>
          </section>
        )}
      </div>

      {zoom && (
        <button
          type="button"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setZoom(false)}
          aria-label="Close zoom"
        >
          <X className="absolute right-4 top-4 h-6 w-6 text-white" aria-hidden />
          <div className="relative h-[80vh] w-full max-w-3xl">
            <SafeImage src={images[activeImg]} alt="" fill className="object-contain" sizes="100vw" />
          </div>
        </button>
      )}

      {offerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-dialog-title"
        >
          <form onSubmit={sendOffer} className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-6">
            <h2 id="offer-dialog-title" className="font-display text-2xl font-medium">
              Make an offer
            </h2>
            <p className="text-sm text-muted">Asking price is {listing.price.toLocaleString()} ETB. The seller sees this in chat.</p>
            <Input
              id="offer-amount"
              label="Amount (ETB)"
              type="number"
              required
              min={1}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" variant="secondary" loading={busy}>
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
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ListingDetail />
    </Suspense>
  );
}
