"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useStore } from "./StoreProvider";
import { Price } from "@/components/brand";
import { productImg } from "./catalogue/util";

type QV = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  stock: number;
  madeToOrder: boolean;
  customizable?: boolean;
  shortDescription: string;
  size: string | null;
  categoryName: string | null;
  rating?: number;
  reviewCount?: number;
};

const CLOSE_MS = 260;
const cache = new Map<string, QV>();

/**
 * Quick view: a centred white modal (7/5 split) on md+, a bottom sheet with a grabber
 * and swipe-down dismiss on phones. Opened from product cards via setQuickViewId.
 */
export function QuickView() {
  const { quickViewId, setQuickViewId, addToCart, setCartOpen } = useStore();
  const [p, setP] = useState<QV | null>(null);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const touch = useRef<{ y: number; x: number; t: number; atTop: boolean; axis: "x" | "y" | null } | null>(null);

  // Load the piece + open animation
  useEffect(() => {
    if (!quickViewId) {
      setShown(false);
      return;
    }
    closing.current = false;
    returnFocus.current = (document.activeElement as HTMLElement) ?? null;
    setSlide(0);
    setFailed(false);
    setDrag(null);
    const cached = cache.get(quickViewId);
    setP(cached ?? null);
    const ctrl = new AbortController();
    if (!cached) {
      fetch(`/api/products?ids=${encodeURIComponent(quickViewId)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => {
          const found: QV | undefined = d.products?.[0];
          if (found) {
            cache.set(quickViewId, found);
            setP(found);
          } else setFailed(true);
        })
        .catch((e) => {
          if (e?.name !== "AbortError") setFailed(true);
        });
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      ctrl.abort();
      cancelAnimationFrame(raf);
      root.style.overflow = prevOverflow;
    };
  }, [quickViewId]);

  const close = useCallback(
    (immediate = false) => {
      if (closing.current) return;
      closing.current = true;
      setShown(false);
      setDrag(null);
      const done = () => {
        setQuickViewId(null);
        returnFocus.current?.focus?.({ preventScroll: true });
      };
      if (immediate) done();
      else setTimeout(done, CLOSE_MS);
    },
    [setQuickViewId],
  );

  // Focus, Esc and a simple focus trap
  useEffect(() => {
    if (!quickViewId) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const els = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickViewId, close]);

  if (!quickViewId) return null;

  const sold = p ? p.stock <= 0 && !p.madeToOrder : false;
  const status = !p
    ? null
    : sold
      ? "Sold · this one has found its home"
      : p.madeToOrder
        ? "Made to order"
        : p.stock === 1
          ? "One of one"
          : p.stock <= 3
            ? `Only ${p.stock} left`
            : "Ready to ship";

  const add = () => {
    if (!p) return;
    addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, price: p.price, maxQty: p.madeToOrder ? 20 : p.stock });
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (desktop) {
      close(true);
      setCartOpen(true);
    } else close();
  };

  // Swipe-down to dismiss (phones). Only when the sheet is scrolled to the top.
  const onTouchStart = (e: React.TouchEvent) => {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const t = e.touches[0];
    touch.current = { y: t.clientY, x: t.clientX, t: performance.now(), atTop: (scrollRef.current?.scrollTop ?? 0) <= 0, axis: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touch.current;
    if (!s || !s.atTop) return;
    const t = e.touches[0];
    const dy = t.clientY - s.y;
    const dx = t.clientX - s.x;
    if (!s.axis && Math.abs(dx) + Math.abs(dy) > 6) s.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
    if (s.axis === "y") setDrag(Math.max(0, dy));
  };
  const onTouchEnd = () => {
    const s = touch.current;
    touch.current = null;
    if (!s || drag === null) return;
    const h = panelRef.current?.offsetHeight ?? 1;
    const v = drag / Math.max(1, performance.now() - s.t);
    if (drag > h * 0.3 || (v > 0.5 && drag > 20)) close();
    else setDrag(null);
  };

  const panelStyle: React.CSSProperties | undefined =
    drag !== null ? { translate: `0 ${drag}px`, transition: "none" } : undefined;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center md:justify-center md:p-6" role="presentation">
      <div
        aria-hidden
        onClick={() => close()}
        className={`absolute inset-0 bg-ink-deep/40 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qv-title"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={panelStyle}
        className={`shadow-float relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[20px] bg-surface pb-[env(safe-area-inset-bottom)] transition-[translate,opacity,scale] ease-drawer md:grid md:h-[min(640px,calc(100dvh_-_48px))] md:max-h-none md:max-w-[960px] md:grid-cols-12 md:rounded-img md:pb-0 md:ease-out ${
          shown
            ? "translate-y-0 duration-[420ms] md:scale-100 md:opacity-100 md:duration-[220ms]"
            : "translate-y-full duration-[260ms] md:translate-y-0 md:scale-[0.98] md:opacity-0 md:duration-[180ms]"
        }`}
      >
        {/* Grabber */}
        <div aria-hidden className="flex shrink-0 justify-center pt-2 pb-2 md:hidden">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={() => close()}
          aria-label="Close quick view"
          className="icon-btn absolute top-2 right-2 z-10 bg-surface/85 backdrop-blur-md md:top-3 md:right-3"
        >
          <X className="size-5" strokeWidth={1.5} />
        </button>

        <div ref={scrollRef} className="min-h-0 flex-1 overscroll-contain overflow-y-auto md:contents">
          {/* Gallery */}
          <div className="relative md:col-span-7 md:h-full md:min-h-0 md:bg-plinth">
            {!p ? (
              <div className="flex gap-2 px-4 md:h-full md:p-0">
                <div className="skeleton aspect-[4/5] w-[62vw] shrink-0 md:h-full md:w-full md:rounded-none" />
              </div>
            ) : (
              <>
                <div
                  className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 md:h-full md:gap-0 md:scroll-px-0 md:px-0"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const w = el.firstElementChild instanceof HTMLElement ? el.firstElementChild.offsetWidth : el.clientWidth;
                    setSlide(Math.round(el.scrollLeft / Math.max(1, w)));
                  }}
                >
                  {(p.images.length ? p.images : [null]).map((src, n) => {
                    const im = productImg(src, [600, 900, 1200]);
                    return (
                      <div key={n} className="aspect-[4/5] w-[62vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-img bg-plinth md:aspect-auto md:h-full md:w-full md:max-w-none md:rounded-none">
                        <img
                          src={im.src}
                          srcSet={im.srcSet}
                          sizes="(min-width: 768px) 560px, 62vw"
                          alt={n === 0 ? p.name : `${p.name}, view ${n + 1}`}
                          decoding="async"
                          className="size-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
                {p.images.length > 1 && (
                  <span className="tabular absolute right-3 bottom-3 hidden rounded-full bg-canvas/90 px-2.5 py-1 text-[11px] font-semibold text-ink md:inline-block">
                    {slide + 1} / {p.images.length}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col px-4 pt-5 pb-5 md:col-span-5 md:min-h-0 md:overflow-y-auto md:p-8 md:pt-14">
            {!p ? (
              failed ? (
                <div className="py-8">
                  <p className="font-display text-[22px]">We couldn’t load this piece.</p>
                  <button type="button" onClick={() => close()} className="link mt-3 text-[15px] font-medium">
                    Close
                  </button>
                </div>
              ) : (
                <div aria-busy="true" aria-label="Loading piece">
                  <div className="skeleton h-[11px] w-24" />
                  <div className="skeleton mt-3 h-7 w-4/5" />
                  <div className="skeleton mt-4 h-5 w-24" />
                  <div className="skeleton mt-6 h-4 w-full" />
                  <div className="skeleton mt-2 h-4 w-5/6" />
                  <div className="skeleton mt-8 h-[52px] w-full" />
                </div>
              )
            ) : (
              <>
                {p.categoryName && <p className="craft-line">{p.categoryName}</p>}
                <h2 id="qv-title" className="font-display mt-2 pr-10 text-[26px] leading-[1.15] md:pr-0 md:text-[30px]">
                  {p.name}
                </h2>
                <p className="mt-3 text-[20px] leading-none">
                  <Price value={p.price} compareAt={p.compareAtPrice} />
                </p>
                {p.reviewCount ? (
                  <p className="tabular mt-3 text-[13px] text-ink">
                    <span aria-hidden>★</span> {(p.rating ?? 5).toFixed(1)} · {p.reviewCount} {p.reviewCount === 1 ? "review" : "reviews"}
                  </p>
                ) : null}
                {p.shortDescription && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{p.shortDescription}</p>}
                <dl className="mt-4 space-y-1 text-[14px]">
                  {p.size && (
                    <div className="flex gap-2">
                      <dt className="text-muted">Size</dt>
                      <dd>{p.size}</dd>
                    </div>
                  )}
                  {status && (
                    <div className="flex gap-2">
                      <dt className="text-muted">Availability</dt>
                      <dd className={!sold && !p.madeToOrder && p.stock <= 3 ? "text-warning" : ""}>{status}</dd>
                    </div>
                  )}
                </dl>
                {p.customizable && !sold && <p className="helper">Want a name or colour changed? Add a note on the full details page.</p>}

                <div className="mt-auto space-y-4 pt-6">
                  {sold ? (
                    <Link href="/custom-order" onClick={() => close(true)} className="btn btn-primary btn-lg w-full">
                      Commission a similar piece
                    </Link>
                  ) : (
                    <button type="button" onClick={add} className="btn btn-primary btn-lg w-full">
                      Add to bag
                    </button>
                  )}
                  <div className="text-center">
                    <Link href={`/product/${p.slug}`} onClick={() => close(true)} className="link text-[15px] font-medium">
                      View full details <span className="arrow">→</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
