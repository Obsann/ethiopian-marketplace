'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!email.includes('@')) nextErrors.email = 'Enter a valid email';
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    setFormError('');
    try {
      await login(email, password);
      router.push(params.get('next') || '/');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">Log in</h1>
        <p className="mt-1 text-sm text-muted">Welcome back to SuqET.</p>
      </div>
      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <GoogleSignInButton next={params.get('next') || undefined} />
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
          />
          <div>
            <Input
              id="login-password"
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              autoComplete="current-password"
            />
            <p className="mt-1.5 text-right text-sm">
              <Link
                href="/auth/forgot-password"
                className="cursor-pointer text-brand-600 hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>
          {formError && <Alert tone="error">{formError}</Alert>}
          {formError.includes('Confirm your email') && (
            <button
              type="button"
              className="cursor-pointer text-sm font-medium text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              onClick={async () => {
                try {
                  await api('/api/auth/resend-verification', {
                    method: 'POST',
                    body: JSON.stringify({ email }),
                  });
                  setFormError('If that account needs confirmation, we sent a new link.');
                } catch {
                  setFormError('Could not resend confirmation email');
                }
              }}
            >
              Resend confirmation email
            </button>
          )}
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Log in
          </Button>
        </form>
      </div>
      <p className="text-center text-sm text-muted">
        New here?{' '}
        <Link href="/auth/register" className="cursor-pointer text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
