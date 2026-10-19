"use client";

import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { useStore } from "./StoreProvider";
import { discountPercent, formatINR, imgUrl } from "@/lib/format";
import type { Product } from "@/lib/types";

export type CardProduct = Pick<
  Product,
  "id" | "slug" | "name" | "price" | "compareAtPrice" | "images" | "badge" | "stock" | "madeToOrder" | "categoryName" | "rating" | "reviewCount" | "customizable"
>;

export function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const off = discountPercent(p.price, p.compareAtPrice);
  const soldOut = p.stock <= 0 && !p.madeToOrder;
  const wished = wishlist.includes(p.id);

  return (
    <div className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
        <Link href={`/product/${p.slug}`} className="absolute inset-0" aria-label={p.name}>
          <img
            src={imgUrl(p.images[0], 600)}
            alt={p.name}
            loading={priority ? "eager" : "lazy"}
            className={`size-full object-cover transition duration-700 group-hover:scale-[1.04] ${p.images[1] ? "group-hover:opacity-0" : ""}`}
          />
          {p.images[1] && (
            <img src={imgUrl(p.images[1], 600)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />
          )}
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {soldOut ? (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-cream">Sold out</span>
          ) : (
            p.badge && <span className="rounded-full bg-paper/95 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink shadow-sm">{p.badge}</span>
          )}
          {off > 0 && !soldOut && <span className="w-fit rounded-full bg-rose px-2.5 py-1 text-[11px] font-medium text-white">−{off}%</span>}
        </div>
        <button
          onClick={() => toggleWishlist(p.id)}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-paper/90 shadow-sm backdrop-blur transition hover:scale-110"
        >
          <Heart className={`size-4 ${wished ? "fill-rose text-rose" : ""}`} />
        </button>
        {!soldOut && (
          <button
            onClick={() =>
              addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, price: p.price, maxQty: p.madeToOrder ? 20 : p.stock })
            }
            aria-label="Add to bag"
            className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-ink text-cream shadow-lg transition hover:scale-105 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>
      <div className="mt-3 px-0.5">
        {p.categoryName && <p className="text-[11px] tracking-[0.18em] text-muted uppercase">{p.categoryName}</p>}
        <Link href={`/product/${p.slug}`} className="mt-0.5 block font-display text-[19px] leading-snug font-semibold hover:text-ink-2">
          {p.name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-medium">{formatINR(p.price)}</span>
          {off > 0 && <span className="text-sm text-muted line-through">{formatINR(p.compareAtPrice!)}</span>}
          {p.rating ? <span className="ml-auto text-xs text-muted">★ {p.rating.toFixed(1)}</span> : null}
        </div>
        {p.madeToOrder && <p className="mt-0.5 text-xs text-gold">Made to order</p>}
      </div>
    </div>
  );
}
