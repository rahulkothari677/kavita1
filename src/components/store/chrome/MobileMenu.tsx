"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Eyebrow, Wordmark } from "@/components/brand";
import { WhatsAppIcon } from "@/components/Motifs";
import { waLink } from "@/lib/whatsapp";
import type { Category } from "@/lib/types";
import { useStore } from "../StoreProvider";
import { useFocusTrap, usePresence, useScrollLock } from "./hooks";

const pad = (n: number) => String(n).padStart(2, "0");

const LINKS = [
  { href: "/custom-order", label: "Custom orders" },
  { href: "/gift-finder", label: "Gift finder" },
  { href: "/about", label: "Our story" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/track", label: "Track your order" },
  { href: "/faq", label: "FAQs" },
];

/** Phone/tablet menu: a full-height surface sheet from the right with the craft index + sub-crafts. */
export function MobileMenu({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const { mounted, visible } = usePresence(open, 260);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { settings, wishlist } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  useFocusTrap(sheetRef, open, { onEscape: onClose });
  useScrollLock(open);
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-ink-deep/40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-surface shadow-float outline-none transition-transform ease-drawer ${
          visible ? "translate-x-0 duration-[420ms]" : "translate-x-full duration-[260ms]"
        }`}
      >
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line pr-1.5 pl-4">
          <Link href="/" onClick={onClose} aria-label="Kavita’s Artistry, home">
            <Wordmark size="sm" />
          </Link>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close menu">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav aria-label="Menu" className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-[calc(32px+env(safe-area-inset-bottom))]">
          <Eyebrow>Shop by craft</Eyebrow>
          <ul className="mt-4 border-t border-line">
            {categories.map((c, i) => {
              const subs = c.children ?? [];
              const isOpen = expanded === c.id;
              return (
                <li key={c.id} className="border-b border-line">
                  <div className="flex items-center">
                    <Link href={`/shop?category=${c.slug}`} onClick={onClose} className="flex min-h-[52px] flex-1 items-center gap-3 py-2">
                      <span className="w-6 text-[11px] font-semibold text-muted tabular">{pad(i + 1)}</span>
                      <span className="font-display text-[22px] leading-tight">{c.name}</span>
                      {typeof c.productCount === "number" && (
                        <span className="ml-auto pl-3 text-[11px] font-semibold text-muted tabular">
                          {c.productCount}
                          <span className="sr-only"> pieces</span>
                        </span>
                      )}
                    </Link>
                    {subs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                        aria-expanded={isOpen}
                        aria-controls={`sub-${c.id}`}
                        aria-label={`${isOpen ? "Hide" : "Show"} ${c.name} sub-categories`}
                        className="icon-btn -mr-2.5 ml-1 shrink-0"
                      >
                        <ChevronDown className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  {subs.length > 0 && (
                    <div id={`sub-${c.id}`} hidden={!isOpen} className="pb-4 pl-9">
                      <ul className="flex flex-wrap gap-2">
                        <li>
                          <Link href={`/shop?category=${c.slug}`} onClick={onClose} className="chip">
                            All {c.name.toLowerCase()}
                          </Link>
                        </li>
                        {subs.map((s) => (
                          <li key={s.id}>
                            <Link href={`/shop?category=${s.slug}`} onClick={onClose} className="chip">
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href="/shop" onClick={onClose} className="link mt-5 inline-block text-[15px] font-medium">
            Shop all pieces <span className="arrow">→</span>
          </Link>

          <ul className="mt-8 border-t border-line">
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-line">
                <Link href={l.href} onClick={onClose} className="flex min-h-[52px] items-center justify-between text-[16px] font-medium">
                  {l.label}
                  {l.href === "/wishlist" && wishlist.length > 0 && <span className="text-[13px] text-muted tabular">{wishlist.length}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <a
            href={waLink(settings.whatsappNumber, "Hi Kavita’s Artistry! I have a question.")}
            target="_blank"
            rel="noreferrer"
            className="btn btn-wa-outline btn-lg mt-8 w-full"
          >
            <WhatsAppIcon className="size-5" /> Ask us on WhatsApp
          </a>
        </nav>
      </div>
    </div>
  );
}
