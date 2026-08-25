'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('This reset link is missing a token. Request a new one.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      router.push('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-ink">Set a new password</h1>
        <p className="mt-2 text-sm text-muted">Choose a password for your SuqET account.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 border border-border bg-surface p-6 sm:p-8">
        <Input
          id="reset-password"
          label="New password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Input
          id="reset-confirm"
          label="Confirm password"
          type="password"
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
        {error && <Alert tone="error">{error}</Alert>}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
          disabled={!token}
        >
          Update password
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        <Link
          href="/auth/forgot-password"
          className="cursor-pointer font-medium text-accent-600 transition hover:text-accent-700"
        >
          Request a new link
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="page-shell pt-24 sm:pt-28 pb-16">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <ResetForm />
      </Suspense>
    </div>
  );
}
