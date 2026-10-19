"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MirrorRing, WhatsAppIcon } from "../Motifs";
import type { HeroSlide } from "@/lib/types";
import { imgUrl } from "@/lib/format";
import { useStore } from "./StoreProvider";
import { waLink } from "@/lib/whatsapp";

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const { settings } = useStore();
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[i] ?? slides[0];
  if (!s) return null;

  return (
    <section className="relative overflow-hidden bg-ink text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #f3ead8 1.5px, transparent 2px)", backgroundSize: "28px 28px" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.1fr_1fr] md:px-6 md:pb-24 md:pt-16">
        <div key={s.id} className="animate-fade-up text-center md:text-left">
          {s.eyebrow && <p className="mb-4 text-[12px] tracking-[0.35em] text-gold-2 uppercase">{s.eyebrow}</p>}
          <h1 className="font-display text-[44px] leading-[1.02] font-medium sm:text-6xl lg:text-[76px]">{s.title}</h1>
          {s.subtitle && <p className="mx-auto mt-6 max-w-xl text-[16.5px] leading-relaxed text-cream/80 md:mx-0">{s.subtitle}</p>}
          <div className="mt-9 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href={s.ctaLink || "/shop"} className="btn btn-gold px-7 py-3.5 text-[15px]">
              {s.ctaLabel || "Shop now"} <ArrowRight className="size-4" />
            </Link>
            <a
              href={waLink(settings.whatsappNumber, "Hi! I'd like to know more about your handmade pieces 🌸")}
              target="_blank"
              rel="noreferrer"
              className="btn border border-cream/30 px-6 py-3.5 text-[15px] text-cream hover:bg-cream/10"
            >
              <WhatsAppIcon className="size-4" /> Chat with us
            </a>
          </div>
          {slides.length > 1 && (
            <div className="mt-10 flex justify-center gap-2 md:justify-start">
              {slides.map((x, n) => (
                <button key={x.id} onClick={() => setI(n)} aria-label={`Slide ${n + 1}`} className={`h-1.5 rounded-full transition-all ${n === i ? "w-8 bg-gold-2" : "w-3 bg-cream/30"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[300px] md:max-w-[460px]">
          <MirrorRing className="absolute inset-0 size-full animate-spin-slow opacity-90" count={18} />
          <div className="absolute inset-[13%] overflow-hidden rounded-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-4 ring-cream/80">
            <img key={s.id} src={s.image ? imgUrl(s.image, 900) : "/brand/medallion.webp"} alt="" className="size-full animate-fade-up object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
