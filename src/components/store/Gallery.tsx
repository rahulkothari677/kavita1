"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { imgUrl } from "@/lib/format";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : ["/brand/medallion.webp"];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const go = (d: number) => setI((x) => (x + d + list.length) % list.length);

  return (
    <div className="md:sticky md:top-24">
      <div className="group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-tint">
        <img src={imgUrl(list[i], 1200)} alt={name} className="size-full cursor-zoom-in object-cover" onClick={() => setZoom(true)} />
        <button onClick={() => setZoom(true)} className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-canvas/90 shadow" aria-label="Zoom">
          <ZoomIn className="size-4" />
        </button>
        {list.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-canvas/90 shadow" aria-label="Previous image">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-canvas/90 shadow" aria-label="Next image">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {list.map((src, n) => (
            <button key={src + n} onClick={() => setI(n)} className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 ${n === i ? "border-ink" : "border-transparent opacity-70"}`}>
              <img src={imgUrl(src, 200)} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-ink-deep/95 p-4" onClick={() => setZoom(false)}>
          <button className="absolute right-4 top-4 rounded-full bg-on-ink/10 p-3 text-on-ink" aria-label="Close">
            <X className="size-5" />
          </button>
          <img src={imgUrl(list[i], 2000)} alt={name} className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          {list.length > 1 && (
            <>
              <button onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute left-4 rounded-full bg-on-ink/10 p-3 text-on-ink" aria-label="Previous">
                <ChevronLeft />
              </button>
              <button onClick={(e) => (e.stopPropagation(), go(1))} className="absolute right-4 rounded-full bg-on-ink/10 p-3 text-on-ink" aria-label="Next">
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
