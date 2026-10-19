"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { WhatsAppIcon } from "@/components/Motifs";
import { waLink } from "@/lib/whatsapp";
import type { Category } from "@/lib/types";
import { useStore } from "./StoreProvider";
import { SearchOverlay } from "./SearchOverlay";
import { CraftsMenu } from "./chrome/CraftsMenu";
import { MobileMenu } from "./chrome/MobileMenu";

// Desktop nav: Manrope 500 14px; underline draws from the left in sindoor on hover.
const NAV_LINK =
  "relative py-2 text-[14px] font-medium tracking-[0.01em] text-ink after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-[240ms] after:ease-out hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 aria-[current=page]:after:bg-ink";

function CountBadge({ count, bumpKey }: { count: number; bumpKey?: number }) {
  if (count <= 0) return null;
  return (
    <span
      key={bumpKey}
      aria-hidden
      className={`absolute -top-1.5 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[11px] leading-none font-semibold text-canvas tabular ${bumpKey ? "animate-pop" : ""}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Header({ categories }: { categories: Category[] }) {
  const { cartCount, setCartOpen, wishlist, settings, addedTick } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const pathname = usePathname();
  const lastY = useRef(0);

  // Frost after 8px; on phones tuck away on scroll-down and reveal on scroll-up.
  useEffect(() => {
    let frame = 0;
    lastY.current = window.scrollY;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.max(0, window.scrollY);
        setScrolled(y > 8);
        const dy = y - lastY.current;
        if (Math.abs(dy) < 6) return;
        setTucked(dy > 0 && y > 160);
        lastY.current = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setTucked(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/shop" ? pathname === "/shop" : pathname.startsWith(href));
  const nav = [
    { href: "/custom-order", label: "Custom orders" },
    { href: "/gift-finder", label: "Gift finder" },
    { href: "/about", label: "Our story", wide: true },
  ];
  const help = waLink(settings.whatsappNumber, "Hi Kavita’s Artistry! I have a question.");
  const hide = tucked && !menuOpen && !searchOpen;

  return (
    <>
      <header
        data-site-header
        style={{ viewTransitionName: "site-header" }}
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,translate] duration-[280ms] ease-out ${
          scrolled
            ? "border-line bg-canvas backdrop-blur-[16px] backdrop-saturate-[1.8] supports-[backdrop-filter:blur(0)]:bg-canvas/88"
            : "border-transparent bg-canvas"
        } ${hide ? "max-lg:-translate-y-full" : ""}`}
      >
        <div className="container-x flex h-[64px] items-center lg:grid lg:h-[88px] lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          {/* Desktop nav (left) */}
          <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-7">
            <Link href="/shop" aria-current={isActive("/shop") ? "page" : undefined} className={NAV_LINK}>
              Shop
            </Link>
            {categories.length > 0 && <CraftsMenu categories={categories} navLinkClass={NAV_LINK} />}
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`${NAV_LINK} ${n.wide ? "hidden xl:inline-block" : ""}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Wordmark: left on phones, centred on desktop */}
          <Link href="/" aria-label="Kavita’s Artistry, home" className="mr-auto shrink-0 lg:mr-0 lg:justify-self-center">
            <span className="lg:hidden">
              <Wordmark size="sm" />
            </span>
            <span className="hidden lg:inline">
              <Wordmark tagline />
            </span>
          </Link>

          {/* Actions (right) */}
          <div className="-mr-3 flex items-center justify-end lg:-mr-2.5">
            <button type="button" className="icon-btn" aria-label="Search" aria-haspopup="dialog" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" strokeWidth={1.5} />
            </button>
            <a href={help} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Help on WhatsApp" title="Help on WhatsApp">
              <WhatsAppIcon className="size-5" />
            </a>
            <Link
              href="/wishlist"
              className="icon-btn max-lg:hidden!"
              aria-label={wishlist.length ? `Wishlist, ${wishlist.length} saved` : "Wishlist"}
              aria-current={isActive("/wishlist") ? "page" : undefined}
            >
              <span className="relative">
                <Heart className="size-5" strokeWidth={1.5} />
                <CountBadge count={wishlist.length} />
              </span>
            </Link>
            <button
              type="button"
              className="icon-btn max-lg:hidden!"
              aria-label={cartCount ? `Bag, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Bag"}
              aria-haspopup="dialog"
              onClick={() => setCartOpen(true)}
            >
              <span className="relative">
                <ShoppingBag className="size-5" strokeWidth={1.5} />
                <CountBadge count={cartCount} bumpKey={addedTick} />
              </span>
            </button>
            <button
              type="button"
              className="icon-btn lg:hidden!"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={closeSearch} categories={categories} />
      <MobileMenu open={menuOpen} onClose={closeMenu} categories={categories} />
    </>
  );
}
