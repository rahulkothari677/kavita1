"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, Share2, ShoppingBag } from "lucide-react";
import { useStore } from "./StoreProvider";
import { WhatsAppIcon } from "../Motifs";
import { productEnquiryMessage, waLink } from "@/lib/whatsapp";

type P = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  madeToOrder: boolean;
  customizable: boolean;
};

export function ProductActions({ p }: { p: P }) {
  const { addToCart, wishlist, toggleWishlist, settings, pushRecent, setCartOpen, toast } = useStore();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const router = useRouter();
  const soldOut = p.stock <= 0 && !p.madeToOrder;
  const max = p.madeToOrder ? 20 : Math.max(1, p.stock);

  useEffect(() => {
    pushRecent(p.id);
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: p.id, event: "view" }) }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  const line = { productId: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, maxQty: max, note: note.trim() || undefined };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast("Link copied!");
    }
  };

  return (
    <div className="mt-7 space-y-4">
      {p.customizable && (
        <div>
          <label className="label">Personalisation (name, colour, size…)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. 'Sharma Niwas' in gold letters" className="input" />
        </div>
      )}
      {!soldOut && (
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-ink/20 bg-white">
            <button className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center">{qty}</span>
            <button className="p-3" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity">
              <Plus className="size-4" />
            </button>
          </div>
          <button
            onClick={() => {
              addToCart(line, qty);
              setCartOpen(true);
            }}
            className="btn btn-primary flex-1 py-3.5 text-[15px]"
          >
            <ShoppingBag className="size-4" /> Add to bag
          </button>
        </div>
      )}
      {!soldOut ? (
        <button
          onClick={() => {
            addToCart(line, qty);
            router.push("/checkout");
          }}
          className="btn btn-wa w-full py-3.5 text-[15px]"
        >
          <WhatsAppIcon className="size-5" /> Buy now via WhatsApp
        </button>
      ) : (
        <a
          href={waLink(settings.whatsappNumber, `Hi! *${p.name}* is sold out on your website. Can you make one for me? 🙏`)}
          target="_blank"
          rel="noreferrer"
          className="btn btn-wa w-full py-3.5 text-[15px]"
        >
          <WhatsAppIcon className="size-5" /> Request this piece on WhatsApp
        </a>
      )}
      <div className="flex gap-2">
        <a
          href={waLink(settings.whatsappNumber, productEnquiryMessage(p.name, p.price, typeof window !== "undefined" ? window.location.href : ""))}
          target="_blank"
          rel="noreferrer"
          onClick={() => fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: p.id, event: "whatsapp" }) })}
          className="btn btn-outline flex-1"
        >
          Ask a question
        </a>
        <button onClick={() => toggleWishlist(p.id)} className="btn btn-outline px-4" aria-label="Wishlist">
          <Heart className={`size-4 ${wishlist.includes(p.id) ? "fill-rose text-rose" : ""}`} />
        </button>
        <button onClick={share} className="btn btn-outline px-4" aria-label="Share">
          <Share2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
