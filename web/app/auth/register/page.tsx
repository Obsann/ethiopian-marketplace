'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
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
  const [emailSent, setEmailSent] = useState(false);
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
      setEmailSent(Boolean(data.emailSent));
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
      <div className="page-shell pt-24 sm:pt-28 pb-16">
        <div className="mx-auto max-w-md space-y-8">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="mt-3 font-display text-4xl font-medium text-ink">
              {emailSent ? 'Check your email' : "You're in"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {emailSent
                ? 'Confirm your address to finish signing up.'
                : 'You can log in now — no confirmation email was sent.'}
            </p>
          </div>
          <div className="space-y-5 border border-border bg-surface p-6 sm:p-8">
            <Alert tone="success">
              {doneMessage ||
                (emailSent
                  ? `We sent a confirmation link to ${form.email}. Confirm it before you log in.`
                  : "You're in — you can log in now.")}
            </Alert>
            <Link
              href="/auth/login"
              className="inline-block cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-ink"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell pt-24 sm:pt-28 pb-16">
      <div className="mx-auto max-w-md space-y-8">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-ink">Create account</h1>
          <p className="mt-2 text-sm text-muted">Join Ethiopia&apos;s second-hand marketplace.</p>
        </div>
        <div className="space-y-5 border border-border bg-surface p-6 sm:p-8">
          <div className="block w-full space-y-1.5">
            <label htmlFor="register-role" className="block text-sm font-medium text-ink">
              I want to
            </label>
            <select
              id="register-role"
              name="role"
              className="field cursor-pointer"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
            >
              <option value="buyer">Buy items</option>
              <option value="seller">Sell items</option>
            </select>
          </div>
          <GoogleSignInButton role={form.role} />
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              id="register-name"
              label="Full name"
              name="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={errors.name}
              required
              autoComplete="name"
            />
            <Input
              id="register-email"
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />
            <Input
              id="register-phone"
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              error={errors.phone}
              placeholder="+2519…"
              required
              autoComplete="tel"
            />
            <Input
              id="register-password"
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
              required
              autoComplete="new-password"
            />
            {formError && <Alert tone="error">{formError}</Alert>}
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Sign up
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="cursor-pointer font-medium text-accent-600 transition hover:text-accent-700"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
