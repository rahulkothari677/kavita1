"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingBag, Sparkles } from "lucide-react";
import { useStore } from "./StoreProvider";

/** App-style bottom navigation on phones. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { cartCount, wishlist, setCartOpen, setAssistantOpen, settings } = useStore();
  const item = "relative flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10.5px] tracking-wide";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[58] flex border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <Link href="/" className={`${item} ${active("/") ? "text-ink" : "text-muted"}`}>
        <Home className="size-5" strokeWidth={1.7} /> Home
      </Link>
      <Link href="/shop" className={`${item} ${active("/shop") ? "text-ink" : "text-muted"}`}>
        <LayoutGrid className="size-5" strokeWidth={1.7} /> Shop
      </Link>
      {settings.aiAssistantEnabled ? (
        <button onClick={() => setAssistantOpen(true)} className={`${item} text-ink`}>
          <span className="-mt-5 grid size-12 place-items-center rounded-full bg-ink text-gold-2 shadow-lg ring-4 ring-paper">
            <Sparkles className="size-5" />
          </span>
          Ask {settings.aiAssistantName}
        </button>
      ) : (
        <Link href="/custom-order" className={`${item} ${active("/custom-order") ? "text-ink" : "text-muted"}`}>
          <Sparkles className="size-5" strokeWidth={1.7} /> Custom
        </Link>
      )}
      <Link href="/wishlist" className={`${item} ${active("/wishlist") ? "text-ink" : "text-muted"}`}>
        <Heart className="size-5" strokeWidth={1.7} /> Saved
        {wishlist.length > 0 && <span className="absolute right-[26%] top-1 size-2 rounded-full bg-rose" />}
      </Link>
      <button onClick={() => setCartOpen(true)} className={`${item} text-muted`}>
        <ShoppingBag className="size-5" strokeWidth={1.7} /> Bag
        {cartCount > 0 && <span className="absolute right-[24%] top-1 grid size-4 place-items-center rounded-full bg-ink text-[9px] text-cream">{cartCount}</span>}
      </button>
    </nav>
  );
}
