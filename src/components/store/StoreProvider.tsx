"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  /** Only claim cash on delivery when this is true. Optional for older callers. */
  codAvailable?: boolean;
};

export type ToastOptions = {
  /** Optional inline action, e.g. "Undo" or "View bag". */
  action?: { label: string; onClick: () => void };
  /** Milliseconds; defaults to 5s plain / 8s with an action. */
  duration?: number;
};

type Toast = { id: number; msg: string; action?: ToastOptions["action"] };

type Ctx = {
  settings: PublicSettings;
  cart: CartLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  updateNote: (productId: string, note: string) => void;
  removeFromCart: (productId: string) => void;
  /** Puts a removed line back where it was (used by "Undo"). */
  restoreLine: (line: CartLine, index?: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  /** Increments on every add-to-bag; use as a key to replay the badge bump. */
  addedTick: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  recent: string[];
  pushRecent: (productId: string) => void;
  toast: (msg: string, opts?: ToastOptions) => void;
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
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpenState] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [addedTick, setAddedTick] = useState(0);
  // Mirrors cartOpen synchronously so an add followed by setCartOpen(true) in the same
  // handler can skip the "Added to bag" toast (the open drawer already says it).
  const cartOpenRef = useRef(false);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

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
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const setCartOpen = useCallback((v: boolean) => {
    cartOpenRef.current = v;
    setCartOpenState(v);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (msg: string, opts: ToastOptions = {}) => {
      const id = Date.now() + Math.random();
      // Keep at most 2 on screen; the newest wins.
      setToasts((t) => [...t.slice(-1), { id, msg, action: opts.action }]);
      const ms = opts.duration ?? (opts.action ? 8000 : 5000);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ms),
      );
    },
    [dismiss],
  );

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
      setAddedTick((n) => n + 1);
      setTimeout(() => {
        if (cartOpenRef.current) return;
        toast("Added to your bag", { action: { label: "View bag", onClick: () => setCartOpen(true) } });
      }, 0);
    },
    [toast, setCartOpen],
  );

  const restoreLine = useCallback((line: CartLine, index?: number) => {
    setCart((c) => {
      if (c.some((l) => l.productId === line.productId)) return c;
      const next = [...c];
      next.splice(index === undefined || index < 0 ? next.length : Math.min(index, next.length), 0, line);
      return next;
    });
  }, []);

  const toggleWishlist = useCallback(
    (id: string) => {
      setWishlist((w) => {
        if (w.includes(id)) return w.filter((x) => x !== id);
        return [...w, id];
      });
      // Read the pre-toggle state from the current render to decide the message.
      if (!wishlist.includes(id)) toast("Saved to your wishlist", { action: { label: "View", onClick: () => router.push("/wishlist") } });
    },
    [wishlist, toast, router],
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
      restoreLine,
      clearCart: () => setCart([]),
      cartOpen,
      setCartOpen,
      addedTick,
      wishlist,
      toggleWishlist,
      recent,
      pushRecent: (id) => setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 12)),
      toast,
      assistantOpen,
      setAssistantOpen,
      quickViewId,
      setQuickViewId,
    }),
    [settings, cart, addToCart, restoreLine, cartOpen, setCartOpen, addedTick, wishlist, toggleWishlist, recent, toast, assistantOpen, quickViewId],
  );

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} raised={cartOpen} />
    </StoreCtx.Provider>
  );
}

/**
 * Ink pill toasts. Bottom-centre on desktop; 12px above the tab bar on phones
 * (moved under the drawer header while the bag is open so it never covers Checkout).
 */
function Toaster({ toasts, onDismiss, raised }: { toasts: Toast[]; onDismiss: (id: number) => void; raised: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4 lg:top-auto lg:bottom-6 ${
        raised ? "top-[calc(env(safe-area-inset-top)+76px)]" : "bottom-[calc(64px+env(safe-area-inset-bottom)+12px)]"
      }`}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-[min(100%,440px)] animate-fade-up items-center gap-4 rounded-[8px] bg-ink py-3 pr-2 pl-4 text-[14px] leading-snug font-medium text-canvas shadow-float sm:rounded-full"
        >
          <span className="min-w-0 py-0.5">{t.msg}</span>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick();
                onDismiss(t.id);
              }}
              className="on-dark -my-2 shrink-0 rounded-full px-3 py-2 text-[14px] font-semibold text-accent-on-dark transition-colors hover:bg-ink-soft"
            >
              {t.action.label}
            </button>
          ) : (
            <span className="pr-2" />
          )}
        </div>
      ))}
    </div>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
