"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Loader2, MapPin, Phone, Printer, Sparkles, Trash2 } from "lucide-react";
import { api, confirmAction, Loading, Panel, PayPill, StatusPill, useToast } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatDate, formatINR, imgUrl } from "@/lib/format";
import { CUSTOMER_TEMPLATES, waLink } from "@/lib/whatsapp";
import { ORDER_STATUSES, PAYMENT_STATUSES, STATUS_LABEL, type Order, type OrderStatus, type StoreSettings } from "@/lib/types";

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [ship, setShip] = useState({ courier: "", trackingNumber: "", adminNotes: "", paymentMethod: "" });
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api<{ order: Order }>(`/api/admin/orders/${id}`).then((d) => {
      setOrder(d.order);
      setShip({ courier: d.order.courier ?? "", trackingNumber: d.order.trackingNumber ?? "", adminNotes: d.order.adminNotes ?? "", paymentMethod: d.order.paymentMethod ?? "" });
    });
    api<{ settings: StoreSettings }>("/api/admin/settings").then((d) => setSettings(d.settings));
  }, [id]);

  const update = async (patch: Partial<Order>, msg = "Updated") => {
    setSaving(true);
    try {
      const d = await api<{ order: Order }>(`/api/admin/orders/${id}`, { method: "PATCH", body: patch });
      setOrder(d.order);
      toast(msg);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const aiMessage = async (intent: string) => {
    setAiBusy(true);
    try {
      const d = await api<{ message: string }>("/api/admin/ai/write", { body: { task: "order-message", input: { orderId: id, intent } } });
      setAiMsg(d.message);
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI failed", "err");
    } finally {
      setAiBusy(false);
    }
  };

  if (!order) return <Loading />;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const extra = { storeName: settings?.storeName ?? "Kavita's Artistry", upiId: settings?.upiId, siteUrl: origin };
  const address = [order.address, order.city, order.state, order.pincode].filter(Boolean).join(", ");
  const currentIdx = ORDER_STATUSES.indexOf(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="grid size-9 place-items-center rounded-full bg-white shadow-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold">{order.orderNumber}</h1>
            <StatusPill status={order.status} />
            <PayPill status={order.paymentStatus} />
          </div>
          <p className="text-sm text-muted">
            {formatDate(order.createdAt)} · via {order.source}
          </p>
        </div>
        <a href={`/admin/invoice/${order.id}`} target="_blank" className="btn btn-outline btn-sm">
          <Printer className="size-4" /> Invoice
        </a>
      </div>

      {/* Status stepper */}
      <Panel title="Order progress">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {ORDER_STATUSES.filter((s) => s !== "CANCELLED").map((s, i) => {
            const done = order.status !== "CANCELLED" && i <= currentIdx;
            return (
              <button
                key={s}
                disabled={saving || order.status === s}
                onClick={() => update({ status: s as OrderStatus }, `Marked as ${STATUS_LABEL[s as OrderStatus]}`)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${order.status === s ? "border-ink bg-ink text-cream" : done ? "border-wa/40 bg-wa/10 text-wa" : "border-ink/10 bg-white hover:border-ink/40"}`}
              >
                {done && order.status !== s && <Check className="size-3.5" />}
                {STATUS_LABEL[s as OrderStatus]}
              </button>
            );
          })}
          <button
            disabled={saving || order.status === "CANCELLED"}
            onClick={() => confirmAction("Cancel this order? Stock will be restored if it was confirmed.") && update({ status: "CANCELLED" }, "Order cancelled")}
            className="shrink-0 rounded-full border border-rose/30 px-4 py-2 text-sm text-rose hover:bg-rose/5 disabled:opacity-40"
          >
            Cancel order
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">Stock is reduced automatically when you confirm an order, and restored if you cancel it.</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="-my-2 divide-y divide-ink/[0.06]">
              {order.items.map((i, n) => (
                <li key={n} className="flex items-center gap-3 py-3">
                  {i.image ? <img src={imgUrl(i.image, 120)} alt="" className="size-14 rounded-xl object-cover" /> : <div className="grid size-14 place-items-center rounded-xl bg-cream">🎁</div>}
                  <div className="min-w-0 flex-1">
                    {i.productId ? (
                      <Link href={`/admin/products/${i.productId}`} className="font-medium hover:underline">
                        {i.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{i.name}</p>
                    )}
                    <p className="text-xs text-muted">
                      {formatINR(i.price)} × {i.quantity}
                    </p>
                    {i.note && <p className="mt-1 rounded-lg bg-gold-2/15 px-2 py-1 text-xs">✏️ {i.note}</p>}
                  </div>
                  <p className="font-medium">{formatINR(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-ink/[0.06] pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatINR(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-wa">
                  <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd>−{formatINR(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{order.shipping ? formatINR(order.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(order.total)}</dd>
              </div>
            </dl>
            {order.notes && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-cream/60 p-3 text-sm">📝 {order.notes}</p>}
          </Panel>

          <Panel title="Message customer on WhatsApp">
            <div className="grid gap-2 sm:grid-cols-2">
              {CUSTOMER_TEMPLATES.map((t) => (
                <a key={t.key} href={waLink(order.phone, t.build(order, extra))} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-ink/10 px-3 py-2.5 text-sm hover:border-wa hover:bg-wa/5">
                  <WhatsAppIcon className="size-4 text-wa" /> {t.label}
                </a>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-cream/50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-gold" /> AI personal message
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Warm thank-you note", "Gentle payment reminder", "Delay apology — needs 2 more days", "Ask for a photo & review"].map((intent) => (
                  <button key={intent} disabled={aiBusy} onClick={() => aiMessage(intent)} className="rounded-full border border-ink/12 bg-white px-3 py-1 text-xs hover:border-ink/40">
                    {intent}
                  </button>
                ))}
              </div>
              {aiBusy && <Loader2 className="mt-3 size-4 animate-spin" />}
              {aiMsg && (
                <div className="mt-3">
                  <textarea value={aiMsg} onChange={(e) => setAiMsg(e.target.value)} rows={5} className="input text-sm" />
                  <a href={waLink(order.phone, aiMsg)} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm mt-2">
                    <WhatsAppIcon className="size-4" /> Send
                  </a>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-display text-2xl">{order.customerName}</p>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-muted" /> {order.phone}
              </p>
              {order.email && <p className="text-muted">{order.email}</p>}
              {address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted" /> {address}
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={waLink(order.phone, `Hi ${order.customerName.split(" ")[0]}! `)} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm">
                <WhatsAppIcon className="size-4" /> Chat
              </a>
              <a href={`tel:${order.phone}`} className="btn btn-outline btn-sm">
                <Phone className="size-4" /> Call
              </a>
              {address && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${order.customerName}\n${address}\n${order.phone}`);
                    toast("Address copied for courier");
                  }}
                  className="btn btn-outline btn-sm"
                >
                  <Copy className="size-4" /> Copy address
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Payment">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUSES.map((p) => (
                <button key={p} onClick={() => update({ paymentStatus: p }, "Payment updated")} className={`rounded-full border px-3.5 py-1.5 text-sm ${order.paymentStatus === p ? "border-ink bg-ink text-cream" : "border-ink/10"}`}>
                  {p === "UNPAID" ? "Unpaid" : p === "PARTIAL" ? "Part-paid" : p === "PAID" ? "Paid" : "Refunded"}
                </button>
              ))}
            </div>
            <label className="label mt-4">Paid via</label>
            <select value={ship.paymentMethod} onChange={(e) => (setShip({ ...ship, paymentMethod: e.target.value }), update({ paymentMethod: e.target.value }, "Saved"))} className="input">
              <option value="">—</option>
              <option>UPI</option>
              <option>Bank transfer</option>
              <option>Cash on delivery</option>
              <option>Cash</option>
              <option>Other</option>
            </select>
          </Panel>

          <Panel title="Shipping & notes">
            <div className="space-y-3">
              <div>
                <label className="label">Courier</label>
                <input list="couriers" value={ship.courier} onChange={(e) => setShip({ ...ship, courier: e.target.value })} className="input" />
                <datalist id="couriers">
                  {["India Post", "DTDC", "Delhivery", "Blue Dart", "Shiprocket", "Professional Couriers", "Xpressbees", "Ekart"].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">Tracking number</label>
                <input value={ship.trackingNumber} onChange={(e) => setShip({ ...ship, trackingNumber: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Private notes (only you see these)</label>
                <textarea rows={3} value={ship.adminNotes} onChange={(e) => setShip({ ...ship, adminNotes: e.target.value })} className="input" />
              </div>
              <button
                disabled={saving}
                onClick={() =>
                  update(
                    { courier: ship.courier || null, trackingNumber: ship.trackingNumber || null, adminNotes: ship.adminNotes || null, ...(ship.trackingNumber && ["CONFIRMED", "IN_MAKING", "PENDING"].includes(order.status) ? { status: "SHIPPED" as const } : {}) },
                    ship.trackingNumber && order.status !== "SHIPPED" ? "Saved & marked shipped" : "Saved",
                  )
                }
                className="btn btn-primary w-full"
              >
                Save
              </button>
            </div>
          </Panel>

          <Panel title="History">
            <ol className="space-y-2 text-sm">
              {order.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />
                    <span>
                      <b>{STATUS_LABEL[h.status as OrderStatus] ?? h.status}</b> <span className="text-muted">· {formatDate(h.at)}</span>
                      {h.note && <span className="block text-xs text-muted">{h.note}</span>}
                    </span>
                  </li>
                ))}
            </ol>
          </Panel>

          <button
            onClick={async () => {
              if (!confirmAction("Delete this order permanently? (Use Cancel instead to keep a record.)")) return;
              await api(`/api/admin/orders/${id}`, { method: "DELETE" });
              toast("Order deleted");
              router.replace("/admin/orders");
            }}
            className="flex items-center gap-2 text-sm text-rose"
          >
            <Trash2 className="size-4" /> Delete order
          </button>
        </div>
      </div>
    </div>
  );
}
