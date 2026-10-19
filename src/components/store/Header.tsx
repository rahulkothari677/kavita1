"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X, ChevronDown, Sparkles } from "lucide-react";
import { useStore } from "./StoreProvider";
import { SearchOverlay } from "./SearchOverlay";
import type { Category } from "@/lib/types";

export function Header({ categories, announcement }: { categories: Category[]; announcement: string | null }) {
  const { cartCount, setCartOpen, wishlist, settings } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShopOpen(false);
  }, [pathname]);

  const nav = [
    { href: "/shop", label: "Shop" },
    { href: "/custom-order", label: "Custom Orders" },
    { href: "/gift-finder", label: "Gift Finder" },
    { href: "/about", label: "Our Story" },
  ];

  return (
    <>
      {announcement && (
        <div className="relative overflow-hidden bg-ink text-on-ink">
          <div className="marquee flex w-max gap-16 py-2 text-[12.5px] tracking-wide">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>{announcement}</span>
            ))}
          </div>
        </div>
      )}
      <header
        className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-canvas/90 shadow-[0_8px_30px_-12px_color-mix(in_srgb,var(--color-ink)_25%,transparent)] backdrop-blur-md" : "bg-canvas"}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-20 md:px-6">
          <button className="-ml-1 p-2 md:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-2.5" aria-label={settings.storeName}>
            <img src="/brand/medallion.webp" alt="" className="size-10 rounded-full shadow-md md:size-12" />
            <span className="leading-none">
              <span className="block font-display text-[22px] font-semibold tracking-tight md:text-[26px]">Kavita&apos;s</span>
              <span className="block text-[9.5px] tracking-[0.32em] text-ink/70 md:text-[10.5px]">ARTISTRY</span>
            </span>
          </Link>

          <nav className="ml-8 hidden items-center gap-1 md:flex">
            <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
              <Link href="/shop" className="flex items-center gap-1 rounded-full px-4 py-2 text-[15px] hover:bg-ink/5">
                Shop <ChevronDown className="size-3.5" />
              </Link>
              {shopOpen && categories.length > 0 && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="grid w-[640px] grid-cols-3 gap-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl">
                    {categories.map((c) => (
                      <div key={c.id}>
                        <Link href={`/shop?category=${c.slug}`} className="font-display text-lg font-semibold hover:text-accent">
                          {c.name}
                        </Link>
                        <ul className="mt-1.5 space-y-1">
                          {c.children?.map((s) => (
                            <li key={s.id}>
                              <Link href={`/shop?category=${s.slug}`} className="text-sm text-muted hover:text-ink">
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <Link href="/shop" className="col-span-3 mt-1 border-t border-ink/10 pt-4 text-sm font-medium text-ink-soft">
                      View all handmade pieces →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {nav.slice(1).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-4 py-2 text-[15px] hover:bg-ink/5 ${pathname === n.href ? "text-accent" : ""}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button className="rounded-full p-2.5 hover:bg-ink/5" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </button>
            <Link href="/wishlist" className="relative hidden rounded-full p-2.5 hover:bg-ink/5 sm:block" aria-label="Wishlist">
              <Heart className="size-5" />
              {wishlist.length > 0 && (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-danger text-[10px] text-white">{wishlist.length}</span>
              )}
            </Link>
            <button className="relative rounded-full p-2.5 hover:bg-ink/5" aria-label="Open bag" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-ink text-[10px] text-on-ink">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={closeSearch} categories={categories} />

      {menuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm animate-fade-up flex-col overflow-y-auto bg-canvas p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-2xl font-semibold">Menu</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <Link href="/shop" className="border-b border-ink/10 py-3 text-lg">
              Shop all
            </Link>
            {categories.map((c) => (
              <div key={c.id} className="border-b border-ink/10 py-3">
                <Link href={`/shop?category=${c.slug}`} className="text-lg">
                  {c.name}
                </Link>
                {c.children && c.children.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.children.map((s) => (
                      <Link key={s.id} href={`/shop?category=${s.slug}`} className="rounded-full bg-tint px-3 py-1 text-sm">
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {nav.slice(1).map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-ink/10 py-3 text-lg">
                {n.label}
              </Link>
            ))}
            <Link href="/wishlist" className="border-b border-ink/10 py-3 text-lg">
              Wishlist
            </Link>
            <Link href="/track" className="border-b border-ink/10 py-3 text-lg">
              Track your order
            </Link>
            <Link href="/faq" className="border-b border-ink/10 py-3 text-lg">
              FAQs
            </Link>
            <Link href="/gift-finder" className="btn btn-accent mt-6">
              <Sparkles className="size-4" /> Find the perfect gift
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
