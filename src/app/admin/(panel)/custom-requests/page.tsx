"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Palette, PenTool, Ruler, Sparkles, Trash2, Wallet } from "lucide-react";
import { api, Empty, PageHeader, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, btn, cardShell, cx, field, FilterChips, relTime, Sk, StateChip, useActionToast, useConfirm, type Fill, type Tone } from "@/components/admin/pages/kit";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { CustomRequest } from "@/lib/types";

const STATUSES: { k: string; l: string; tone: Tone; fill: Fill; struck?: boolean }[] = [
  { k: "NEW", l: "New", tone: "warning", fill: "empty" },
  { k: "DISCUSSING", l: "Discussing", tone: "info", fill: "half" },
  { k: "QUOTED", l: "Quoted", tone: "info", fill: "half" },
  { k: "ACCEPTED", l: "Accepted", tone: "neutral", fill: "full" },
  { k: "DECLINED", l: "Declined", tone: "neutral", fill: "empty", struck: true },
];

export default function CustomRequestsPage() {
  const { data, setData, loading } = useLoad<{ requests: CustomRequest[] }>("/api/admin/custom-requests");
  const toast = useActionToast();
  const [ask, confirmDialog] = useConfirm();
  const [filter, setFilter] = useState("ALL");
  const all = useMemo(() => data?.requests ?? [], [data]);
  const list = all.filter((r) => filter === "ALL" || r.status === filter);
  const count = (k: string) => all.filter((r) => r.status === k).length;

  const update = async (r: CustomRequest, patch: Partial<CustomRequest>, msg?: string) => {
    const next = { ...r, ...patch };
    setData((d) => d && { requests: d.requests.map((x) => (x.id === r.id ? next : x)) });
    try {
      await api(`/api/admin/custom-requests/${r.id}`, { method: "PATCH", body: { status: next.status, quotedPrice: next.quotedPrice, adminNotes: next.adminNotes } });
      if (msg)
        toast(msg, "ok", {
          label: "Undo",
          onClick: async () => {
            setData((d) => d && { requests: d.requests.map((x) => (x.id === r.id ? r : x)) });
            await api(`/api/admin/custom-requests/${r.id}`, { method: "PATCH", body: { status: r.status, quotedPrice: r.quotedPrice, adminNotes: r.adminNotes } }).catch(() => {});
          },
        });
    } catch (e) {
      setData((d) => d && { requests: d.requests.map((x) => (x.id === r.id ? r : x)) });
      toast(e instanceof Error ? e.message : "Could not save", "err");
    }
  };

  const remove = async (r: CustomRequest) => {
    const ok = await ask({ title: `Delete ${r.name}’s request?`, body: "Their idea and your notes will be removed.", confirmLabel: "Delete request" });
    if (!ok) return;
    try {
      await api(`/api/admin/custom-requests/${r.id}`, { method: "DELETE" });
      setData((d) => d && { requests: d.requests.filter((x) => x.id !== r.id) });
      toast("Request deleted");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete", "err");
    }
  };

  return (
    <div className={ADMIN_ICONS}>
      <PageHeader title="Custom requests" subtitle="Ideas customers sent from your Custom order page." />
      <FilterChips
        label="Filter requests"
        className="mb-4"
        value={filter}
        onChange={setFilter}
        items={[{ key: "ALL", label: "All", count: all.length }, ...STATUSES.map((s) => ({ key: s.k, label: s.l, count: count(s.k) || undefined }))]}
      />
      {loading && !data ? (
        <div role="status" aria-label="Loading" className="grid gap-3 md:grid-cols-2 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx(cardShell, "space-y-3 p-4 md:p-5")}>
              <Sk className="h-5 w-1/3" />
              <Sk className="h-14 w-full" />
              <Sk className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className={cardShell}>
          <Empty icon={<PenTool />} title={all.length ? "Nothing in this group" : "Share your Custom order page"} text={all.length ? "Try another filter." : "Post it on Instagram or WhatsApp status to start getting personalised orders."} />
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
          {list.map((r) => {
            const st = STATUSES.find((s) => s.k === r.status) ?? STATUSES[0];
            const first = r.name.split(" ")[0];
            return (
              <li key={r.id} className={cx(cardShell, "flex flex-col p-4 md:p-5")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] leading-6 font-semibold">{r.name}</p>
                    <p className="tabular text-[13px] text-muted">
                      {r.type ?? "Custom piece"} · {relTime(r.createdAt)} · {r.phone}
                    </p>
                  </div>
                  <StateChip tone={st.tone} fill={st.fill} struck={st.struck}>
                    {st.l}
                  </StateChip>
                </div>
                <p className="mt-3 text-[15px] leading-6 whitespace-pre-wrap text-ink-2">{r.description}</p>
                {(r.size || r.colors || r.budget || r.deadline) && (
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-[13px]">
                    {r.size && <Fact icon={<Ruler className="size-3.5" aria-hidden />} label="Size" value={r.size} />}
                    {r.colors && <Fact icon={<Palette className="size-3.5" aria-hidden />} label="Colours" value={r.colors} />}
                    {r.budget && <Fact icon={<Wallet className="size-3.5" aria-hidden />} label="Budget" value={r.budget} />}
                    {r.deadline && <Fact icon={<CalendarDays className="size-3.5" aria-hidden />} label="Needed by" value={new Date(r.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />}
                  </ul>
                )}
                {r.aiConcept && (
                  <div className="mt-3 rounded-[6px] border border-ai-line bg-ai-bg p-3 text-[13px] leading-5 text-ai-fg">
                    <p className="mb-1 flex items-center gap-1.5 font-semibold">
                      <Sparkles className="size-3.5" aria-hidden /> AI concept
                    </p>
                    <p className="whitespace-pre-wrap">{r.aiConcept}</p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-admin-line pt-4">
                  <div>
                    <label htmlFor={`st-${r.id}`} className="label">
                      Status
                    </label>
                    <select id={`st-${r.id}`} value={r.status} onChange={(e) => update(r, { status: e.target.value }, `Marked ${STATUSES.find((s) => s.k === e.target.value)?.l.toLowerCase() ?? "updated"}`)} className={field}>
                      {STATUSES.map((s) => (
                        <option key={s.k} value={s.k}>
                          {s.l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`q-${r.id}`} className="label">
                      Quote (₹)
                    </label>
                    <input
                      id={`q-${r.id}`}
                      defaultValue={r.quotedPrice ?? ""}
                      onBlur={(e) => {
                        const v = Number(e.target.value.replace(/\D/g, "")) || null;
                        if (v !== r.quotedPrice) update(r, { quotedPrice: v });
                      }}
                      placeholder="e.g. 2400"
                      className={cx(field, "tabular")}
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <label htmlFor={`n-${r.id}`} className="label mt-3">
                  Private notes
                </label>
                <textarea
                  id={`n-${r.id}`}
                  defaultValue={r.adminNotes ?? ""}
                  onBlur={(e) => e.target.value !== (r.adminNotes ?? "") && update(r, { adminNotes: e.target.value })}
                  placeholder="Only you can see these"
                  rows={2}
                  className={field}
                />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a href={waLink(r.phone, `Hi ${first}! Thank you for your custom order idea. I’d love to make this for you.`)} target="_blank" rel="noreferrer" className={btn("wa")}>
                    <WhatsAppIcon className="size-4" /> Reply
                  </a>
                  {r.quotedPrice ? (
                    <a
                      href={waLink(r.phone, `Hi ${first}! Here’s the quote for your custom ${r.type ?? "piece"}: *${formatINR(r.quotedPrice)}*. It will take about 7–10 days to make. Shall I go ahead?`)}
                      target="_blank"
                      rel="noreferrer"
                      className={btn("waOutline")}
                    >
                      <WhatsAppIcon className="size-4" /> Send quote · <span className="tabular">{formatINR(r.quotedPrice)}</span>
                    </a>
                  ) : null}
                  <button onClick={() => remove(r)} className="ml-auto grid size-11 place-items-center rounded-full text-muted hover:bg-status-danger-bg hover:text-danger md:size-9" aria-label={`Delete ${r.name}’s request`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {confirmDialog}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-plinth px-2.5 py-0.5">
      {icon}
      <span className="sr-only">{label}:</span>
      {value}
    </li>
  );
}
