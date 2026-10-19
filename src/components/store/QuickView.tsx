"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { useStore } from "./StoreProvider";
import { discountPercent, formatINR, imgUrl } from "@/lib/format";

type QV = { id: string; slug: string; name: string; price: number; compareAtPrice: number | null; images: string[]; stock: number; madeToOrder: boolean; shortDescription: string; size: string | null; categoryName: string | null };

export function QuickView() {
  const { quickViewId, setQuickViewId, addToCart, setCartOpen } = useStore();
  const [p, setP] = useState<QV | null>(null);
  const [img, setImg] = useState(0);

  useEffect(() => {
    if (!quickViewId) return setP(null);
    setImg(0);
    fetch(`/api/products?ids=${quickViewId}`)
      .then((r) => r.json())
      .then((d) => setP(d.products?.[0] ?? null));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setQuickViewId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickViewId, setQuickViewId]);

  if (!quickViewId) return null;
  const close = () => setQuickViewId(null);
  const soldOut = p ? p.stock <= 0 && !p.madeToOrder : false;
  const off = p ? discountPercent(p.price, p.compareAtPrice) : 0;

  return (
    <div className="fixed inset-0 z-[88] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[3px]" onClick={close} />
      <div className="relative grid w-full max-w-4xl animate-fade-up overflow-hidden rounded-[1.75rem] bg-paper shadow-2xl md:grid-cols-2">
        <button onClick={close} className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-paper/90 shadow" aria-label="Close">
          <X className="size-5" />
        </button>
        {!p ? (
          <div className="col-span-2 grid h-[420px] place-items-center">
            <div className="size-10 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
          </div>
        ) : (
          <>
            <div className="relative bg-cream">
              <img src={imgUrl(p.images[img], 900)} alt={p.name} className="aspect-square w-full object-cover" />
              {p.images.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {p.images.map((_, n) => (
                    <button key={n} onClick={() => setImg(n)} className={`h-1.5 rounded-full transition-all ${n === img ? "w-6 bg-ink" : "w-1.5 bg-ink/30"}`} aria-label={`Image ${n + 1}`} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col p-8">
              {p.categoryName && <p className="text-[11px] tracking-[0.2em] text-muted uppercase">{p.categoryName}</p>}
              <h3 className="mt-1 font-display text-4xl leading-tight">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl">{formatINR(p.price)}</span>
                {off > 0 && <span className="text-muted line-through">{formatINR(p.compareAtPrice!)}</span>}
              </div>
              <p className="mt-4 leading-relaxed text-ink/75">{p.shortDescription}</p>
              {p.size && <p className="mt-3 text-sm text-muted">Size: {p.size}</p>}
              <div className="mt-auto space-y-2 pt-8">
                {!soldOut && (
                  <button
                    onClick={() => {
                      addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, price: p.price, maxQty: p.madeToOrder ? 20 : p.stock });
                      close();
                      setCartOpen(true);
                    }}
                    className="btn btn-primary w-full py-3.5"
                  >
                    <ShoppingBag className="size-4" /> Add to bag
                  </button>
                )}
                <Link href={`/product/${p.slug}`} onClick={close} className="btn btn-outline w-full">
                  Full details <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
