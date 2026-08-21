import { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-black/8 bg-white/90 p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
