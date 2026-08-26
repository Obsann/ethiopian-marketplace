'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getSavedIds, syncSavedToApi } from '@/lib/saved';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Listing } from '@/types';

export default function SavedPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getSavedIds().filter((id) => !id.startsWith('demo-'));
    if (user) {
      void (async () => {
        await syncSavedToApi(token);
        try {
          const r = await api<Listing[]>('/api/saved', { token });
          setItems(r.data);
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    Promise.all(
      ids.map((id) =>
        api<Listing>(`/api/listings/${id}?count_view=0`)
          .then((r) => r.data)
          .catch(() => null)
      )
    )
      .then((rows) => setItems(rows.filter((x): x is Listing => Boolean(x))))
      .finally(() => setLoading(false));
  }, [user, token]);

  return (
    <div className="page-shell space-y-8 pt-24 sm:pt-28 pb-16">
      <div>
        <p className="eyebrow">Saved</p>
        <h1 className="mt-3 font-display text-display font-medium">Your list</h1>
        <p className="mt-2 text-sm text-muted">Items you hearted while browsing.</p>
      </div>
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}
      {!loading && items.length === 0 && (
        <EmptyState title="Nothing saved yet" description="Tap the heart on a listing to save it." />
      )}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
