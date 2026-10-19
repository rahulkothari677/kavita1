"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Eye, EyeOff, Minus, Package, Pencil, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { api, confirmAction, Empty, Loading, PageHeader, Switch, useLoad, useToast } from "@/components/admin/ui";
import { formatINR, imgUrl } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const FILTERS = [
  { k: "all", l: "All" },
  { k: "live", l: "Live" },
  { k: "draft", l: "Drafts" },
  { k: "low", l: "Low / sold out" },
  { k: "featured", l: "Featured" },
];

export default function ProductsPage() {
  const { data, setData, loading, reload } = useLoad<{ products: Product[] }>("/api/admin/products");
  const { data: catData } = useLoad<{ categories: Category[] }>("/api/admin/categories");
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [cat, setCat] = useState("");
  const [sel, setSel] = useState<string[]>([]);

  const cats = catData?.categories ?? [];
  const flatCats = cats.flatMap((c) => [c, ...(c.children ?? [])]);
  const products = useMemo(() => {
    let list = data?.products ?? [];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((p) => `${p.name} ${p.tags.join(" ")} ${p.categoryName ?? ""}`.toLowerCase().includes(s));
    }
    if (cat) {
      const ids = [cat, ...(cats.find((c) => c.id === cat)?.children?.map((c) => c.id) ?? [])];
      list = list.filter((p) => p.categoryId && ids.includes(p.categoryId));
    }
    if (filter === "live") list = list.filter((p) => p.isActive);
    if (filter === "draft") list = list.filter((p) => !p.isActive);
    if (filter === "low") list = list.filter((p) => !p.madeToOrder && p.stock <= 1);
    if (filter === "featured") list = list.filter((p) => p.isFeatured);
    return list;
  }, [data, q, filter, cat, cats]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setData((d) => d && { products: d.products.map((p) => (p.id === id ? { ...p, ...body } : p)) });
    try {
      await api(`/api/admin/products/${id}`, { method: "PATCH", body });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
      reload();
    }
  };

  const bulk = async (action: string, patchBody?: Record<string, unknown>, msg = "Updated") => {
    if (action === "delete" && !confirmAction(`Delete ${sel.length} products permanently?`)) return;
    await api("/api/admin/products/bulk", { body: { action, ids: sel, patch: patchBody } });
    toast(msg);
    setSel([]);
    reload();
  };

  const toggleSel = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.products.length} products · ${data.products.filter((p) => p.isActive).length} live` : undefined}
        actions={
          <>
            <Link href="/admin/products/bulk" className="btn btn-outline btn-sm">
              <Upload className="size-4" /> Bulk upload
            </Link>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus className="size-4" /> Add product
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input pl-10" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input w-auto">
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
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${filter === f.k ? "bg-ink text-cream" : "bg-white text-muted"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {sel.length > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-cream shadow-lg lg:top-2">
          <span className="mr-2 font-medium">{sel.length} selected</span>
          <BulkBtn onClick={() => bulk("patch", { isActive: true }, "Published")}><Eye className="size-3.5" /> Publish</BulkBtn>
          <BulkBtn onClick={() => bulk("patch", { isActive: false }, "Hidden")}><EyeOff className="size-3.5" /> Hide</BulkBtn>
          <BulkBtn onClick={() => bulk("patch", { isFeatured: true }, "Featured")}><Star className="size-3.5" /> Feature</BulkBtn>
          <select
            onChange={(e) => e.target.value && bulk("patch", { categoryId: e.target.value === "none" ? null : e.target.value }, "Category updated")}
            value=""
            className="rounded-full bg-cream/10 px-3 py-1.5 text-cream"
          >
            <option value="">Move to…</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id} className="text-ink">
                {c.parentId ? "↳ " : ""}
                {c.name}
              </option>
            ))}
            <option value="none" className="text-ink">Uncategorised</option>
          </select>
          <select onChange={(e) => e.target.value && bulk("price", { percent: Number(e.target.value) }, "Prices updated")} value="" className="rounded-full bg-cream/10 px-3 py-1.5 text-cream">
            <option value="">Change price…</option>
            {[-20, -10, -5, 5, 10, 20].map((p) => (
              <option key={p} value={p} className="text-ink">
                {p > 0 ? `+${p}%` : `${p}%`}
              </option>
            ))}
          </select>
          <BulkBtn onClick={() => bulk("delete", undefined, "Deleted")}><Trash2 className="size-3.5" /> Delete</BulkBtn>
          <button onClick={() => setSel([])} className="ml-auto text-cream/70">Clear</button>
        </div>
      )}

      {loading && !data ? (
        <Loading />
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-white">
          <Empty
            icon={<Package className="size-6" />}
            title={data?.products.length ? "No products match" : "No products yet"}
            text={data?.products.length ? "Try a different search or filter." : "Snap a photo of your first piece — AI will write the listing for you."}
            action={<Link href="/admin/products/new" className="btn btn-primary">Add product</Link>}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
          <div className="hidden grid-cols-[28px_56px_1fr_120px_130px_70px_110px] items-center gap-4 border-b border-ink/[0.06] px-4 py-2.5 text-xs text-muted md:grid">
            <input type="checkbox" checked={sel.length === products.length} onChange={(e) => setSel(e.target.checked ? products.map((p) => p.id) : [])} aria-label="Select all" />
            <span />
            <span>Product</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Live</span>
            <span />
          </div>
          <ul className="divide-y divide-ink/[0.06]">
            {products.map((p) => (
              <li key={p.id} className={`grid grid-cols-[28px_56px_1fr] items-center gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[28px_56px_1fr_120px_130px_70px_110px] ${sel.includes(p.id) ? "bg-cream/40" : ""}`}>
                <input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggleSel(p.id)} aria-label={`Select ${p.name}`} />
                <Link href={`/admin/products/${p.id}`}>
                  <img src={imgUrl(p.images[0], 120)} alt="" className="size-14 rounded-xl object-cover" />
                </Link>
                <div className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                    <span className="truncate">{p.name}</span>
                    {p.isFeatured && <Star className="size-3.5 shrink-0 fill-gold text-gold" />}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {p.categoryName ?? "Uncategorised"}
                    {p.isDemo && " · demo"}
                    {!p.isActive && " · draft"} · {p.views} views
                  </p>
                </div>
                <div className="col-span-3 flex flex-wrap items-center gap-3 pl-[44px] md:contents">
                  <PriceCell value={p.price} onSave={(price) => patch(p.id, { price })} />
                  {p.madeToOrder ? (
                    <span className="text-xs text-gold">Made to order</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => patch(p.id, { stock: Math.max(0, p.stock - 1) })} className="grid size-7 place-items-center rounded-full border border-ink/10" aria-label="Less stock">
                        <Minus className="size-3" />
                      </button>
                      <span className={`w-8 text-center text-sm ${p.stock === 0 ? "font-semibold text-rose" : ""}`}>{p.stock}</span>
                      <button onClick={() => patch(p.id, { stock: p.stock + 1 })} className="grid size-7 place-items-center rounded-full border border-ink/10" aria-label="More stock">
                        <Plus className="size-3" />
                      </button>
                    </div>
                  )}
                  <Switch checked={p.isActive} onChange={(v) => patch(p.id, { isActive: v })} label="Live" />
                  <div className="ml-auto flex gap-1 md:ml-0">
                    <IconLink href={`/admin/products/${p.id}`} label="Edit"><Pencil className="size-4" /></IconLink>
                    <button
                      onClick={async () => {
                        await api(`/api/admin/products/${p.id}`, { method: "PATCH", body: { action: "duplicate" } });
                        toast("Duplicated as draft");
                        reload();
                      }}
                      className="grid size-8 place-items-center rounded-full hover:bg-ink/5"
                      aria-label="Duplicate"
                      title="Duplicate"
                    >
                      <Copy className="size-4" />
                    </button>
                    <a href={`/product/${p.slug}`} target="_blank" className="grid size-8 place-items-center rounded-full hover:bg-ink/5" aria-label="View on site" title="View on site">
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PriceCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  if (!editing)
    return (
      <button onClick={() => (setV(String(value)), setEditing(true))} className="rounded-lg px-1.5 py-1 text-left text-sm font-medium hover:bg-cream" title="Tap to edit price">
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
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="input w-24 py-1 text-sm"
      inputMode="numeric"
    />
  );
}

function BulkBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-full bg-cream/10 px-3 py-1.5 hover:bg-cream/20">
      {children}
    </button>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="grid size-8 place-items-center rounded-full hover:bg-ink/5" aria-label={label} title={label}>
      {children}
    </Link>
  );
}
