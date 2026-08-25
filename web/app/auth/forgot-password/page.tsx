'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
        <h1 className="font-display text-3xl font-semibold">Forgot password</h1>
        <p className="mt-1 text-sm text-ink/70">
          Enter your email and we will send a reset link if an account exists.
        </p>
      </div>
      {done ? (
        <div className="space-y-3 rounded-xl border border-black/8 bg-white/90 p-5 text-sm">
          <p>If that email is registered, we sent a password reset link. Check your inbox.</p>
          {resetUrl && (
            <p>
              Demo / local (email was not sent):{' '}
              <Link href={resetUrl} className="break-all font-medium text-brand-600 hover:underline">
                Open reset link
              </Link>
            </p>
          )}
          <Link href="/auth/login" className="inline-block font-medium text-brand-600 hover:underline">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-black/8 bg-white/90 p-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </div>
  );
}
