"use client";

import { useState } from "react";
import { Palette, Sparkles, Trash2 } from "lucide-react";
import { api, confirmAction, Empty, Loading, PageHeader, useLoad, useToast } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR, timeAgo } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { CustomRequest } from "@/lib/types";

const STATUSES = [
  { k: "NEW", l: "New", c: "bg-amber-100 text-amber-800" },
  { k: "DISCUSSING", l: "Discussing", c: "bg-sky-100 text-sky-800" },
  { k: "QUOTED", l: "Quoted", c: "bg-violet-100 text-violet-800" },
  { k: "ACCEPTED", l: "Accepted", c: "bg-emerald-100 text-emerald-800" },
  { k: "DECLINED", l: "Declined", c: "bg-ink/5 text-muted" },
];

export default function CustomRequestsPage() {
  const { data, setData, loading } = useLoad<{ requests: CustomRequest[] }>("/api/admin/custom-requests");
  const toast = useToast();
  const [filter, setFilter] = useState("ALL");
  const list = (data?.requests ?? []).filter((r) => filter === "ALL" || r.status === filter);

  const update = async (r: CustomRequest, patch: Partial<CustomRequest>) => {
    const next = { ...r, ...patch };
    setData((d) => d && { requests: d.requests.map((x) => (x.id === r.id ? next : x)) });
    await api(`/api/admin/custom-requests/${r.id}`, { method: "PATCH", body: { status: next.status, quotedPrice: next.quotedPrice, adminNotes: next.adminNotes } });
  };

  return (
    <div>
      <PageHeader title="Custom requests" subtitle="Ideas customers sent from the Custom Order page." />
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {[{ k: "ALL", l: "All" }, ...STATUSES].map((s) => (
          <button key={s.k} onClick={() => setFilter(s.k)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${filter === s.k ? "bg-ink text-cream" : "bg-white text-muted"}`}>
            {s.l}
          </button>
        ))}
      </div>
      {loading && !data ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white">
          <Empty icon={<Palette className="size-6" />} title="No requests yet" text="Share your Custom Order page on Instagram to get personalised orders." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((r) => {
            const st = STATUSES.find((s) => s.k === r.status) ?? STATUSES[0];
            return (
              <div key={r.id} className="rounded-2xl border border-ink/[0.07] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold">{r.name}</p>
                    <p className="text-xs text-muted">
                      {r.type ?? "Custom piece"} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.c}`}>{st.l}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{r.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {r.size && <span className="rounded-full bg-cream px-2.5 py-1">📏 {r.size}</span>}
                  {r.colors && <span className="rounded-full bg-cream px-2.5 py-1">🎨 {r.colors}</span>}
                  {r.budget && <span className="rounded-full bg-cream px-2.5 py-1">💰 {r.budget}</span>}
                  {r.deadline && <span className="rounded-full bg-cream px-2.5 py-1">📅 {new Date(r.deadline).toLocaleDateString("en-IN")}</span>}
                </div>
                {r.aiConcept && (
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-gold-2/10 p-3 text-xs">
                    <Sparkles className="mr-1 inline size-3.5 text-gold" />
                    {r.aiConcept}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <select value={r.status} onChange={(e) => update(r, { status: e.target.value })} className="input py-2 text-sm">
                    {STATUSES.map((s) => (
                      <option key={s.k} value={s.k}>
                        {s.l}
                      </option>
                    ))}
                  </select>
                  <input
                    defaultValue={r.quotedPrice ?? ""}
                    onBlur={(e) => update(r, { quotedPrice: Number(e.target.value.replace(/\D/g, "")) || null })}
                    placeholder="Quote ₹"
                    className="input py-2 text-sm"
                    inputMode="numeric"
                  />
                </div>
                <textarea defaultValue={r.adminNotes ?? ""} onBlur={(e) => update(r, { adminNotes: e.target.value })} placeholder="Private notes…" rows={2} className="input mt-2 text-sm" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={waLink(r.phone, `Hi ${r.name.split(" ")[0]}! 🎨 Thank you for your custom order idea — I'd love to make this for you.`)} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm">
                    <WhatsAppIcon className="size-4" /> Reply
                  </a>
                  {r.quotedPrice ? (
                    <a
                      href={waLink(r.phone, `Hi ${r.name.split(" ")[0]}! Here's the quote for your custom ${r.type ?? "piece"}: *${formatINR(r.quotedPrice)}*. It will take about 7–10 days to make. Shall I go ahead? 😊`)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      Send quote
                    </a>
                  ) : null}
                  <button
                    onClick={async () => {
                      if (!confirmAction("Delete this request?")) return;
                      await api(`/api/admin/custom-requests/${r.id}`, { method: "DELETE" });
                      setData((d) => d && { requests: d.requests.filter((x) => x.id !== r.id) });
                      toast("Deleted");
                    }}
                    className="ml-auto text-muted hover:text-rose"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
