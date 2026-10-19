"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock, Search, Sparkles, X } from "lucide-react";
import { formatINR, imgUrl } from "@/lib/format";
import type { Category } from "@/lib/types";
import { useStore } from "./StoreProvider";

type Hit = { id: string; slug: string; name: string; price: number; images: string[]; categoryName: string | null };

const POPULAR = ["Lippan", "Name plate", "Diwali", "Housewarming gift", "Wall decor", "Under 1500"];

/** Full-screen predictive search: instant results while typing, recent & popular searches. */
export function SearchOverlay({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setAssistantOpen, settings } = useStore();

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    try {
      setRecent(JSON.parse(localStorage.getItem("ka_searches") ?? "[]"));
    } catch {}
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setHits([]);
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      const under = term.match(/under\s*₹?\s*(\d+)/i);
      const url = `/api/products?limit=6&q=${encodeURIComponent(under ? term.replace(under[0], "").trim() : term)}`;
      fetch(url, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setHits((d.products ?? []).filter((p: Hit) => !under || p.price <= Number(under[1]))))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    try {
      localStorage.setItem("ka_searches", JSON.stringify(next));
    } catch {}
    onClose();
    router.push(`/shop?q=${encodeURIComponent(t)}`);
  };

  if (!open) return null;
  const flat = categories.flatMap((c) => [c, ...(c.children ?? [])]);
  const catHits = q.trim().length >= 2 ? flat.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 4) : [];

  return (
    <div className="fixed inset-0 z-[85] bg-canvas/98 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-4 pt-5 md:pt-14">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
          className="flex items-center gap-3 border-b-2 border-ink pb-3"
        >
          <Search className="size-6 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search handmade pieces…"
            className="min-w-0 flex-1 bg-transparent font-display text-3xl outline-none placeholder:text-ink/30 md:text-5xl"
            enterKeyHint="search"
          />
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-ink/5" aria-label="Close search">
            <X className="size-6" />
          </button>
        </form>

        <div className="mt-8 max-h-[calc(100vh-140px)] overflow-y-auto pb-10">
          {q.trim().length < 2 ? (
            <div className="space-y-8">
              {recent.length > 0 && (
                <div>
                  <p className="mb-3 text-xs tracking-[0.25em] text-muted uppercase">Recent</p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => go(r)} className="flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-sm hover:border-ink">
                        <Clock className="size-3.5 text-muted" /> {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-3 text-xs tracking-[0.25em] text-muted uppercase">Popular</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((r) => (
                    <button key={r} onClick={() => (r.startsWith("Under") ? (onClose(), router.push("/shop?price=0-999")) : go(r))} className="rounded-full bg-tint px-3.5 py-1.5 text-sm hover:bg-tint-strong">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs tracking-[0.25em] text-muted uppercase">Browse</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {categories.slice(0, 8).map((c) => (
                    <Link key={c.id} href={`/shop?category=${c.slug}`} onClick={onClose} className="group">
                      <img src={imgUrl(c.image, 300)} alt="" className="aspect-square w-full rounded-2xl object-cover transition group-hover:opacity-90" />
                      <p className="mt-2 font-display text-lg">{c.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
              {settings.aiAssistantEnabled && (
                <button
                  onClick={() => {
                    onClose();
                    setAssistantOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-ink p-4 text-left text-on-ink"
                >
                  <Sparkles className="size-5 text-accent-soft" />
                  <span className="flex-1">
                    <span className="block font-medium">Not sure what you&apos;re looking for?</span>
                    <span className="text-sm text-on-ink/70">Describe it to {settings.aiAssistantName}, our AI helper</span>
                  </span>
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <div>
              {catHits.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {catHits.map((c) => (
                    <Link key={c.id} href={`/shop?category=${c.slug}`} onClick={onClose} className="rounded-full bg-tint px-3.5 py-1.5 text-sm">
                      in <b>{c.name}</b>
                    </Link>
                  ))}
                </div>
              )}
              {loading && hits.length === 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-2xl bg-tint" />
                  ))}
                </div>
              ) : hits.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-display text-2xl">No pieces match “{q}”</p>
                  <p className="mt-2 text-sm text-muted">We can make it for you!</p>
                  <Link href="/custom-order" onClick={onClose} className="btn btn-primary mt-5">
                    Request a custom piece
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {hits.map((h) => (
                      <Link key={h.id} href={`/product/${h.slug}`} onClick={onClose} className="group">
                        <img src={imgUrl(h.images[0], 400)} alt={h.name} className="aspect-square w-full rounded-2xl object-cover transition group-hover:opacity-90" />
                        <p className="mt-2 font-display text-lg leading-tight">{h.name}</p>
                        <p className="text-sm text-muted">{formatINR(h.price)}</p>
                      </Link>
                    ))}
                  </div>
                  <button onClick={() => go(q)} className="btn btn-outline mt-8 w-full">
                    See all results for “{q}” <ArrowRight className="size-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
