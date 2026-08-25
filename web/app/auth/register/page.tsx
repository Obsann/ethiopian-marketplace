'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'buyer' as 'buyer' | 'seller',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Name is required';
    if (!form.email.includes('@')) next.email = 'Enter a valid email';
    if (form.phone.trim().length < 9) next.phone = 'Enter a valid phone';
    if (form.password.length < 6) next.password = 'At least 6 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError('');
    try {
      const data = await register(form);
      setVerifyUrl(data.verifyUrl || '');
      setDoneMessage(data.message || '');
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-black/8 bg-white/90 p-5 text-sm">
        <h1 className="font-display text-2xl font-semibold">Check your email</h1>
        <p>
          {doneMessage ||
            `We sent a confirmation link to ${form.email}. Confirm it before you log in.`}
        </p>
        {verifyUrl && (
          <p>
            Local dev (SMTP not sending):{' '}
            <Link href={verifyUrl} className="break-all font-medium text-brand-600 hover:underline">
              Open confirmation link
            </Link>
          </p>
        )}
        <Link href="/auth/login" className="inline-block font-medium text-brand-600 hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-ink/70">Join Ethiopia&apos;s second-hand marketplace.</p>
      </div>
      <div className="space-y-4 rounded-xl border border-black/8 bg-white/90 p-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink/80">I want to</span>
          <select
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
          >
            <option value="buyer">Buy items</option>
            <option value="seller">Sell items</option>
          </select>
        </label>
        <GoogleSignInButton role={form.role} />
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} required />
          <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} placeholder="+2519…" required />
          <Input label="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} required />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Sign up
          </Button>
        </form>
      </div>
      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
