/**
 * Shown the instant a shop link is tapped, while the next page renders on the server.
 * Shared by every shop page that has no loading screen of its own.
 */
export default function StoreLoading() {
  return (
    <div className="container-x pt-6 pb-16 lg:pt-10" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-[13px] w-28" />
      <div className="skeleton mt-4 h-9 w-[min(100%,24rem)] lg:h-11" />
      <div className="skeleton mt-4 h-4 w-[min(100%,32rem)]" />
      <div className="skeleton mt-2 h-4 w-[min(70%,20rem)]" />
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 xl:grid-cols-4 xl:gap-x-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-square" />
            <div className="skeleton mt-3 h-4 w-[70%]" />
            <div className="skeleton mt-2 h-3.5 w-[30%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
