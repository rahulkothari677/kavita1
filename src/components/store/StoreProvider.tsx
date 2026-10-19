"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  note?: string;
  maxQty?: number;
};

export type PublicSettings = {
  storeName: string;
  whatsappNumber: string;
  shippingFee: number;
  freeShippingAbove: number;
  giftWrapFee: number;
  acceptingOrders: boolean;
  vacationMessage: string;
  aiAssistantEnabled: boolean;
  aiAssistantName: string;
  aiAvailable: boolean;
  instagram: string;
};

type Ctx = {
  settings: PublicSettings;
  cart: CartLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  updateNote: (productId: string, note: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  recent: string[];
  pushRecent: (productId: string) => void;
  toast: (msg: string) => void;
  assistantOpen: boolean;
  setAssistantOpen: (v: boolean) => void;
  quickViewId: string | null;
  setQuickViewId: (id: string | null) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function StoreProvider({ settings, children }: { settings: PublicSettings; children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  useEffect(() => {
    setCart(load("ka_cart", []));
    setWishlist(load("ka_wish", []));
    setRecent(load("ka_recent", []));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) save("ka_cart", cart);
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) save("ka_wish", wishlist);
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (hydrated) save("ka_recent", recent);
  }, [recent, hydrated]);

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const addToCart = useCallback(
    (line: Omit<CartLine, "quantity">, qty = 1) => {
      setCart((c) => {
        const ex = c.find((l) => l.productId === line.productId);
        if (ex) {
          const max = line.maxQty ?? 99;
          return c.map((l) => (l.productId === line.productId ? { ...l, quantity: Math.min(max, l.quantity + qty), note: line.note ?? l.note } : l));
        }
        return [...c, { ...line, quantity: qty }];
      });
      toast(`Added “${line.name}” to your bag`);
    },
    [toast],
  );

  const value = useMemo<Ctx>(
    () => ({
      settings,
      cart,
      cartCount: cart.reduce((s, l) => s + l.quantity, 0),
      subtotal: cart.reduce((s, l) => s + l.price * l.quantity, 0),
      addToCart,
      updateQty: (id, qty) =>
        setCart((c) => (qty <= 0 ? c.filter((l) => l.productId !== id) : c.map((l) => (l.productId === id ? { ...l, quantity: Math.min(l.maxQty ?? 99, qty) } : l)))),
      updateNote: (id, note) => setCart((c) => c.map((l) => (l.productId === id ? { ...l, note } : l))),
      removeFromCart: (id) => setCart((c) => c.filter((l) => l.productId !== id)),
      clearCart: () => setCart([]),
      cartOpen,
      setCartOpen,
      wishlist,
      toggleWishlist: (id) =>
        setWishlist((w) => {
          if (w.includes(id)) return w.filter((x) => x !== id);
          toast("Saved to your wishlist ♡");
          return [...w, id];
        }),
      recent,
      pushRecent: (id) => setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 12)),
      toast,
      assistantOpen,
      setAssistantOpen,
      quickViewId,
      setQuickViewId,
    }),
    [settings, cart, addToCart, cartOpen, wishlist, recent, toast, assistantOpen, quickViewId],
  );

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(140px+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 md:bottom-8">
        {toasts.map((t) => (
          <div key={t.id} className="animate-fade-up rounded-full bg-ink px-5 py-2.5 text-sm text-on-ink shadow-xl">
            {t.msg}
          </div>
        ))}
      </div>
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
