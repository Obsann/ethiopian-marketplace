'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

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
        <h1 className="font-display text-3xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-ink/70">Welcome back to SuqET.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-black/8 bg-white/90 p-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        <button type="button" className="text-xs text-ink/50 underline">
          Forgot password
        </button>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Log in
        </Button>
      </form>
      <p className="text-center text-sm">
        New here?{' '}
        <Link href="/auth/register" className="font-medium text-brand-600 hover:underline">
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
