'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api<{ resetUrl?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResetUrl(res.data.resetUrl || '');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">Forgot password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we will send a reset link if an account exists.
        </p>
      </div>
      {done ? (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <Alert tone="success">
            If that email is registered, we sent a password reset link. Check your inbox.
          </Alert>
          {resetUrl && (
            <p className="text-sm text-muted">
              Demo / local (email was not sent):{' '}
              <Link
                href={resetUrl}
                className="break-all cursor-pointer text-brand-600 hover:underline"
              >
                Open reset link
              </Link>
            </p>
          )}
          <Link
            href="/auth/login"
            className="inline-block cursor-pointer text-sm text-brand-600 hover:underline"
          >
            Back to log in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-border bg-surface p-5"
        >
          <Input
            id="forgot-password-email"
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-muted">
        Remembered it?{' '}
        <Link href="/auth/login" className="cursor-pointer text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
