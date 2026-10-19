"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, Link2, Loader2, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/components/admin/ui";
import { ADMIN_ICONS, AiDraftChip, btn, ContextBar, cx, DetailHeader, field, StateChip, useActionToast, useEasedProgress } from "@/components/admin/pages/kit";
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
  /** Fields still holding the AI's first draft (cleared when edited). */
  aiFilled?: ("name" | "price" | "categoryId")[];
};

export default function BulkUploadPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiOn, setAiOn] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useActionToast();
  const router = useRouter();

  useEffect(() => {
    api<{ categories: Category[] }>("/api/admin/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
    api<{ system: { ai: string | null } }>("/api/admin/settings")
      .then((d) => setAiOn(Boolean(d.system.ai)))
      .catch(() => {});
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
  const edit = (it: Item, k: "name" | "price" | "categoryId", v: string) => update(it.key, { [k]: v, aiFilled: (it.aiFilled ?? []).filter((x) => x !== k) });

  const removeItem = (idx: number) => {
    const it = items[idx];
    setItems((c) => c.filter((x) => x.key !== it.key));
    toast("Removed from the batch", "ok", { label: "Undo", onClick: () => setItems((c) => [...c.slice(0, idx), it, ...c.slice(idx)]) });
  };

  const processOne = async (it: Item) => {
    update(it.key, { status: "working", error: undefined });
    try {
      const [urls, draft] = await Promise.all([
        uploadImages(it.files),
        aiOn
          ? Promise.all(it.files.slice(0, 3).map((f) => toAiImage(f))).then((images) => api<{ draft: Record<string, unknown> }>("/api/admin/ai/product-from-images", { body: { images } }).then((d) => d.draft))
          : Promise.resolve(undefined),
      ]);
      setItems((cur) =>
        cur.map((x) => {
          if (x.key !== it.key) return x;
          const aiFilled: Item["aiFilled"] = [];
          if (!x.name && draft?.name) aiFilled.push("name");
          if (!x.price && draft?.suggestedPrice) aiFilled.push("price");
          if (!x.categoryId && draft?.categoryId) aiFilled.push("categoryId");
          return {
            ...x,
            status: "done",
            images: urls,
            draft,
            aiFilled,
            name: x.name || String(draft?.name ?? ""),
            price: x.price || String(draft?.suggestedPrice ?? ""),
            categoryId: x.categoryId || String(draft?.categoryId ?? ""),
          };
        }),
      );
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
    if (!ready.length) return toast("Nothing is ready to save yet", "err");
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
      toast(`${products.length} ${products.length === 1 ? "piece" : "pieces"} ${publish ? "published" : "saved as drafts"}`);
      router.push("/admin/products");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const workingCount = items.filter((i) => i.status === "working").length;
  const progress = items.length ? doneCount / items.length : 0;
  const flatCats = cats.flatMap((c) => [c, ...(c.children ?? [])]);

  return (
    <div className={cx(ADMIN_ICONS, "pb-24 md:pb-8")}>
      <DetailHeader back={{ href: "/admin/products", label: "Products" }} title="Bulk upload" meta={aiOn ? "Add many photos at once. AI drafts a full listing for each piece." : "Add many photos at once, then name and price each piece."} />

      <div
        onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cx("rounded-[8px] border border-dashed bg-white px-5 py-10 text-center transition-colors", dragOver ? "border-ink bg-admin-inset" : "border-line-strong")}
      >
        <span className="mx-auto grid size-14 place-items-center rounded-[12px] bg-plinth text-ink">
          <ImagePlus className="size-6" aria-hidden />
        </span>
        <p className="mt-3 font-display text-[22px] leading-tight">Drop photos here</p>
        <p className="mx-auto mt-1 max-w-md text-[14px] text-muted">One photo makes one piece. Several photos of the same piece? Use “Join with previous”.</p>
        <button type="button" onClick={() => input.current?.click()} className={btn("primary", "mt-4")}>
          Choose photos
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
      </div>

      {items.length > 0 && (
        <>
          <div className={cx("mt-4 overflow-hidden rounded-[8px] border", aiOn ? "border-ai-line bg-ai-bg" : "border-admin-line bg-white")}>
            {running && (
              <div className="h-0.5 bg-ai-line" aria-hidden>
                <div className={cx("h-full transition-[width] duration-500", aiOn ? "bg-ai-fg" : "bg-ink")} style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 p-4">
              <p className={cx("tabular text-[14px] font-medium", aiOn ? "text-ai-fg" : "text-ink")} role="status" aria-live="polite">
                {items.length} {items.length === 1 ? "piece" : "pieces"} · {doneCount} ready{workingCount ? ` · ${workingCount} in progress` : ""}
              </p>
              <button onClick={runAll} disabled={running || doneCount === items.length} className={btn(aiOn ? "ai" : "primary", "ml-auto")}>
                {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : aiOn ? <Sparkles className="size-4" aria-hidden /> : null}
                {running ? (aiOn ? "AI is writing…" : "Uploading…") : aiOn ? "Upload & write listings with AI" : "Upload photos"}
              </button>
            </div>
          </div>

          <ul className="mt-3 grid gap-3 md:mt-4 md:grid-cols-2 md:gap-4">
            {items.map((it, idx) => (
              <li key={it.key} className={cx("rounded-[8px] border bg-white p-4", it.status === "error" ? "border-danger" : it.status === "working" && aiOn ? "border-ai-line" : "border-admin-line")}>
                <div className="flex gap-3">
                  <div className="grid w-24 shrink-0 grid-cols-2 gap-1 self-start">
                    {it.previews.map((src, n) => (
                      <img key={n} src={src} alt="" className={cx("aspect-[4/5] w-full rounded-[6px] bg-plinth object-cover", n === 0 && "col-span-2")} />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex min-h-8 flex-wrap items-center gap-2">
                      {it.status === "idle" && (
                        <StateChip tone="neutral" fill="empty">
                          Waiting
                        </StateChip>
                      )}
                      {it.status === "working" &&
                        (aiOn ? (
                          <WorkingChip />
                        ) : (
                          <StateChip tone="info" icon={<Loader2 className="size-3 animate-spin" aria-hidden />}>
                            Uploading…
                          </StateChip>
                        ))}
                      {it.status === "done" && (
                        <StateChip tone="success" icon={<CheckCircle2 className="size-3" aria-hidden />}>
                          Ready
                        </StateChip>
                      )}
                      {it.status === "error" && (
                        <StateChip tone="danger" icon={<AlertTriangle className="size-3" aria-hidden />}>
                          Failed
                        </StateChip>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        {idx > 0 && it.status === "idle" && (
                          <button onClick={() => mergeUp(idx)} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-admin-sidebar px-2.5 text-[12.5px] font-medium hover:bg-admin-sidebar-hover" title="These photos show the same piece as the one before">
                            <Link2 className="size-3.5" aria-hidden /> Join with previous
                          </button>
                        )}
                        <button onClick={() => removeItem(idx)} disabled={it.status === "working"} className="grid size-11 place-items-center rounded-full text-muted hover:bg-status-danger-bg hover:text-danger disabled:opacity-40 md:size-9" aria-label="Remove from batch">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {it.status === "error" && (
                      <p className="flex flex-wrap items-center gap-2 text-[13px] text-danger">
                        {it.error}
                        <button onClick={() => processOne(it)} className="inline-flex min-h-9 items-center gap-1 font-semibold text-ink underline">
                          <RotateCcw className="size-3.5" aria-hidden /> Retry
                        </button>
                      </p>
                    )}
                    <div className="relative">
                      <input value={it.name} onChange={(e) => edit(it, "name", e.target.value)} placeholder={aiOn ? "Name (AI will fill this)" : "Name"} aria-label="Name" className={cx(field, it.aiFilled?.includes("name") && "pr-24!")} />
                      {it.aiFilled?.includes("name") && <AiDraftChip className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2" />}
                    </div>
                    <div className="flex gap-2">
                      <input value={it.price} onChange={(e) => edit(it, "price", e.target.value.replace(/\D/g, ""))} placeholder="₹ Price" aria-label="Price in rupees" inputMode="numeric" className={cx(field, "tabular w-28! shrink-0", it.aiFilled?.includes("price") && "border-ai-line! bg-ai-bg!")} />
                      <select value={it.categoryId} onChange={(e) => edit(it, "categoryId", e.target.value)} aria-label="Category" className={cx(field, "min-w-0", it.aiFilled?.includes("categoryId") && "border-ai-line! bg-ai-bg!")}>
                        <option value="">Category…</option>
                        {flatCats.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.parentId ? "↳ " : ""}
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {it.draft?.shortDescription ? <p className="line-clamp-2 text-[13px] text-muted">{String(it.draft.shortDescription)}</p> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ContextBar
        show={doneCount > 0}
        busy={saving}
        message="Pieces without a price are saved as drafts"
        secondaryLabel="Save as drafts"
        onSecondary={() => saveAll(false)}
        primaryLabel={<span className="tabular">Publish {doneCount}</span>}
        onPrimary={() => saveAll(true)}
      />
    </div>
  );
}

/** Neel chip with a tiny eased bar while AI writes one listing. */
function WorkingChip() {
  const p = useEasedProgress(true, 12);
  return (
    <span className="inline-flex h-[22px] items-center gap-1.5 overflow-hidden rounded-full border border-ai-line bg-ai-bg pr-2 pl-1.5 text-[11.5px] font-semibold text-ai-fg">
      <Sparkles className="size-3" aria-hidden /> AI writing…
      <span className="h-0.5 w-10 rounded-full bg-ai-line" aria-hidden>
        <span className="block h-full rounded-full bg-ai-fg transition-[width] duration-500" style={{ width: `${Math.round(p * 100)}%` }} />
      </span>
    </span>
  );
}
