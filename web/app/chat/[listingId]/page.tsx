'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Listing } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ListingChat } from '@/components/ListingChat';
import { MessageSquare } from 'lucide-react';

function ChatView() {
  const { listingId } = useParams<{ listingId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const withUserId = params.get('with') || '';

  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      const next = `/chat/${listingId}?with=${encodeURIComponent(withUserId)}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [user, isLoading, router, listingId, withUserId]);

  useEffect(() => {
    if (!token || !withUserId || !listingId) {
      if (!isLoading && user && !withUserId) {
        setError('Missing chat partner.');
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    api<Listing>(`/api/listings/${listingId}?count_view=0`)
      .then((listingRes) => {
        if (!cancelled) setListing(listingRes.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load chat');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, listingId, withUserId, isLoading, user]);

  if (isLoading || loading) {
    return (
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell pt-24 sm:pt-28 pb-16">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (user && withUserId === user.id) {
    return (
      <div className="page-shell pt-24 sm:pt-28 pb-16">
        <Alert tone="info">
          You cannot chat with yourself.{' '}
          <Link href="/chat" className="font-semibold underline underline-offset-2">
            Open your inbox
          </Link>{' '}
          to reply to buyers.
        </Alert>
      </div>
    );
  }

  if (!user || !withUserId) {
    return (
      <div className="page-shell pt-24 sm:pt-28 pb-16">
        <EmptyState
          icon={MessageSquare}
          title="Open a conversation"
          description="Pick a thread from Inbox to keep chatting."
          actionHref="/inbox"
          actionLabel="Open inbox"
        />
      </div>
    );
  }

  const peerName =
    listing?.seller_id === withUserId ? listing.seller?.name : undefined;

  return (
    <div className="page-shell pt-24 sm:pt-28 pb-16">
      <div className="flex h-[calc(100svh-9rem)] min-h-[20rem] flex-col overflow-hidden border border-border bg-surface">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h1 className="font-display text-2xl font-medium text-ink">
            {listing ? listing.title : 'Chat'}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.14em]">
            {listing && (
              <Link
                href={`/listings/${listing.id}`}
                className="text-accent-600 transition hover:text-accent-700"
              >
                View listing
              </Link>
            )}
            <Link href="/chat" className="text-muted transition hover:text-ink">
              All messages
            </Link>
          </div>
        </div>
        <ListingChat
          listingId={listingId}
          sellerId={listing?.seller_id || withUserId}
          peerId={withUserId}
          peerName={peerName}
          variant="full"
          initialOnline={listing?.seller_id === withUserId ? listing.seller?.is_online : undefined}
          initialLastSeen={
            listing?.seller_id === withUserId ? listing.seller?.last_seen_at : undefined
          }
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
          <Spinner />
        </div>
      }
    >
      <ChatView />
    </Suspense>
  );
}
