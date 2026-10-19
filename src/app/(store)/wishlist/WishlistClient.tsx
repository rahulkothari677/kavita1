"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { ProductCard, type CardProduct } from "@/components/store/ProductCard";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

export function WishlistClient() {
  const { wishlist, settings } = useStore();
  const [items, setItems] = useState<CardProduct[] | null>(null);
  const key = wishlist.join(",");
  useEffect(() => {
    if (!key) return setItems([]);
    fetch(`/api/products?ids=${key}`)
      .then((r) => r.json())
      .then((d) => setItems(d.products ?? []));
  }, [key]);

  const share = () => {
    if (!items?.length) return;
    const text = `My wishlist from ${settings.storeName} 💛\n\n${items.map((p) => `• ${p.name} — ${formatINR(p.price)}\n  ${window.location.origin}/product/${p.slug}`).join("\n")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.3em] text-gold uppercase">Saved for later</p>
          <h1 className="mt-2 font-display text-5xl">Your wishlist</h1>
        </div>
        {items && items.length > 0 && (
          <div className="flex gap-2">
            <button onClick={share} className="btn btn-outline">
              Share wishlist
            </button>
            <a
              href={waLink(settings.whatsappNumber, `Hi! I'm interested in these pieces:\n${items.map((p) => `• ${p.name} (${formatINR(p.price)})`).join("\n")}`)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-wa"
            >
              <WhatsAppIcon className="size-4" /> Enquire about all
            </a>
          </div>
        )}
      </div>
      {items === null ? (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-cream" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center">
          <Heart className="mx-auto size-12 text-ink/20" strokeWidth={1.2} />
          <p className="mt-4 font-display text-3xl">Nothing saved yet</p>
          <p className="mt-2 text-muted">Tap the heart on any piece to save it here.</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
