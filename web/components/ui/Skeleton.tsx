export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-card">
      <div className="aspect-[4/3] animate-pulse bg-stone-200" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-stone-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}
