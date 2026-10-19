"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type CraftRow = { slug: string; name: string; count: number; image: string | null; subs: string[] };

const IMG_W = 280;
const IMG_H = 350;
const GAP = 40; // image sits this far right of the cursor
const LERP = 0.15;

/**
 * Desktop craft index: numbered serif rows. On hover the row shifts and gains a bindi,
 * and a 280×350 plinth image follows the cursor (transform only, rAF lerp).
 * The floating image is never rendered for touch or reduced motion.
 */
export function CraftIndex({ rows }: { rows: CraftRow[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const floater = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const seeded = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const paint = () => {
    if (floater.current) floater.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
  };

  const tick = () => {
    const p = pos.current;
    const t = target.current;
    p.x += (t.x - p.x) * LERP;
    p.y += (t.y - p.y) * LERP;
    paint();
    frame.current = Math.abs(t.x - p.x) > 0.25 || Math.abs(t.y - p.y) > 0.25 ? requestAnimationFrame(tick) : 0;
  };

  const onMove = (e: React.PointerEvent) => {
    if (!enabled || e.pointerType !== "mouse" || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left + GAP, 0), Math.max(0, r.width - IMG_W));
    const y = e.clientY - r.top - IMG_H / 2;
    target.current = { x, y };
    if (!seeded.current) {
      // first move after entering: appear at the cursor instead of flying in from a corner
      pos.current = { x, y };
      seeded.current = true;
      paint();
    }
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  };

  const onLeave = () => {
    setActive(null);
    seeded.current = false;
  };

  return (
    <div ref={wrap} className="relative" onPointerMove={onMove} onPointerLeave={onLeave}>
      <ol className="border-t border-line">
        {rows.map((r, i) => (
          <li key={r.slug} className="border-b border-line">
            <Link
              href={`/shop?category=${encodeURIComponent(r.slug)}`}
              onPointerEnter={() => setActive(i)}
              className="group grid min-h-24 grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-6 py-4"
            >
              <span className="tabular text-[12px] font-semibold tracking-[0.14em] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="relative block transition-transform duration-[240ms] ease-out group-hover:translate-x-3 group-focus-visible:translate-x-3">
                <span
                  aria-hidden
                  className="absolute top-1/2 -left-5 size-2 -translate-y-1/2 scale-50 rounded-full bg-accent opacity-0 transition duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                />
                <span className="font-display block text-[clamp(2rem,4vw,3.5rem)] leading-[1.05]">{r.name}</span>
              </span>
              <span className="flex items-center gap-8 text-right">
                {r.subs.length > 0 && <span className="hidden max-w-[30ch] text-[13px] leading-snug text-muted xl:block">{r.subs.join(" · ")}</span>}
                <span className="craft-line tabular inline-flex min-w-[7rem] items-center justify-end gap-3">
                  {r.count} {r.count === 1 ? "piece" : "pieces"}
                  <span aria-hidden className="text-[15px] text-ink transition-transform duration-200 ease-out group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {enabled && (
        <div
          ref={floater}
          aria-hidden
          className={`pointer-events-none absolute top-0 left-0 z-10 overflow-hidden rounded-[2px] bg-plinth transition-opacity duration-200 ease-out ${active === null ? "opacity-0" : "opacity-100"}`}
          style={{ width: IMG_W, height: IMG_H, willChange: "transform" }}
        >
          {rows.map((r, i) =>
            r.image ? (
              <img
                key={r.slug}
                src={r.image}
                alt=""
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 size-full object-cover transition-opacity duration-200 ease-out ${i === active ? "opacity-100" : "opacity-0"}`}
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
