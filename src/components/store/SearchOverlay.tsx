"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock, CornerDownLeft, Search, Sparkles, X } from "lucide-react";
import { EmptyArt, Eyebrow } from "@/components/brand";
import { formatINR, imgUrl } from "@/lib/format";
import type { Category } from "@/lib/types";
import { useStore } from "./StoreProvider";
import { useFocusTrap, usePresence, useScrollLock } from "./chrome/hooks";

type Hit = { id: string; slug: string; name: string; price: number; images: string[]; categoryName: string | null };
type Option = { id: string; href: string; label: string; kind: "craft" | "piece" | "all" };

const POPULAR: { label: string; href?: string }[] = [
  { label: "Lippan" },
  { label: "Name plate" },
  { label: "Diwali" },
  { label: "Housewarming gift" },
  { label: "Wall decor" },
  { label: "Under ₹1,000", href: "/shop?price=0-999" },
];

/** Bold the matched part of a label (Manrope only — never bold serif). */
function Highlight({ text, term }: { text: string; term: string }) {
  const i = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold">{text.slice(i, i + term.length)}</span>
      {text.slice(i + term.length)}
    </>
  );
}

/**
 * Predictive search. Phones: full screen. Desktop: a 720px panel dropping from the header.
 * Combobox pattern: arrow keys move the active row (aria-activedescendant), Enter opens, Esc closes.
 */
