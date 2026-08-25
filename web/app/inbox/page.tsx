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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Inbox</h1>
        <p className="mt-1 text-sm text-muted">Conversations about listings.</p>
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
                className="block cursor-pointer rounded-xl border border-border bg-surface p-4 transition duration-180 hover:border-brand-300"
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
