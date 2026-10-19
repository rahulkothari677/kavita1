export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10" aria-busy="true" aria-label="Loading product">
      <div className="mb-5 h-3 w-40 animate-pulse rounded bg-ink/10" />
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-tint" />
        <div className="space-y-4 md:pt-4">
          <div className="h-12 w-4/5 animate-pulse rounded-lg bg-ink/10" />
          <div className="h-8 w-32 animate-pulse rounded bg-ink/10" />
          <div className="h-4 w-full animate-pulse rounded bg-ink/5" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-ink/5" />
          <div className="mt-8 h-12 w-full animate-pulse rounded-full bg-ink/10" />
          <div className="h-12 w-full animate-pulse rounded-full bg-ink/5" />
        </div>
      </div>
    </div>
  );
}
