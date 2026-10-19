"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { EmptyArt, Eyebrow } from "@/components/brand";
import { imgUrl } from "@/lib/format";
import type { Category } from "@/lib/types";

const OPEN_DELAY = 120;
const CLOSE_DELAY = 200;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Desktop "Crafts" disclosure + full-width mega menu.
 * The panel is absolutely positioned against the sticky header (its nearest positioned
 * ancestor), so the trigger can live inside the nav while the panel spans the full width.
 */
export function CraftsMenu({ categories, navLinkClass }: { categories: Category[]; navLinkClass: string }) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = closeTimer.current = null;
  };
  const openedAt = useRef(0);
  const show = useCallback(() => {
    openedAt.current = Date.now();
    setOpen(true);
    setEverOpened(true);
  }, []);
  const close = useCallback((returnFocus = false) => {
    clearTimers();
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);
  const scheduleOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    if (open || openTimer.current) return;
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      show();
    }, OPEN_DELAY);
  };
  const scheduleClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = null;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, CLOSE_DELAY);
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Outside click / focus leaving the menu closes it.
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) => t instanceof Node && (panelRef.current?.contains(t) || triggerRef.current?.contains(t));
    const onPointer = (e: PointerEvent) => !inside(e.target) && close();
    const onFocus = (e: FocusEvent) => !inside(e.target) && close();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const rows = () => Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>("[data-craft-row]") ?? []);
  const focusRow = (i: number) => {
    const list = rows();
    if (!list.length) return;
    const n = (i + list.length) % list.length;
    list[n].focus();
    setActive(n);
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      show();
      requestAnimationFrame(() => requestAnimationFrame(() => focusRow(0)));
    }
  };
  const onPanelKey = (e: React.KeyboardEvent) => {
    const list = rows();
    const idx = list.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusRow(idx < 0 ? 0 : idx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx <= 0) triggerRef.current?.focus();
      else focusRow(idx - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusRow(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusRow(list.length - 1);
    }
  };

  const current = categories[active] ?? categories[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="crafts-menu"
        onClick={() => {
          // A click right after hover-intent opened the menu should not slam it shut.
          if (open && Date.now() - openedAt.current > 400) return close();
          clearTimers();
          show();
        }}
        onKeyDown={onTriggerKey}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        className={`${navLinkClass} inline-flex items-center gap-1 ${open ? "after:scale-x-100" : ""}`}
      >
        Crafts
        <ChevronDown aria-hidden className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={1.75} />
      </button>

      <div
        id="crafts-menu"
        ref={panelRef}
        inert={!open}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onKeyDown={onPanelKey}
        className={`absolute inset-x-0 top-full hidden transition-[opacity,translate,visibility] duration-200 ease-out lg:block ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
        }`}
      >
        <div className="border-t border-line bg-surface shadow-float">
          <div className="container-x grid grid-cols-12 gap-6 py-10">
            <div className="col-span-7">
              <Eyebrow>Shop by craft</Eyebrow>
              <ul className="mt-5 border-t border-line">
                {categories.map((c, i) => (
                  <li key={c.id} className="border-b border-line">
                    <Link
                      data-craft-row
                      data-active={active === i}
                      href={`/shop?category=${c.slug}`}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className="group flex h-11 items-center gap-4 outline-offset-0"
                    >
                      <span className="w-6 text-[11px] font-semibold text-muted tabular">{pad(i + 1)}</span>
                      <span className="flex items-center gap-2.5 transition-transform duration-200 ease-out group-data-[active=true]:translate-x-2">
                        <span aria-hidden className="size-1.5 rounded-full bg-accent opacity-0 transition-opacity duration-200 group-data-[active=true]:opacity-100" />
                        <span className="font-display text-[22px] leading-none">{c.name}</span>
                      </span>
                      {typeof c.productCount === "number" && (
                        <span className="ml-auto text-[11px] font-semibold tracking-[0.1em] text-muted uppercase tabular">
                          {c.productCount}
                          <span className="sr-only"> pieces</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[14px] font-medium">
                <Link href="/shop" className="link">
                  Shop all pieces <span className="arrow">→</span>
                </Link>
                <Link href="/custom-order" className="link">
                  Commission a piece <span className="arrow">→</span>
                </Link>
              </div>
            </div>

            <div className="col-span-4 col-start-9">
              <div className="relative ml-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-[2px] bg-plinth">
                {everOpened &&
                  categories.map((c, i) =>
                    c.image ? (
                      <img
                        key={c.id}
                        src={imgUrl(c.image, 640)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`absolute inset-0 size-full object-cover transition-opacity duration-200 ease-out ${active === i ? "opacity-100" : "opacity-0"}`}
                      />
                    ) : (
                      <div
                        key={c.id}
                        aria-hidden
                        className={`absolute inset-0 grid place-content-center justify-items-center gap-3 transition-opacity duration-200 ${active === i ? "opacity-100" : "opacity-0"}`}
                      >
                        <EmptyArt kind="plate" size={48} />
                        <span className="craft-line">{c.name}</span>
                      </div>
                    ),
                  )}
              </div>
              {current && (
                <div className="ml-auto mt-4 w-full max-w-[320px]">
                  <p className="font-display text-[22px] leading-tight">{current.name}</p>
                  {current.description && <p className="mt-1 line-clamp-2 text-[14px] leading-normal text-muted">{current.description}</p>}
                  {current.children && current.children.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
                      {current.children.map((s) => (
                        <li key={s.id}>
                          <Link href={`/shop?category=${s.slug}`} className="link">
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
