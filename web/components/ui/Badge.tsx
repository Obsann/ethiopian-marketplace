const tones: Record<string, string> = {
  green: 'bg-brand-100 text-brand-700',
  amber: 'bg-amber-100 text-amber-800',
  gray: 'bg-stone-100 text-stone-700',
  red: 'bg-red-100 text-red-700',
};

export function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
