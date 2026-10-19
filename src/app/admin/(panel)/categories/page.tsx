"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CornerDownRight, FolderPlus, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { api, confirmAction, Empty, Loading, Modal, PageHeader, Switch, useLoad, useToast } from "@/components/admin/ui";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import type { Category } from "@/lib/types";

type Edit = { id?: string; name: string; slug: string; parentId: string; description: string; image: string; isActive: boolean; sortOrder: number };

export default function CategoriesPage() {
  const { data, loading, reload } = useLoad<{ categories: Category[] }>("/api/admin/categories");
  const toast = useToast();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const tree = data?.categories ?? [];

  const openNew = (parentId = "") => setEdit({ name: "", slug: "", parentId, description: "", image: "", isActive: true, sortOrder: 0 });
  const openEdit = (c: Category) =>
    setEdit({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId ?? "", description: c.description ?? "", image: c.image ?? "", isActive: c.isActive, sortOrder: c.sortOrder });

  const save = async () => {
    if (!edit?.name.trim()) return toast("Please enter a name", "err");
    setSaving(true);
    try {
      const body = { ...edit, parentId: edit.parentId || null };
      if (edit.id) await api(`/api/admin/categories/${edit.id}`, { method: "PUT", body });
      else await api("/api/admin/categories", { body });
      toast(edit.id ? "Category updated" : "Category added");
      setEdit(null);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    const subs = c.children?.length ? ` Its ${c.children.length} sub-categories will become main categories.` : "";
    if (!confirmAction(`Delete “${c.name}”? Products in it will move ${c.parentId ? "to the parent category" : "to Uncategorised"}.${subs}`)) return;
    await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    toast("Category deleted");
    reload();
  };

  const toggle = async (c: Category, isActive: boolean) => {
    await api(`/api/admin/categories/${c.id}`, { method: "PUT", body: { ...c, isActive } });
    reload();
  };

  const move = async (list: Category[], idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    const ids = list.map((c) => c.id);
    [ids[idx], ids[to]] = [ids[to], ids[idx]];
    await api("/api/admin/categories", { body: { action: "reorder", order: ids } });
    reload();
  };

  const upload = async (files: FileList | null) => {
    if (!files?.[0] || !edit) return;
    setUploading(true);
    try {
      const [url] = await uploadImages([files[0]]);
      setEdit({ ...edit, image: url });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "err");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organise your shop into categories and sub-categories. Use the arrows to set the order shown on your website."
        actions={
          <button onClick={() => openNew()} className="btn btn-primary btn-sm">
            <FolderPlus className="size-4" /> New category
          </button>
        }
      />
      {loading && !data ? (
        <Loading />
      ) : tree.length === 0 ? (
        <div className="rounded-2xl bg-white">
          <Empty title="No categories yet" text="Create categories like “Wall Decor” and sub-categories like “Lippan Art”." action={<button onClick={() => openNew()} className="btn btn-primary">Create category</button>} />
        </div>
      ) : (
        <div className="space-y-4">
          {tree.map((c, i) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
              <CatRow c={c} onEdit={() => openEdit(c)} onDelete={() => remove(c)} onToggle={(v) => toggle(c, v)} onUp={() => move(tree, i, -1)} onDown={() => move(tree, i, 1)} />
              <div className="border-t border-ink/[0.05] bg-tint/30">
                {c.children?.map((s, j) => (
                  <CatRow key={s.id} c={s} sub onEdit={() => openEdit(s)} onDelete={() => remove(s)} onToggle={(v) => toggle(s, v)} onUp={() => move(c.children!, j, -1)} onDown={() => move(c.children!, j, 1)} />
                ))}
                <button onClick={() => openNew(c.id)} className="flex w-full items-center gap-2 px-5 py-3 pl-14 text-sm text-ink-soft hover:bg-tint/40">
                  <Plus className="size-4" /> Add sub-category to {c.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit category" : edit?.parentId ? "New sub-category" : "New category"}>
        {edit && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="relative grid size-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/15 bg-tint/40">
                {uploading ? <Loader2 className="size-5 animate-spin" /> : edit.image ? <img src={imgUrl(edit.image, 200)} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6 text-ink/40" />}
                <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files)} />
              </label>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="label">Name *</label>
                  <input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="input" placeholder="e.g. Resin Art" />
                </div>
                <p className="text-xs text-muted">Tap the square to add a cover image (shown on homepage).</p>
              </div>
            </div>
            <div>
              <label className="label">Parent category</label>
              <select value={edit.parentId} onChange={(e) => setEdit({ ...edit, parentId: e.target.value })} className="input">
                <option value="">— None (main category) —</option>
                {tree
                  .filter((c) => c.id !== edit.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea rows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="input" placeholder="Shown at the top of the category page" />
            </div>
            {edit.id && (
              <div>
                <label className="label">URL slug</label>
                <input value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} className="input" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Visible on website</span>
              <Switch checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} />
            </div>
            <button onClick={save} disabled={saving} className="btn btn-primary w-full">
              {saving && <Loader2 className="size-4 animate-spin" />} Save
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CatRow({ c, sub, onEdit, onDelete, onToggle, onUp, onDown }: { c: Category; sub?: boolean; onEdit: () => void; onDelete: () => void; onToggle: (v: boolean) => void; onUp: () => void; onDown: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${sub ? "pl-6 md:pl-8" : ""}`}>
      {sub && <CornerDownRight className="size-4 shrink-0 text-ink/30" />}
      <img src={imgUrl(c.image, 100)} alt="" className={`${sub ? "size-9" : "size-12"} shrink-0 rounded-xl object-cover`} />
      <div className="min-w-0 flex-1">
        <p className={`truncate ${sub ? "text-[15px]" : "font-display text-xl font-semibold"}`}>{c.name}</p>
        <p className="text-xs text-muted">
          {c.productCount ?? 0} products · /{c.slug}
          {!c.isActive && " · hidden"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onUp} className="hidden size-8 place-items-center rounded-full hover:bg-ink/5 sm:grid" aria-label="Move up">
          <ArrowUp className="size-4" />
        </button>
        <button onClick={onDown} className="hidden size-8 place-items-center rounded-full hover:bg-ink/5 sm:grid" aria-label="Move down">
          <ArrowDown className="size-4" />
        </button>
        <Switch checked={c.isActive} onChange={onToggle} label="Visible" />
        <button onClick={onEdit} className="grid size-8 place-items-center rounded-full hover:bg-ink/5" aria-label="Edit">
          <Pencil className="size-4" />
        </button>
        <button onClick={onDelete} className="grid size-8 place-items-center rounded-full text-danger/80 hover:bg-danger/10" aria-label="Delete">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
