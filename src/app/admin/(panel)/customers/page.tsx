"use client";

import { useMemo, useState } from "react";
import { Download, Search, Users } from "lucide-react";
import { Empty, Loading, PageHeader, useLoad } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR, timeAgo } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { Customer } from "@/lib/analytics";

export default function CustomersPage() {
  const { data, loading } = useLoad<{ customers: Customer[] }>("/api/admin/customers");
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("all");
  const list = useMemo(() => {
    let l = data?.customers ?? [];
    if (q) l = l.filter((c) => `${c.name} ${c.phone} ${c.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    if (seg === "repeat") l = l.filter((c) => c.orders > 1);
    if (seg === "vip") l = l.filter((c) => c.spent >= 5000);
    if (seg === "lapsed") l = l.filter((c) => Date.now() - new Date(c.lastOrder).getTime() > 90 * 86400000);
    return l;
  }, [data, q, seg]);

  const exportCsv = () => {
    const rows = [["Name", "Phone", "City", "Orders", "Spent", "Last order"], ...list.map((c) => [c.name, c.phone, c.city ?? "", c.orders, c.spent, c.lastOrder.slice(0, 10)])];
    const blob = new Blob(["﻿" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "customers.csv";
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Built automatically from your orders."
        actions={
          <button onClick={exportCsv} className="btn btn-outline btn-sm">
            <Download className="size-4" /> Export (for WhatsApp broadcast)
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…" className="input pl-10" />
        </div>
        <div className="flex gap-1.5">
          {[
            ["all", "All"],
            ["repeat", "Repeat"],
            ["vip", "₹5k+ VIP"],
            ["lapsed", "Not ordered in 90d"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setSeg(k)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${seg === k ? "bg-ink text-on-ink" : "bg-white text-muted"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {loading && !data ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white">
          <Empty icon={<Users className="size-6" />} title="No customers yet" text="Customers appear here after their first order." />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
          <ul className="divide-y divide-ink/[0.06]">
            {list.map((c) => (
              <li key={c.phone} className="flex items-center gap-3 px-4 py-3">
                <div className="grid size-10 place-items-center rounded-full bg-tint font-display text-lg">{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {c.name} {c.orders > 1 && <span className="ml-1 rounded-full bg-accent-soft/20 px-2 py-0.5 text-[10px] text-accent">REPEAT</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {c.phone}
                    {c.city ? ` · ${c.city}` : ""} · last order {timeAgo(c.lastOrder)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatINR(c.spent)}</p>
                  <p className="text-xs text-muted">{c.orders} orders</p>
                </div>
                <a href={waLink(c.phone, `Hi ${c.name.split(" ")[0]}! 🌸`)} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full bg-wa/10 text-wa" aria-label="WhatsApp">
                  <WhatsAppIcon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
