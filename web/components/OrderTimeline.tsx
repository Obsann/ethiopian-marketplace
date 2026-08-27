'use client';

import type { TransactionStatus } from '@/types';

const STEPS = [
  { key: 'pending', label: 'Payment started' },
  { key: 'held', label: 'Held in escrow' },
  { key: 'done', label: 'Handoff confirmed' },
] as const;

function stepState(
  status: TransactionStatus,
  index: number
): 'done' | 'current' | 'upcoming' | 'failed' {
  if (status === 'failed') {
    if (index === 0) return 'done';
    if (index === 1) return 'failed';
    return 'upcoming';
  }
  if (status === 'pending') {
    if (index === 0) return 'current';
    return 'upcoming';
  }
  if (status === 'held') {
    if (index === 0) return 'done';
    if (index === 1) return 'current';
    return 'upcoming';
  }
  if (status === 'released') {
    return 'done';
  }
  if (status === 'refunded') {
    if (index < 2) return 'done';
    return 'failed';
  }
  return 'upcoming';
}

function labelFor(status: TransactionStatus, index: number): string {
  if (status === 'failed' && index === 1) return 'Payment failed';
  if (status === 'refunded' && index === 2) return 'Refunded';
  if (status === 'held' && index === 2) return 'Waiting for handoff';
  return STEPS[index].label;
}

export function OrderTimeline({
  status,
  createdAt,
}: {
  status: TransactionStatus;
  createdAt: string;
}) {
  return (
    <ol className="mt-4 space-y-2 border-t border-border pt-4" aria-label="Order status">
      {STEPS.map((step, index) => {
        const state = stepState(status, index);
        const label = labelFor(status, index);
        const showTime = index === 0;
        return (
          <li key={step.key} className="flex items-start gap-3">
            <span
              className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                state === 'done'
                  ? 'bg-et-green'
                  : state === 'current'
                    ? 'bg-accent-600'
                    : state === 'failed'
                      ? 'bg-danger-600'
                      : 'bg-stone-300'
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${
                  state === 'upcoming' ? 'text-muted' : 'font-medium text-ink'
                }`}
              >
                {label}
              </p>
              {showTime && (
                <p className="text-[11px] text-muted">{new Date(createdAt).toLocaleString()}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
