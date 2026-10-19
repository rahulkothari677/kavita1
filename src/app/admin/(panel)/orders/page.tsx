"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Copy, Download, Plus, ShoppingBag, X } from "lucide-react";
import { api, Empty, PageHeader, PayPill, StatusPill, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, btn, cardShell, copyText, cx, downloadCsv, FilterChips, relTime, SearchField, SkeletonRows, Thumb, useActionToast, useOrigin } from "@/components/admin/pages/kit";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR, imgUrl } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/lib/types";

type FilterKey = "all" | "new" | "make" | "ship" | "shipped" | "unpaid" | "done" | "cancelled";

const FILTERS: { key: FilterKey; label: string; test: (o: Order) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "new", label: "New", test: (o) => o.status === "PENDING" },
  { key: "make", label: "To make", test: (o) => o.status === "CONFIRMED" },
  { key: "ship", label: "To ship", test: (o) => o.status === "IN_MAKING" },
  { key: "shipped", label: "Shipped", test: (o) => o.status === "SHIPPED" },
  { key: "unpaid", label: "Unpaid", test: (o) => o.status !== "CANCELLED" && o.paymentStatus !== "PAID" && o.paymentStatus !== "REFUNDED" },
  { key: "done", label: "Done", test: (o) => o.status === "DELIVERED" },
  { key: "cancelled", label: "Cancelled", test: (o) => o.status === "CANCELLED" },
];

/** Old links (?status=PENDING) and new ones (?status=unpaid) both work. */
const FROM_PARAM: Record<string, FilterKey> = { PENDING: "new", CONFIRMED: "make", IN_MAKING: "ship", SHIPPED: "shipped", DELIVERED: "done", CANCELLED: "cancelled", UNPAID: "unpaid" };
const committed = (s: OrderStatus) => s !== "PENDING" && s !== "CANCELLED";
const itemCount = (o: Order) => o.items.reduce((s, i) => s + i.quantity, 0);

function OrdersInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useActionToast();
  const origin = useOrigin();
  const initial = sp.get("status") ?? "all";
  const [filter, setFilter] = useState<FilterKey>(FROM_PARAM[initial] ?? (FILTERS.some((f) => f.key === initial) ? (initial as FilterKey) : "all"));
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const { data, setData, loading, reload } = useLoad<{ orders: Order[] }>("/api/admin/orders");
  const all = useMemo(() => data?.orders ?? [], [data]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, all.filter(f.test).length])) as Record<FilterKey, number>, [all]);
  const orders = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    let l = all.filter(f.test);
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((o) => `${o.orderNumber} ${o.customerName} ${o.phone} ${o.city ?? ""} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(s));
    }
    return l;
  }, [all, filter, q]);

  const visibleSel = sel.filter((id) => orders.some((o) => o.id === id));
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allChecked = orders.length > 0 && visibleSel.length === orders.length;

  /** Bulk status change: PATCH each order, optimistic, with Undo when it is safe for stock. */
  const bulkStatus = async (to: OrderStatus, eligible: (o: Order) => boolean, verb: string) => {
    const targets = all.filter((o) => visibleSel.includes(o.id) && eligible(o));
    const skipped = visibleSel.length - targets.length;
    if (!targets.length) return toast(`Nothing to update — ${skipped === 1 ? "that order is" : "those orders are"} already past this step`, "err");
    const prev = new Map(targets.map((o) => [o.id, o.status]));
    setBusy(true);
    setData((d) => d && { orders: d.orders.map((o) => (prev.has(o.id) ? { ...o, status: to } : o)) });
    const results = await Promise.allSettled(targets.map((o) => api<{ order: Order }>(`/api/admin/orders/${o.id}`, { method: "PATCH", body: { status: to } })));
    setBusy(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    setSel([]);
    if (failed) {
      toast(`${failed} order${failed > 1 ? "s" : ""} could not be updated`, "err");
      reload();
      return;
    }
    // Reverting a stock-committing change back to "New" would not restore stock, so no Undo then.
    const undoSafe = targets.every((o) => !(committed(to) && o.status === "PENDING"));
    const msg = `${targets.length} ${verb}${skipped ? ` · ${skipped} skipped` : ""}`;
    toast(
      msg,
      "ok",
      undoSafe
        ? {
            label: "Undo",
            onClick: async () => {
              setData((d) => d && { orders: d.orders.map((o) => (prev.has(o.id) ? { ...o, status: prev.get(o.id)! } : o)) });
              await Promise.allSettled([...prev].map(([id, status]) => api(`/api/admin/orders/${id}`, { method: "PATCH", body: { status } })));
              reload();
            },
          }
        : undefined,
    );
    reload();
  };

  const exportSelected = () => {
    const list = all.filter((o) => visibleSel.includes(o.id));
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Order", "Date", "Status", "Payment", "Customer", "Phone", "City", "Items", "Total"],
      ...list.map((o) => [o.orderNumber, new Date(o.createdAt).toLocaleString("en-IN"), o.status, o.paymentStatus, o.customerName, o.phone, o.city, o.items.map((i) => `${i.name} x${i.quantity}`).join("; "), o.total]),
    ]);
  };

  const shopLink = origin || "";
  const subtitle = data ? (counts.new ? `${counts.new} new to confirm · ${counts.make + counts.ship} to make & ship` : "Everything placed on your website or added by you.") : undefined;

  return (
    <div className={ADMIN_ICONS}>
      <PageHeader
        title="Orders"
        subtitle={subtitle}
        actions={
          <>
            <a href="/api/admin/orders/export" className={btn("secondary")}>
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
            <Link href="/admin/orders/new" className={btn("primary")}>
              <Plus className="size-4" aria-hidden /> Add order
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <FilterChips label="Filter orders" value={filter} onChange={(k) => (setFilter(k), setSel([]))} items={FILTERS.map((f) => ({ key: f.key, label: f.label, count: f.key === "all" || counts[f.key] ? counts[f.key] : undefined }))} />
        <SearchField value={q} onChange={setQ} label="Search orders" placeholder="Search name, phone, order no. or piece" className="md:max-w-md" />
      </div>

      {/* Ink bulk-action bar slides down when rows are selected */}
      {visibleSel.length > 0 && (
        <div className="on-dark sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-[8px] bg-ink px-3 py-2 text-white transition-[translate,opacity] duration-200 ease-[var(--ease-out)] starting:-translate-y-2 starting:opacity-0 md:top-2">
          <span className="tabular mr-1 px-1 text-[14px] font-semibold">{visibleSel.length} selected</span>
          <button disabled={busy} onClick={() => bulkStatus("CONFIRMED", (o) => o.status === "PENDING", "confirmed")} className={btn("onInk")}>
            Mark confirmed
          </button>
          <button disabled={busy} onClick={() => bulkStatus("SHIPPED", (o) => ["PENDING", "CONFIRMED", "IN_MAKING"].includes(o.status), "marked shipped")} className={btn("onInk")}>
            Mark shipped
          </button>
          <button onClick={exportSelected} className={btn("onInk")}>
            <Download className="size-4" aria-hidden /> Export
          </button>
          <button onClick={() => setSel([])} className="ml-auto grid size-11 place-items-center rounded-full text-white/80 hover:bg-white/10 md:size-9" aria-label="Clear selection">
            <X className="size-4" />
          </button>
        </div>
      )}

      {loading && !data ? (
        <SkeletonRows rows={6} />
      ) : orders.length === 0 ? (
        <div className={cardShell}>
          {all.length ? (
            <Empty icon={<ShoppingBag />} title="No orders match" text="Try another filter or clear the search." action={<button onClick={() => (setFilter("all"), setQ(""))} className={btn("secondary")}>Show all orders</button>} />
          ) : (
            <Empty
              icon={<ShoppingBag />}
              title="Share your shop to get your first order"
              text="When customers check out, their orders appear here and on your WhatsApp."
              action={
                <>
                  <button
                    onClick={async () => ((await copyText(shopLink)) ? toast("Shop link copied") : toast("Could not copy the link", "err"))}
                    className={btn("primary")}
                  >
                    <Copy className="size-4" aria-hidden /> Copy shop link
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Take a look at my handmade pieces: ${shopLink}`)}`} target="_blank" rel="noreferrer" className={btn("waOutline")}>
                    <WhatsAppIcon className="size-4" /> Share on WhatsApp
                  </a>
                </>
              }
            />
          )}
        </div>
      ) : (
        <>
          {/* Mobile + tablet: 76px list rows */}
          <ul className={cx(cardShell, "lg:hidden")}>
            {orders.map((o) => {
              const thumb = o.items.find((i) => i.image)?.image;
              const on = sel.includes(o.id);
              return (
                <li key={o.id} className={cx("flex min-h-[76px] items-center gap-3 border-b border-admin-line py-3 pr-2 pl-3 last:border-0", on && "bg-admin-inset")}>
                  <label className="-m-1 hidden size-10 shrink-0 cursor-pointer place-items-center md:grid">
                    <input type="checkbox" checked={on} onChange={() => toggle(o.id)} className="size-4" aria-label={`Select order ${o.orderNumber}`} />
                  </label>
                  <Link href={`/admin/orders/${o.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Thumb src={thumb ? imgUrl(thumb, 120) : null} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[16px] leading-6 font-semibold">{o.customerName}</p>
                        <p className="tabular shrink-0 text-[16px] leading-6 font-semibold">{formatINR(o.total)}</p>
                      </div>
                      <p className="tabular truncate text-[14px] leading-5 text-muted">
                        #{o.orderNumber} · {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"} · {relTime(o.createdAt)}
                        {o.source !== "website" ? ` · ${o.source}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <StatusPill status={o.status} />
                        <PayPill status={o.paymentStatus} />
                      </div>
                    </div>
                  </Link>
                  <a href={waLink(o.phone, `Hi ${o.customerName.split(" ")[0]}! `)} target="_blank" rel="noreferrer" className="icon-btn shrink-0 text-wa!" aria-label={`WhatsApp ${o.customerName}`}>
                    <WhatsAppIcon className="size-[22px]" />
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Desktop: 44px table rows, sticky header */}
          <div className={cx(cardShell, "hidden overflow-visible lg:block")}>
            <table className="w-full border-separate border-spacing-0 text-[14px]">
              <thead>
                <tr className="text-left text-[12px] font-semibold text-muted">
                  {[
                    <input key="all" type="checkbox" checked={allChecked} onChange={(e) => setSel(e.target.checked ? orders.map((o) => o.id) : [])} aria-label="Select all orders" className="size-4" />,
                    "Order",
                    "Customer",
                    "Items",
                    "Placed",
                    "Status",
                    "Payment",
                    <span key="amt" className="block text-right">
                      Amount
                    </span>,
                    <span key="wa" className="sr-only">
                      WhatsApp
                    </span>,
                  ].map((h, i) => (
                    <th key={i} scope="col" className={cx("sticky top-0 z-10 h-10 border-b border-admin-line bg-admin-inset px-3 font-semibold first:rounded-tl-[8px] first:pl-4 last:rounded-tr-[8px]", i === 0 && "w-10")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const on = sel.includes(o.id);
                  return (
                    <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} className={cx("group h-11 cursor-pointer [&>td]:border-b [&>td]:border-admin-line last:[&>td]:border-0", on ? "bg-admin-inset" : "hover:bg-admin-inset")}>
                      <td className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={on} onChange={() => toggle(o.id)} className="size-4" aria-label={`Select order ${o.orderNumber}`} />
                      </td>
                      <td className="tabular px-3 font-medium whitespace-nowrap">
                        <Link href={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                          #{o.orderNumber}
                        </Link>
                      </td>
                      <td className="max-w-[220px] px-3">
                        <p className="truncate font-medium">{o.customerName}</p>
                      </td>
                      <td className="max-w-[240px] px-3 text-muted">
                        <p className="tabular truncate">
                          {itemCount(o)} · {o.items.map((i) => i.name).join(", ")}
                        </p>
                      </td>
                      <td className="tabular px-3 whitespace-nowrap text-muted">{relTime(o.createdAt)}</td>
                      <td className="px-3">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="px-3">
                        <PayPill status={o.paymentStatus} />
                      </td>
                      <td className="tabular px-3 text-right font-semibold whitespace-nowrap">{formatINR(o.total)}</td>
                      <td className="w-12 pr-2" onClick={(e) => e.stopPropagation()}>
                        <a href={waLink(o.phone, `Hi ${o.customerName.split(" ")[0]}! `)} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full text-wa hover:bg-admin-sidebar" aria-label={`WhatsApp ${o.customerName}`}>
                          <WhatsAppIcon className="size-[18px]" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="tabular mt-3 text-[13px] text-muted">
            Showing {orders.length} of {all.length} orders
          </p>
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={6} />}>
      <OrdersInner />
    </Suspense>
  );
}
