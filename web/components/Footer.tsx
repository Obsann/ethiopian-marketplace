import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/8 bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-bold text-brand-700">
            Suq<span className="text-accent-500">ET</span>
          </p>
          <p className="mt-1 text-xs text-ink/60">Trusted second-hand marketplace across Ethiopia.</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink/70">
          <Link href="/listings" className="hover:text-brand-700">
            Browse
          </Link>
          <Link href="/sell" className="hover:text-brand-700">
            Sell
          </Link>
          <Link href="/auth/register" className="hover:text-brand-700">
            Join
          </Link>
        </nav>
      </div>
    </footer>
  );
}
