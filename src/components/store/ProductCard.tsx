"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { Heart, Plus } from "lucide-react";
import { useStore } from "./StoreProvider";
import { flyToBag } from "./fly";
import { Price } from "@/components/brand";
import type { Product } from "@/lib/types";
import { CARD_SIZES, isMirrorWork, morphName, productImg } from "./catalogue/util";

export type CardProduct = Pick<
  Product,
  "id" | "slug" | "name" | "price" | "compareAtPrice" | "images" | "badge" | "stock" | "madeToOrder" | "categoryName" | "rating" | "reviewCount" | "customizable"
> &
  Partial<Pick<Product, "tags" | "leadTimeDays">>;

/**
 * Gallery-style product card: plinth image well, one badge, wishlist heart,
 * desktop hover (second image, Quick view bar, mirror glint), mobile quick-add "+".
 * The image and the text are both links to the piece; the buttons sit outside them.
 */
export function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const { addToCart, wishlist, toggleWishlist, setQuickViewId } = useStore();
  const sold = p.stock <= 0 && !p.madeToOrder;
  const oneOfOne = p.stock === 1 && !p.madeToOrder;
  const wished = wishlist.includes(p.id);
  const href = `/product/${p.slug}`;
  const first = productImg(p.images[0], [400, 600, 900]);
  const second = p.images[1] ? productImg(p.images[1], [400, 600, 900]) : null;
  const glint = !sold && isMirrorWork(p);

  const badge: { label: string; accent?: boolean } | null = sold
    ? { label: "Sold" }
    : oneOfOne
      ? { label: "One of one", accent: true }
      : p.badge
        ? { label: p.badge }
        : p.madeToOrder
          ? { label: "Made to order" }
          : null;

  const meta = sold
    ? null
    : p.madeToOrder && badge?.label !== "Made to order"
      ? "Made to order"
      : !p.madeToOrder && p.stock > 1 && p.stock <= 3
        ? `Only ${p.stock} left`
        : null;

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToBag(e.currentTarget.closest(".img-well"));
    addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, price: p.price, maxQty: p.madeToOrder ? 20 : p.stock });
  };

  return (
    <article className="group reveal relative">
      <div className={`img-well relative aspect-square shadow-soft ${glint ? "glint" : ""}`}>
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0 block">
          <ViewTransition name={morphName(p.id)} share="morph" default="none">
            <img
              src={first.src}
              srcSet={first.srcSet}
              sizes={CARD_SIZES}
              alt={p.name}
              width={600}
              height={750}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              decoding="async"
              className={`size-full object-cover transition-[opacity,scale] duration-[450ms,1200ms] ease-out pointer-fine:group-hover:scale-[1.03] ${
                second ? `pointer-fine:group-hover:opacity-0` : ""
              } ${sold ? "opacity-85 grayscale-[0.6]" : ""}`}
            />
          </ViewTransition>
          {second && (
            <img
              src={second.src}
              srcSet={second.srcSet}
              sizes={CARD_SIZES}
              alt=""
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 size-full object-cover opacity-0 transition-[opacity,scale] duration-[450ms,1200ms] ease-out pointer-fine:group-hover:scale-[1.03] pointer-fine:group-hover:opacity-100 ${
                sold ? "grayscale-[0.6]" : ""
              }`}
            />
          )}
        </Link>

        {badge && <span className={`badge pointer-events-none absolute top-2 left-2 ${badge.accent ? "badge-accent" : "badge-image"}`}>{badge.label}</span>}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(p.id);
          }}
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          aria-pressed={wished}
          className={`absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-canvas/80 text-ink backdrop-blur-md transition-[opacity,background-color] duration-200 before:absolute before:-inset-1 before:content-[''] hover:bg-canvas focus-visible:opacity-100 ${
            wished ? "" : `pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100`
          }`}
        >
          <Heart key={wished ? "on" : "off"} strokeWidth={1.5} className={`size-[18px] ${wished ? "animate-pop fill-accent text-accent" : ""}`} />
        </button>

        {/* Desktop: Quick view bar slides up from inside the image */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQuickViewId(p.id);
          }}
          className={`absolute inset-x-0 bottom-0 hidden h-11 items-center justify-center bg-canvas/90 text-[13px] font-medium text-ink backdrop-blur-md transition-transform duration-[220ms] ease-out pointer-fine:flex translate-y-full group-hover:translate-y-0 focus-visible:translate-y-0 focus-visible:outline-offset-[-2px]`}
        >
          Quick view<span className="sr-only">: {p.name}</span>
        </button>

        {/* Touch: quick add */}
        {!sold && (
          <button
            type="button"
            onClick={quickAdd}
            aria-label={`Add ${p.name} to bag`}
            className={`absolute right-2 bottom-2 grid size-[34px] place-items-center rounded-full bg-ink text-canvas transition-transform duration-[120ms] before:absolute before:-inset-[5px] before:content-[''] active:scale-[0.92] pointer-fine:hidden`}
          >
            <Plus className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <Link href={href} className="mt-2.5 block px-0.5">
        <h3 className="line-clamp-1 text-[14px] leading-snug font-medium text-ink lg:text-[15px]">{p.name}</h3>
        {p.categoryName && <p className="mt-0.5 truncate text-[12px] text-muted">{p.categoryName}</p>}
        {!sold && (
          <p className="mt-1 text-[14px] leading-snug font-semibold">
            <Price value={p.price} compareAt={p.compareAtPrice} />
            {meta && <span className="text-[13px] text-muted"> · {meta}</span>}
          </p>
        )}
      </Link>
      {sold && (
        <Link href="/custom-order" className="link mt-1.5 inline-block text-[14px] font-medium">
          Commission a similar piece <span className="arrow">→</span>
        </Link>
      )}
    </article>
  );
}
