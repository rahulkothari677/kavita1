"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, Copy, ExternalLink, ImagePlus, Loader2, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { api, Panel, Switch, TagInput } from "./ui";
import { ImageManager } from "./ImageManager";
import { ADMIN_ICONS, AiDraftChip, AiPanel, AiProgress, btn, ContextBar, copyText, cx, DetailHeader, field, relTime, Sk, StateChip, useActionToast, useConfirm, useEasedProgress } from "./pages/kit";
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

type AiKey = keyof Form;

export function ProductEditor({ productId, aiEnabled }: { productId?: string; aiEnabled: boolean }) {
  const router = useRouter();
  const toast = useActionToast();
  const [ask, confirmDialog] = useConfirm();
  const [form, setForm] = useState<Form>(EMPTY);
  const [cats, setCats] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(!productId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [draftExtras, setDraftExtras] = useState<{ priceRange?: string; caption?: string; newCategory?: string | null } | null>(null);
  const [hint, setHint] = useState("");
  const [dirty, setDirty] = useState(false);
  const [manual, setManual] = useState(false);
  const [aiFields, setAiFields] = useState<Set<AiKey>>(() => new Set());
  const [pendingUploads, setPendingUploads] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [aiFileCount, setAiFileCount] = useState(0);
  const aiFiles = useRef<File[]>([]);
  const savedForm = useRef<Form>(EMPTY);
  const formRef = useRef<Form>(EMPTY);
  const startGallery = useRef<HTMLInputElement>(null);
  const startCamera = useRef<HTMLInputElement>(null);
  const progress = useEasedProgress(aiBusy === "listing", 14);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    api<{ categories: Category[] }>("/api/admin/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
    if (productId)
      api<{ product: Product }>(`/api/admin/products/${productId}`)
        .then((d) => {
          const f = fromProduct(d.product);
          setForm(f);
          savedForm.current = f;
          setLoaded(true);
        })
        .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load this piece"));
  }, [productId]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const clearAi = (...keys: AiKey[]) =>
    setAiFields((s) => {
      if (!keys.some((k) => s.has(k))) return s;
      const n = new Set(s);
      keys.forEach((k) => n.delete(k));
      return n;
    });
  const markAi = (keys: AiKey[]) => setAiFields((s) => new Set([...s, ...keys]));

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
    clearAi(k);
  };
  const bind = (k: keyof Form) => ({
    id: `pe-${k}`,
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
      const before = formRef.current;
      const filled: AiKey[] = ["shortDescription", "description", "size", "materials", "colors", "tags", "care", "seoTitle", "seoDescription"];
      if (!before.name && draft.name) filled.push("name");
      if (!before.categoryId && draft.categoryId) filled.push("categoryId");
      if (!before.price && draft.suggestedPrice) filled.push("price");
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
      markAi(filled);
      setDraftExtras({ priceRange: draft.priceRange, caption: draft.instagramCaption, newCategory: draft.categoryId ? null : draft.newCategorySuggestion });
      setDirty(true);
      toast("Listing drafted by AI. Review it, then publish.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not read the photo", "err");
    } finally {
      setAiBusy(null);
    }
  };

  const startWithPhotos = async (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    aiFiles.current = files;
    setAiFileCount(files.length);
    setAiBusy("listing");
    setPendingUploads(files.length);
    const uploadP = uploadImages(files)
      .then((urls) => {
        setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
        setDirty(true);
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Upload failed", "err"))
      .finally(() => setPendingUploads(0));
    if (aiEnabled) await analyse(files);
    else {
      setAiBusy(null);
      setManual(true);
    }
    await uploadP;
  };

  const rewrite = async (label: string, instruction?: string) => {
    setAiBusy(`rewrite:${label}`);
    try {
      const out = await api<{ shortDescription: string; description: string }>("/api/admin/ai/write", {
        body: { task: "rewrite", input: { name: form.name, shortDescription: form.shortDescription, description: form.description, instruction } },
      });
      setForm((f) => ({ ...f, ...out }));
      markAi(["shortDescription", "description"]);
      setDirty(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not rewrite this", "err");
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
      markAi(["price"]);
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not suggest a price", "err");
    } finally {
      setAiBusy(null);
    }
  };

  const createSuggestedCategory = async (name: string) => {
    try {
      const { id } = await api<{ id: string }>("/api/admin/categories", { body: { name } });
      const d = await api<{ categories: Category[] }>("/api/admin/categories");
      setCats(d.categories);
      set("categoryId", id);
      setDraftExtras((x) => ({ ...x, newCategory: null }));
      toast(`Category “${name}” created`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create the category", "err");
    }
  };

  const save = async (publish?: boolean) => {
    if (!form.name.trim()) return toast("Add a name for this piece", "err");
    if (!form.price || Number(form.price) <= 0) return toast("Add a price", "err");
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
        const next = { ...form, isActive: body.isActive };
        setForm(next);
        savedForm.current = next;
        setDirty(false);
        setAiFields(new Set());
        setSavedAt(new Date().toISOString());
        toast("Saved");
      } else {
        const r = await api<{ id: string }>("/api/admin/products", { body });
        toast(body.isActive ? "Published. It’s live in your shop." : "Saved as a hidden draft");
        setDirty(false);
        router.replace(`/admin/products/${r.id}`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    const prev = { form, aiFields };
    setForm(savedForm.current);
    setAiFields(new Set());
    setDirty(false);
    toast("Changes discarded", "ok", {
      label: "Undo",
      onClick: () => {
        setForm(prev.form);
        setAiFields(prev.aiFields);
        setDirty(true);
      },
    });
  };

  const remove = async () => {
    if (!productId) return;
    const ok = await ask({ title: `Delete “${form.name || "this piece"}”?`, body: "It will be removed from your shop with its reviews. Turning Live off hides it instead.", confirmLabel: "Delete piece" });
    if (!ok) return;
    try {
      await api(`/api/admin/products/${productId}`, { method: "DELETE" });
      setDirty(false);
      toast("Piece deleted");
      router.replace("/admin/products");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete", "err");
    }
  };

  if (loadError)
    return (
      <div className="rounded-[8px] border border-admin-line bg-white p-6 text-center">
        <p className="font-display text-[22px]">We couldn’t open this piece</p>
        <p className="mt-1 text-[14px] text-muted">{loadError}</p>
        <Link href="/admin/products" className={btn("secondary", "mt-4")}>
          Back to products
        </Link>
      </div>
    );

  if (!loaded)
    return (
      <div role="status" aria-label="Loading piece" className="space-y-4">
        <Sk className="h-5 w-24" />
        <Sk className="h-8 w-72 max-w-full" />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Sk className="h-56" />
            <Sk className="h-80" />
          </div>
          <div className="space-y-4">
            <Sk className="h-40" />
            <Sk className="h-56" />
          </div>
        </div>
      </div>
    );

  const isNewEmpty = !productId && !manual && form.images.length === 0 && !form.name && aiBusy !== "listing";
  const ai = (k: AiKey) => aiFields.has(k);
  const showBar = !isNewEmpty && (dirty || !productId);
  const listingBusy = aiBusy === "listing";
  const uploadDone = pendingUploads === 0;
  const steps: { label: string; state: "done" | "current" | "todo" }[] = [
    { label: aiFileCount > 1 ? "Photos uploaded" : "Photo uploaded", state: uploadDone ? "done" : "current" },
    { label: "Writing title & description", state: progress < 0.62 ? "current" : "done" },
    { label: "Suggesting price", state: progress < 0.62 ? "todo" : "current" },
  ];

  return (
    <div className={cx(ADMIN_ICONS, "pb-24 md:pb-8")}>
      <DetailHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={productId ? form.name || "Untitled piece" : isNewEmpty ? "Add a piece" : form.name || "New piece"}
        chips={
          productId ? (
            <StateChip tone={form.isActive ? "success" : "neutral"} fill={form.isActive ? "full" : "empty"}>
              {form.isActive ? "Live" : "Hidden"}
            </StateChip>
          ) : undefined
        }
        meta={savedAt && !dirty ? <span className="text-[12px]">Saved · {relTime(savedAt)}</span> : productId && dirty ? <span className="text-[12px]">Unsaved changes</span> : undefined}
      />

      {isNewEmpty ? (
        <div className="mx-auto max-w-2xl">
          {aiEnabled ? (
            <section className="rounded-[8px] border border-ai-line bg-ai-bg px-5 py-8 text-center md:px-10 md:py-12">
              <span className="mx-auto grid size-14 place-items-center rounded-[12px] border border-ai-line bg-white text-ai-fg">
                <Sparkles className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-[30px] leading-tight font-[380] tracking-[-0.015em] text-ink md:text-[36px]">
                Snap &amp; <em>sell</em>
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-ink-2">Take or choose photos of your piece. AI drafts the name, story, tags and size, and suggests a fair price. You review, then publish.</p>
              <div className="mx-auto mt-6 max-w-md text-left">
                <label htmlFor="snap-hint" className="label">
                  Anything AI should know? <span className="font-normal text-muted">(optional)</span>
                </label>
                <input id="snap-hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="e.g. 12 inch Lippan plate with real mirrors" className={field} />
              </div>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <button onClick={() => startCamera.current?.click()} className={btn("ai", "h-12! px-6!")}>
                  <Camera className="size-5" aria-hidden /> Take photo
                </button>
                <button onClick={() => startGallery.current?.click()} className={btn("aiOutline", "h-12! px-6!")}>
                  <ImagePlus className="size-5" aria-hidden /> Choose photos
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-[8px] border border-admin-line bg-white px-5 py-8 text-center md:px-10 md:py-12">
              <span className="mx-auto grid size-14 place-items-center rounded-[12px] bg-plinth text-ink">
                <Camera className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-[30px] leading-tight font-[380] tracking-[-0.015em] md:text-[36px]">
                Start with a <em>photo</em>
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-ink-2">Take or choose photos of your piece, then add its name and price. Add an AI key in Settings to have listings written for you.</p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <button onClick={() => startCamera.current?.click()} className={btn("primary", "h-12! px-6!")}>
                  <Camera className="size-5" aria-hidden /> Take photo
                </button>
                <button onClick={() => startGallery.current?.click()} className={btn("secondary", "h-12! px-6!")}>
                  <ImagePlus className="size-5" aria-hidden /> Choose photos
                </button>
              </div>
            </section>
          )}
          <input ref={startGallery} type="file" accept="image/*" multiple hidden onChange={(e) => (startWithPhotos(e.target.files), (e.target.value = ""))} />
          <input ref={startCamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (startWithPhotos(e.target.files), (e.target.value = ""))} />
          <p className="mt-5 text-center">
            <button onClick={() => setManual(true)} className="link text-[14px] font-medium text-ink">
              or fill in the form yourself
            </button>
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3 md:space-y-4">
            {listingBusy && <AiProgress title="AI is studying your photos" steps={steps} progress={progress} />}

            <Panel title="Photos">
              <ImageManager
                images={form.images}
                onChange={(urls) => set("images", urls)}
                pending={pendingUploads}
                coverTransitionName={productId ? `admin-product-${productId}` : undefined}
                onNewFiles={(files) => {
                  aiFiles.current = [...aiFiles.current, ...files];
                  setAiFileCount(aiFiles.current.length);
                }}
              />
              {aiEnabled && (
                <button
                  type="button"
                  disabled={!!aiBusy || !aiFileCount}
                  onClick={() => analyse(aiFiles.current)}
                  className={btn("aiOutline", "mt-4")}
                  title={!aiFileCount ? "Add new photos first" : undefined}
                >
                  <Sparkles className="size-4" aria-hidden /> {productId ? "Rewrite listing from new photos" : "Write listing from photos"}
                </button>
              )}
            </Panel>

            <Panel title="Details">
              <div className="space-y-4">
                <div>
                  <FieldLabel htmlFor="pe-name" ai={ai("name")}>
                    Name
                  </FieldLabel>
                  <input {...bind("name")} className={cx(field, "text-[17px]! font-medium")} placeholder="e.g. Midnight Mirror Mandala" />
                </div>
                <div>
                  <FieldLabel htmlFor="pe-shortDescription" ai={ai("shortDescription")} extra={<span className="tabular text-[12px] text-muted">{form.shortDescription.length}/180</span>}>
                    Short description <span className="font-normal text-muted">· shown near the price</span>
                  </FieldLabel>
                  <textarea {...bind("shortDescription")} rows={2} className={field} maxLength={240} />
                </div>
                <div>
                  <FieldLabel htmlFor="pe-description" ai={ai("description")}>
                    Story & description
                  </FieldLabel>
                  {aiEnabled && (
                    <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Rewrite with AI">
                      {(
                        [
                          ["Polish", undefined],
                          ["Shorter", "Make it shorter and punchier"],
                          ["Gift angle", "Rewrite focusing on gifting occasions"],
                          ["Hinglish", "Rewrite in friendly Hinglish"],
                        ] as [string, string | undefined][]
                      ).map(([label, ins]) => (
                        <button
                          key={label}
                          type="button"
                          disabled={!!aiBusy || !form.name}
                          onClick={() => rewrite(label, ins)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ai-line bg-ai-bg px-3 text-[13px] font-medium text-ai-fg hover:border-ai-fg disabled:opacity-50 md:min-h-8"
                        >
                          {aiBusy === `rewrite:${label}` ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />}
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea {...bind("description")} rows={7} className={field} />
                </div>
              </div>
            </Panel>

            <Panel title="Size, materials & tags">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="pe-size" ai={ai("size")}>
                      Size
                    </FieldLabel>
                    <input {...bind("size")} className={field} placeholder="e.g. 12 in (30 cm) across" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pe-care" ai={ai("care")}>
                      Care
                    </FieldLabel>
                    <input {...bind("care")} className={field} placeholder="e.g. Wipe with a dry cloth" />
                  </div>
                </div>
                <div>
                  <FieldLabel ai={ai("materials")}>Materials</FieldLabel>
                  <TagInput value={form.materials} onChange={(v) => set("materials", v)} placeholder="Clay, mirrors… (press Enter)" />
                </div>
                <div>
                  <FieldLabel ai={ai("colors")}>Colours</FieldLabel>
                  <TagInput value={form.colors} onChange={(v) => set("colors", v)} placeholder="Teal, white…" />
                </div>
                <div>
                  <FieldLabel ai={ai("tags")}>Search tags</FieldLabel>
                  <TagInput value={form.tags} onChange={(v) => set("tags", v)} placeholder="housewarming, living room, gift…" />
                  <p className="helper">Helps customers and the shop assistant find this piece.</p>
                </div>
              </div>
            </Panel>

            <details className="group rounded-[8px] border border-admin-line bg-white">
              <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-[16px] font-semibold md:px-5 md:text-[14px]">
                <span className="flex items-center gap-2">
                  Google & sharing <span className="font-normal text-muted">(optional)</span>
                  {(ai("seoTitle") || ai("seoDescription")) && <AiDraftChip />}
                </span>
                <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="space-y-4 border-t border-admin-line px-4 py-4 md:px-5">
                <div>
                  <FieldLabel htmlFor="pe-seoTitle" ai={ai("seoTitle")}>
                    Search title
                  </FieldLabel>
                  <input {...bind("seoTitle")} className={field} maxLength={70} />
                </div>
                <div>
                  <FieldLabel htmlFor="pe-seoDescription" ai={ai("seoDescription")}>
                    Search description
                  </FieldLabel>
                  <textarea {...bind("seoDescription")} rows={2} className={field} maxLength={170} />
                </div>
                {productId && (
                  <div>
                    <FieldLabel htmlFor="pe-slug">Web address</FieldLabel>
                    <input {...bind("slug")} className={field} />
                    <p className="helper">/product/{form.slug || "…"}</p>
                  </div>
                )}
              </div>
            </details>
          </div>

          <div className="space-y-3 md:space-y-4">
            <Panel title="Visibility">
              <div className="space-y-4">
                <Row label="Live" hint={form.isActive ? "Customers can see this" : "Hidden. Saved as a draft"}>
                  <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Live on website" />
                </Row>
                <Row label="Featured on homepage">
                  <Switch checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured on homepage" />
                </Row>
                <Row label="Mark as bestseller">
                  <Switch checked={form.isBestseller} onChange={(v) => set("isBestseller", v)} label="Mark as bestseller" />
                </Row>
                <div>
                  <FieldLabel htmlFor="pe-badge">Badge</FieldLabel>
                  <select {...bind("badge")} className={field}>
                    {BADGES.map((b) => (
                      <option key={b} value={b}>
                        {b || "None"}
                      </option>
                    ))}
                  </select>
                  <p className="helper">Shows one small label on the product card.</p>
                </div>
              </div>
            </Panel>

            <Panel
              title="Price & stock"
              action={
                aiEnabled && (
                  <button type="button" onClick={suggestPrice} disabled={!!aiBusy || !form.name} className="-my-1 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ai-line bg-ai-bg px-3 text-[13px] font-semibold text-ai-fg hover:border-ai-fg disabled:opacity-50">
                    {aiBusy === "price" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />} Suggest price
                  </button>
                )
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel htmlFor="pe-price" ai={ai("price")}>
                      Price (₹)
                    </FieldLabel>
                    <input {...bind("price")} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cx(field, "tabular text-[17px]! font-semibold")} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pe-compareAtPrice">MRP (₹)</FieldLabel>
                    <input {...bind("compareAtPrice")} onChange={(e) => set("compareAtPrice", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cx(field, "tabular")} placeholder="optional" />
                  </div>
                </div>
                {draftExtras?.priceRange && (
                  <p className="flex gap-2 rounded-[6px] border border-ai-line bg-ai-bg p-3 text-[13px] leading-5 text-ai-fg">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>
                      <span className="font-semibold">AI suggestion:</span> {draftExtras.priceRange}
                    </span>
                  </p>
                )}
                <Row label="Made to order" hint="Always orderable; made after the order">
                  <Switch checked={form.madeToOrder} onChange={(v) => set("madeToOrder", v)} label="Made to order" />
                </Row>
                {form.madeToOrder ? (
                  <div>
                    <FieldLabel htmlFor="pe-leadTimeDays">Days to make</FieldLabel>
                    <input {...bind("leadTimeDays")} onChange={(e) => set("leadTimeDays", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cx(field, "tabular")} placeholder="e.g. 7" />
                  </div>
                ) : (
                  <div>
                    <FieldLabel htmlFor="pe-stock">Pieces in stock</FieldLabel>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => set("stock", String(Math.max(0, Number(form.stock) - 1)))} className="grid size-12 shrink-0 place-items-center rounded-[6px] border border-line-strong bg-white hover:bg-admin-inset md:size-9" aria-label="One fewer">
                        <Minus className="size-4" />
                      </button>
                      <input {...bind("stock")} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cx(field, "tabular text-center")} />
                      <button type="button" onClick={() => set("stock", String(Number(form.stock || 0) + 1))} className="grid size-12 shrink-0 place-items-center rounded-[6px] border border-line-strong bg-white hover:bg-admin-inset md:size-9" aria-label="One more">
                        <Plus className="size-4" />
                      </button>
                    </div>
                    {Number(form.stock) <= 2 && <p className="helper text-warning!">{Number(form.stock) === 0 ? "Sold out. Customers can’t order this." : `Only ${form.stock} left.`}</p>}
                  </div>
                )}
                <Row label="Personalisable" hint="Shows a note box for names or colours">
                  <Switch checked={form.customizable} onChange={(v) => set("customizable", v)} label="Personalisable" />
                </Row>
              </div>
            </Panel>

            <Panel title="Category">
              <FieldLabel htmlFor="pe-categoryId" ai={ai("categoryId")}>
                Category
              </FieldLabel>
              <select {...bind("categoryId")} className={field}>
                <option value="">Uncategorised</option>
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
                <button type="button" onClick={() => createSuggestedCategory(draftExtras.newCategory!)} className="mt-3 flex w-full items-start gap-2 rounded-[6px] border border-ai-line bg-ai-bg p-3 text-left text-[14px] text-ai-fg hover:border-ai-fg">
                  <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    AI suggests a new category: <b>{draftExtras.newCategory}</b>
                    <span className="block text-[13px]">Tap to create it and use it here</span>
                  </span>
                </button>
              )}
              <Link href="/admin/categories" className="link mt-3 inline-block text-[13px] font-medium">
                Manage categories
              </Link>
            </Panel>

            {draftExtras?.caption && (
              <AiPanel title="Instagram caption">
                <p className="text-[14px] leading-6 whitespace-pre-wrap text-ink">{draftExtras.caption}</p>
                <button
                  type="button"
                  onClick={async () => ((await copyText(draftExtras.caption!)) ? toast("Caption copied") : toast("Could not copy", "err"))}
                  className={btn("aiOutline", "mt-3")}
                >
                  <Copy className="size-4" aria-hidden /> Copy caption
                </button>
              </AiPanel>
            )}

            {productId && form.slug && (
              <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" className={btn("secondary", "w-full")}>
                Preview as customer <ExternalLink className="size-4" aria-hidden />
              </a>
            )}

            {productId && (
              <button onClick={remove} className={btn("dangerGhost", "w-full justify-start")}>
                <Trash2 className="size-4" aria-hidden /> Delete piece
              </button>
            )}
          </div>
        </div>
      )}

      <ContextBar
        show={showBar}
        busy={saving}
        primaryDisabled={listingBusy}
        message={productId ? "Unsaved changes" : listingBusy ? "AI is drafting your listing…" : "Not published yet"}
        primaryLabel={productId ? "Save" : "Publish"}
        onPrimary={() => save(productId ? undefined : true)}
        secondaryLabel={productId ? "Discard" : "Save draft"}
        onSecondary={productId ? discard : listingBusy ? undefined : () => save(false)}
      />
      {confirmDialog}
    </div>
  );
}

function FieldLabel({ htmlFor, ai, extra, children }: { htmlFor?: string; ai?: boolean; extra?: React.ReactNode; children: React.ReactNode }) {
  const Tag = htmlFor ? "label" : "p";
  return (
    <div className="mb-1.5 flex min-h-[22px] items-center justify-between gap-2">
      <Tag {...(htmlFor ? { htmlFor } : {})} className="label mb-0!">
        {children}
      </Tag>
      <span className="flex items-center gap-2">
        {ai && <AiDraftChip />}
        {extra}
      </span>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div>
        <p className="text-[15px] font-medium md:text-[14px]">{label}</p>
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
