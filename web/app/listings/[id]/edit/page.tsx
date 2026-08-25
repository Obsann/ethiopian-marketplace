'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Category, Listing } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    condition: 'good',
    price: '',
    location: '',
    status: 'active',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/auth/login?next=/listings/${id}/edit`);
    }
  }, [user, isLoading, router, id]);

  useEffect(() => {
    api<Category[]>('/api/listings/categories')
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    api<Listing>(`/api/listings/${id}?count_view=0`)
      .then((r) => {
        const l = r.data;
        if (user && l.seller_id !== user.id && user.role !== 'admin') {
          router.replace(`/listings/${id}`);
          return;
        }
        setForm({
          title: l.title,
          description: l.description,
          category_id: l.category_id,
          condition: l.condition,
          price: String(l.price),
          location: l.location,
          status: l.status,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load listing'))
      .finally(() => setLoading(false));
  }, [id, token, user, router]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/listings/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category_id: form.category_id,
          condition: form.condition,
          price: Number(form.price),
          location: form.location,
          status: form.status,
        }),
      });
      router.push(`/listings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update listing');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !user || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Edit listing</h1>
        <p className="mt-1 text-sm text-ink/70">Changes are saved to the live database.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-black/8 bg-white p-5 shadow-card">
        <Input label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} required />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="field min-h-[100px]"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            required
            minLength={10}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Category</span>
          <select
            className="field"
            value={form.category_id}
            onChange={(e) => update('category_id', e.target.value)}
            required
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Condition</span>
          <select className="field" value={form.condition} onChange={(e) => update('condition', e.target.value)}>
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </label>
        <Input
          label="Price (ETB)"
          type="number"
          value={form.price}
          onChange={(e) => update('price', e.target.value)}
          required
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
          required
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Status</span>
          <select className="field" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="removed">Removed</option>
          </select>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push(`/listings/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
