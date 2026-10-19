"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { EmptyArt, Eyebrow } from "@/components/brand";
import { formatINR, imgUrl } from "@/lib/format";
import { useStore, type CartLine } from "./StoreProvider";
import { useFocusTrap, usePresence, useScrollLock } from "./chrome/hooks";

type Mini = { id: string; slug: string; name: string; price: number; images: string[]; stock: number; madeToOrder: boolean; categoryName?: string | null };

/** 32px stepper button inside a 44px hit area. */
function StepButton({ onClick, label, disabled, children }: { onClick: () => void; label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group -m-1.5 grid size-11 shrink-0 place-items-center disabled:cursor-not-allowed"
    >
      <span className="grid size-8 place-items-center rounded-[4px] border border-line-strong transition-colors group-hover:bg-plinth group-active:scale-[0.92] group-disabled:border-line group-disabled:text-muted group-disabled:group-hover:bg-transparent">
        {children}
      </span>
    </button>
  );
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, subtotal, cartCount, updateQty, removeFromCart, restoreLine, settings, addToCart, toast, wishlist } = useStore();
  const { mounted, visible } = usePresence(cartOpen, 260);
  const [suggest, setSuggest] = useState<Mini[]>([]);
  const [crafts, setCrafts] = useState<Record<string, string | null>>({});
  const panelRef = useRef<HTMLElement>(null);
  const close = () => setCartOpen(false);

  useFocusTrap(panelRef, cartOpen, { onEscape: close });
  useScrollLock(cartOpen);

  // "Pairs well with" suggestions (fetched once, on first open).
  useEffect(() => {
    if (!cartOpen || suggest.length) return;
    const ctrl = new AbortController();
    fetch("/api/products?limit=10", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setSuggest(d.products ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [cartOpen, suggest.length]);

  // Craft line for each bag item (cart lines don't store their category).
  const missing = cart.filter((l) => !(l.productId in crafts)).map((l) => l.productId);
  const missingKey = missing.join(",");
  useEffect(() => {
    if (!cartOpen || !missingKey) return;
    const ctrl = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(missingKey)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { products?: Mini[] }) => {
        setCrafts((prev) => {
          const next = { ...prev };
          for (const id of missingKey.split(",")) next[id] = d.products?.find((p) => p.id === id)?.categoryName ?? null;
          return next;
        });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [cartOpen, missingKey]);

  if (!mounted) return null;

  const pairs = suggest.filter((p) => !cart.some((l) => l.productId === p.id) && (p.stock > 0 || p.madeToOrder)).slice(0, 3);
  const threshold = settings.freeShippingAbove;
  const remaining = threshold > 0 ? Math.max(0, threshold - subtotal) : 0;
  const pct = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;
  const unlocked = threshold > 0 && remaining <= 0;

  const remove = (l: CartLine) => {
    const index = cart.findIndex((x) => x.productId === l.productId);
    removeFromCart(l.productId);
    toast(`Removed “${l.name}”`, { action: { label: "Undo", onClick: () => restoreLine(l, index) } });
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        aria-hidden
        onClick={close}
        className={`absolute inset-0 bg-ink-deep/40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-float outline-none transition-transform ease-drawer sm:w-[440px] ${
          visible ? "translate-x-0 duration-[420ms]" : "translate-x-full duration-[260ms]"
        }`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line pr-2 pl-5">
          <h2 id="bag-title" className="font-display text-[24px] leading-none">
            Your bag <span className="tabular">({cartCount})</span>
          </h2>
          <button type="button" onClick={close} aria-label="Close bag" className="icon-btn">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
            <EmptyArt kind="diya" />
            <p className="mt-5 max-w-[16ch] font-display text-[24px] leading-tight">Your bag is waiting for its first piece</p>
            <Link href="/shop" onClick={close} className="btn btn-primary mt-7">
              Explore the collection
            </Link>
            {wishlist.length > 0 && (
              <Link href="/wishlist" onClick={close} className="link mt-5 text-[14px] font-medium">
                Or open your wishlist ({wishlist.length}) <span className="arrow">→</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            {threshold > 0 && (
              <div className="shrink-0 border-b border-line px-5 pt-3 pb-4">
                <p aria-live="polite" className={`text-[14px] ${unlocked ? "font-medium text-success" : "text-ink-2"}`}>
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check aria-hidden className="size-4" strokeWidth={2} /> Free shipping unlocked
                    </span>
                  ) : (
                    <>
                      <span className="font-medium text-ink tabular">{formatINR(remaining)}</span> away from free shipping
                    </>
                  )}
                </p>
                <div
                  className="mt-2.5 h-0.5 overflow-hidden bg-line"
                  role="progressbar"
                  aria-label="Progress to free shipping"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pct)}
                >
                  <div className="h-full bg-accent transition-[width] duration-[400ms] ease-out" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <ul className="px-5">
                {cart.map((l) => {
                  const max = l.maxQty ?? 99;
                  const craft = crafts[l.productId];
                  return (
                    <li key={l.productId} className="flex gap-4 border-b border-line py-5">
                      <Link href={`/product/${l.slug}`} onClick={close} className="h-[90px] w-[72px] shrink-0 overflow-hidden rounded-img bg-plinth" tabIndex={-1} aria-hidden>
                        <img src={imgUrl(l.image, 200)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        {craft && <p className="craft-line truncate">{craft}</p>}
                        <Link href={`/product/${l.slug}`} onClick={close} className="mt-1 line-clamp-2 font-display text-[16px] leading-snug">
                          {l.name}
                        </Link>
                        {l.note && <p className="mt-1 line-clamp-2 text-[13px] text-muted">Personalised: {l.note}</p>}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                          <div className="flex items-center" role="group" aria-label={`Quantity of ${l.name}`}>
                            <StepButton
                              label={l.quantity <= 1 ? `Remove ${l.name}` : "Decrease quantity"}
                              onClick={() => (l.quantity <= 1 ? remove(l) : updateQty(l.productId, l.quantity - 1))}
                            >
                              <Minus className="size-3.5" strokeWidth={1.75} />
                            </StepButton>
                            <span className="w-8 text-center text-[15px] font-medium tabular" aria-live="polite">
                              {l.quantity}
                            </span>
                            <StepButton label="Increase quantity" disabled={l.quantity >= max} onClick={() => updateQty(l.productId, l.quantity + 1)}>
                              <Plus className="size-3.5" strokeWidth={1.75} />
                            </StepButton>
                          </div>
                          <span className="text-[16px] font-medium tabular">{formatINR(l.price * l.quantity)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(l)}
                          className="mt-2 self-start py-1 text-[13px] text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {pairs.length > 0 && (
                <section aria-labelledby="pairs-title" className="px-5 pt-7 pb-6">
                  <Eyebrow>
                    <span id="pairs-title">Pairs well with</span>
                  </Eyebrow>
                  <ul className="mt-3">
                    {pairs.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                        <Link href={`/product/${p.slug}`} onClick={close} className="h-[60px] w-12 shrink-0 overflow-hidden rounded-img bg-plinth" tabIndex={-1} aria-hidden>
                          <img src={imgUrl(p.images[0], 120)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link href={`/product/${p.slug}`} onClick={close} className="block truncate text-[14px] font-medium">
                            {p.name}
                          </Link>
                          <p className="text-[13px] text-muted tabular">{formatINR(p.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, price: p.price, maxQty: p.madeToOrder ? 20 : p.stock })
                          }
                          className="min-h-11 shrink-0 px-2 text-[14px] font-medium underline decoration-line-strong underline-offset-4 hover:decoration-accent"
                          aria-label={`Add ${p.name} to bag`}
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <footer className="shrink-0 border-t border-line bg-surface px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between text-[16px] font-semibold">
                <span>Subtotal</span>
                <span className="tabular">{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">Shipping shown before you send. No account needed.</p>
              <Link href="/checkout" onClick={close} className="btn btn-primary btn-lg mt-4 w-full">
                Checkout
              </Link>
              <button type="button" onClick={close} className="mt-1 min-h-11 w-full text-[14px] font-medium text-muted transition-colors hover:text-ink">
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
