'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="page-shell pt-24 sm:pt-28 pb-16">
      <div className="mx-auto max-w-md space-y-8">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-ink">Forgot password</h1>
          <p className="mt-2 text-sm text-muted">
            Enter the email on your account. We will tell you how to get back in.
          </p>
        </div>
        {sent ? (
          <div className="space-y-5 border border-border bg-surface p-6 sm:p-8">
            <Alert tone="info">
              If an account exists for <span className="font-medium text-ink">{email}</span>, check
              that inbox. Password reset email is not wired yet — contact support if you cannot
              sign in.
            </Alert>
            <Link
              href="/auth/login"
              className="inline-block cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-ink"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-4 border border-border bg-surface p-6 sm:p-8"
          >
            <Input
              id="forgot-email"
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Button type="submit" variant="primary" className="w-full">
              Send reset link
            </Button>
          </form>
        )}
        <p className="text-center text-sm text-muted">
          Remembered it?{' '}
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
