"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useStore } from "./StoreProvider";
import { formatINR, imgUrl } from "@/lib/format";

type Mini = { id: string; slug: string; name: string; price: number; images: string[]; stock: number; madeToOrder: boolean };

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, subtotal, updateQty, removeFromCart, settings, addToCart } = useStore();
  const [suggest, setSuggest] = useState<Mini[]>([]);
  useEffect(() => {
    if (!cartOpen || suggest.length) return;
    fetch("/api/products?limit=10")
      .then((r) => r.json())
      .then((d) => setSuggest(d.products ?? []))
      .catch(() => {});
  }, [cartOpen, suggest.length]);
  useEffect(() => {
    if (!cartOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);
  if (!cartOpen) return null;
  const pairs = suggest.filter((p) => !cart.some((l) => l.productId === p.id) && (p.stock > 0 || p.madeToOrder)).slice(0, 3);
  const remaining = settings.freeShippingAbove > 0 ? settings.freeShippingAbove - subtotal : 0;
  const pct = settings.freeShippingAbove > 0 ? Math.min(100, (subtotal / settings.freeShippingAbove) * 100) : 100;

  return (
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-canvas shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-2xl font-semibold">Your bag</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close bag" className="rounded-full p-2 hover:bg-ink/5">
            <X className="size-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-tint">
              <ShoppingBag className="size-8 text-ink/60" />
            </div>
            <p className="font-display text-2xl">Your bag is empty</p>
            <p className="text-sm text-muted">Every piece is handmade with love — find one that speaks to you.</p>
            <Link href="/shop" onClick={() => setCartOpen(false)} className="btn btn-primary">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            {settings.freeShippingAbove > 0 && (
              <div className="border-b border-ink/10 px-5 py-3 text-sm">
                {remaining > 0 ? (
                  <p>
                    Add <b>{formatINR(remaining)}</b> more for <b>free shipping</b> 🚚
                  </p>
                ) : (
                  <p>🎉 You&apos;ve unlocked <b>free shipping</b>!</p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint-strong">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {cart.map((l) => (
                <li key={l.productId} className="flex gap-4 py-4">
                  <Link href={`/product/${l.slug}`} onClick={() => setCartOpen(false)} className="shrink-0">
                    <img src={imgUrl(l.image, 200)} alt={l.name} className="size-20 rounded-xl bg-tint object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <Link href={`/product/${l.slug}`} onClick={() => setCartOpen(false)} className="font-medium leading-snug">
                        {l.name}
                      </Link>
                      <button onClick={() => removeFromCart(l.productId)} className="text-muted hover:text-danger" aria-label="Remove">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {l.note && <p className="mt-0.5 line-clamp-2 text-xs text-muted">✏️ {l.note}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button className="p-1.5" onClick={() => updateQty(l.productId, l.quantity - 1)} aria-label="Decrease">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm">{l.quantity}</span>
                        <button className="p-1.5" onClick={() => updateQty(l.productId, l.quantity + 1)} aria-label="Increase">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-medium">{formatINR(l.price * l.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
              {pairs.length > 0 && (
                <li className="py-5">
                  <p className="mb-3 text-xs tracking-[0.22em] text-muted uppercase">Pairs beautifully with</p>
                  <div className="grid grid-cols-3 gap-3">
                    {pairs.map((p) => (
                      <div key={p.id} className="text-center">
                        <Link href={`/product/${p.slug}`} onClick={() => setCartOpen(false)}>
                          <img src={imgUrl(p.images[0], 200)} alt={p.name} className="aspect-square w-full rounded-xl bg-tint object-cover" />
                        </Link>
                        <p className="mt-1.5 line-clamp-1 text-xs">{p.name}</p>
                        <button
                          onClick={() => addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, price: p.price, maxQty: p.madeToOrder ? 20 : p.stock })}
                          className="mt-1 text-xs font-medium text-ink-soft underline-offset-2 hover:underline"
                        >
                          + Add · {formatINR(p.price)}
                        </button>
                      </div>
                    ))}
                  </div>
                </li>
              )}
            </ul>
            <div className="border-t border-ink/10 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="mb-1 flex justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-muted">Shipping & offers calculated at checkout. You&apos;ll confirm your order on WhatsApp.</p>
              <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn btn-primary w-full py-3.5 text-base">
                Checkout
              </Link>
              <button onClick={() => setCartOpen(false)} className="mt-2 w-full py-2 text-sm text-muted hover:text-ink">
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
