"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, House, LayoutGrid, PenTool, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";
import { useStore } from "./StoreProvider";

type Tab = { key: string; label: string; icon: LucideIcon; href?: string; match?: (p: string) => boolean };

const SIDE_TABS: Tab[] = [
  { key: "home", label: "Home", icon: House, href: "/", match: (p) => p === "/" },
  { key: "shop", label: "Shop", icon: LayoutGrid, href: "/shop", match: (p) => p.startsWith("/shop") || p.startsWith("/product") },
  { key: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist", match: (p) => p.startsWith("/wishlist") },
  { key: "bag", label: "Bag", icon: ShoppingBag },
];

/**
 * App-style floating dock below 1024px: Home · Shop · [centre action] · Wishlist · Bag.
 * The raised centre button opens the AI helper (or Custom orders when the helper is off), so
 * nothing floats over the products any more. A soft pill glides behind the active tab.
 * `tabbar` lets globals.css slide it away while the PDP sticky buy bar shows.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { cartCount, cartOpen, setCartOpen, addedTick, wishlist, settings, assistantOpen, setAssistantOpen } = useStore();
  const ai = settings.aiAssistantEnabled;

  // Slots 0,1 | centre (2) | 3,4
  // The tapped tab lights up at once (before the next page arrives), then the route takes over.
  const [tapped, setTapped] = useState<{ index: number; from: string } | null>(null);
  useEffect(() => setTapped(null), [pathname]);
  const routeIndex = tapped && tapped.from === pathname ? tapped.index : SIDE_TABS.findIndex((t) => t.match?.(pathname));
  const customActive = !ai && pathname.startsWith("/custom-order");
  const sideActive = cartOpen ? 3 : routeIndex;
  const slot = customActive || (ai && assistantOpen) ? 2 : sideActive < 0 ? -1 : sideActive < 2 ? sideActive : sideActive + 1;

  const item = "relative z-[1] flex h-[60px] flex-col items-center justify-center gap-1 text-[10.5px] leading-none font-semibold tracking-[0.01em] transition-colors duration-200";

  const sideTab = (t: Tab, i: number) => {
    const Icon = t.icon;
    const isActive = sideActive === i && slot !== 2;
    const tone = isActive ? "text-accent" : "text-muted";
    const badge = t.key === "bag" ? cartCount : t.key === "wishlist" ? wishlist.length : 0;
    const content = (
      <>
        <span className="relative grid size-6 place-items-center" data-bag-target={t.key === "bag" ? "" : undefined}>
          <Icon
            className={`size-[22px] transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
            strokeWidth={isActive ? 1.9 : 1.5}
            fill={isActive && t.key === "wishlist" ? "currentColor" : "none"}
            aria-hidden
          />
          {badge > 0 && (
            <span
              key={t.key === "bag" ? addedTick : undefined}
              aria-hidden
              className={`absolute -top-1.5 -right-2.5 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10.5px] leading-none font-bold text-canvas tabular ring-2 ring-surface ${
                t.key === "bag" ? "bg-accent" : "bg-ink"
              } ${t.key === "bag" && addedTick ? "animate-pop" : ""}`}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
        <span>{t.label}</span>
      </>
    );
    return t.href ? (
      <Link key={t.key} href={t.href} onClick={() => setTapped({ index: i, from: pathname })} aria-current={isActive ? "page" : undefined} className={`${item} ${tone}`}>
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
  };

  const centreCls =
    "relative z-[1] -mt-10 grid size-[58px] place-items-center justify-self-center rounded-full bg-ink text-canvas shadow-float ring-4 ring-surface transition-transform duration-200 active:scale-[0.92]";
  const centreLabel = "absolute top-[calc(100%+1px)] text-[10.5px] leading-none font-semibold whitespace-nowrap text-muted";

  return (
    <nav
      aria-label="Shortcuts"
      style={{ viewTransitionName: "tab-dock" }}
      className="tabbar pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] transition-transform duration-300 ease-out lg:hidden"
    >
      <div className="pointer-events-auto relative mx-auto grid max-w-md grid-cols-5 items-center rounded-[26px] border border-line/70 bg-surface/90 px-1 shadow-dock backdrop-blur-xl backdrop-saturate-150">
        {/* The gliding highlight behind the active side tab */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-[7px] left-1 w-[calc((100%-8px)/5)] transition-[translate,opacity] duration-[320ms] ease-[cubic-bezier(.34,1.3,.64,1)] ${
            slot < 0 || slot === 2 ? "opacity-0" : "opacity-100"
          }`}
          style={{ translate: `${Math.max(0, slot) * 100}% 0` }}
        >
          <span className="mx-auto block h-full w-[86%] rounded-[18px] bg-accent-tint" />
        </span>

        {SIDE_TABS.slice(0, 2).map((t, i) => sideTab(t, i))}

        {ai ? (
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            aria-label={`Ask ${settings.aiAssistantName}, our gift and decor helper`}
            aria-haspopup="dialog"
            aria-expanded={assistantOpen}
            className={centreCls}
          >
            <Sparkles className="size-6" strokeWidth={1.6} aria-hidden />
            <span aria-hidden className={centreLabel}>
              {settings.aiAssistantName}
            </span>
          </button>
        ) : (
          <Link href="/custom-order" aria-current={customActive ? "page" : undefined} aria-label="Custom orders" className={centreCls}>
            <PenTool className="size-[22px]" strokeWidth={1.6} aria-hidden />
            <span aria-hidden className={centreLabel}>
              Custom
            </span>
          </Link>
        )}

        {SIDE_TABS.slice(2).map((t, i) => sideTab(t, i + 2))}
      </div>
    </nav>
  );
}