export function SearchOverlay({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const { mounted, visible } = usePresence(open, 200);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [top, setTop] = useState(72);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setAssistantOpen, settings } = useStore();
  const uid = useId();
  const listboxId = `${uid}-results`;

  useFocusTrap(panelRef, open, { onEscape: onClose, initialFocus: inputRef });
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    try {
      setRecent(JSON.parse(localStorage.getItem("ka_searches") ?? "[]"));
    } catch {}
    const header = document.querySelector("[data-site-header]");
    if (header) setTop(Math.max(0, Math.round(header.getBoundingClientRect().bottom)));
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    setActive(-1);
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      const under = term.match(/under\s*₹?\s*([\d,]+)/i);
      const max = under ? Number(under[1].replace(/,/g, "")) : 0;
      const url = `/api/products?limit=6&q=${encodeURIComponent(under ? term.replace(under[0], "").trim() : term)}`;
      fetch(url, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => {
          setHits((d.products ?? []).filter((p: Hit) => !max || p.price <= max));
          setLoading(false);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const term = q.trim();
  const flat = useMemo(() => categories.flatMap((c) => [c, ...(c.children ?? [])]), [categories]);
  const catHits = term.length >= 2 ? flat.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).slice(0, 4) : [];
  const options: Option[] =
    term.length >= 2
      ? [
          ...catHits.map((c) => ({ id: `${uid}-c-${c.id}`, href: `/shop?category=${c.slug}`, label: c.name, kind: "craft" as const })),
          ...hits.map((h) => ({ id: `${uid}-p-${h.id}`, href: `/product/${h.slug}`, label: h.name, kind: "piece" as const })),
          ...(hits.length > 0 ? [{ id: `${uid}-all`, href: `/shop?q=${encodeURIComponent(term)}`, label: `See all results for “${term}”`, kind: "all" as const }] : []),
        ]
      : [];

  // Keep the active row in view.
  useEffect(() => {
    if (active < 0) return;
    document.getElementById(options[active]?.id ?? "")?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const remember = (t: string) => {
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem("ka_searches", JSON.stringify(next));
    } catch {}
  };
  const go = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    remember(t);
    onClose();
    router.push(`/shop?q=${encodeURIComponent(t)}`);
  };
  const openOption = (o: Option) => {
    if (term) remember(term);
    onClose();
    router.push(o.href);
  };
  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem("ka_searches");
    } catch {}
    inputRef.current?.focus();
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!options.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0 && options[active]) {
      e.preventDefault();
      openOption(options[active]);
    }
  };

  if (!mounted) return null;

  const optionProps = (o: Option) => {
    const idx = options.findIndex((x) => x.id === o.id);
    return {
      id: o.id,
      role: "option" as const,
      "aria-selected": idx === active,
      tabIndex: -1,
      onMouseMove: () => idx !== active && setActive(idx),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        openOption(o);
      },
      href: o.href,
    };
  };
  const pieceOptions = options.filter((o) => o.kind === "piece");
  const allOption = options.find((o) => o.kind === "all");

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Scrim (desktop only, starts under the header so it stays readable) */}
      <div
        aria-hidden
        onClick={onClose}
        style={{ top }}
        className={`absolute inset-x-0 bottom-0 hidden bg-ink-deep/40 transition-opacity duration-200 lg:block ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        style={{ "--search-top": `${top + 8}px` } as React.CSSProperties}
        className={`absolute inset-0 flex flex-col bg-surface transition-[opacity,translate] duration-200 ease-out lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-[var(--search-top)] lg:max-h-[calc(100dvh-var(--search-top)-24px)] lg:w-[720px] lg:-translate-x-1/2 lg:rounded-[2px] lg:shadow-float ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
        }`}
      >
        {/* Input row */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (active >= 0 && options[active]) openOption(options[active]);
            else go(q);
          }}
          className="flex shrink-0 items-center gap-1 px-2 pt-[env(safe-area-inset-top)] lg:px-6 lg:pt-4"
        >
          <button type="button" onClick={onClose} className="icon-btn lg:hidden!" aria-label="Close search">
            <ArrowLeft className="size-5" strokeWidth={1.5} />
          </button>
          <label className="flex h-14 min-w-0 flex-1 items-center gap-3 border-b border-ink">
            <Search aria-hidden className="hidden size-5 shrink-0 text-muted lg:block" strokeWidth={1.5} />
            <span className="sr-only">Search the studio</span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Search pieces, crafts, gifts"
              className="h-full min-w-0 flex-1 bg-transparent font-display text-[24px] leading-none text-ink outline-none placeholder:text-muted"
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={options.length > 0}
              aria-controls={listboxId}
              aria-activedescendant={active >= 0 ? options[active]?.id : undefined}
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  inputRef.current?.focus();
                }}
                className="shrink-0 px-1 text-[13px] font-medium text-muted hover:text-ink"
              >
                Clear
              </button>
            )}
          </label>
          <button type="button" onClick={onClose} className="icon-btn max-lg:hidden! ml-2" aria-label="Close search">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-[calc(32px+env(safe-area-inset-bottom))] lg:px-6 lg:pb-6">
          {term.length < 2 ? (
            <div className="space-y-8">
              {recent.length > 0 && (
                <section>
                  <div className="flex items-center justify-between">
                    <Eyebrow dot={false}>Recent</Eyebrow>
                    <button type="button" onClick={clearRecent} className="text-[13px] font-medium text-muted hover:text-ink">
                      Clear
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} type="button" onClick={() => go(r)} className="chip">
                        <Clock aria-hidden className="size-3.5 text-muted" strokeWidth={1.75} /> {r}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <section>
                <Eyebrow dot={false}>Popular</Eyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR.map((p) =>
                    p.href ? (
                      <Link key={p.label} href={p.href} onClick={onClose} className="chip">
                        {p.label}
                      </Link>
                    ) : (
                      <button key={p.label} type="button" onClick={() => go(p.label)} className="chip">
                        {p.label}
                      </button>
                    ),
                  )}
                </div>
              </section>
              {categories.length > 0 && (
                <section>
                  <Eyebrow>Browse by craft</Eyebrow>
                  <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
                    {categories.slice(0, 4).map((c) => (
                      <li key={c.id}>
                        <Link href={`/shop?category=${c.slug}`} onClick={onClose} className="group block">
                          <span className="hover-zoom block aspect-[3/4] overflow-hidden rounded-[2px] bg-plinth">
                            {c.image ? (
                              <img src={imgUrl(c.image, 400)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                            ) : (
                              <span className="grid size-full place-items-center">
                                <EmptyArt kind="plate" size={40} />
                              </span>
                            )}
                          </span>
                          <span className="mt-2 block font-display text-[17px] leading-snug">{c.name}</span>
                          {typeof c.productCount === "number" && (
                            <span className="craft-line mt-0.5 block tabular">
                              {c.productCount} {c.productCount === 1 ? "piece" : "pieces"}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {settings.aiAssistantEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setAssistantOpen(true);
                  }}
                  className="flex w-full items-center gap-3 border-t border-line pt-5 text-left"
                >
                  <Sparkles aria-hidden className="size-3.5 shrink-0 text-accent" />
                  <span className="text-[15px]">
                    Not sure what you&rsquo;re looking for?{" "}
                    <span className="link font-medium">
                      Ask {settings.aiAssistantName} <span className="arrow">→</span>
                    </span>
                  </span>
                </button>
              )}
            </div>
          ) : (
            <>
              {(catHits.length > 0 || hits.length > 0) && (
                <div id={listboxId} role="listbox" aria-label="Search results">
                  {catHits.length > 0 && (
                    <div role="group" aria-labelledby={`${uid}-crafts`} className="mb-6">
                      <Eyebrow className="mb-2">
                        <span id={`${uid}-crafts`}>Crafts</span>
                      </Eyebrow>
                      {options
                        .filter((o) => o.kind === "craft")
                        .map((o) => {
                          const c = catHits.find((x) => o.id === `${uid}-c-${x.id}`);
                          return (
                            <Link
                              key={o.id}
                              {...optionProps(o)}
                              className="-mx-3 flex min-h-11 items-center gap-3 rounded-[4px] px-3 text-[15px] aria-selected:bg-plinth"
                            >
                              <span>
                                <Highlight text={o.label} term={term} />
                              </span>
                              {typeof c?.productCount === "number" && (
                                <span className="ml-auto text-[11px] font-semibold text-muted tabular">
                                  {c.productCount}
                                  <span className="sr-only"> pieces</span>
                                </span>
                              )}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                  {hits.length > 0 && (
                    <div role="group" aria-labelledby={`${uid}-pieces`}>
                      <Eyebrow className="mb-2">
                        <span id={`${uid}-pieces`}>Pieces</span>
                      </Eyebrow>
                      {pieceOptions.map((o) => {
                        const h = hits.find((x) => o.id === `${uid}-p-${x.id}`);
                        if (!h) return null;
                        return (
                          <Link key={o.id} {...optionProps(o)} className="-mx-3 flex items-center gap-4 rounded-[4px] px-3 py-2 aria-selected:bg-plinth">
                            <span className="h-[60px] w-12 shrink-0 overflow-hidden rounded-[2px] bg-plinth">
                              <img src={imgUrl(h.images[0], 120)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                            </span>
                            <span className="min-w-0 flex-1">
                              {h.categoryName && <span className="craft-line block truncate">{h.categoryName}</span>}
                              <span className="mt-0.5 block truncate font-display text-[16px] leading-snug">{h.name}</span>
                            </span>
                            <span className="shrink-0 text-[15px] font-medium tabular">{formatINR(h.price)}</span>
                          </Link>
                        );
                      })}
                      {allOption && (
                        <Link
                          {...optionProps(allOption)}
                          className="-mx-3 mt-3 flex min-h-11 items-center justify-between gap-3 rounded-[4px] px-3 text-[15px] font-medium aria-selected:bg-plinth"
                        >
                          <span className="link">{allOption.label}</span>
                          <CornerDownLeft aria-hidden className="size-4 text-muted" strokeWidth={1.5} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {loading && hits.length === 0 && (
                <div aria-hidden className="space-y-3">
                  <Eyebrow className="mb-2">Pieces</Eyebrow>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="skeleton h-[60px] w-12 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3.5 w-[70%]" />
                        <div className="skeleton h-3 w-[40%]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && hits.length === 0 && catHits.length === 0 && (
                <div className="flex flex-col items-center py-10 text-center">
                  <EmptyArt kind="plate" />
                  <p className="mt-4 font-display text-[24px] leading-tight">Nothing matches &ldquo;{term}&rdquo; yet</p>
                  <p className="mt-2 text-[15px] text-muted">Kavita can make it for you, by hand.</p>
                  <Link href="/custom-order" onClick={onClose} className="btn btn-primary mt-6">
                    Request a custom piece
                  </Link>
                </div>
              )}
              <p className="sr-only" aria-live="polite">
                {loading ? "" : `${hits.length} ${hits.length === 1 ? "piece" : "pieces"} and ${catHits.length} ${catHits.length === 1 ? "craft" : "crafts"} found`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
