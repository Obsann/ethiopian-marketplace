'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
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
  const [message, setMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
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

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!token || !user || !listing) {
      router.push(`/auth/login?next=/listings/${id}`);
      return;
    }
    setBusy(true);
    try {
      // REST create via socket fallback: offer endpoint pattern — use notifications path
      // Messages go through socket; also persist via a simple fetch to chat if needed.
      const { io } = await import('socket.io-client');
      const { getApiUrl } = await import('@/lib/api');
      const socket = io(getApiUrl(), { transports: ['websocket'] });
      socket.emit('join_room', { listingId: listing.id, userId: user.id });
      socket.emit('send_message', {
        listingId: listing.id,
        senderId: user.id,
        receiverId: listing.seller_id,
        content: message,
      });
      setNote('Message sent.');
      setMessage('');
      setChatOpen(false);
      socket.disconnect();
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not send message');
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

  return (
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
          <h1 className="font-display text-3xl font-semibold">{listing.title}</h1>
          <p className="text-2xl font-bold text-brand-700">
            {listing.price.toLocaleString()} ETB
          </p>
          <p className="text-sm text-ink/70">
            {listing.location}
            {listing.seller ? ` · Seller: ${listing.seller.name}` : ''}
            {listing.seller?.is_verified ? ' ✓ Verified' : ''}
          </p>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
          {listing.description}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button onClick={buyNow} loading={busy}>
            Buy Now
          </Button>
          <Button variant="secondary" onClick={() => setOfferOpen(true)}>
            Make Offer
          </Button>
          <Button variant="ghost" onClick={() => setChatOpen(true)}>
            Message Seller
          </Button>
        </div>

        {note && <p className="text-sm text-brand-700">{note}</p>}

        <button
          type="button"
          onClick={reportListing}
          className="text-xs text-ink/50 underline hover:text-ink"
        >
          Report listing
        </button>
      </div>

      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={sendOffer}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-lg"
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

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={sendMessage}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-lg"
          >
            <h2 className="font-display text-xl font-semibold">Message seller</h2>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] w-full rounded-md border border-black/10 p-3 text-sm outline-none ring-brand-500 focus:ring-2"
              placeholder="Ask about condition, meetup, etc."
            />
            <div className="flex gap-2">
              <Button type="submit" loading={busy}>
                Send
              </Button>
              <Button type="button" variant="ghost" onClick={() => setChatOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
