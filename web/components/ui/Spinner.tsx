export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
