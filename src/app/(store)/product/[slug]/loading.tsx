/** Product page skeleton: gallery left, details right (stacked on phones). */
export default function ProductLoading() {
  return (
    <div className="container-x pt-5 pb-16 lg:pt-8" aria-busy="true" aria-label="Loading piece">
      <div className="skeleton h-3.5 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="skeleton aspect-square lg:col-span-7" />
        <div className="lg:col-span-5">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton mt-4 h-10 w-[85%]" />
          <div className="skeleton mt-4 h-6 w-28" />
          <div className="skeleton mt-6 h-4 w-full" />
          <div className="skeleton mt-2 h-4 w-[80%]" />
          <div className="skeleton mt-8 h-12 w-full" style={{ borderRadius: 999 }} />
          <div className="skeleton mt-3 h-12 w-full" style={{ borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}
