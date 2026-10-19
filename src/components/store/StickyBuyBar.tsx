"use client";

import { useEffect, useState } from "react";
import { formatINR, imgUrl } from "@/lib/format";

/** Mobile: a slim bar that appears once the main buy buttons scroll out of view. */
export function StickyBuyBar({ name, price, image }: { name: string; price: number; image: string | null }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById("buy");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => {
      io.disconnect();
      document.body.classList.remove("has-buybar");
    };
  }, []);
  useEffect(() => {
    document.body.classList.toggle("has-buybar", show);
  }, [show]);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[55] animate-fade-up border-t border-ink/10 bg-paper/95 px-4 py-3 shadow-[0_-10px_30px_-12px_rgba(22,36,74,0.3)] backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <img src={imgUrl(image, 120)} alt="" className="size-11 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-sm text-muted">{formatINR(price)}</p>
        </div>
        <button onClick={() => document.getElementById("buy")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="btn btn-primary btn-sm">
          Buy
        </button>
      </div>
    </div>
  );
}
