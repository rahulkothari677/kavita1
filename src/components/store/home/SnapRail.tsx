"use client";

import { useEffect, useRef } from "react";

/**
 * Mobile horizontal scroll-snap row that bleeds to the screen edge, with a 2px
 * progress line tied to scrollLeft. Children set their own width + `snap-start`.
 */
export function SnapRail({
  children,
  label,
  tone = "light",
  className = "",
  focusable = false,
}: {
  children: React.ReactNode;
  label: string;
  tone?: "light" | "dark";
  className?: string;
  /** Make the scroller itself keyboard-focusable (needed when it holds no links). */
  focusable?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = scroller.current;
    const fill = bar.current;
    if (!el || !fill) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const visible = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1;
      const progress = max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 1;
      fill.style.transform = `scaleX(${Math.min(1, visible + (1 - visible) * progress)})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={className}>
      <div
        ref={scroller}
        role="region"
        aria-label={label}
        tabIndex={focusable ? 0 : undefined}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {children}
      </div>
      <div aria-hidden className={`mt-6 h-0.5 overflow-hidden ${tone === "dark" ? "bg-line-on-dark" : "bg-line"}`}>
        <span
          ref={bar}
          className={`block h-full origin-left ${tone === "dark" ? "bg-accent-on-dark" : "bg-ink"}`}
          style={{ transform: "scaleX(0.25)" }}
        />
      </div>
    </div>
  );
}
