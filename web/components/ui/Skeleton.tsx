export function ListingCardSkeleton() {
  return (
    <div className="break-inside-avoid overflow-hidden" aria-hidden>
      <div className="aspect-[4/5] max-h-72 w-full animate-pulse rounded-xl bg-stone-200 md:max-h-80" />
      <div className="space-y-2 pt-3">
        <div className="h-4 w-3/4 animate-pulse bg-stone-200" />
        <div className="h-4 w-1/3 animate-pulse bg-stone-200" />
        <div className="h-3 w-1/2 animate-pulse bg-stone-100" />
      </div>
    </div>
  );
}
