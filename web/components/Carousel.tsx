'use client';

import { ReactNode, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Carousel({
  children,
  label,
  className = '',
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  function scrollByDir(dir: -1 | 1) {
    const el = track.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 420);
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  }

  return (
    <div className={`relative ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="sr-only">{label}</p>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            aria-label={`Previous ${label}`}
            onClick={() => scrollByDir(-1)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border bg-surface text-ink transition hover:bg-ink hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            onClick={() => scrollByDir(1)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border bg-surface text-ink transition hover:bg-ink hover:text-white"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="carousel-track"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') scrollByDir(-1);
          if (e.key === 'ArrowRight') scrollByDir(1);
        }}
      >
        {children}
      </div>
    </div>
  );
}
