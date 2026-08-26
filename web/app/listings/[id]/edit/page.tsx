'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Category, Listing } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

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
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: '',
    size: '',
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
          meetup_ok: l.meetup_ok !== false,
          delivery_ok: Boolean(l.delivery_ok),
          delivery_fee: l.delivery_fee != null ? String(l.delivery_fee) : '',
          size: l.size || '',
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load listing'))
      .finally(() => setLoading(false));
  }, [id, token, user, router]);

  function update(key: string, value: string | boolean) {
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
          meetup_ok: form.meetup_ok,
          delivery_ok: form.delivery_ok,
          delivery_fee: form.delivery_ok && form.delivery_fee ? Number(form.delivery_fee) : null,
          size: form.size.trim() || null,
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
      <div
        className="page-shell flex justify-center pt-24 sm:pt-28 pb-16"
        aria-busy="true"
        aria-label="Loading editor"
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-xl space-y-8 pt-24 sm:pt-28 pb-16">
      <div>
        <p className="eyebrow">Edit</p>
        <h1 className="mt-3 font-display text-display font-medium text-ink">Edit listing</h1>
        <p className="mt-3 text-sm text-muted">Changes are saved to the live database.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 border border-border bg-surface p-5">
        <Input
          id="edit-title"
          label="Title"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          required
        />
        <Textarea
          id="edit-description"
          label="Description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          required
          minLength={10}
          className="min-h-[100px]"
        />
        <div className="space-y-1.5">
          <label
            htmlFor="edit-category"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Category
          </label>
          <select
            id="edit-category"
            className="field cursor-pointer"
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
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="edit-condition"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Condition
          </label>
          <select
            id="edit-condition"
            className="field cursor-pointer"
            value={form.condition}
            onChange={(e) => update('condition', e.target.value)}
          >
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
        <Input
          id="edit-price"
          label="Price (ETB)"
          type="number"
          value={form.price}
          onChange={(e) => update('price', e.target.value)}
          required
        />
        <Input
          id="edit-location"
          label="Location"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
          required
        />
        <Input
          id="edit-size"
          label="Size (optional)"
          value={form.size}
          onChange={(e) => update('size', e.target.value)}
          placeholder="M, 42…"
        />
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.meetup_ok}
            onChange={(e) => update('meetup_ok', e.target.checked)}
          />
          Meetup in a public place is OK
        </label>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.delivery_ok}
            onChange={(e) => update('delivery_ok', e.target.checked)}
          />
          Delivery available
        </label>
        {form.delivery_ok && (
          <Input
            id="edit-delivery-fee"
            label="Delivery fee (ETB)"
            type="number"
            min={0}
            value={form.delivery_fee}
            onChange={(e) => update('delivery_fee', e.target.value)}
          />
        )}
        <div className="space-y-1.5">
          <label
            htmlFor="edit-status"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Status
          </label>
          <select
            id="edit-status"
            className="field cursor-pointer"
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="removed">Removed</option>
          </select>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button type="button" variant="ghost" onClick={() => router.push(`/listings/${id}`)}>
            <ArrowLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
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
