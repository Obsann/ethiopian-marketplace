import { AlertCircle, CheckCircle2, Info, LucideIcon } from 'lucide-react';

const styles = {
  error: 'border-danger-500/30 bg-danger-50 text-danger-700',
  success: 'border-accent-600/25 bg-accent-50 text-accent-700',
  info: 'border-border bg-stone-50 text-ink',
};

const icons: Record<keyof typeof styles, LucideIcon> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function Alert({
  children,
  tone = 'info',
  className = '',
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-2.5 border px-4 py-3 text-sm ${styles[tone]} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
