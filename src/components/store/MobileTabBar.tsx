"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, PenTool, ShoppingBag, type LucideIcon } from "lucide-react";
import { useStore } from "./StoreProvider";

type Tab = { key: string; label: string; icon: LucideIcon; href?: string; match?: (p: string) => boolean };

const TABS: Tab[] = [
  { key: "home", label: "Home", icon: House, href: "/", match: (p) => p === "/" },
  { key: "shop", label: "Shop", icon: LayoutGrid, href: "/shop", match: (p) => p.startsWith("/shop") || p.startsWith("/product") },
  { key: "custom", label: "Custom", icon: PenTool, href: "/custom-order", match: (p) => p.startsWith("/custom-order") },
  { key: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist", match: (p) => p.startsWith("/wishlist") },
  { key: "bag", label: "Bag", icon: ShoppingBag },
];

/**
 * App-style bottom navigation below 1024px. One shared sindoor bindi glides above the
 * active tab. `tabbar` lets globals.css slide it away while the PDP sticky buy bar shows.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { cartCount, cartOpen, setCartOpen, addedTick } = useStore();
  const routeIndex = TABS.findIndex((t) => t.match?.(pathname));
  const activeIndex = cartOpen ? TABS.length - 1 : routeIndex;

  const item = "relative flex h-16 flex-col items-center justify-start pt-3.5 text-[11px] leading-none font-medium transition-colors duration-150";
  const iconBox = "relative grid size-[22px] place-items-center";

  return (
    <nav
      aria-label="Shortcuts"
      className="tabbar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] backdrop-blur-[16px] backdrop-saturate-[1.8] transition-transform duration-300 ease-out supports-[backdrop-filter:blur(0)]:bg-canvas/92 lg:hidden"
    >
      <div className="relative mx-auto grid max-w-xl grid-cols-5">
        {/* The single gliding bindi */}
        <span
          aria-hidden
          className={`pointer-events-none absolute top-[3px] left-0 flex w-1/5 justify-center transition-[translate,opacity] duration-[260ms] ease-out ${activeIndex < 0 ? "opacity-0" : "opacity-100"}`}
          style={{ translate: `${Math.max(0, activeIndex) * 100}% 0` }}
        >
          <span className="size-[5px] rounded-full bg-accent" />
        </span>

        {TABS.map((t, i) => {
          const Icon = t.icon;
          const isActive = i === activeIndex;
          const tone = isActive ? "text-ink" : "text-muted";
          const content = (
            <>
              <span className={iconBox}>
                <Icon className="size-[22px]" strokeWidth={1.5} aria-hidden />
                {t.key === "bag" && cartCount > 0 && (
                  <span
                    key={addedTick}
                    aria-hidden
                    className={`absolute -top-1.5 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[11px] leading-none font-semibold text-canvas tabular ${addedTick ? "animate-pop" : ""}`}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span className="mt-1">{t.label}</span>
            </>
          );
          return t.href ? (
            <Link key={t.key} href={t.href} aria-current={isActive ? "page" : undefined} className={`${item} ${tone}`}>
              {content}
            </Link>
          ) : (
            <button
              key={t.key}
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={cartCount ? `Bag, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Bag"}
              aria-haspopup="dialog"
              className={`${item} ${tone}`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
