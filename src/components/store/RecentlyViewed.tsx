"use client";

import { useEffect, useState } from "react";
import { useStore } from "./StoreProvider";
import { ProductCard, type CardProduct } from "./ProductCard";

export function RecentlyViewed({ excludeId, title = "Recently viewed" }: { excludeId?: string; title?: string }) {
  const { recent } = useStore();
  const [items, setItems] = useState<CardProduct[]>([]);
  const ids = recent.filter((id) => id !== excludeId).slice(0, 4);
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return setItems([]);
    fetch(`/api/products?ids=${key}`)
      .then((r) => r.json())
      .then((d) => setItems(d.products ?? []))
      .catch(() => {});
  }, [key]);
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
      <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
