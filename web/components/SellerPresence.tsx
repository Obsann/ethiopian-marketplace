'use client';

import { formatLastSeen } from '@/lib/presence';

export function SellerPresence({
  isOnline,
  lastSeenAt,
  className = '',
}: {
  isOnline?: boolean;
  lastSeenAt?: string | null;
  className?: string;
}) {
  if (!isOnline && !lastSeenAt) return null;
  const label = isOnline ? 'Online now' : formatLastSeen(lastSeenAt);
  if (!label) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOnline ? 'bg-et-green' : 'bg-stone-300'}`}
        aria-hidden
      />
      <span className={isOnline ? 'font-medium text-et-green' : 'text-muted'}>{label}</span>
    </span>
  );
}
