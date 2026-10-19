"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, ViewTransition } from "react";
import { Check, CheckSquare, Copy, ExternalLink, Eye, EyeOff, LayoutGrid, List, Minus, MoreHorizontal, Package, Pencil, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { api, Empty, Modal, PageHeader, Switch, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, btn, cardShell, cx, field, FilterChips, ProgressDot, SearchField, Segmented, SheetRow, SkeletonGrid, SkeletonRows, Thumb, useActionToast, useConfirm, useOrigin } from "@/components/admin/pages/kit";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR, imgUrl } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

type FilterKey = "all" | "live" | "hidden" | "low" | "featured";
const LOW = (p: Product) => !p.madeToOrder && p.stock <= 2;
const FILTERS: { key: FilterKey; label: string; test: (p: Product) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "live", label: "Live", test: (p) => p.isActive },
  { key: "hidden", label: "Hidden", test: (p) => !p.isActive },
  { key: "low", label: "Low stock", test: LOW },
  { key: "featured", label: "Featured", test: (p) => p.isFeatured },
];
type View = "grid" | "table";
const VIEW_KEY = "ka-admin-products-view";
type Snap = Pick<Product, "id" | "isActive" | "isFeatured" | "categoryId" | "price">;

export default function ProductsPage() {
  const { data, setData, loading, reload } = useLoad<{ products: Product[] }>("/api/admin/products");
  const { data: catData } = useLoad<{ categories: Category[] }>("/api/admin/categories");
  const toast = useActionToast();
  const router = useRouter();
  const origin = useOrigin();
  const [ask, confirmDialog] = useConfirm();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [cat, setCat] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [view, setView] = useState<View>("grid");
  const [sheetFor, setSheetFor] = useState<Product | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "grid" || v === "table") setView(v);
    } catch {}
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const all = useMemo(() => data?.products ?? [], [data]);
  const cats = useMemo(() => catData?.categories ?? [], [catData]);
  const flatCats = cats.flatMap((c) => [c, ...(c.children ?? [])]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, all.filter(f.test).length])) as Record<FilterKey, number>, [all]);
  const products = useMemo(() => {
    let list = all.filter((FILTERS.find((f) => f.key === filter) ?? FILTERS[0]).test);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((p) => `${p.name} ${p.tags.join(" ")} ${p.categoryName ?? ""}`.toLowerCase().includes(s));
    }
    if (cat) {
      const ids = [cat, ...(cats.find((c) => c.id === cat)?.children?.map((c) => c.id) ?? [])];
      list = list.filter((p) => p.categoryId && ids.includes(p.categoryId));
    }
    return list;
  }, [all, q, filter, cat, cats]);

  const local = (id: string, body: Partial<Product>) => setData((d) => d && { products: d.products.map((p) => (p.id === id ? { ...p, ...body } : p)) });

  const patch = async (id: string, body: Partial<Product>) => {
    local(id, body);
    try {
      await api(`/api/admin/products/${id}`, { method: "PATCH", body });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update", "err");
      reload();
      throw e;
    }
  };

  const setLive = async (p: Product, isActive: boolean) => {
    try {
      await patch(p.id, { isActive });
      toast(isActive ? `${p.name} is live` : `${p.name} is hidden`, "ok", { label: "Undo", onClick: () => patch(p.id, { isActive: !isActive }).catch(() => {}) });
    } catch {}
  };

  const duplicate = async (p: Product) => {
    try {
      const r = await api<{ id: string }>(`/api/admin/products/${p.id}`, { method: "PATCH", body: { action: "duplicate" } });
      toast("Duplicated as a hidden draft", "ok", r?.id ? { label: "Edit copy", onClick: () => router.push(`/admin/products/${r.id}`) } : undefined);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not duplicate", "err");
    }
  };

  const removeOne = async (p: Product) => {
    const ok = await ask({ title: `Delete “${p.name}”?`, body: "The piece and its reviews will be removed from your shop. Hiding it keeps it safe instead.", confirmLabel: "Delete piece" });
    if (!ok) return;
    try {
      await api(`/api/admin/products/${p.id}`, { method: "DELETE" });
      setData((d) => d && { products: d.products.filter((x) => x.id !== p.id) });
      toast("Piece deleted");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete", "err");
    }
  };

  /** Bulk actions, with Undo that restores each piece's previous values. */
  const bulk = async (action: "patch" | "price" | "delete", patchBody?: Record<string, unknown>, msg = "Updated") => {
    const ids = sel.filter((id) => all.some((p) => p.id === id));
    if (!ids.length) return;
    if (action === "delete") {
      const ok = await ask({ title: `Delete ${ids.length} ${ids.length === 1 ? "piece" : "pieces"}?`, body: "They will be removed from your shop along with their reviews.", confirmLabel: `Delete ${ids.length}` });
      if (!ok) return;
    }
    const snap: Snap[] = all.filter((p) => ids.includes(p.id)).map(({ id, isActive, isFeatured, categoryId, price }) => ({ id, isActive, isFeatured, categoryId, price }));
    const keys = (action === "price" ? ["price"] : Object.keys(patchBody ?? {})) as (keyof Snap)[];
    try {
      await api("/api/admin/products/bulk", { body: { action, ids, patch: patchBody } });
      setSel([]);
      setSelecting(false);
      toast(
        `${msg} · ${ids.length}`,
        "ok",
        action === "delete"
          ? undefined
          : {
              label: "Undo",
              onClick: async () => {
                await Promise.allSettled(snap.map((s) => api(`/api/admin/products/${s.id}`, { method: "PATCH", body: Object.fromEntries(keys.map((k) => [k, s[k]])) })));
                reload();
              },
            },
      );
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update", "err");
    }
  };

  const toggleSel = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const shareUrl = (p: Product) => `https://wa.me/?text=${encodeURIComponent(`${p.name} · ${formatINR(p.price)}\n${origin}/product/${p.slug}`)}`;
  const liveCount = counts.live;

  return (
    <div className={ADMIN_ICONS}>
      <PageHeader
        title="Products"
        subtitle={data ? `${all.length} ${all.length === 1 ? "piece" : "pieces"} · ${liveCount} live` : undefined}
        actions={
          <>
            <Link href="/admin/products/bulk" className={btn("secondary")}>
              <Upload className="size-4" aria-hidden /> Bulk upload
            </Link>
            <Link href="/admin/products/new" className={btn("primary")}>
              <Plus className="size-4" aria-hidden /> Add product
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <SearchField value={q} onChange={setQ} label="Search products" placeholder="Search pieces, tags or categories" className="min-w-[200px] flex-1" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={cx(field, "w-auto! max-w-full")} aria-label="Filter by category">
            <option value="">All categories</option>
            {cats.map((c) => (
              <optgroup key={c.id} label={c.name}>
                <option value={c.id}>{c.name}</option>
                {c.children?.map((s) => (
                  <option key={s.id} value={s.id}>
                    ↳ {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <FilterChips label="Filter by status" value={filter} onChange={setFilter} items={FILTERS.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }))} className="min-w-0 flex-1" />
          <div className="hidden shrink-0 md:block">
            <Segmented
              label="Layout"
              value={view}
              onChange={(v) => (changeView(v), setSelecting(false))}
              items={[
                { key: "grid", label: <LayoutGrid className="size-4" aria-hidden />, aria: "Grid view" },
                { key: "table", label: <List className="size-4" aria-hidden />, aria: "Table view" },
              ]}
            />
          </div>
          <button
            type="button"
            onClick={() => (setSelecting((s) => !s), setSel([]))}
            aria-pressed={selecting}
            className={cx(btn(selecting ? "primary" : "secondary"), view === "table" && "md:hidden")}
          >
            <CheckSquare className="size-4" aria-hidden /> <span className="max-[380px]:sr-only">{selecting ? "Done" : "Select"}</span>
          </button>
        </div>
      </div>

      {sel.length > 0 && (
        <div className="on-dark sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-[8px] bg-ink px-3 py-2 text-white transition-[translate,opacity] duration-200 ease-[var(--ease-out)] starting:-translate-y-2 starting:opacity-0 md:top-2">
          <span className="tabular mr-1 px-1 text-[14px] font-semibold">{sel.length} selected</span>
          <button onClick={() => bulk("patch", { isActive: true }, "Published")} className={btn("onInk")}>
            <Eye className="size-4" aria-hidden /> Publish
          </button>
          <button onClick={() => bulk("patch", { isActive: false }, "Hidden")} className={btn("onInk")}>
            <EyeOff className="size-4" aria-hidden /> Hide
          </button>
          <button onClick={() => bulk("patch", { isFeatured: true }, "Featured")} className={btn("onInk")}>
            <Star className="size-4" aria-hidden /> Feature
          </button>
          <select
            onChange={(e) => e.target.value && bulk("patch", { categoryId: e.target.value === "none" ? null : e.target.value }, "Moved")}
            value=""
            aria-label="Move to category"
            className="h-11 rounded-[6px] border border-white/40 bg-transparent px-3 text-[14px] font-semibold text-white md:h-9"
          >
            <option value="">Move to…</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id} className="text-ink">
                {c.parentId ? "↳ " : ""}
                {c.name}
              </option>
            ))}
            <option value="none" className="text-ink">
              Uncategorised
            </option>
          </select>
          <select
            onChange={(e) => e.target.value && bulk("price", { percent: Number(e.target.value) }, "Prices updated")}
            value=""
            aria-label="Change price"
            className="h-11 rounded-[6px] border border-white/40 bg-transparent px-3 text-[14px] font-semibold text-white md:h-9"
          >
            <option value="">Change price…</option>
            {[-20, -10, -5, 5, 10, 20].map((p) => (
              <option key={p} value={p} className="text-ink">
                {p > 0 ? `+${p}%` : `${p}%`}
              </option>
            ))}
          </select>
          <button onClick={() => bulk("delete", undefined, "Deleted")} className={btn("onInk")}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </button>
          <button onClick={() => setSel([])} className="ml-auto grid size-11 place-items-center rounded-full text-white/80 hover:bg-white/10 md:size-9" aria-label="Clear selection">
            <X className="size-4" />
          </button>
        </div>
      )}

      {loading && !data ? (
        view === "table" ? (
          <>
            <div className="md:hidden">
              <SkeletonGrid />
            </div>
            <div className="hidden md:block">
              <SkeletonRows rows={6} />
            </div>
          </>
        ) : (
          <SkeletonGrid />
        )
      ) : products.length === 0 ? (
        <div className={cardShell}>
          <Empty
            icon={<Package />}
            title={all.length ? "No pieces match" : "Add your first real piece"}
            text={all.length ? "Try a different search or filter." : "Snap a photo of a piece and AI writes the listing for you to review."}
            action={
              all.length ? (
                <button onClick={() => (setQ(""), setFilter("all"), setCat(""))} className={btn("secondary")}>
                  Clear filters
                </button>
              ) : (
                <Link href="/admin/products/new" className={btn("primary")}>
                  <Plus className="size-4" aria-hidden /> Add product
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* Grid: 4:5 plinth photos (always on phones; on desktop when chosen) */}
          <ul className={cx("grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4 xl:grid-cols-5", view === "table" && "md:hidden")}>
            {products.map((p) => {
              const on = sel.includes(p.id);
              return (
                <li key={p.id} className="min-w-0">
                  <div className="relative">
                    <Link
                      href={`/admin/products/${p.id}`}
                      onClick={(e) => {
                        if (selecting) {
                          e.preventDefault();
                          toggleSel(p.id);
                        }
                      }}
                      aria-label={selecting ? `${on ? "Deselect" : "Select"} ${p.name}` : `Edit ${p.name}`}
                      className={cx("block aspect-[4/5] overflow-hidden rounded-[6px] bg-plinth", on && "outline-2 outline-offset-2 outline-ink")}
                    >
                      <ViewTransition name={`admin-product-${p.id}`} share="morph" default="none">
                        <img src={imgUrl(p.images[0], 500)} alt="" loading="lazy" decoding="async" className={cx("size-full object-cover", !p.isActive && "opacity-80")} />
                      </ViewTransition>
                    </Link>
                    <span className={cx("pointer-events-none absolute top-2 left-2 inline-flex h-[22px] items-center gap-1.5 rounded-full bg-white/90 px-2 text-[11.5px] font-semibold backdrop-blur-sm", p.isActive ? "text-success" : "text-muted")}>
                      <ProgressDot fill={p.isActive ? "full" : "empty"} className="size-2.5" />
                      {p.isActive ? "Live" : "Hidden"}
                    </span>
                    {selecting ? (
                      <span aria-hidden className={cx("pointer-events-none absolute top-2 right-2 grid size-6 place-items-center rounded-[6px] border-[1.5px]", on ? "border-ink bg-ink text-white" : "border-line-strong bg-white/90")}>
                        {on && <Check className="size-4" strokeWidth={2.5} />}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSheetFor(p)}
                        className="absolute top-0 right-0 grid size-11 place-items-center"
                        aria-label={`More actions for ${p.name}`}
                      >
                        <span className="grid size-8 place-items-center rounded-full bg-white/90 text-ink backdrop-blur-sm">
                          <MoreHorizontal className="size-4" />
                        </span>
                      </button>
                    )}
                    {p.isFeatured && (
                      <span className="pointer-events-none absolute bottom-2 left-2 grid size-6 place-items-center rounded-full bg-white/90 text-ink" title="Featured">
                        <Star className="size-3.5 fill-ink" aria-label="Featured" />
                      </span>
                    )}
                  </div>
                  <Link href={`/admin/products/${p.id}`} className="mt-2 line-clamp-2 text-[14px] leading-5 font-medium text-ink hover:underline">
                    {p.name}
                  </Link>
                  <p className="tabular mt-1 flex flex-wrap items-baseline gap-x-2 text-[14px]">
                    <span className="font-medium">{formatINR(p.price)}</span>
                    {p.madeToOrder ? (
                      <span className="text-[13px] text-muted">Made to order</span>
                    ) : LOW(p) ? (
                      <span className="text-[13px] font-semibold text-warning">{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* Table (desktop) with inline price/stock editing */}
          {view === "table" && (
            <div className={cx(cardShell, "hidden overflow-visible md:block")}>
              <table className="w-full border-separate border-spacing-0 text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted">
                    <th scope="col" className="sticky top-0 z-10 h-10 w-10 rounded-tl-[8px] border-b border-admin-line bg-admin-inset pl-4">
                      <input type="checkbox" className="size-4" checked={products.length > 0 && products.every((p) => sel.includes(p.id))} onChange={(e) => setSel(e.target.checked ? products.map((p) => p.id) : [])} aria-label="Select all" />
                    </th>
                    {["Piece", "Price", "Stock", "Live", ""].map((h, i) => (
                      <th key={i} scope="col" className={cx("sticky top-0 z-10 h-10 border-b border-admin-line bg-admin-inset px-3 font-semibold last:rounded-tr-[8px]", h === "Price" && "text-right")}>
                        {h || <span className="sr-only">Actions</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const on = sel.includes(p.id);
                    return (
                      <tr key={p.id} className={cx("[&>td]:border-b [&>td]:border-admin-line last:[&>td]:border-0", on ? "bg-admin-inset" : "hover:bg-admin-inset")}>
                        <td className="pl-4">
                          <input type="checkbox" className="size-4" checked={on} onChange={() => toggleSel(p.id)} aria-label={`Select ${p.name}`} />
                        </td>
                        <td className="px-3 py-2">
                          <Link href={`/admin/products/${p.id}`} className="flex min-w-0 items-center gap-3">
                            <Thumb src={imgUrl(p.images[0], 120)} className="aspect-[4/5] w-9" />
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5 font-medium hover:underline">
                                <span className="truncate">{p.name}</span>
                                {p.isFeatured && <Star className="size-3.5 shrink-0 fill-ink" aria-label="Featured" />}
                              </span>
                              <span className="tabular block truncate text-[13px] text-muted">
                                {p.categoryName ?? "Uncategorised"}
                                {p.isDemo && " · demo"} · {p.views} views
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="w-32 px-3 text-right">
                          <PriceCell value={p.price} onSave={(price) => patch(p.id, { price }).then(() => toast("Price updated")).catch(() => {})} />
                        </td>
                        <td className="w-36 px-3">
                          {p.madeToOrder ? (
                            <span className="text-[13px] text-muted">Made to order</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button onClick={() => patch(p.id, { stock: Math.max(0, p.stock - 1) }).catch(() => {})} className="grid size-8 place-items-center rounded-[6px] border border-line-strong hover:bg-white" aria-label={`One fewer ${p.name} in stock`}>
                                <Minus className="size-3.5" />
                              </button>
                              <span className={cx("tabular w-8 text-center", LOW(p) && "font-semibold text-warning")}>{p.stock}</span>
                              <button onClick={() => patch(p.id, { stock: p.stock + 1 }).catch(() => {})} className="grid size-8 place-items-center rounded-[6px] border border-line-strong hover:bg-white" aria-label={`One more ${p.name} in stock`}>
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="w-20 px-3">
                          <Switch checked={p.isActive} onChange={(v) => setLive(p, v)} label={`${p.name} live`} />
                        </td>
                        <td className="w-24 pr-2">
                          <div className="flex justify-end gap-0.5">
                            <Link href={`/admin/products/${p.id}`} className="grid size-9 place-items-center rounded-full hover:bg-admin-sidebar" aria-label={`Edit ${p.name}`} title="Edit">
                              <Pencil className="size-4" />
                            </Link>
                            <button onClick={() => setSheetFor(p)} className="grid size-9 place-items-center rounded-full hover:bg-admin-sidebar" aria-label={`More actions for ${p.name}`} title="More">
                              <MoreHorizontal className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Action sheet */}
      <Modal open={!!sheetFor} onClose={() => setSheetFor(null)} title={sheetFor?.name ?? ""}>
        {sheetFor && (
          <div className="-mx-2">
            <SheetRow href={`/admin/products/${sheetFor.id}`} icon={<Pencil className="size-5" />}>
              Edit
            </SheetRow>
            <SheetRow
              onClick={() => {
                const p = sheetFor;
                setSheetFor(null);
                setLive(p, !p.isActive);
              }}
              icon={sheetFor.isActive ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            >
              {sheetFor.isActive ? "Hide from shop" : "Show in shop"}
            </SheetRow>
            <SheetRow
              onClick={() => {
                const p = sheetFor;
                setSheetFor(null);
                duplicate(p);
              }}
              icon={<Copy className="size-5" />}
            >
              Duplicate
            </SheetRow>
            <SheetRow href={shareUrl(sheetFor)} external onClick={() => setSheetFor(null)} icon={<WhatsAppIcon className="size-5" />} tone="wa">
              Share on WhatsApp
            </SheetRow>
            <SheetRow href={`/product/${sheetFor.slug}`} external onClick={() => setSheetFor(null)} icon={<ExternalLink className="size-5" />}>
              View on website
            </SheetRow>
            <div className="my-1 border-t border-admin-line" />
            <SheetRow
              tone="danger"
              onClick={() => {
                const p = sheetFor;
                setSheetFor(null);
                removeOne(p);
              }}
              icon={<Trash2 className="size-5" />}
            >
              Delete
            </SheetRow>
          </div>
        )}
      </Modal>
      {confirmDialog}
    </div>
  );
}

function PriceCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  if (!editing)
    return (
      <button onClick={() => (setV(String(value)), setEditing(true))} className="tabular rounded-[6px] px-2 py-1.5 font-medium hover:bg-white hover:outline hover:outline-1 hover:outline-admin-line" title="Edit price" aria-label={`Price ${formatINR(value)}, edit`}>
        {formatINR(value)}
      </button>
    );
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
      onBlur={() => {
        setEditing(false);
        if (Number(v) > 0 && Number(v) !== value) onSave(Number(v));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
      }}
      aria-label="Price in rupees"
      className={cx(field, "tabular w-24! text-right")}
      inputMode="numeric"
    />
  );
}
