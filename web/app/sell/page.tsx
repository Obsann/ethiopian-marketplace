'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ImagePlus, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

const STEP_LABELS = ['Details', 'Photos', 'Preview'];

export default function SellPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    condition: 'good',
    price: '',
    location: '',
  });

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/sell');
    if (!isLoading && user && user.role !== 'seller' && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    api<Category[]>('/api/listings/categories')
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function publish(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      files.forEach((f) => body.append('images', f));
      const res = await api<{ id: string }>('/api/listings', {
        method: 'POST',
        token,
        body,
      });
      router.push(`/listings/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="page-shell flex justify-center pt-24 sm:pt-28 pb-16" aria-busy="true" aria-label="Loading">
        <Spinner />
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === form.category_id)?.name;

  return (
    <div className="page-shell mx-auto max-w-xl space-y-8 pt-24 sm:pt-28 pb-16">
      <div>
        <p className="eyebrow">List</p>
        <h1 className="mt-3 font-display text-display font-medium text-ink">Sell an item</h1>
        <p className="mt-3 text-sm text-muted">
          Step {step} of 3 — {STEP_LABELS[step - 1]}
        </p>
        <div className="mt-5 flex gap-2" role="list" aria-label="Progress">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              role="listitem"
              aria-current={s === step ? 'step' : undefined}
              className={`h-1 flex-1 transition ${s <= step ? 'bg-ink' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4 border border-border bg-surface p-5">
          <Input
            id="sell-title"
            label="Title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />
          <Textarea
            id="sell-description"
            label="Description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            required
            minLength={10}
            className="min-h-[100px]"
          />
          <div className="space-y-1.5">
            <label
              htmlFor="sell-category"
              className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Category
            </label>
            <select
              id="sell-category"
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
              htmlFor="sell-condition"
              className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Condition
            </label>
            <select
              id="sell-condition"
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
            id="sell-price"
            label="Price (ETB)"
            type="number"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            required
          />
          <Input
            id="sell-location"
            label="Location"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Addis Ababa"
            required
          />
          <Button
            type="button"
            onClick={() => setStep(2)}
            disabled={
              form.title.trim().length < 3 ||
              form.description.trim().length < 10 ||
              !form.category_id ||
              !form.price ||
              form.location.trim().length < 2
            }
          >
            Next: photos
            <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2} />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 border border-border bg-surface p-5">
          <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-paper px-4 text-center transition hover:border-ink hover:bg-surface">
            <span className="flex h-10 w-10 items-center justify-center bg-ink text-white">
              <ImagePlus className="h-5 w-5" aria-hidden strokeWidth={1.75} />
            </span>
            <span className="text-sm font-medium text-ink">Drag & drop or click to upload</span>
            <span className="text-xs text-muted">Up to 5 images (JPG/PNG)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label="Upload listing photos"
              onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
            />
          </label>
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center gap-2 border border-border bg-paper px-3 py-2 text-sm text-ink"
                >
                  <Upload className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden strokeWidth={2} />
                  <span className="truncate">{f.name}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={files.length === 0}>
              Next: preview
              <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={publish} className="space-y-4 border border-border bg-surface p-5">
          <h2 className="font-display text-2xl font-medium text-ink">Preview</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
              <dt className="text-muted">Title</dt>
              <dd className="font-medium text-ink">{form.title}</dd>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
              <dt className="text-muted">Price</dt>
              <dd className="font-medium text-accent-600">
                {Number(form.price).toLocaleString()} ETB
              </dd>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
              <dt className="text-muted">Category</dt>
              <dd className="text-ink">{categoryName || '—'}</dd>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
              <dt className="text-muted">Condition</dt>
              <dd>
                <Badge tone="amber">{form.condition.replace('_', ' ')}</Badge>
              </dd>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
              <dt className="text-muted">Location</dt>
              <dd className="text-ink">{form.location}</dd>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <dt className="text-muted">Photos</dt>
              <dd className="text-ink">{files.length} selected</dd>
            </div>
          </dl>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
              Back
            </Button>
            <Button type="submit" variant="secondary" loading={busy}>
              Publish listing
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
