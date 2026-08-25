'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

interface Conversation {
  listing_id: string;
  listing_title: string;
  other_user: { id: string; name: string };
  last_message: string;
  last_at: string;
  unread: boolean;
}

export default function InboxPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/chat');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    api<Conversation[]>('/api/conversations', { token })
      .then((r) => setItems(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load messages'))
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Messages</h1>
        <p className="mt-1 text-sm text-muted">Reply to buyers and sellers in one place.</p>
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
                className="block cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 transition duration-180 hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {c.other_user.name}
                    {c.unread && (
                      <span
                        className="ml-2 inline-block h-2 w-2 rounded-full bg-danger-600 align-middle"
                        aria-label="Unread"
                      />
                    )}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(c.last_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">{c.listing_title}</p>
                <p className="mt-1 truncate text-sm text-muted">{c.last_message}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
