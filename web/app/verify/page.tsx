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
  const [msg, setMsg] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login?next=/verify');
  }, [user, isLoading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !idImage || !faceImage) return;
    setBusy(true);
    setFailed(false);
    try {
      const body = new FormData();
      body.append('id_image', idImage);
      body.append('face_image', faceImage);
      await api('/api/verifications/submit', { method: 'POST', token, body });
      setMsg('Submitted. An admin will review your documents soon.');
    } catch (err) {
      setFailed(true);
      setMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
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
        {msg && (
          <p className={`text-sm ${failed ? 'text-red-600' : 'text-brand-700'}`}>{msg}</p>
        )}
        <Button type="submit" loading={busy} disabled={!idImage || !faceImage} className="w-full">
          Submit for review
        </Button>
      </form>
    </div>
  );
}
