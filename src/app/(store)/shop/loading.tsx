/** Plinth skeletons in the exact shapes of the shop header, chips and product cards. */
export default function ShopLoading() {
  return (
    <div className="container-x" aria-busy="true" aria-label="Loading pieces">
      <div className="pt-6 pb-8 lg:pt-10 lg:pb-12">
        <div className="skeleton h-[13px] w-28" />
        <div className="skeleton mt-5 h-[clamp(2.25rem,1.5rem_+_3.2vw,4rem)] w-[min(100%,26rem)]" />
        <div className="skeleton mt-4 h-[17px] w-[min(100%,34rem)] lg:h-[18px]" />
        <div className="skeleton mt-2 h-[17px] w-[min(70%,22rem)] lg:h-[18px]" />
      </div>

      <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
        {[56, 96, 120, 88, 104, 92].map((w, i) => (
          <div key={i} className="skeleton h-10 shrink-0 md:h-9" style={{ width: w, borderRadius: 999 }} />
        ))}
      </div>
      <div className="-mx-4 mt-3 flex gap-2 overflow-hidden px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
        {[112, 128, 128, 120, 112].map((w, i) => (
          <div key={i} className="skeleton h-10 shrink-0 md:h-9" style={{ width: w, borderRadius: 999 }} />
        ))}
      </div>

      <div className="hairline-b mt-5 flex h-[53px] items-center justify-between pb-2">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-36" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 md:gap-y-10 lg:mt-10 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5]" />
            <div className="skeleton mt-3 h-[11px] w-[40%]" />
            <div className="skeleton mt-2 h-[17px] w-[70%] lg:h-[18px]" />
            <div className="skeleton mt-2 h-[15px] w-[30%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
