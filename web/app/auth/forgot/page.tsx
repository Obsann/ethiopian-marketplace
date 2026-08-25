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
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">Forgot password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter the email on your account. We will tell you how to get back in.
        </p>
      </div>
      {sent ? (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <Alert tone="info">
            If an account exists for <span className="font-medium text-ink">{email}</span>, check
            that inbox. Password reset email is not wired yet — contact support if you cannot
            sign in.
          </Alert>
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
        <Link href="/auth/login" className="cursor-pointer text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
