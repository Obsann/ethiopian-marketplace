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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/inbox"
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-600 transition duration-180 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
        Back to inbox
      </Link>
      <ListingChat listingId={listingId} sellerId={peerId} peerId={peerId} />
    </div>
  );
}
