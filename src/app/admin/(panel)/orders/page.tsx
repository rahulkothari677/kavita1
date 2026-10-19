"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Download, Plus, Search, ShoppingBag } from "lucide-react";
import { Empty, Loading, PageHeader, PayPill, StatusPill, useLoad } from "@/components/admin/ui";
import { formatINR, imgUrl, timeAgo } from "@/lib/format";
import { ORDER_STATUSES, type Order } from "@/lib/types";
import { WhatsAppIcon } from "@/components/Motifs";
import { waLink } from "@/lib/whatsapp";

const TAB_LABEL: Record<string, string> = { ALL: "All", PENDING: "New", CONFIRMED: "Confirmed", IN_MAKING: "Being made", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled" };

function OrdersInner() {
  const sp = useSearchParams();
  const [status, setStatus] = useState(sp.get("status") ?? "ALL");
  const [q, setQ] = useState("");
  const [pay, setPay] = useState("");
  const { data, loading } = useLoad<{ orders: Order[] }>("/api/admin/orders");
  const all = data?.orders ?? [];
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: all.length };
    for (const o of all) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [all]);
  const orders = useMemo(() => {
    let l = all;
    if (status !== "ALL") l = l.filter((o) => o.status === status);
    if (pay) l = l.filter((o) => (pay === "UNPAID" ? o.paymentStatus !== "PAID" : o.paymentStatus === pay));
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((o) => `${o.orderNumber} ${o.customerName} ${o.phone} ${o.city ?? ""} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(s));
    }
    return l;
  }, [all, status, q, pay]);

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Every order placed on your website or added by you."
        actions={
          <>
            <a href="/api/admin/orders/export" className="btn btn-outline btn-sm">
              <Download className="size-4" /> Export CSV
            </a>
            <Link href="/admin/orders/new" className="btn btn-primary btn-sm">
              <Plus className="size-4" /> Add order
            </Link>
          </>
        }
      />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
        {["ALL", ...ORDER_STATUSES].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm ${status === s ? "bg-ink text-on-ink" : "bg-white text-muted"}`}>
            {TAB_LABEL[s]}
            {counts[s] ? <span className={`rounded-full px-1.5 text-[11px] ${status === s ? "bg-on-ink/20" : "bg-ink/5"}`}>{counts[s]}</span> : null}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, order no, product…" className="input pl-10" />
        </div>
        <select value={pay} onChange={(e) => setPay(e.target.value)} className="input w-auto">
          <option value="">Any payment</option>
          <option value="UNPAID">Not fully paid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {loading && !data ? (
        <Loading />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white">
          <Empty icon={<ShoppingBag className="size-6" />} title="No orders here" text={all.length ? "Try another filter." : "When customers checkout, their orders appear here — and on your WhatsApp."} />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-ink/[0.07] bg-white transition hover:shadow-md">
              <div className="flex items-center gap-3 p-4">
                <Link href={`/admin/orders/${o.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex -space-x-3">
                    {o.items
                      .filter((i) => i.image)
                      .slice(0, 3)
                      .map((i, n) => (
                        <img key={n} src={imgUrl(i.image, 100)} alt="" className="size-12 rounded-xl border-2 border-white object-cover" />
                      ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{o.customerName}</p>
                      <StatusPill status={o.status} />
                      <PayPill status={o.paymentStatus} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {o.orderNumber} · {timeAgo(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} items{o.city ? ` · ${o.city}` : ""}
                      {o.source !== "website" ? ` · via ${o.source}` : ""}
                    </p>
                  </div>
                  <p className="font-display text-xl font-semibold">{formatINR(o.total)}</p>
                </Link>
                <a href={waLink(o.phone, `Hi ${o.customerName.split(" ")[0]}! `)} target="_blank" rel="noreferrer" className="grid size-10 shrink-0 place-items-center rounded-full bg-wa/10 text-wa" aria-label="WhatsApp customer">
                  <WhatsAppIcon className="size-5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdersInner />
    </Suspense>
  );
}
