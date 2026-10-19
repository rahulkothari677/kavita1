"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "./StoreProvider";
import { Price } from "@/components/brand";
import { imgUrl } from "@/lib/format";

type Props = {
  name: string;
  price: number;
  image: string | null;
  /** When given, "Add" puts the piece straight in the bag; otherwise it scrolls to the buy box. */
  product?: { id: string; slug: string; stock: number; madeToOrder: boolean; customizable: boolean; compareAtPrice?: number | null };
};

/**
 * Mobile: once the main "Add to bag" scrolls out of view, a slim white bar slides up
 * (and the tab bar steps aside via body.has-buybar).
 */
export function StickyBuyBar({ name, price, image, product }: Props) {
  const { addToCart } = useStore();
  const [show, setShow] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = document.getElementById("pdp-add") ?? document.getElementById("buy");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => {
      io.disconnect();
      document.body.classList.remove("has-buybar");
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    // Only phones/tablets have the tab bar this replaces.
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    document.body.classList.toggle("has-buybar", show && mobile);
  }, [show]);

  const toBuyBox = () => {
    const box = document.getElementById("buy");
    box?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    const note = box?.querySelector<HTMLInputElement>("[data-pdp-note]");
    if (note) setTimeout(() => note.focus({ preventScroll: true }), 400);
  };

  const direct = product && !product.customizable;
  const onAdd = () => {
    if (!product || !direct) return toBuyBox();
    addToCart({ productId: product.id, slug: product.slug, name, image, price, maxQty: product.madeToOrder ? 20 : product.stock });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-[45] border-t border-line bg-surface/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-[1.8] transition-transform duration-300 ease-out lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container-x flex h-16 items-center gap-3">
        <img src={imgUrl(image, 120)} alt="" width={40} height={50} className="h-[50px] w-10 shrink-0 rounded-img bg-plinth object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-[15px] leading-tight">{name}</p>
          <p className="mt-0.5 text-[15px] leading-tight">
            <Price value={price} compareAt={product?.compareAtPrice} />
          </p>
        </div>
        <button type="button" onClick={onAdd} className="btn btn-primary h-11! w-28 shrink-0 px-0!">
          {direct ? (
            <span className="grid place-items-center">
              <span className={`col-start-1 row-start-1 transition-opacity duration-200 ${added ? "opacity-0" : "opacity-100"}`}>Add</span>
              <span aria-hidden={!added} className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-200 ${added ? "opacity-100" : "opacity-0"}`}>
                <Check className="size-4" strokeWidth={2} /> Added
              </span>
            </span>
          ) : product?.customizable ? (
            "Personalise"
          ) : (
            "Buy"
          )}
        </button>
      </div>
    </div>
  );
}
