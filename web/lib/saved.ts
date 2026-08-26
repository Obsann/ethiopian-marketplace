import { api } from '@/lib/api';

const KEY = 'suqet_saved_v1';

export function getSavedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function isSaved(id: string): boolean {
  return getSavedIds().includes(id);
}

export function toggleSaved(id: string): boolean {
  const next = new Set(getSavedIds());
  if (next.has(id)) next.delete(id);
  else next.add(id);
  localStorage.setItem(KEY, JSON.stringify(Array.from(next)));
  window.dispatchEvent(new Event('suqet-saved'));
  return next.has(id);
}

/** Push guest hearts to the account once the user is signed in. Demo ids stay local. */
export async function syncSavedToApi(token?: string | null): Promise<void> {
  const ids = getSavedIds().filter((id) => !id.startsWith('demo-'));
  if (ids.length === 0) return;
  await Promise.all(
    ids.map((id) =>
      api(`/api/listings/${id}/save`, { method: 'POST', token }).catch(() => undefined)
    )
  );
}
