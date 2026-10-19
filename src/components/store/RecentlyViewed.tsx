"use client";

import { useEffect, useState } from "react";
import { useStore } from "./StoreProvider";
import { ProductCard, type CardProduct } from "./ProductCard";

/**
 * A horizontal row of small cards for pieces viewed earlier (ids kept in localStorage by the store).
 * `excludeIds` keeps pieces already on the page out (so card view-transition names stay unique).
 */
export function RecentlyViewed({ excludeId, excludeIds = [], title }: { excludeId?: string; excludeIds?: string[]; title?: React.ReactNode }) {
  const { recent } = useStore();
  const [items, setItems] = useState<CardProduct[]>([]);
  const skip = new Set([excludeId, ...excludeIds].filter(Boolean));
  const ids = recent.filter((id) => !skip.has(id)).slice(0, 8);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return setItems([]);
    const ctrl = new AbortController();
    fetch(`/api/products?ids=${key}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.products ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);

  if (!items.length) return null;
  return (
    <section aria-labelledby="recent-title" className="container-x pt-16 lg:pt-24">
      <div className="hairline-t pt-6">
        <h2 id="recent-title" className="t-h3">
          {title ?? (
            <>
              Recently <em>viewed</em>
            </>
          )}
        </h2>
      </div>
      <ul className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:mt-8 lg:gap-6 lg:px-0 lg:scroll-px-0">
        {items.map((p) => (
          <li key={p.id} className="w-[42vw] max-w-[260px] shrink-0 snap-start sm:w-[30vw] lg:w-[calc((100%_-_4*24px)/5)]">
            <ProductCard p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
