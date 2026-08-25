'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Forgot password</h1>
        <p className="mt-1 text-sm text-ink/70">
          Enter the email on your account. We will tell you how to get back in.
        </p>
      </div>
      {sent ? (
        <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-5 shadow-card">
          <p className="text-sm text-ink/80">
            If an account exists for <span className="font-medium">{email}</span>, check that inbox.
            Password reset email is not wired yet — contact support if you cannot sign in.
          </p>
          <Link href="/auth/login" className="text-sm font-medium text-brand-600 hover:underline">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-black/8 bg-white p-5 shadow-card">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
      <p className="text-center text-sm">
        Remembered it?{' '}
        <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
