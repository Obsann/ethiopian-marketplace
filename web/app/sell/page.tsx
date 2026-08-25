'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Sell an item</h1>
        <p className="mt-1 text-sm text-ink/70">Step {step} of 3</p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-brand-600' : 'bg-black/10'}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-5 shadow-card">
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
            <select
              className="field"
              value={form.condition}
              onChange={(e) => update('condition', e.target.value)}
            >
              <option value="new">New</option>
              <option value="like_new">Like new</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </label>
          <Input label="Price (ETB)" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} required />
          <Input label="Location" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Addis Ababa" required />
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
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-5 shadow-card">
          <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-brand-500/30 bg-brand-50/50 px-4 text-center text-sm transition hover:bg-brand-50">
            <span className="font-medium">Drag & drop or click to upload</span>
            <span className="mt-1 text-ink/60">Up to 5 images (JPG/PNG)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
            />
          </label>
          {files.length > 0 && (
            <ul className="space-y-1 text-sm">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={files.length === 0}>
              Next: preview
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={publish} className="space-y-4 rounded-2xl border border-black/8 bg-white p-5 shadow-card">
          <h2 className="font-display text-xl font-semibold">Preview</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-ink/50">Title</dt><dd className="font-medium">{form.title}</dd></div>
            <div><dt className="text-ink/50">Price</dt><dd className="font-medium">{Number(form.price).toLocaleString()} ETB</dd></div>
            <div><dt className="text-ink/50">Location</dt><dd>{form.location}</dd></div>
            <div><dt className="text-ink/50">Photos</dt><dd>{files.length} selected</dd></div>
          </dl>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="submit" loading={busy}>
              Publish listing
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
