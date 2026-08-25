import { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-black/8 bg-white/95 p-4 shadow-card ${className}`}>
      {children}
    </div>
  );
}
