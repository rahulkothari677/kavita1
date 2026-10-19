"use client";

import { useState } from "react";
import { Copy, Loader2, Mail, Plus, Sparkles, Tag, Trash2 } from "lucide-react";
import { api, Modal, PageHeader, Panel, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, AiDraftChip, AiPanel, btn, copyText, cx, field, relTime, Sk, StateChip, useActionToast, useConfirm } from "@/components/admin/pages/kit";
import { InstagramIcon, WhatsAppIcon } from "@/components/Motifs";
import { formatINR } from "@/lib/format";
import type { Coupon } from "@/lib/types";

type Campaign = { theme: string; offerIdea: string; couponCode: string; whatsappBroadcast: string; instagramPost: string; productPicks: string[]; contentIdeas: string[] };
const OCCASIONS = ["Diwali", "Raksha Bandhan", "Navratri", "Mother’s Day", "Housewarming season", "Wedding season"];

export default function MarketingPage() {
  const { data, loading, reload } = useLoad<{ coupons: Coupon[] }>("/api/admin/coupons");
  const { data: subs } = useLoad<{ subscribers: { id: string; contact: string; createdAt: string }[] }>("/api/admin/subscribers");
  const toast = useActionToast();
  const [ask, confirmDialog] = useConfirm();
  const [open, setOpen] = useState(false);
  const [c, setC] = useState({ code: "", type: "PERCENT", value: "10", minOrder: "0", expiresAt: "" });
  const [occasion, setOccasion] = useState("");
  const [camp, setCamp] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  const saveCoupon = async () => {
    if (!c.code.trim()) return toast("Give the code a name, like DIWALI10", "err");
    if (!Number(c.value)) return toast("Add how much it takes off", "err");
    setCreating(true);
    try {
      await api("/api/admin/coupons", { body: { ...c, value: Number(c.value), minOrder: Number(c.minOrder) } });
      toast(`Offer code ${c.code} created`);
      setOpen(false);
      setC({ code: "", type: "PERCENT", value: "10", minOrder: "0", expiresAt: "" });
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create the code", "err");
    } finally {
      setCreating(false);
    }
  };

  const removeCoupon = async (cp: Coupon) => {
    const ok = await ask({ title: `Delete code ${cp.code}?`, body: "Customers won’t be able to use it any more.", confirmLabel: "Delete code" });
    if (!ok) return;
    try {
      await api(`/api/admin/coupons/${cp.id}`, { method: "DELETE" });
      toast("Code deleted");
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete", "err");
    }
  };

  const plan = async () => {
    setBusy(true);
    try {
      setCamp(await api<Campaign>("/api/admin/ai/write", { body: { task: "campaign", input: { occasion } } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not plan this", "err");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (t: string, what = "Copied") => ((await copyText(t)) ? toast(what) : toast("Could not copy", "err"));
  const coupons = data?.coupons ?? [];
  const subscribers = subs?.subscribers ?? [];

  return (
    <div className={cx(ADMIN_ICONS, "space-y-3 md:space-y-4")}>
      <PageHeader title="Offers & marketing" subtitle="Discount codes, AI campaign ideas and the people who signed up for your letters." />

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Tag className="size-4" aria-hidden /> Offer codes
          </span>
        }
        action={
          <button onClick={() => setOpen(true)} className={btn("primary")}>
            <Plus className="size-4" aria-hidden /> New code
          </button>
        }
      >
        {loading && !data ? (
          <div className="space-y-3" role="status" aria-label="Loading">
            <Sk className="h-10 w-full" />
            <Sk className="h-10 w-full" />
          </div>
        ) : !coupons.length ? (
          <p className="py-4 text-center text-[14px] text-muted">No offer codes yet. Create one like DIWALI10 for a festive sale.</p>
        ) : (
          <ul className="-my-2">
            {coupons.map((cp) => {
              const expired = !!cp.expiresAt && new Date(cp.expiresAt).getTime() < Date.now();
              const live = cp.isActive && !expired;
              return (
                <li key={cp.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-admin-line py-3 last:border-0">
                  <button
                    onClick={() => copy(cp.code, `${cp.code} copied`)}
                    className="tabular inline-flex h-9 items-center rounded-[6px] border border-dashed border-line-strong bg-admin-inset px-3 font-mono text-[14px] font-semibold tracking-wide hover:bg-white"
                    title="Copy code"
                  >
                    {cp.code}
                  </button>
                  <div className="min-w-0 flex-1 text-[14px]">
                    <p className="tabular font-medium">
                      {cp.type === "PERCENT" ? `${cp.value}% off` : `${formatINR(cp.value)} off`}
                      {cp.minOrder ? <span className="font-normal text-muted"> above {formatINR(cp.minOrder)}</span> : null}
                    </p>
                    <p className="tabular text-[13px] text-muted">
                      Used {cp.usageCount} {cp.usageCount === 1 ? "time" : "times"}
                      {cp.expiresAt ? ` · ${expired ? "ended" : "ends"} ${new Date(cp.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </div>
                  {live ? (
                    <StateChip tone="success" fill="full">
                      Active
                    </StateChip>
                  ) : (
                    <StateChip tone="neutral" fill="empty" struck={expired}>
                      {expired ? "Expired" : "Off"}
                    </StateChip>
                  )}
                  <button onClick={() => removeCoupon(cp)} className="grid size-11 place-items-center rounded-full text-muted hover:bg-status-danger-bg hover:text-danger md:size-9" aria-label={`Delete code ${cp.code}`}>
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <AiPanel title="Campaign planner">
        <label htmlFor="occasion" className="label">
          What’s the occasion?
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && plan()}
            placeholder="e.g. Diwali (leave empty for the next festive season)"
            className={cx(field, "border-ai-line! sm:flex-1")}
          />
          <button onClick={plan} disabled={busy} className={btn("ai")}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} Plan campaign
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OCCASIONS.map((o) => (
            <button key={o} type="button" onClick={() => setOccasion(o)} className="inline-flex min-h-9 items-center rounded-full border border-ai-line bg-white px-3 text-[13px] font-medium text-ai-fg hover:border-ai-fg">
              {o}
            </button>
          ))}
        </div>

        {camp && (
          <div className="mt-5 space-y-3">
            <div className="rounded-[8px] border border-ai-line bg-white p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[12px] font-semibold tracking-[0.1em] text-muted uppercase">Campaign</p>
                <AiDraftChip />
              </div>
              <p className="mt-1 font-display text-[26px] leading-tight">{camp.theme}</p>
              <p className="mt-2 text-[15px] leading-6 text-ink-2">{camp.offerIdea}</p>
              {camp.couponCode && (
                <button
                  onClick={() => {
                    setC({ ...c, code: camp.couponCode.toUpperCase().replace(/\s/g, "") });
                    setOpen(true);
                  }}
                  className={btn("primary", "mt-4")}
                >
                  <Tag className="size-4" aria-hidden /> Create code <span className="font-mono">{camp.couponCode}</span>
                </button>
              )}
            </div>
            <CopyBlock title="WhatsApp broadcast" icon={<WhatsAppIcon className="size-4 text-wa" />} text={camp.whatsappBroadcast} onCopy={(t) => copy(t, "Broadcast copied")} />
            <CopyBlock title="Instagram post" icon={<InstagramIcon className="size-4" />} text={camp.instagramPost} onCopy={(t) => copy(t, "Post copied")} />
            <div className="grid gap-3 md:grid-cols-2">
              <ListBlock title="Feature these pieces" items={camp.productPicks} />
              <ListBlock title="Reel & story ideas" items={camp.contentIdeas} />
            </div>
          </div>
        )}
      </AiPanel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Mail className="size-4" aria-hidden /> Subscribers <span className="tabular font-medium text-muted">{subscribers.length}</span>
          </span>
        }
        action={
          subscribers.length ? (
            <button onClick={() => copy(subscribers.map((s) => s.contact).join("\n"), "All contacts copied")} className={btn("secondary")}>
              <Copy className="size-4" aria-hidden /> Copy all
            </button>
          ) : null
        }
      >
        {!subscribers.length ? (
          <p className="py-4 text-center text-[14px] text-muted">People who sign up in your website footer appear here.</p>
        ) : (
          <ul className="-my-2">
            {subscribers.map((s) => (
              <li key={s.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-admin-line py-2 text-[14px] last:border-0">
                <span className="tabular min-w-0 truncate">{s.contact}</span>
                <span className="tabular shrink-0 text-[13px] text-muted">{relTime(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="New offer code">
        <div className="space-y-4">
          <div>
            <label htmlFor="cp-code" className="label">
              Code
            </label>
            <input id="cp-code" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase().replace(/\s/g, "") })} placeholder="DIWALI10" className={cx(field, "font-mono! uppercase")} autoCapitalize="characters" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cp-type" className="label">
                Type
              </label>
              <select id="cp-type" value={c.type} onChange={(e) => setC({ ...c, type: e.target.value })} className={field}>
                <option value="PERCENT">% off</option>
                <option value="FLAT">₹ off</option>
              </select>
            </div>
            <div>
              <label htmlFor="cp-value" className="label">
                {c.type === "PERCENT" ? "Percent off" : "Rupees off"}
              </label>
              <input id="cp-value" value={c.value} onChange={(e) => setC({ ...c, value: e.target.value.replace(/\D/g, "") })} className={cx(field, "tabular")} inputMode="numeric" />
            </div>
            <div>
              <label htmlFor="cp-min" className="label">
                Minimum order (₹)
              </label>
              <input id="cp-min" value={c.minOrder} onChange={(e) => setC({ ...c, minOrder: e.target.value.replace(/\D/g, "") })} className={cx(field, "tabular")} inputMode="numeric" />
            </div>
            <div>
              <label htmlFor="cp-exp" className="label">
                Ends <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="cp-exp" type="date" value={c.expiresAt} onChange={(e) => setC({ ...c, expiresAt: e.target.value })} className={field} />
            </div>
          </div>
          <button onClick={saveCoupon} disabled={creating} className={btn("primary", "w-full")}>
            {creating && <Loader2 className="size-4 animate-spin" aria-hidden />} Create code
          </button>
        </div>
      </Modal>
      {confirmDialog}
    </div>
  );
}

function CopyBlock({ title, icon, text, onCopy }: { title: string; icon: React.ReactNode; text: string; onCopy: (t: string) => void }) {
  return (
    <div className="rounded-[8px] border border-ai-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          {icon} {title}
        </p>
        <button onClick={() => onCopy(text)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-ink hover:bg-admin-inset">
          <Copy className="size-3.5" aria-hidden /> Copy
        </button>
      </div>
      <p className="mt-2 text-[14px] leading-6 whitespace-pre-wrap text-ink-2">{text}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[8px] border border-ai-line bg-white p-4 text-[14px]">
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-ink-2 marker:text-ai-fg">
        {items.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
