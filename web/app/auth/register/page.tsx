'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'buyer' as 'buyer' | 'seller',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

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
      await register(form);
      router.push('/');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-md gap-6 lg:max-w-4xl lg:grid-cols-2 lg:items-center">
      <div className="hidden rounded-3xl bg-brand-900 p-8 text-white lg:block">
        <p className="font-display text-3xl font-bold">
          Suq<span className="text-accent-400">ET</span>
        </p>
        <p className="mt-4 text-white/80">
          Create an account to buy with escrow or list items as a verified seller.
        </p>
      </div>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-ink/70">Join Ethiopia&apos;s second-hand marketplace.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-black/8 bg-white p-5 shadow-card">
          <Input label="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} required autoComplete="name" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} required autoComplete="email" />
          <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} placeholder="+2519…" required autoComplete="tel" />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-[2.15rem] text-xs font-medium text-brand-700"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink/80">I want to</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['buyer', 'Buy items', 'Shop with escrow'],
                  ['seller', 'Sell items', 'List and get paid'],
                ] as const
              ).map(([value, title, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('role', value)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    form.role === value
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                      : 'border-black/10 bg-white hover:border-brand-500/40'
                  }`}
                >
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-xs text-ink/55">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          {formError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Sign up
          </Button>
        </form>
        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
