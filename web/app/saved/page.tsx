'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getSavedIds, syncSavedToApi } from '@/lib/saved';
import { demoListingById, isDemoListingId } from '@/lib/demoCatalog';
import { ListingCard } from '@/components/ListingCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Listing } from '@/types';

async function fetchLiveListing(id: string): Promise<Listing | null> {
  try {
    const r = await api<Listing>(`/api/listings/${id}?count_view=0`);
    return r.data;
  } catch {
    return null;
  }
}

export default function SavedPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const ids = getSavedIds();
    const demoRows = ids
      .map((id) => demoListingById(id))
      .filter((row): row is Listing => Boolean(row));
    const liveIds = ids.filter((id) => !isDemoListingId(id));
    let liveRows: Listing[] = [];

    if (user) {
      await syncSavedToApi(token).catch(() => undefined);
      try {
        const r = await api<Listing[]>('/api/saved', { token });
        liveRows = Array.isArray(r.data) ? r.data : [];
      } catch {
        liveRows = (await Promise.all(liveIds.map(fetchLiveListing))).filter(
          (row): row is Listing => Boolean(row)
        );
      }
    } else {
      liveRows = (await Promise.all(liveIds.map(fetchLiveListing))).filter(
        (row): row is Listing => Boolean(row)
      );
    }

    const byId = new Map<string, Listing>();
    for (const row of liveRows) byId.set(row.id, row);
    for (const row of demoRows) byId.set(row.id, row);

    const ordered: Listing[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      const row = byId.get(id);
      if (row && !seen.has(row.id)) {
        ordered.push(row);
        seen.add(row.id);
      }
    }
    for (const row of liveRows) {
      if (!seen.has(row.id)) {
        ordered.push(row);
        seen.add(row.id);
      }
    }

    setItems(ordered);
    setLoading(false);
  }, [user, token]);

  useEffect(() => {
    setLoading(true);
    void load();
    const onSaved = () => {
      void load();
    };
    window.addEventListener('suqet-saved', onSaved);
    window.addEventListener('storage', onSaved);
    return () => {
      window.removeEventListener('suqet-saved', onSaved);
      window.removeEventListener('storage', onSaved);
    };
  }, [load]);

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
