import Link from 'next/link';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-4xl opacity-40" aria-hidden>
        ◇
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-ink/70">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
