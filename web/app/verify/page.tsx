'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IdCard, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

function FileField({
  id,
  label,
  hint,
  icon: Icon,
  file,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  icon: typeof IdCard;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-paper px-4 py-8 text-center transition duration-180 hover:border-brand-300 hover:bg-brand-50/40"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-brand-600">
          <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
        </span>
        <span className="text-sm font-medium text-ink">
          {file ? file.name : 'Click to choose a photo'}
        </span>
        <span className="text-xs text-muted">{hint}</span>
        <input
          id={id}
          type="file"
          accept="image/*"
          required
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}

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
      <div className="flex justify-center py-16" aria-busy="true" aria-label="Loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-3 text-center sm:text-left">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:mx-0"
          aria-hidden
        >
          <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="page-title">Get verified</h1>
          <p className="muted mt-1">Upload a clear ID photo and a selfie.</p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
      >
        <FileField
          id="verify-id-image"
          label="ID image"
          hint="Government ID or passport, well lit"
          icon={IdCard}
          file={idImage}
          onChange={setIdImage}
        />
        <FileField
          id="verify-face-image"
          label="Face image"
          hint="Clear selfie matching your ID"
          icon={UserRound}
          file={faceImage}
          onChange={setFaceImage}
        />

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <Button type="submit" variant="secondary" loading={busy} className="w-full">
          Submit for review
        </Button>
      </form>
    </div>
  );
}
