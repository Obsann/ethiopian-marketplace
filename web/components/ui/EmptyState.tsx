import Link from 'next/link';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon = PackageOpen,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-16 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
        aria-hidden
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-1">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
