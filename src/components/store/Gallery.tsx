"use client";

import { ViewTransition, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { morphName, productImg } from "./catalogue/util";

const WIDTHS = [600, 900, 1200, 1600];

/**
 * Product gallery.
 * Desktop: images stacked on plinth (first full width, then 2-up pairs).
 * Mobile: full-bleed scroll-snap row (92vw slides) with a "1 / n" pill and a thumbnail strip.
 * Any image opens a full-screen zoom viewer on canvas.
 * The first image shares a view-transition name with the product card for the morph.
 */
export function Gallery({ images, name, productId }: { images: string[]; name: string; productId?: string }) {
  const list = images.length ? images : [""];
  const [active, setActive] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const many = list.length > 1;

  const onScroll = () => {
    const row = rowRef.current;
    const first = row?.firstElementChild as HTMLElement | null;
    if (!row || !first) return;
    const step = first.offsetWidth + 4;
    setActive(Math.min(list.length - 1, Math.max(0, Math.round(row.scrollLeft / step))));
  };

  const scrollToSlide = (n: number) => {
    const row = rowRef.current;
    const el = row?.children[n] as HTMLElement | undefined;
    if (!row || !el) return;
    row.scrollTo({ left: el.offsetLeft - row.offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const open = (n: number, e: React.MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget;
    setZoomAt(n);
  };

  return (
    <div>
      <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
        <ul
          ref={rowRef}
          onScroll={onScroll}
          aria-label={`${name} images`}
          className="no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible"
        >
          {list.map((src, n) => {
            const im = productImg(src || null, WIDTHS);
            const wide = n === 0 || (n % 2 === 1 && n === list.length - 1);
            const img = (
              <img
                src={im.src}
                srcSet={im.srcSet}
                sizes={wide ? "(min-width: 1440px) 760px, (min-width: 1024px) 54vw, 92vw" : "(min-width: 1440px) 380px, (min-width: 1024px) 27vw, 92vw"}
                alt={n === 0 ? name : `${name}, view ${n + 1}`}
                width={1200}
                height={1500}
                loading={n === 0 ? "eager" : "lazy"}
                fetchPriority={n === 0 ? "high" : undefined}
                decoding={n === 0 ? "sync" : "async"}
                className="size-full object-cover"
              />
            );
            return (
              <li key={`${src}-${n}`} className={`w-[92vw] shrink-0 snap-start lg:w-auto ${wide ? "lg:col-span-2" : ""}`}>
                <button
                  type="button"
                  onClick={(e) => open(n, e)}
                  aria-label={many ? `View image ${n + 1} of ${list.length} full screen` : "View image full screen"}
                  className="img-well block aspect-[4/5] w-full cursor-zoom-in"
                >
                  {n === 0 && productId ? (
                    <ViewTransition name={morphName(productId)} share="morph" default="none">
                      {img}
                    </ViewTransition>
                  ) : (
                    img
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {many && (
          <span
            aria-hidden
            className="tabular pointer-events-none absolute right-[calc(8vw+12px)] bottom-3 rounded-full bg-canvas/88 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur-sm lg:hidden"
          >
            {active + 1} / {list.length}
          </span>
        )}
      </div>

      {many && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto p-0.5 lg:hidden" aria-label="Choose image">
          {list.map((src, n) => (
            <button
              key={`t-${src}-${n}`}
              type="button"
              onClick={() => scrollToSlide(n)}
              aria-label={`Show image ${n + 1}`}
              aria-current={n === active ? "true" : undefined}
              className={`h-[60px] w-12 shrink-0 overflow-hidden rounded-[2px] bg-plinth transition-[outline-color,opacity] duration-150 ${
                n === active ? "outline-1 outline-offset-1 outline-ink outline-solid" : "opacity-75"
              }`}
            >
              <img src={productImg(src || null, [120]).src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomAt !== null && (
        <ZoomViewer
          images={list}
          name={name}
          start={zoomAt}
          onClose={(last) => {
            setZoomAt(null);
            if (window.matchMedia("(max-width: 1023px)").matches && last !== active) scrollToSlide(last);
            opener.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </div>
  );
}

/** Full-screen viewer on canvas: arrows / swipe, tap or click to zoom, Esc to close. */
function ZoomViewer({ images, name, start, onClose }: { images: string[]; name: string; start: number; onClose: (last: number) => void }) {
  const [i, setI] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const focusPoint = useRef<{ fx: number; fy: number } | null>(null);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const n = images.length;

  const go = useCallback(
    (d: number) => {
      setZoomed(false);
      setI((x) => (x + d + n) % n);
    },
    [n],
  );

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose(i);
      } else if (e.key === "ArrowRight" && n > 1) go(1);
      else if (e.key === "ArrowLeft" && n > 1) go(-1);
      else if (e.key === "Tab" && boxRef.current) {
        const els = boxRef.current.querySelectorAll<HTMLElement>("button");
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, i, n, onClose]);

  // After zooming in, centre the point that was tapped.
  useEffect(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    const fp = focusPoint.current;
    if (!zoomed || !stage || !img || !fp) return;
    const apply = () => {
      stage.scrollLeft = fp.fx * img.offsetWidth - stage.clientWidth / 2;
      stage.scrollTop = fp.fy * img.offsetHeight - stage.clientHeight / 2;
    };
    if (img.complete) apply();
    else img.addEventListener("load", apply, { once: true });
  }, [zoomed, i]);

  const toggleZoom = (e: React.MouseEvent) => {
    if (swipe.current?.moved) return;
    if (zoomed) {
      setZoomed(false);
      return;
    }
    const img = imgRef.current;
    if (!img) return;
    const r = img.getBoundingClientRect();
    focusPoint.current = {
      fx: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      fy: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
    setZoomed(true);
  };

  const im = productImg(images[i] || null, [1200, 2000]);

  return (
    <div ref={boxRef} role="dialog" aria-modal="true" aria-label={`${name}, image ${i + 1} of ${n}`} className="fixed inset-0 z-[65] animate-fade-in bg-canvas">
      <div className="absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between px-2 pl-4 lg:h-16 lg:px-4 lg:pl-6">
        <p className="tabular text-[13px] font-medium text-muted" aria-live="polite">
          {n > 1 ? `${i + 1} / ${n}` : ""}
        </p>
        <button ref={closeRef} type="button" onClick={() => onClose(i)} className="icon-btn" aria-label="Close full-screen view">
          <X className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <div
        ref={stageRef}
        onClick={toggleZoom}
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY, moved: false };
        }}
        onPointerMove={(e) => {
          const s = swipe.current;
          if (s && Math.abs(e.clientX - s.x) > 8) s.moved = true;
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          if (!s || zoomed || n < 2) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
          setTimeout(() => (swipe.current = null), 0);
        }}
        className={`absolute inset-x-0 top-14 bottom-4 lg:top-16 lg:bottom-6 ${
          zoomed ? "no-scrollbar cursor-zoom-out overflow-auto" : "flex cursor-zoom-in touch-pan-y items-center justify-center overflow-hidden px-4 lg:px-24"
        }`}
      >
        <img
          key={i}
          ref={imgRef}
          src={im.src}
          srcSet={im.srcSet}
          sizes={zoomed ? "200vw" : "100vw"}
          alt={`${name}, image ${i + 1} of ${n}`}
          draggable={false}
          className={zoomed ? "max-w-none rounded-[2px] select-none" : "max-h-full max-w-full animate-fade-in rounded-[2px] object-contain select-none"}
          style={zoomed ? { width: "max(200%, 1200px)" } : undefined}
        />
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="icon-btn absolute top-1/2 left-3 z-10 -translate-y-1/2 bg-surface/90 backdrop-blur-md max-lg:hidden!"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="icon-btn absolute top-1/2 right-3 z-10 -translate-y-1/2 bg-surface/90 backdrop-blur-md max-lg:hidden!"
            aria-label="Next image"
          >
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>
        </>
      )}
    </div>
  );
}
