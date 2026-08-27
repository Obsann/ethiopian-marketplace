'use client';

export function UnreadBadge({ count, inverted = false }: { count: number; inverted?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -right-1 -top-1 min-w-[1.05rem] px-1 text-center text-[10px] font-semibold leading-4 text-white ${
        inverted ? 'bg-accent-500' : 'bg-accent-600'
      }`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
