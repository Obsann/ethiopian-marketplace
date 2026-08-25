'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function VerifyPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [idImage, setIdImage] = useState<File | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canSubmit = user?.role === 'seller' || user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login?next=/verify');
      return;
    }
    if (!canSubmit) router.replace('/');
  }, [user, isLoading, router, canSubmit]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !idImage || !faceImage) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const body = new FormData();
      body.append('id_image', idImage);
      body.append('face_image', faceImage);
      await api('/api/verifications/submit', { method: 'POST', token, body });
      setSuccess('Submitted. An admin will review your documents soon.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !canSubmit) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Get verified</h1>
        <p className="mt-1 text-sm text-ink/70">Upload a clear ID photo and a selfie.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-black/8 bg-white/90 p-5">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">ID image</span>
          <input type="file" accept="image/*" required onChange={(e) => setIdImage(e.target.files?.[0] || null)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Face image</span>
          <input type="file" accept="image/*" required onChange={(e) => setFaceImage(e.target.files?.[0] || null)} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-brand-700">{success}</p>}
        <Button type="submit" loading={busy} className="w-full">
          Submit for review
        </Button>
      </form>
    </div>
  );
}
