const tones: Record<string, string> = {
  green: 'bg-accent-100 text-accent-700',
  blue: 'bg-stone-200 text-ink',
  amber: 'bg-amber-100 text-amber-900',
  gray: 'bg-stone-100 text-stone-700',
  red: 'bg-danger-50 text-danger-700',
};

export function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center truncate px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
