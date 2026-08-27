'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/chat');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    api<ConversationPreview[]>('/api/conversations', { token })
      .then((r) => setItems(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load messages'))
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading || loading) {
    return (
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-xl space-y-8 pt-24 sm:pt-28 pb-16">
      <div>
        <p className="eyebrow">Messages</p>
        <h1 className="mt-3 font-display text-display font-medium text-ink">Messages</h1>
        <p className="mt-3 text-sm text-muted">Reply to buyers and sellers in one place.</p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {items.length === 0 && !error ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Open a listing and tap Message Seller to start one."
          actionHref="/listings"
          actionLabel="Browse listings"
        />
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={`${c.listing_id}:${c.other_user.id}`}>
              <Link
                href={`/chat/${c.listing_id}?with=${c.other_user.id}`}
                className="block border border-border bg-surface px-5 py-4 transition hover:bg-paper"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">
                    {c.other_user.name}
                    {c.unread_count ? (
                      <span className="ml-2 bg-accent-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {c.unread_count > 9 ? '9+' : c.unread_count}
                      </span>
                    ) : null}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(c.last_at || c.last_message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">{c.listing_title}</p>
                <p className="mt-1 truncate text-sm text-muted">{c.last_message.content}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
