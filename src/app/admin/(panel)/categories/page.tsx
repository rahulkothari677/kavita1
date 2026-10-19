"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CornerDownRight, FolderPlus, FolderTree, ImagePlus, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { api, Empty, Modal, PageHeader, Switch, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, btn, cardShell, cx, field, SheetRow, Sk, StateChip, Thumb, useActionToast, useConfirm } from "@/components/admin/pages/kit";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import type { Category } from "@/lib/types";

type Edit = { id?: string; name: string; slug: string; parentId: string; description: string; image: string; isActive: boolean; sortOrder: number };

export default function CategoriesPage() {
  const { data, setData, loading, reload } = useLoad<{ categories: Category[] }>("/api/admin/categories");
  const toast = useActionToast();
  const [ask, confirmDialog] = useConfirm();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menu, setMenu] = useState<{ c: Category; list: Category[]; idx: number } | null>(null);
  const tree = data?.categories ?? [];

  const openNew = (parentId = "") => setEdit({ name: "", slug: "", parentId, description: "", image: "", isActive: true, sortOrder: 0 });
  const openEdit = (c: Category) =>
    setEdit({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId ?? "", description: c.description ?? "", image: c.image ?? "", isActive: c.isActive, sortOrder: c.sortOrder });

  const save = async () => {
    if (!edit?.name.trim()) return toast("Give the category a name", "err");
    setSaving(true);
    try {
      const body = { ...edit, parentId: edit.parentId || null };
      if (edit.id) await api(`/api/admin/categories/${edit.id}`, { method: "PUT", body });
      else await api("/api/admin/categories", { body });
      toast(edit.id ? "Category updated" : "Category added");
      setEdit(null);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    const subs = c.children?.length ? ` Its ${c.children.length} sub-categories will become main categories.` : "";
    const ok = await ask({
      title: `Delete “${c.name}”?`,
      body: `Pieces in it move ${c.parentId ? "to the parent category" : "to Uncategorised"}.${subs}`,
      confirmLabel: "Delete category",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      toast("Category deleted");
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete", "err");
    }
  };

  const setLocalActive = (id: string, isActive: boolean) =>
    setData((d) => d && { categories: d.categories.map((c) => (c.id === id ? { ...c, isActive } : { ...c, children: c.children?.map((s) => (s.id === id ? { ...s, isActive } : s)) })) });

  const toggle = async (c: Category, isActive: boolean, withUndo = true) => {
    setLocalActive(c.id, isActive);
    try {
      const { children: _children, productCount: _count, ...rest } = c;
      void _children;
      void _count;
      await api(`/api/admin/categories/${c.id}`, { method: "PUT", body: { ...rest, isActive } });
      if (withUndo) toast(isActive ? `${c.name} is visible` : `${c.name} is hidden`, "ok", { label: "Undo", onClick: () => toggle({ ...c, isActive }, !isActive, false) });
      reload();
    } catch (e) {
      setLocalActive(c.id, !isActive);
      toast(e instanceof Error ? e.message : "Could not update", "err");
    }
  };

  const move = async (list: Category[], idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    const ids = list.map((c) => c.id);
    [ids[idx], ids[to]] = [ids[to], ids[idx]];
    try {
      await api("/api/admin/categories", { body: { action: "reorder", order: ids } });
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not reorder", "err");
    }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.[0] || !edit) return;
    setUploading(true);
    try {
      const [url] = await uploadImages([files[0]]);
      setEdit((e) => e && { ...e, image: url });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "err");
    } finally {
      setUploading(false);
    }
  };

  const rowProps = (c: Category, list: Category[], idx: number) => ({
    c,
    first: idx === 0,
    last: idx === list.length - 1,
    onEdit: () => openEdit(c),
    onDelete: () => remove(c),
    onToggle: (v: boolean) => toggle(c, v),
    onUp: () => move(list, idx, -1),
    onDown: () => move(list, idx, 1),
    onMenu: () => setMenu({ c, list, idx }),
  });

  return (
    <div className={ADMIN_ICONS}>
      <PageHeader
        title="Categories"
        subtitle="Group your pieces into categories and sub-categories. The order here is the order on your website."
        actions={
          <button onClick={() => openNew()} className={btn("primary")}>
            <FolderPlus className="size-4" aria-hidden /> New category
          </button>
        }
      />

      {loading && !data ? (
        <div role="status" aria-label="Loading" className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cx(cardShell, "flex items-center gap-3 p-4")}>
              <Sk className="size-12 shrink-0" />
              <div className="flex-1 space-y-2">
                <Sk className="h-4 w-1/3" />
                <Sk className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : tree.length === 0 ? (
        <div className={cardShell}>
          <Empty
            icon={<FolderTree />}
            title="Create your first category"
            text="For example “Wall decor”, with sub-categories like “Lippan art”."
            action={
              <button onClick={() => openNew()} className={btn("primary")}>
                <FolderPlus className="size-4" aria-hidden /> New category
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {tree.map((c, i) => (
            <section key={c.id} className={cardShell} aria-label={c.name}>
              <CatRow {...rowProps(c, tree, i)} />
              <div className="border-t border-admin-line bg-admin-inset">
                {c.children?.map((s, j) => (
                  <CatRow key={s.id} sub {...rowProps(s, c.children!, j)} />
                ))}
                <button onClick={() => openNew(c.id)} className="flex min-h-11 w-full items-center gap-2 px-4 pl-11 text-left text-[14px] font-medium text-muted hover:text-ink md:pl-14">
                  <Plus className="size-4" aria-hidden /> Add sub-category
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Mobile row menu */}
      <Modal open={!!menu} onClose={() => setMenu(null)} title={menu?.c.name ?? ""}>
        {menu && (
          <div className="-mx-2">
            <SheetRow icon={<Pencil className="size-5" />} onClick={() => (setMenu(null), openEdit(menu.c))}>
              Edit
            </SheetRow>
            {!menu.c.parentId && (
              <SheetRow icon={<Plus className="size-5" />} onClick={() => (setMenu(null), openNew(menu.c.id))}>
                Add sub-category
              </SheetRow>
            )}
            {menu.idx > 0 && (
              <SheetRow icon={<ArrowUp className="size-5" />} onClick={() => (setMenu(null), move(menu.list, menu.idx, -1))}>
                Move up
              </SheetRow>
            )}
            {menu.idx < menu.list.length - 1 && (
              <SheetRow icon={<ArrowDown className="size-5" />} onClick={() => (setMenu(null), move(menu.list, menu.idx, 1))}>
                Move down
              </SheetRow>
            )}
            <div className="my-1 border-t border-admin-line" />
            <SheetRow tone="danger" icon={<Trash2 className="size-5" />} onClick={() => (setMenu(null), remove(menu.c))}>
              Delete
            </SheetRow>
          </div>
        )}
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit category" : edit?.parentId ? "New sub-category" : "New category"}>
        {edit && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="relative grid aspect-[4/5] w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[6px] border border-dashed border-line-strong bg-plinth hover:bg-plinth-strong">
                {uploading ? <Loader2 className="size-5 animate-spin text-muted" aria-hidden /> : edit.image ? <img src={imgUrl(edit.image, 240)} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6 text-muted" aria-hidden />}
                <span className="sr-only">{edit.image ? "Change cover image" : "Add cover image"}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files)} />
              </label>
              <div className="flex-1">
                <label htmlFor="cat-name" className="label">
                  Name
                </label>
                <input id="cat-name" autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={field} placeholder="e.g. Resin art" />
                <p className="helper">Tap the image to add a cover. It shows on your homepage.</p>
              </div>
            </div>
            <div>
              <label htmlFor="cat-parent" className="label">
                Sits under
              </label>
              <select id="cat-parent" value={edit.parentId} onChange={(e) => setEdit({ ...edit, parentId: e.target.value })} className={field}>
                <option value="">Nothing (main category)</option>
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
              <label htmlFor="cat-desc" className="label">
                Description <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea id="cat-desc" rows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className={field} placeholder="Shown at the top of the category page" />
            </div>
            {edit.id && (
              <div>
                <label htmlFor="cat-slug" className="label">
                  Web address
                </label>
                <input id="cat-slug" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} className={field} />
              </div>
            )}
            <div className="flex min-h-11 items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-medium md:text-[14px]">Visible on website</p>
                <p className="text-[13px] text-muted">{edit.isActive ? "Customers can browse it" : "Hidden from the shop"}</p>
              </div>
              <Switch checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} label="Visible on website" />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button onClick={() => setEdit(null)} className={btn("secondary")}>
                Cancel
              </button>
              <button onClick={save} disabled={saving} className={btn("primary")}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} {edit.id ? "Save changes" : "Add category"}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {confirmDialog}
    </div>
  );
}

function CatRow({
  c,
  sub,
  first,
  last,
  onEdit,
  onDelete,
  onToggle,
  onUp,
  onDown,
  onMenu,
}: {
  c: Category;
  sub?: boolean;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
  onUp: () => void;
  onDown: () => void;
  onMenu: () => void;
}) {
  const iconBtn = "grid size-9 place-items-center rounded-full text-muted hover:bg-admin-sidebar hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className={cx("flex items-center gap-3 border-b border-admin-line py-2.5 pr-2 last:border-0", sub ? "min-h-14 pl-4 md:pl-6" : "min-h-[72px] bg-white pl-4")}>
      {sub && <CornerDownRight className="size-4 shrink-0 text-muted" aria-hidden />}
      <Thumb src={c.image ? imgUrl(c.image, 120) : null} className={sub ? "size-9" : "size-12"} />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className={cx("block truncate", sub ? "text-[15px] font-medium" : "text-[16px] font-semibold")}>{c.name}</span>
        <span className="tabular flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span>
            {c.productCount ?? 0} {c.productCount === 1 ? "piece" : "pieces"} · /{c.slug}
          </span>
          {!c.isActive && (
            <StateChip tone="neutral" fill="empty">
              Hidden
            </StateChip>
          )}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <div className="hidden items-center md:flex">
          <button onClick={onUp} disabled={first} className={iconBtn} aria-label={`Move ${c.name} up`}>
            <ArrowUp className="size-4" />
          </button>
          <button onClick={onDown} disabled={last} className={iconBtn} aria-label={`Move ${c.name} down`}>
            <ArrowDown className="size-4" />
          </button>
        </div>
        <span className="px-2">
          <Switch checked={c.isActive} onChange={onToggle} label={`${c.name} visible`} />
        </span>
        <div className="hidden items-center md:flex">
          <button onClick={onEdit} className={iconBtn} aria-label={`Edit ${c.name}`}>
            <Pencil className="size-4" />
          </button>
          <button onClick={onDelete} className={cx(iconBtn, "hover:bg-status-danger-bg hover:text-danger")} aria-label={`Delete ${c.name}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
        <button onClick={onMenu} className="grid size-11 place-items-center rounded-full text-muted hover:bg-admin-sidebar hover:text-ink md:hidden" aria-label={`More actions for ${c.name}`}>
          <MoreHorizontal className="size-5" />
        </button>
      </div>
    </div>
  );
}
