'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ListingChat } from '@/components/ListingChat';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';

export default function InboxThreadPage({
  params,
}: {
  params: { listingId: string; peerId: string };
}) {
  const { listingId, peerId } = params;
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/auth/login?next=/inbox/${listingId}/${peerId}`);
  }, [user, isLoading, router, listingId, peerId]);

  if (isLoading || !user) {
    return (
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6 pt-24 sm:pt-28 pb-16">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition hover:text-accent-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
        Back to inbox
      </Link>
      <ListingChat listingId={listingId} sellerId={peerId} peerId={peerId} />
    </div>
  );
}
