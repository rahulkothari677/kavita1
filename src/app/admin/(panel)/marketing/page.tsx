"use client";

import { useState } from "react";
import { Copy, Loader2, Plus, Sparkles, Tag, Trash2 } from "lucide-react";
import { api, confirmAction, Modal, PageHeader, Panel, useLoad, useToast } from "@/components/admin/ui";
import { formatINR, timeAgo } from "@/lib/format";
import type { Coupon } from "@/lib/types";

type Campaign = { theme: string; offerIdea: string; couponCode: string; whatsappBroadcast: string; instagramPost: string; productPicks: string[]; contentIdeas: string[] };

export default function MarketingPage() {
  const { data, reload } = useLoad<{ coupons: Coupon[] }>("/api/admin/coupons");
  const { data: subs } = useLoad<{ subscribers: { id: string; contact: string; createdAt: string }[] }>("/api/admin/subscribers");
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [c, setC] = useState({ code: "", type: "PERCENT", value: "10", minOrder: "0", expiresAt: "" });
  const [occasion, setOccasion] = useState("");
  const [camp, setCamp] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState(false);

  const saveCoupon = async () => {
    try {
      await api("/api/admin/coupons", { body: { ...c, value: Number(c.value), minOrder: Number(c.minOrder) } });
      toast("Offer code created");
      setOpen(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    }
  };

  const plan = async () => {
    setBusy(true);
    try {
      setCamp(await api<Campaign>("/api/admin/ai/write", { body: { task: "campaign", input: { occasion } } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI failed", "err");
    } finally {
      setBusy(false);
    }
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast("Copied");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Offers & marketing" subtitle="Discount codes, your subscriber list and AI campaign planning." />

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Tag className="size-4" /> Offer codes
          </span>
        }
        action={
          <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
            <Plus className="size-4" /> New code
          </button>
        }
      >
        {!data?.coupons.length ? (
          <p className="py-4 text-center text-sm text-muted">No offer codes yet. Create one like DIWALI10 for festive sales.</p>
        ) : (
          <ul className="-my-2 divide-y divide-ink/[0.06]">
            {data.coupons.map((cp) => {
              const expired = cp.expiresAt && new Date(cp.expiresAt).getTime() < Date.now();
              return (
                <li key={cp.id} className="flex items-center gap-3 py-3">
                  <span className="rounded-lg border border-dashed border-gold bg-gold-2/10 px-3 py-1 font-mono text-sm font-semibold">{cp.code}</span>
                  <div className="flex-1 text-sm">
                    <p>
                      {cp.type === "PERCENT" ? `${cp.value}% off` : `${formatINR(cp.value)} off`}
                      {cp.minOrder ? ` on orders above ${formatINR(cp.minOrder)}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      Used {cp.usageCount}× {cp.expiresAt ? `· ${expired ? "expired" : "ends"} ${new Date(cp.expiresAt).toLocaleDateString("en-IN")}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirmAction(`Delete code ${cp.code}?`)) return;
                      await api(`/api/admin/coupons/${cp.id}`, { method: "DELETE" });
                      reload();
                    }}
                    className="text-muted hover:text-rose"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-gold" /> AI campaign planner
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Occasion — e.g. Diwali, Raksha Bandhan, Mother's Day, Summer sale" className="input min-w-[240px] flex-1" />
          <button onClick={plan} disabled={busy} className="btn btn-primary">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Plan campaign
          </button>
        </div>
        {camp && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-ink p-5 text-cream">
              <p className="text-xs tracking-[0.25em] text-gold-2 uppercase">Campaign</p>
              <p className="mt-1 font-display text-3xl">{camp.theme}</p>
              <p className="mt-2 text-sm text-cream/80">{camp.offerIdea}</p>
              <button
                onClick={() => {
                  setC({ ...c, code: camp.couponCode });
                  setOpen(true);
                }}
                className="btn btn-gold btn-sm mt-3"
              >
                Create code {camp.couponCode}
              </button>
            </div>
            <CopyBlock title="WhatsApp broadcast" text={camp.whatsappBroadcast} onCopy={copy} />
            <CopyBlock title="Instagram post" text={camp.instagramPost} onCopy={copy} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-cream/50 p-4 text-sm">
                <p className="font-medium">Feature these pieces</p>
                <ul className="mt-2 list-inside list-disc text-muted">
                  {camp.productPicks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-cream/50 p-4 text-sm">
                <p className="font-medium">Reel & story ideas</p>
                <ul className="mt-2 list-inside list-disc text-muted">
                  {camp.contentIdeas.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel title={`Subscribers (${subs?.subscribers.length ?? 0})`} action={subs?.subscribers.length ? <button onClick={() => copy(subs.subscribers.map((s) => s.contact).join("\n"))} className="btn btn-outline btn-sm"><Copy className="size-3.5" /> Copy all</button> : null}>
        {!subs?.subscribers.length ? (
          <p className="py-4 text-center text-sm text-muted">People who join from your website footer appear here.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {subs.subscribers.map((s) => (
              <li key={s.id} className="flex justify-between rounded-xl bg-cream/40 px-3 py-2 text-sm">
                <span>{s.contact}</span>
                <span className="text-xs text-muted">{timeAgo(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="New offer code">
        <div className="space-y-3">
          <div>
            <label className="label">Code</label>
            <input value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase().replace(/\s/g, "") })} placeholder="DIWALI10" className="input font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select value={c.type} onChange={(e) => setC({ ...c, type: e.target.value })} className="input">
                <option value="PERCENT">% off</option>
                <option value="FLAT">₹ off</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input value={c.value} onChange={(e) => setC({ ...c, value: e.target.value.replace(/\D/g, "") })} className="input" inputMode="numeric" />
            </div>
            <div>
              <label className="label">Min. order (₹)</label>
              <input value={c.minOrder} onChange={(e) => setC({ ...c, minOrder: e.target.value.replace(/\D/g, "") })} className="input" inputMode="numeric" />
            </div>
            <div>
              <label className="label">Expires (optional)</label>
              <input type="date" value={c.expiresAt} onChange={(e) => setC({ ...c, expiresAt: e.target.value })} className="input" />
            </div>
          </div>
          <button onClick={saveCoupon} className="btn btn-primary w-full">
            Create code
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CopyBlock({ title, text, onCopy }: { title: string; text: string; onCopy: (t: string) => void }) {
  return (
    <div className="rounded-xl border border-ink/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <button onClick={() => onCopy(text)} className="flex items-center gap-1 text-xs text-ink-2">
          <Copy className="size-3.5" /> Copy
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{text}</p>
    </div>
  );
}
