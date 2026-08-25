'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ConversationPreview } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

export default function InboxPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ConversationPreview[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/inbox');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    api<ConversationPreview[]>('/api/conversations', token ? { token } : {})
      .then((r) => setItems(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [user, token]);

  if (isLoading || !user) {
    return (
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-8 pt-24 sm:pt-28 pb-16">
      <div>
        <p className="eyebrow">Messages</p>
        <h1 className="mt-3 font-display text-display font-medium text-ink">Inbox</h1>
        <p className="mt-3 text-sm text-muted">Conversations about listings.</p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No conversations yet"
          description="Open a listing and message the seller to start a thread."
          actionHref="/listings"
          actionLabel="Browse listings"
        />
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={`${c.listing_id}-${c.other_user.id}`}>
              <Link
                href={`/inbox/${c.listing_id}/${c.other_user.id}`}
                className="block border border-border bg-surface p-5 transition hover:bg-paper"
              >
                <p className="font-medium text-ink">
                  {c.other_user.name} · {c.listing_title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{c.last_message.content}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
