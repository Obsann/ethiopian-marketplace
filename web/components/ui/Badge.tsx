const tones: Record<string, string> = {
  green: 'bg-accent-100 text-accent-700',
  blue: 'bg-brand-100 text-brand-800',
  amber: 'bg-amber-100 text-amber-900',
  gray: 'bg-slate-100 text-slate-700',
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
      className={`inline-flex max-w-full items-center truncate rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
