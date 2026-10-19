"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { ProductCard, type CardProduct } from "@/components/store/ProductCard";
import { WhatsAppIcon } from "@/components/Motifs";
import { EmptyArt, Eyebrow } from "@/components/brand";
import { formatINR } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

const GRID = "grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 md:gap-y-10 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-12";

export function WishlistClient() {
  const { wishlist, settings } = useStore();
  const [items, setItems] = useState<CardProduct[] | null>(null);
  const key = wishlist.join(",");
  useEffect(() => {
    if (!key) return setItems([]);
    let live = true;
    fetch(`/api/products?ids=${key}`)
      .then((r) => r.json())
      .then((d) => live && setItems(d.products ?? []))
      .catch(() => live && setItems([]));
    return () => {
      live = false;
    };
  }, [key]);

  const share = async () => {
    if (!items?.length) return;
    const text = `My wishlist from ${settings.storeName}\n\n${items.map((p) => `• ${p.name} (${formatINR(p.price)})\n  ${window.location.origin}/product/${p.slug}`).join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `My ${settings.storeName} wishlist`, text });
        return;
      }
    } catch {
      return; // user dismissed the share sheet
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const count = items?.length ?? 0;

  return (
    <div className="container-x pt-10 pb-16 lg:pt-16 lg:pb-24">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>
            Saved for later{items && count > 0 ? ` · ${count} ${count === 1 ? "piece" : "pieces"}` : ""}
          </Eyebrow>
          <h1 className="t-h1 mt-4">
            Your <em>wishlist</em>
          </h1>
        </div>
        {items && count > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={share} className="btn btn-outline">
              <Share2 aria-hidden className="size-4" strokeWidth={1.5} /> Share wishlist
            </button>
            <a
              href={waLink(settings.whatsappNumber, `Hi! I'm interested in these pieces:\n${items.map((p) => `• ${p.name} (${formatINR(p.price)})`).join("\n")}`)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-wa-outline"
            >
              <WhatsAppIcon className="size-5" /> Ask about all
            </a>
          </div>
        )}
      </header>

      <div className="hairline-t mt-8 pt-8 lg:mt-12 lg:pt-12">
        {items === null ? (
          <div className={GRID} aria-busy="true" aria-label="Loading your saved pieces">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[4/5]" />
                <div className="skeleton mt-3 h-3 w-[40%]" />
                <div className="skeleton mt-2 h-4 w-[70%]" />
              </div>
            ))}
          </div>
        ) : count === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center lg:py-16">
            <EmptyArt kind="plate" size={56} />
            <h2 className="font-display mt-6 text-[24px] leading-tight">Save the pieces you love</h2>
            <p className="mt-2 text-[15px] text-muted">Tap the heart on any piece and it will wait for you here.</p>
            <Link href="/shop" className="btn btn-primary mt-8 max-[400px]:w-full">
              Explore the collection
            </Link>
          </div>
        ) : (
          <div className={GRID}>
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
