export function ListingCardSkeleton() {
  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden" aria-hidden>
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl">
        <div className="aspect-[4/5] w-full max-w-full animate-pulse bg-stone-200" />
      </div>
      <div className="space-y-2 pt-3">
        <div className="h-4 w-3/4 animate-pulse bg-stone-200" />
        <div className="h-4 w-1/3 animate-pulse bg-stone-200" />
        <div className="h-3 w-1/2 animate-pulse bg-stone-100" />
      </div>
    </div>
  );
}
