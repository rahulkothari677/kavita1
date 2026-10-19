"use client";

import { useState } from "react";
import { Check, MessageSquareQuote, Plus, Star, Trash2, X } from "lucide-react";
import { api, confirmAction, Empty, Loading, Modal, PageHeader, useLoad, useToast } from "@/components/admin/ui";
import { timeAgo } from "@/lib/format";
import type { Product, Review } from "@/lib/types";

export default function ReviewsPage() {
  const { data, loading, reload } = useLoad<{ reviews: Review[] }>("/api/admin/reviews");
  const { data: pd } = useLoad<{ products: Product[] }>("/api/admin/products");
  const toast = useToast();
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", city: "", rating: 5, comment: "", productId: "", isFeatured: true });
  const all = data?.reviews ?? [];
  const list = all.filter((r) => (tab === "pending" ? !r.isApproved : r.isApproved));

  const patch = async (id: string, body: Record<string, boolean>) => {
    await api(`/api/admin/reviews/${id}`, { method: "PATCH", body });
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="Approve reviews before they appear. ⭐ Featured ones show on your homepage."
        actions={
          <button onClick={() => setAdding(true)} className="btn btn-primary btn-sm">
            <Plus className="size-4" /> Add testimonial
          </button>
        }
      />
      <div className="mb-4 flex gap-1.5">
        {(["pending", "approved"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3.5 py-1.5 text-sm capitalize ${tab === t ? "bg-ink text-cream" : "bg-white text-muted"}`}>
            {t} ({all.filter((r) => (t === "pending" ? !r.isApproved : r.isApproved)).length})
          </button>
        ))}
      </div>
      {loading && !data ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white">
          <Empty icon={<MessageSquareQuote className="size-6" />} title={tab === "pending" ? "No reviews waiting" : "No approved reviews yet"} text="Tip: after delivery, send the “Ask for review” WhatsApp template from the order page." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink/[0.07] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gold">{"★".repeat(r.rating)}<span className="text-ink/15">{"★".repeat(5 - r.rating)}</span></p>
                  <p className="mt-1 font-medium">
                    {r.name}
                    {r.city && <span className="font-normal text-muted">, {r.city}</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {r.productName ? `on ${r.productName} · ` : ""}
                    {timeAgo(r.createdAt)}
                  </p>
                </div>
                {r.isApproved && (
                  <button onClick={() => patch(r.id, { isFeatured: !r.isFeatured })} title="Feature on homepage" aria-label="Feature">
                    <Star className={`size-5 ${r.isFeatured ? "fill-gold text-gold" : "text-ink/20"}`} />
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed">{r.comment}</p>
              <div className="mt-4 flex gap-2">
                {!r.isApproved ? (
                  <button onClick={() => (patch(r.id, { isApproved: true }), toast("Approved"))} className="btn btn-primary btn-sm">
                    <Check className="size-4" /> Approve
                  </button>
                ) : (
                  <button onClick={() => patch(r.id, { isApproved: false })} className="btn btn-outline btn-sm">
                    <X className="size-4" /> Unpublish
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!confirmAction("Delete this review?")) return;
                    await api(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
                    reload();
                  }}
                  className="ml-auto text-muted hover:text-rose"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a testimonial">
        <div className="space-y-3">
          <p className="text-sm text-muted">Got lovely feedback on WhatsApp or Instagram? Add it here to show on your website.</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setF({ ...f, rating: n })} aria-label={`${n} stars`}>
                <Star className={`size-6 ${n <= f.rating ? "fill-gold text-gold" : "text-ink/20"}`} />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Customer name" className="input" />
            <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="City" className="input" />
          </div>
          <textarea value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} rows={3} placeholder="What they said…" className="input" />
          <select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} className="input">
            <option value="">Not about a specific product</option>
            {pd?.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={async () => {
              await api("/api/admin/reviews", { body: f });
              toast("Testimonial added");
              setAdding(false);
              setF({ name: "", city: "", rating: 5, comment: "", productId: "", isFeatured: true });
              setTab("approved");
              reload();
            }}
            className="btn btn-primary w-full"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
