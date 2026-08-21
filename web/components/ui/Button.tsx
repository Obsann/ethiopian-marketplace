import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary:
    'bg-accent-400 text-ink hover:bg-accent-500 focus-visible:ring-accent-400',
  ghost: 'bg-transparent text-ink hover:bg-black/5 focus-visible:ring-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
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
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
