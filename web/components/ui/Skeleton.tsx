export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
