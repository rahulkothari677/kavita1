"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Copy, ExternalLink, ImagePlus, Loader2, Sparkles, Trash2, Wand2 } from "lucide-react";
import { api, Panel, Switch, TagInput, useToast, confirmAction } from "./ui";
import { ImageManager } from "./ImageManager";
import { toAiImage, uploadImages } from "@/lib/client-image";
import type { Category, Product } from "@/lib/types";

type Draft = {
  name: string;
  categoryId: string | null;
  newCategorySuggestion?: string | null;
  shortDescription: string;
  description: string;
  size: string;
  materials: string[];
  colors: string[];
  tags: string[];
  care: string;
  suggestedPrice: number;
  priceRange: string;
  customizable: boolean;
  seoTitle: string;
  seoDescription: string;
  instagramCaption: string;
};

type Form = {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  madeToOrder: boolean;
  leadTimeDays: string;
  customizable: boolean;
  images: string[];
  shortDescription: string;
  description: string;
  size: string;
  materials: string[];
  colors: string[];
  tags: string[];
  care: string;
  badge: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY: Form = {
  name: "",
  slug: "",
  categoryId: "",
  price: "",
  compareAtPrice: "",
  stock: "1",
  madeToOrder: false,
  leadTimeDays: "",
  customizable: false,
  images: [],
  shortDescription: "",
  description: "",
  size: "",
  materials: [],
  colors: [],
  tags: [],
  care: "",
  badge: "",
  isActive: true,
  isFeatured: false,
  isBestseller: false,
  seoTitle: "",
  seoDescription: "",
};

const BADGES = ["", "New", "Bestseller", "Limited", "Festive", "Trending", "Last piece", "Sale"];

function fromProduct(p: Product): Form {
  return {
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId ?? "",
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    stock: String(p.stock),
    madeToOrder: p.madeToOrder,
    leadTimeDays: p.leadTimeDays ? String(p.leadTimeDays) : "",
    customizable: p.customizable,
    images: p.images,
    shortDescription: p.shortDescription,
    description: p.description,
    size: p.size ?? "",
    materials: p.materials,
    colors: p.colors,
    tags: p.tags,
    care: p.care ?? "",
    badge: p.badge ?? "",
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

export function ProductEditor({ productId, aiEnabled }: { productId?: string; aiEnabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Form>(EMPTY);
  const [cats, setCats] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(!productId);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [draftExtras, setDraftExtras] = useState<{ priceRange?: string; caption?: string; newCategory?: string | null } | null>(null);
  const [hint, setHint] = useState("");
  const [dirty, setDirty] = useState(false);
  const [manual, setManual] = useState(false);
  const aiFiles = useRef<File[]>([]);
  const startGallery = useRef<HTMLInputElement>(null);
  const startCamera = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ categories: Category[] }>("/api/admin/categories").then((d) => setCats(d.categories));
    if (productId)
      api<{ product: Product }>(`/api/admin/products/${productId}`).then((d) => {
        setForm(fromProduct(d.product));
        setLoaded(true);
      });
  }, [productId]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };
  const bind = (k: keyof Form) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never),
  });

  // ── Snap & Sell: photos → AI listing ──────────────────────────────────────
  const analyse = async (files: File[]) => {
    if (!aiEnabled || !files.length) return;
    setAiBusy("listing");
    try {
      const images = await Promise.all(files.slice(0, 4).map((f) => toAiImage(f)));
      const { draft } = await api<{ draft: Draft }>("/api/admin/ai/product-from-images", { body: { images, hint } });
      setForm((f) => ({
        ...f,
        name: f.name || draft.name,
        categoryId: f.categoryId || draft.categoryId || "",
        shortDescription: draft.shortDescription,
        description: draft.description,
        size: draft.size,
        materials: draft.materials ?? [],
        colors: draft.colors ?? [],
        tags: draft.tags ?? [],
        care: draft.care,
        price: f.price || String(draft.suggestedPrice || ""),
        customizable: draft.customizable,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
      }));
      setDraftExtras({ priceRange: draft.priceRange, caption: draft.instagramCaption, newCategory: draft.categoryId ? null : draft.newCategorySuggestion });
      setDirty(true);
      toast("✨ Listing written by AI — review & publish");
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not analyse the photo", "err");
    } finally {
      setAiBusy(null);
    }
  };

  const startWithPhotos = async (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    aiFiles.current = files;
    setAiBusy("listing");
    const uploadP = uploadImages(files)
      .then((urls) => {
        setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
        setDirty(true);
      })
      .catch((e) => toast(e.message, "err"));
    if (aiEnabled) await analyse(files);
    else setAiBusy(null);
    await uploadP;
  };

  const rewrite = async (instruction?: string) => {
    setAiBusy("rewrite");
    try {
      const out = await api<{ shortDescription: string; description: string }>("/api/admin/ai/write", {
        body: { task: "rewrite", input: { name: form.name, shortDescription: form.shortDescription, description: form.description, instruction } },
      });
      setForm((f) => ({ ...f, ...out }));
      setDirty(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI failed", "err");
    } finally {
      setAiBusy(null);
    }
  };

  const suggestPrice = async () => {
    setAiBusy("price");
    try {
      const out = await api<{ suggested: number; range: string; reasoning: string }>("/api/admin/ai/write", {
        body: { task: "price", input: { productText: `Product: ${form.name}\nSize: ${form.size}\nMaterials: ${form.materials.join(", ")}\n${form.shortDescription}` } },
      });
      setDraftExtras((d) => ({ ...d, priceRange: `${out.range} — ${out.reasoning}` }));
      set("price", String(out.suggested));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI failed", "err");
    } finally {
      setAiBusy(null);
    }
  };

  const createSuggestedCategory = async (name: string) => {
    const { id } = await api<{ id: string }>("/api/admin/categories", { body: { name } });
    const d = await api<{ categories: Category[] }>("/api/admin/categories");
    setCats(d.categories);
    set("categoryId", id);
    setDraftExtras((x) => ({ ...x, newCategory: null }));
    toast(`Category “${name}” created`);
  };

  const save = async (publish?: boolean) => {
    if (!form.name.trim()) return toast("Please add a product name", "err");
    if (!form.price || Number(form.price) <= 0) return toast("Please add a price", "err");
    setSaving(true);
    const body = {
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stock: Number(form.stock || 0),
      leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : null,
      categoryId: form.categoryId || null,
      isActive: publish === undefined ? form.isActive : publish,
      slug: productId ? form.slug : undefined,
    };
    try {
      if (productId) {
        await api(`/api/admin/products/${productId}`, { method: "PUT", body });
        toast("Saved");
        setForm((f) => ({ ...f, isActive: body.isActive }));
        setDirty(false);
      } else {
        const r = await api<{ id: string }>("/api/admin/products", { body });
        toast(body.isActive ? "Published! 🎉" : "Saved as draft");
        setDirty(false);
        router.replace(`/admin/products/${r.id}`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!productId || !confirmAction("Delete this product permanently?")) return;
    await api(`/api/admin/products/${productId}`, { method: "DELETE" });
    toast("Product deleted");
    router.replace("/admin/products");
  };

  if (!loaded)
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-7 animate-spin text-ink/40" />
      </div>
    );

  const isNewEmpty = !productId && !manual && form.images.length === 0 && !form.name && aiBusy !== "listing";

  return (
    <div className="pb-24">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/admin/products" className="grid size-9 place-items-center rounded-full bg-white shadow-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="flex-1 font-display text-3xl font-semibold md:text-4xl">{productId ? form.name || "Edit product" : "New product"}</h1>
        {productId && (
          <a href={`/product/${form.slug}`} target="_blank" className="btn btn-outline btn-sm">
            <ExternalLink className="size-3.5" /> View
          </a>
        )}
      </div>

      {isNewEmpty ? (
        <div className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-center text-cream md:p-12">
            <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle, #f3ead8 1.5px, transparent 2px)", backgroundSize: "24px 24px" }} />
            <Sparkles className="relative mx-auto size-10 text-gold-2" />
            <h2 className="relative mt-4 font-display text-4xl">Snap & Sell</h2>
            <p className="relative mx-auto mt-3 max-w-md text-cream/75">
              {aiEnabled
                ? "Take or choose photos of your piece. AI will write the name, description, tags, size estimate and suggest a price — you just review and publish."
                : "Take or choose photos of your piece to start. (Add an AI key in Settings to auto-write listings.)"}
            </p>
            <div className="relative mx-auto mt-6 max-w-md">
              <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Optional hint: e.g. 12 inch lippan, made with real mirrors" className="w-full rounded-full border border-cream/20 bg-cream/10 px-5 py-3 text-sm text-cream placeholder:text-cream/50 outline-none" />
            </div>
            <div className="relative mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => startCamera.current?.click()} className="btn btn-gold px-6 py-3.5">
                <Camera className="size-5" /> Take photo
              </button>
              <button onClick={() => startGallery.current?.click()} className="btn border border-cream/30 px-6 py-3.5 text-cream hover:bg-cream/10">
                <ImagePlus className="size-5" /> Choose photos
              </button>
            </div>
            <input ref={startGallery} type="file" accept="image/*" multiple hidden onChange={(e) => startWithPhotos(e.target.files)} />
            <input ref={startCamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => startWithPhotos(e.target.files)} />
          </div>
          <button onClick={() => setManual(true)} className="mx-auto mt-5 block text-sm text-muted underline">
            or fill the form manually
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {aiBusy === "listing" && (
              <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gradient-to-r from-gold-2/20 to-white p-4">
                <Loader2 className="size-5 animate-spin text-gold" />
                <div>
                  <p className="font-medium">AI is studying your photos…</p>
                  <p className="text-sm text-muted">Writing the name, story, tags and a fair price. ~10 seconds.</p>
                </div>
              </div>
            )}
            <Panel title="Photos">
              <ImageManager
                images={form.images}
                onChange={(urls) => set("images", urls)}
                onNewFiles={(files) => {
                  aiFiles.current = [...aiFiles.current, ...files];
                }}
              />
              {aiEnabled && (
                <button type="button" disabled={!!aiBusy || !aiFiles.current.length} onClick={() => analyse(aiFiles.current)} className="btn btn-outline btn-sm mt-4" title={!aiFiles.current.length ? "Add new photos to analyse" : ""}>
                  <Sparkles className="size-3.5" /> {productId ? "Re-write listing from new photos" : "Write listing from photos"}
                </button>
              )}
            </Panel>

            <Panel title="Details">
              <div className="space-y-4">
                <div>
                  <label className="label">Product name *</label>
                  <input {...bind("name")} className="input text-lg" placeholder="e.g. Midnight Mirror Mandala" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Short description (shown near price)</label>
                    <span className="text-[11px] text-muted">{form.shortDescription.length}/180</span>
                  </div>
                  <textarea {...bind("shortDescription")} rows={2} className="input" maxLength={240} />
                </div>
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <label className="label mb-0">Full story / description</label>
                    {aiEnabled && (
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          ["✨ Polish", undefined],
                          ["Shorter", "Make it shorter and punchier"],
                          ["Gift angle", "Rewrite focusing on gifting occasions"],
                          ["Hinglish", "Rewrite in friendly Hinglish"],
                        ].map(([label, ins]) => (
                          <button key={label} type="button" disabled={!!aiBusy || !form.name} onClick={() => rewrite(ins)} className="rounded-full border border-ink/12 bg-white px-2.5 py-1 text-xs hover:border-ink/40 disabled:opacity-50">
                            {aiBusy === "rewrite" ? "…" : label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea {...bind("description")} rows={7} className="input" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Size / dimensions</label>
                    <input {...bind("size")} className="input" placeholder='e.g. 12 inch (30 cm) diameter' />
                  </div>
                  <div>
                    <label className="label">Care instructions</label>
                    <input {...bind("care")} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Materials</label>
                  <TagInput value={form.materials} onChange={(v) => set("materials", v)} placeholder="Clay, mirrors… (press Enter)" />
                </div>
                <div>
                  <label className="label">Colours</label>
                  <TagInput value={form.colors} onChange={(v) => set("colors", v)} placeholder="Navy, white…" />
                </div>
                <div>
                  <label className="label">Search tags (help customers & AI find it)</label>
                  <TagInput value={form.tags} onChange={(v) => set("tags", v)} placeholder="housewarming, living room, gift…" />
                </div>
              </div>
            </Panel>

            <details className="rounded-2xl border border-ink/[0.07] bg-white">
              <summary className="cursor-pointer px-5 py-3.5 text-[15px] font-semibold">Google / SEO (optional)</summary>
              <div className="space-y-4 px-5 pb-5">
                <div>
                  <label className="label">SEO title</label>
                  <input {...bind("seoTitle")} className="input" maxLength={70} />
                </div>
                <div>
                  <label className="label">SEO description</label>
                  <textarea {...bind("seoDescription")} rows={2} className="input" maxLength={170} />
                </div>
                {productId && (
                  <div>
                    <label className="label">URL slug</label>
                    <input {...bind("slug")} className="input" />
                  </div>
                )}
              </div>
            </details>
          </div>

          <div className="space-y-6">
            <Panel title="Visibility">
              <div className="space-y-4">
                <Row label="Live on website" hint="Off = saved as draft">
                  <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} />
                </Row>
                <Row label="Featured on homepage">
                  <Switch checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
                </Row>
                <Row label="Mark as bestseller">
                  <Switch checked={form.isBestseller} onChange={(v) => set("isBestseller", v)} />
                </Row>
                <div>
                  <label className="label">Badge</label>
                  <select {...bind("badge")} className="input">
                    {BADGES.map((b) => (
                      <option key={b} value={b}>
                        {b || "None"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Panel>

            <Panel title="Category">
              <select {...bind("categoryId")} className="input">
                <option value="">— Uncategorised —</option>
                {cats.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name} (all)</option>
                    {c.children?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {c.name} › {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {draftExtras?.newCategory && (
                <button type="button" onClick={() => createSuggestedCategory(draftExtras.newCategory!)} className="mt-3 w-full rounded-xl bg-gold-2/15 px-3 py-2 text-left text-sm">
                  ✨ AI suggests a new category: <b>{draftExtras.newCategory}</b> — tap to create
                </button>
              )}
              <Link href="/admin/categories" className="mt-2 inline-block text-xs text-muted underline">
                Manage categories & sub-categories
              </Link>
            </Panel>

            <Panel
              title="Price & stock"
              action={
                aiEnabled && (
                  <button type="button" onClick={suggestPrice} disabled={!!aiBusy || !form.name} className="flex items-center gap-1 text-xs text-gold disabled:opacity-50">
                    {aiBusy === "price" ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />} Suggest price
                  </button>
                )
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Price (₹) *</label>
                    <input {...bind("price")} inputMode="numeric" className="input text-lg font-medium" />
                  </div>
                  <div>
                    <label className="label">MRP / was (₹)</label>
                    <input {...bind("compareAtPrice")} inputMode="numeric" className="input" placeholder="optional" />
                  </div>
                </div>
                {draftExtras?.priceRange && <p className="rounded-xl bg-cream/70 p-3 text-xs leading-relaxed">💡 AI suggestion: {draftExtras.priceRange}</p>}
                <Row label="Made to order" hint="Can always be ordered; made after order">
                  <Switch checked={form.madeToOrder} onChange={(v) => set("madeToOrder", v)} />
                </Row>
                {form.madeToOrder ? (
                  <div>
                    <label className="label">Days to make</label>
                    <input {...bind("leadTimeDays")} inputMode="numeric" className="input" placeholder="e.g. 7" />
                  </div>
                ) : (
                  <div>
                    <label className="label">Pieces in stock</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => set("stock", String(Math.max(0, Number(form.stock) - 1)))} className="btn btn-outline px-4">
                        −
                      </button>
                      <input {...bind("stock")} inputMode="numeric" className="input text-center" />
                      <button type="button" onClick={() => set("stock", String(Number(form.stock) + 1))} className="btn btn-outline px-4">
                        +
                      </button>
                    </div>
                  </div>
                )}
                <Row label="Personalisable" hint="Shows a note box for names/colours">
                  <Switch checked={form.customizable} onChange={(v) => set("customizable", v)} />
                </Row>
              </div>
            </Panel>

            {draftExtras?.caption && (
              <Panel title="Ready-made Instagram caption">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{draftExtras.caption}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(draftExtras.caption!);
                    toast("Caption copied");
                  }}
                  className="btn btn-outline btn-sm mt-3"
                >
                  <Copy className="size-3.5" /> Copy
                </button>
              </Panel>
            )}

            {productId && (
              <button onClick={remove} className="flex items-center gap-2 text-sm text-rose">
                <Trash2 className="size-4" /> Delete product
              </button>
            )}
          </div>
        </div>
      )}

      {!isNewEmpty && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
            {dirty && <span className="mr-auto text-xs text-muted">Unsaved changes</span>}
            {!productId && (
              <button disabled={saving || aiBusy === "listing"} onClick={() => save(false)} className="btn btn-outline">
                Save draft
              </button>
            )}
            <button disabled={saving || aiBusy === "listing"} onClick={() => save(productId ? undefined : true)} className="btn btn-primary min-w-32">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {productId ? "Save changes" : "Publish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
