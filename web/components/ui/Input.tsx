import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <label className="block w-full space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-ink/80">{label}</span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none ring-brand-500 focus:ring-2 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
