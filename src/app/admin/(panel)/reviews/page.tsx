"use client";

import { useMemo, useState } from "react";
import { Check, CircleCheck, EyeOff, Home, Loader2, MessageSquareQuote, Plus, Star, Trash2 } from "lucide-react";
import { api, Empty, Modal, PageHeader, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, btn, cardShell, cx, field, FilterChips, relTime, Sk, StateChip, useActionToast, useConfirm } from "@/components/admin/pages/kit";
import type { Product, Review } from "@/lib/types";

type Tab = "pending" | "approved";
const BLANK = { name: "", city: "", rating: 5, comment: "", productId: "", isFeatured: true };

function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cx(className, n <= value ? "fill-ink text-ink" : "text-line-strong")} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { data, setData, loading, reload } = useLoad<{ reviews: Review[] }>("/api/admin/reviews");
  const { data: pd } = useLoad<{ products: Product[] }>("/api/admin/products");
  const toast = useActionToast();
  const [ask, confirmDialog] = useConfirm();
  const [tab, setTab] = useState<Tab>("pending");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(BLANK);
  const all = useMemo(() => data?.reviews ?? [], [data]);
  const pending = all.filter((r) => !r.isApproved).length;
  const list = all.filter((r) => (tab === "pending" ? !r.isApproved : r.isApproved));

  const local = (id: string, body: Partial<Review>) => setData((d) => d && { reviews: d.reviews.map((r) => (r.id === id ? { ...r, ...body } : r)) });

  /** Optimistic patch with an Undo toast. */
  const patch = async (r: Review, body: Partial<Pick<Review, "isApproved" | "isFeatured">>, msg?: string) => {
    const before = { isApproved: r.isApproved, isFeatured: r.isFeatured };
    local(r.id, body);
    try {
      await api(`/api/admin/reviews/${r.id}`, { method: "PATCH", body });
      if (msg)
        toast(msg, "ok", {
          label: "Undo",
          onClick: async () => {
            local(r.id, before);
            await api(`/api/admin/reviews/${r.id}`, { method: "PATCH", body: before }).catch(() => {});
            reload();
          },
        });
    } catch (e) {
      local(r.id, before);
      toast(e instanceof Error ? e.message : "Could not update", "err");
    }
  };

  const remove = async (r: Review) => {
    const ok = await ask({ title: "Delete this review?", body: `“${r.comment.slice(0, 120)}${r.comment.length > 120 ? "…" : ""}” — ${r.name}`, confirmLabel: "Delete review" });
    if (!ok) return;
    try {
      await api(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
      setData((d) => d && { reviews: d.reviews.filter((x) => x.id !== r.id) });
      toast("Review deleted");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete", "err");
    }
  };

  const addTestimonial = async () => {
    if (!f.name.trim() || !f.comment.trim()) return toast("Add the customer’s name and what they said", "err");
    setBusy(true);
    try {
      await api("/api/admin/reviews", { body: f });
      toast("Testimonial added");
      setAdding(false);
      setF(BLANK);
      setTab("approved");
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={ADMIN_ICONS}>
      <PageHeader
        title="Reviews"
        subtitle="Approve reviews before they appear. Featured ones show on your homepage."
        actions={
          <button onClick={() => setAdding(true)} className={btn("primary")}>
            <Plus className="size-4" aria-hidden /> Add testimonial
          </button>
        }
      />
      <FilterChips
        label="Review status"
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { key: "pending", label: "To approve", count: pending },
          { key: "approved", label: "Approved", count: all.length - pending },
        ]}
      />

      {loading && !data ? (
        <div role="status" aria-label="Loading" className="grid gap-3 md:grid-cols-2 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx(cardShell, "space-y-3 p-4 md:p-5")}>
              <Sk className="h-4 w-24" />
              <Sk className="h-4 w-1/2" />
              <Sk className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className={cardShell}>
          <Empty
            icon={<MessageSquareQuote />}
            title={tab === "pending" ? "You’re all caught up" : "Ask a happy customer for a review"}
            text="After delivery, send the “Delivered — ask for review” WhatsApp message from the order page."
          />
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
          {list.map((r) => (
            <li key={r.id} className={cx(cardShell, "flex flex-col p-4 md:p-5")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Stars value={r.rating} />
                  <p className="mt-1.5 text-[15px] font-semibold">
                    {r.name}
                    {r.city && <span className="font-normal text-muted"> · {r.city}</span>}
                  </p>
                  <p className="text-[13px] text-muted">
                    {r.productName ? `${r.productName} · ` : ""}
                    {relTime(r.createdAt)}
                  </p>
                </div>
                {r.isApproved ? (
                  <StateChip tone="neutral" icon={<CircleCheck className="size-3" aria-hidden />}>
                    Live
                  </StateChip>
                ) : (
                  <StateChip tone="warning" fill="empty">
                    To approve
                  </StateChip>
                )}
              </div>
              <p className="mt-3 flex-1 text-[15px] leading-6 text-ink-2">{r.comment}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-line pt-3">
                {!r.isApproved ? (
                  <button onClick={() => patch(r, { isApproved: true }, "Review approved")} className={btn("primary")}>
                    <Check className="size-4" aria-hidden /> Approve
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => patch(r, { isFeatured: !r.isFeatured }, r.isFeatured ? "Removed from homepage" : "Featured on homepage")}
                      aria-pressed={r.isFeatured}
                      className={btn(r.isFeatured ? "primary" : "secondary")}
                    >
                      <Home className="size-4" aria-hidden /> {r.isFeatured ? "On homepage" : "Feature"}
                    </button>
                    <button onClick={() => patch(r, { isApproved: false }, "Review unpublished")} className={btn("secondary")}>
                      <EyeOff className="size-4" aria-hidden /> Unpublish
                    </button>
                  </>
                )}
                <button onClick={() => remove(r)} className="ml-auto grid size-11 place-items-center rounded-full text-muted hover:bg-status-danger-bg hover:text-danger md:size-9" aria-label={`Delete review by ${r.name}`}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a testimonial">
        <div className="space-y-4">
          <p className="text-[14px] text-muted">Lovely feedback on WhatsApp or Instagram? Add it here to show on your website.</p>
          <fieldset>
            <legend className="label">Rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setF({ ...f, rating: n })} aria-label={`${n} ${n === 1 ? "star" : "stars"}`} aria-pressed={f.rating === n} className="grid size-11 place-items-center rounded-full hover:bg-admin-inset">
                  <Star className={cx("size-6", n <= f.rating ? "fill-ink text-ink" : "text-line-strong")} aria-hidden />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="t-name" className="label">
                Customer name
              </label>
              <input id="t-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
            </div>
            <div>
              <label htmlFor="t-city" className="label">
                City
              </label>
              <input id="t-city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={field} />
            </div>
          </div>
          <div>
            <label htmlFor="t-comment" className="label">
              What they said
            </label>
            <textarea id="t-comment" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} rows={3} className={field} />
          </div>
          <div>
            <label htmlFor="t-product" className="label">
              About which piece?
            </label>
            <select id="t-product" value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} className={field}>
              <option value="">Not about a specific piece</option>
              {pd?.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-[15px]">
            <input type="checkbox" checked={f.isFeatured} onChange={(e) => setF({ ...f, isFeatured: e.target.checked })} className="size-5" />
            Show on homepage
          </label>
          <button onClick={addTestimonial} disabled={busy} className={btn("primary", "w-full")}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save testimonial
          </button>
        </div>
      </Modal>
      {confirmDialog}
    </div>
  );
}
