export default function ShopLoading() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="border-b border-ink/10 bg-tint/50">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="h-3 w-32 animate-pulse rounded bg-ink/10" />
          <div className="mt-4 h-12 w-72 max-w-full animate-pulse rounded-lg bg-ink/10" />
          <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-ink/5" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex gap-2 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-ink/5" />
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] animate-pulse rounded-2xl bg-tint" />
              <div className="mt-3 h-3 w-20 animate-pulse rounded bg-ink/10" />
              <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-ink/10" />
              <div className="mt-2 h-4 w-16 animate-pulse rounded bg-ink/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
