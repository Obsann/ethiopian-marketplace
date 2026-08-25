import { LucideIcon, type LucideProps } from 'lucide-react';

/** Prefer importing Lucide icons directly. Kept for any legacy Material Symbol name maps. */
export function Icon({
  icon: Lucide,
  className = '',
  ...props
}: { icon: LucideIcon; className?: string } & LucideProps) {
  return <Lucide className={className} aria-hidden strokeWidth={1.75} {...props} />;
}
