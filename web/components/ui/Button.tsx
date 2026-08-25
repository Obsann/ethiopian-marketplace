import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'inverse';

const styles: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90 focus-visible:ring-ink',
  secondary: 'bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-600',
  outline: 'border border-ink bg-transparent text-ink hover:bg-ink hover:text-white focus-visible:ring-ink',
  inverse: 'border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-ink',
  ghost: 'bg-transparent text-ink hover:bg-stone-100 focus-visible:ring-ink',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-600',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {loading ? 'Please wait…' : children}
    </button>
  );
}
