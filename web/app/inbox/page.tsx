'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ConversationPreview } from '@/types';
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
        <h1 className="font-display text-3xl font-semibold">Inbox</h1>
        <p className="mt-1 text-sm text-ink/70">Conversations about listings.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={`${c.listing_id}-${c.other_user.id}`}>
            <Link
              href={`/inbox/${c.listing_id}/${c.other_user.id}`}
              className="block rounded-lg border border-black/8 bg-white/90 p-4 hover:border-brand-500/40"
            >
              <p className="font-medium">
                {c.other_user.name} · {c.listing_title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-ink/70">{c.last_message.content}</p>
            </Link>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-ink/60">No conversations yet.</p>}
      </ul>
    </div>
  );
}
