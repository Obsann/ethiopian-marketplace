'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Listing } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();
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
    if (!token) {
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
    if (!token) {
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
    if (!token) {
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
  const canAct = user?.id !== listing.seller_id;
  const chatHref = user
    ? `/chat/${listing.id}?with=${listing.seller?.id ?? listing.seller_id}`
    : `/auth/login?next=${encodeURIComponent(`/chat/${listing.id}?with=${listing.seller?.id ?? listing.seller_id}`)}`;

  return (
    <div className="grid gap-8 pb-24 lg:grid-cols-2 lg:pb-0">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-100 shadow-card">
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
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === activeImg ? 'border-brand-600' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <Badge tone="amber">{listing.condition.replace('_', ' ')}</Badge>
          <h1 className="font-display text-3xl font-semibold leading-tight">{listing.title}</h1>
          <p className="text-3xl font-bold tracking-tight text-brand-700">
            {listing.price.toLocaleString()} ETB
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
            <span>{listing.location}</span>
            {listing.seller && (
              <span className="rounded-full bg-stone-100 px-2.5 py-1">
                {listing.seller.name}
                {listing.seller.is_verified ? ' · Verified' : ''}
              </span>
            )}
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
          {listing.description}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canAct && (
            <Button onClick={buyNow} loading={busy} className="min-w-[8rem]">
              Buy Now
            </Button>
          )}
          {canAct && (
            <Link href={chatHref}>
              <Button variant="ghost" className="w-full sm:w-auto">
                Message Seller
              </Button>
            </Link>
          )}
          {canAct && (
            <Button variant="secondary" onClick={() => setOfferOpen(true)}>
              Make Offer
            </Button>
          )}
          {user && (user.id === listing.seller_id || user.role === 'admin') && (
            <Link href={`/listings/${listing.id}/edit`}>
              <Button variant="ghost" className="w-full sm:w-auto">
                Edit listing
              </Button>
            </Link>
          )}
        </div>

        {note && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">{note}</p>}

        <button
          type="button"
          onClick={reportListing}
          className="text-xs text-ink/50 underline hover:text-ink"
        >
          Report listing
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{listing.price.toLocaleString()} ETB</p>
            <p className="truncate text-xs text-ink/50">{listing.title}</p>
          </div>
          {canAct && (
            <Link href={chatHref}>
              <Button variant="ghost" className="px-3">
                Chat
              </Button>
            </Link>
          )}
          {canAct ? (
            <Button onClick={buyNow} loading={busy}>
              Buy Now
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setOfferOpen(true)}>
              Offer
            </Button>
          )}
        </div>
      </div>

      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={sendOffer}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-lift"
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
