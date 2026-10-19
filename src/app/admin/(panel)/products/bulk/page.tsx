"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ImagePlus, Link2, Loader2, Sparkles, Trash2, AlertTriangle } from "lucide-react";
import { api, Panel, useToast } from "@/components/admin/ui";
import { toAiImage, uploadImages } from "@/lib/client-image";
import type { Category } from "@/lib/types";

type Item = {
  key: string;
  files: File[];
  previews: string[];
  status: "idle" | "working" | "done" | "error";
  error?: string;
  images: string[];
  name: string;
  price: string;
  categoryId: string;
  draft?: Record<string, unknown>;
};

export default function BulkUploadPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiOn, setAiOn] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api<{ categories: Category[] }>("/api/admin/categories").then((d) => setCats(d.categories));
    api<{ system: { ai: string | null } }>("/api/admin/settings").then((d) => setAiOn(Boolean(d.system.ai)));
  }, []);

  const addFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    setItems((cur) => [
      ...cur,
      ...files.map((f, i) => ({ key: `${Date.now()}-${i}-${f.name}`, files: [f], previews: [URL.createObjectURL(f)], status: "idle" as const, images: [], name: "", price: "", categoryId: "" })),
    ]);
  };

  const mergeUp = (idx: number) =>
    setItems((cur) => {
      if (idx === 0) return cur;
      const next = [...cur];
      const prev = next[idx - 1];
      next[idx - 1] = { ...prev, files: [...prev.files, ...next[idx].files], previews: [...prev.previews, ...next[idx].previews] };
      next.splice(idx, 1);
      return next;
    });

  const update = (key: string, patch: Partial<Item>) => setItems((cur) => cur.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const processOne = async (it: Item) => {
    update(it.key, { status: "working", error: undefined });
    try {
      const [urls, draft] = await Promise.all([
        uploadImages(it.files),
        aiOn
          ? Promise.all(it.files.slice(0, 3).map((f) => toAiImage(f))).then((images) => api<{ draft: Record<string, unknown> }>("/api/admin/ai/product-from-images", { body: { images } }).then((d) => d.draft))
          : Promise.resolve(undefined),
      ]);
      update(it.key, {
        status: "done",
        images: urls,
        draft,
        name: it.name || String(draft?.name ?? ""),
        price: it.price || String(draft?.suggestedPrice ?? ""),
        categoryId: it.categoryId || String(draft?.categoryId ?? ""),
      });
    } catch (e) {
      update(it.key, { status: "error", error: e instanceof Error ? e.message : "Failed" });
    }
  };

  const runAll = async () => {
    setRunning(true);
    const queue = items.filter((i) => i.status !== "done");
    // two at a time keeps it fast without hitting rate limits
    const workers = [0, 1].map(async () => {
      while (queue.length) await processOne(queue.shift()!);
    });
    await Promise.all(workers);
    setRunning(false);
  };

  const saveAll = async (publish: boolean) => {
    const ready = items.filter((i) => i.status === "done" && i.name.trim());
    if (!ready.length) return toast("Nothing ready to save yet", "err");
    setSaving(true);
    try {
      const products = ready.map((i) => {
        const d = (i.draft ?? {}) as Record<string, unknown>;
        return {
          ...d,
          name: i.name,
          price: Number(i.price) || 0,
          categoryId: i.categoryId || null,
          images: i.images,
          stock: 1,
          isActive: publish && Number(i.price) > 0,
        };
      });
      await api("/api/admin/products/bulk", { body: { action: "create", products } });
      toast(`${products.length} products ${publish ? "published" : "saved as drafts"} 🎉`);
      router.push("/admin/products");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/products" className="grid size-9 place-items-center rounded-full bg-white shadow-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Bulk upload</h1>
          <p className="text-sm text-muted">Add many photos at once — {aiOn ? "AI writes a full listing for each piece." : "then name & price each piece."}</p>
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className="cursor-pointer rounded-[1.75rem] border-2 border-dashed border-ink/15 bg-white p-10 text-center transition hover:border-ink/40"
      >
        <ImagePlus className="mx-auto size-10 text-ink/40" />
        <p className="mt-3 font-display text-2xl">Drop photos here or tap to choose</p>
        <p className="mt-1 text-sm text-muted">One photo = one product. Have several photos of the same piece? Use “Join with previous”.</p>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">
              {items.length} products · {doneCount} ready
            </p>
            <button onClick={runAll} disabled={running || doneCount === items.length} className="btn btn-primary btn-sm ml-auto">
              {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {running ? "Working…" : aiOn ? "Upload & write listings with AI" : "Upload photos"}
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {items.map((it, idx) => (
              <Panel key={it.key} className={it.status === "error" ? "ring-1 ring-rose/40" : ""}>
                <div className="flex gap-4">
                  <div className="grid w-28 shrink-0 grid-cols-2 gap-1">
                    {it.previews.map((src, n) => (
                      <img key={n} src={src} alt="" className={`aspect-square w-full rounded-lg object-cover ${n === 0 ? "col-span-2" : ""}`} />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      {it.status === "working" && (
                        <span className="flex items-center gap-1 text-gold">
                          <Loader2 className="size-3.5 animate-spin" /> {aiOn ? "AI writing…" : "Uploading…"}
                        </span>
                      )}
                      {it.status === "done" && (
                        <span className="flex items-center gap-1 text-wa">
                          <CheckCircle2 className="size-3.5" /> Ready
                        </span>
                      )}
                      {it.status === "error" && (
                        <span className="flex items-center gap-1 text-rose">
                          <AlertTriangle className="size-3.5" /> {it.error}
                        </span>
                      )}
                      <div className="ml-auto flex gap-1">
                        {idx > 0 && it.status === "idle" && (
                          <button onClick={() => mergeUp(idx)} className="flex items-center gap-1 rounded-full bg-cream px-2 py-1" title="These photos are of the same piece as the previous one">
                            <Link2 className="size-3" /> Join with previous
                          </button>
                        )}
                        <button onClick={() => setItems((c) => c.filter((x) => x.key !== it.key))} className="rounded-full p-1 text-muted hover:text-rose" aria-label="Remove">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <input value={it.name} onChange={(e) => update(it.key, { name: e.target.value })} placeholder={aiOn ? "Name (AI will fill)" : "Product name"} className="input py-2 text-sm" />
                    <div className="flex gap-2">
                      <input value={it.price} onChange={(e) => update(it.key, { price: e.target.value.replace(/\D/g, "") })} placeholder="₹ Price" inputMode="numeric" className="input w-28 py-2 text-sm" />
                      <select value={it.categoryId} onChange={(e) => update(it.key, { categoryId: e.target.value })} className="input py-2 text-sm">
                        <option value="">Category…</option>
                        {cats.flatMap((c) => [c, ...(c.children ?? [])]).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.parentId ? "↳ " : ""}
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {it.draft?.shortDescription ? <p className="line-clamp-2 text-xs text-muted">{String(it.draft.shortDescription)}</p> : null}
                    {it.status === "error" && (
                      <button onClick={() => processOne(it)} className="text-xs underline">
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}

      {doneCount > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
            <span className="mr-auto text-xs text-muted">Products without a price are saved as drafts.</span>
            <button disabled={saving} onClick={() => saveAll(false)} className="btn btn-outline">
              Save as drafts
            </button>
            <button disabled={saving} onClick={() => saveAll(true)} className="btn btn-primary">
              {saving && <Loader2 className="size-4 animate-spin" />} Publish {doneCount}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
