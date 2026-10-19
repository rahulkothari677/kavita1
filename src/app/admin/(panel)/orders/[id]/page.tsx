"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, Loader2, Mail, MapPin, PenLine, Phone, Printer, RotateCcw, Trash2, XCircle } from "lucide-react";
import { api, Panel, PayPill, StatusPill } from "@/components/admin/ui";
import { ADMIN_ICONS, AiDraftChip, AiPanel, btn, copyText, cx, DetailHeader, field, relTime, Segmented, SheetRow, Sk, Thumb, useActionToast, useConfirm, useOrigin } from "@/components/admin/pages/kit";
import { Modal } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatDate, formatINR, imgUrl } from "@/lib/format";
import { CUSTOMER_TEMPLATES, waLink } from "@/lib/whatsapp";
import { PAYMENT_STATUSES, type Order, type OrderStatus, type PaymentStatus, type StoreSettings } from "@/lib/types";

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "IN_MAKING", "SHIPPED", "DELIVERED"];
const LABEL: Record<OrderStatus, string> = { PENDING: "New", CONFIRMED: "Confirmed", IN_MAKING: "Being made", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled" };
const NEXT_VERB: Partial<Record<OrderStatus, string>> = { PENDING: "Confirm order", CONFIRMED: "Start making", IN_MAKING: "Mark shipped", SHIPPED: "Mark delivered" };
const PAY_LABEL: Record<PaymentStatus, string> = { UNPAID: "Unpaid", PARTIAL: "Part-paid", PAID: "Paid", REFUNDED: "Refunded" };
const AI_INTENTS = ["Warm thank-you note", "Gentle payment reminder", "Delay apology — needs 2 more days", "Ask for a photo & review"];
const COURIERS = ["India Post", "DTDC", "Delhivery", "Blue Dart", "Shiprocket", "Professional Couriers", "Xpressbees", "Ekart"];
const committed = (s: OrderStatus) => s !== "PENDING" && s !== "CANCELLED";

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [aiEdited, setAiEdited] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [ship, setShip] = useState({ courier: "", trackingNumber: "", adminNotes: "", paymentMethod: "" });
  const [sheet, setSheet] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const toast = useActionToast();
  const router = useRouter();
  const origin = useOrigin();
  const [ask, confirmDialog] = useConfirm();

  useEffect(() => {
    api<{ order: Order }>(`/api/admin/orders/${id}`)
      .then((d) => {
        setOrder(d.order);
        setShip({ courier: d.order.courier ?? "", trackingNumber: d.order.trackingNumber ?? "", adminNotes: d.order.adminNotes ?? "", paymentMethod: d.order.paymentMethod ?? "" });
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load this order"));
    api<{ settings: StoreSettings }>("/api/admin/settings")
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, [id]);

  const patch = async (body: Partial<Order>) => {
    const d = await api<{ order: Order }>(`/api/admin/orders/${id}`, { method: "PATCH", body });
    setOrder(d.order);
    setSavedAt(new Date().toISOString());
    return d.order;
  };

  /** Optimistic status change with rollback and an Undo toast (when undoing cannot upset stock). */
  const setStatus = async (to: OrderStatus, opts: { undo?: boolean } = { undo: true }) => {
    if (!order || order.status === to) return;
    const before = order;
    setOrder({ ...order, status: to });
    try {
      await patch({ status: to });
      const undoSafe = !(committed(to) && before.status === "PENDING");
      toast(
        to === "CANCELLED" ? "Order cancelled" : `Marked as ${LABEL[to].toLowerCase()}`,
        "ok",
        opts.undo && undoSafe ? { label: "Undo", onClick: () => setStatus(before.status, { undo: false }) } : undefined,
      );
    } catch (e) {
      setOrder(before);
      toast(e instanceof Error ? e.message : "Could not update the order", "err");
    }
  };

  const setPayment = async (p: PaymentStatus, opts: { undo?: boolean } = { undo: true }) => {
    if (!order || order.paymentStatus === p) return;
    const before = order.paymentStatus;
    setOrder({ ...order, paymentStatus: p });
    try {
      await patch({ paymentStatus: p });
      toast(`Payment: ${PAY_LABEL[p].toLowerCase()}`, "ok", opts.undo ? { label: "Undo", onClick: () => setPayment(before, { undo: false }) } : undefined);
    } catch (e) {
      setOrder((o) => o && { ...o, paymentStatus: before });
      toast(e instanceof Error ? e.message : "Could not update payment", "err");
    }
  };

  const saveShipping = async () => {
    if (!order) return;
    setSaving(true);
    const markShipped = !!ship.trackingNumber && ["CONFIRMED", "IN_MAKING", "PENDING"].includes(order.status);
    try {
      await patch({ courier: ship.courier || null, trackingNumber: ship.trackingNumber || null, adminNotes: ship.adminNotes || null, ...(markShipped ? { status: "SHIPPED" as const } : {}) });
      toast(markShipped ? "Saved and marked shipped" : "Saved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  };

  const aiMessage = async (intent: string) => {
    setAiBusy(intent);
    try {
      const d = await api<{ message: string }>("/api/admin/ai/write", { body: { task: "order-message", input: { orderId: id, intent } } });
      setAiMsg(d.message);
      setAiEdited(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not write a message", "err");
    } finally {
      setAiBusy(null);
    }
  };

  const remove = async () => {
    const ok = await ask({ title: "Delete this order?", body: "It will be removed from your records. To keep a record, cancel the order instead.", confirmLabel: "Delete order" });
    if (!ok) return;
    try {
      await api(`/api/admin/orders/${id}`, { method: "DELETE" });
      toast("Order deleted");
      router.replace("/admin/orders");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete", "err");
    }
  };

  if (loadError)
    return (
      <div className="rounded-[8px] border border-admin-line bg-white p-6 text-center">
        <p className="font-display text-[22px]">We couldn’t open this order</p>
        <p className="mt-1 text-[14px] text-muted">{loadError}</p>
        <Link href="/admin/orders" className={btn("secondary", "mt-4")}>
          Back to orders
        </Link>
      </div>
    );

  if (!order)
    return (
      <div role="status" aria-label="Loading order" className="space-y-4">
        <Sk className="h-5 w-20" />
        <Sk className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Sk className="h-72" />
          <Sk className="h-72" />
        </div>
      </div>
    );

  const extra = { storeName: settings?.storeName ?? "Kavita's Artistry", upiId: settings?.upiId, siteUrl: origin };
  const address = [order.address, order.city, order.state, order.pincode].filter(Boolean).join(", ");
  const first = order.customerName.split(" ")[0];
  const curIdx = FLOW.indexOf(order.status);
  const next = order.status !== "CANCELLED" && curIdx < FLOW.length - 1 ? FLOW[curIdx + 1] : null;
  const lastAt = (s: OrderStatus) => [...order.history].reverse().find((h) => h.status === s)?.at;
  const shipDirty = (ship.courier || "") !== (order.courier ?? "") || (ship.trackingNumber || "") !== (order.trackingNumber ?? "") || (ship.adminNotes || "") !== (order.adminNotes ?? "");
  const units = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={ADMIN_ICONS}>
      <DetailHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`#${order.orderNumber}`}
        chips={
          <>
            <StatusPill status={order.status} />
            <PayPill status={order.paymentStatus} />
          </>
        }
        meta={
          <span className="tabular">
            {formatDate(order.createdAt)} · via {order.source}
            {savedAt && <span className="text-[12px]"> · Saved {relTime(savedAt)}</span>}
          </span>
        }
        actions={
          <>
            <a href={`/admin/invoice/${order.id}`} target="_blank" rel="noreferrer" className={btn("secondary")}>
              <Printer className="size-4" aria-hidden /> Invoice
            </a>
            <button onClick={() => setSheet(true)} className={btn("wa")}>
              <WhatsAppIcon className="size-[18px]" /> Message on WhatsApp
            </button>
          </>
        }
      />

      <div className="grid gap-3 md:gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3 md:space-y-4">
          {/* Status timeline */}
          <Panel title="Progress">
            {order.status === "CANCELLED" && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[6px] bg-status-neutral-bg px-3 py-2.5 text-[14px]">
                <span className="flex items-center gap-2 font-medium">
                  <XCircle className="size-4" aria-hidden /> This order was cancelled{lastAt("CANCELLED") ? ` ${relTime(lastAt("CANCELLED")!)}` : ""}.
                </span>
                <button onClick={() => setStatus("PENDING")} className={btn("secondary")}>
                  <RotateCcw className="size-4" aria-hidden /> Reopen
                </button>
              </div>
            )}
            <ol className="relative" aria-label="Order status">
              {FLOW.map((s, i) => {
                const state = order.status === "CANCELLED" ? (lastAt(s) ? "done" : "todo") : i < curIdx ? "done" : i === curIdx ? "current" : "todo";
                const at = lastAt(s);
                return (
                  <li key={s} className="relative pl-8">
                    {i < FLOW.length - 1 && <span aria-hidden className="absolute top-[26px] bottom-[-14px] left-[7px] w-px bg-admin-line" />}
                    <span
                      aria-hidden
                      className={cx(
                        "absolute top-[15px] left-0 size-[15px] rounded-full",
                        state === "done" && "bg-ink",
                        state === "current" && "bg-accent ring-4 ring-accent-tint",
                        state === "todo" && "border-[1.5px] border-line-strong bg-white",
                      )}
                    />
                    <button
                      type="button"
                      disabled={order.status === s}
                      onClick={() => setStatus(s)}
                      className="group -mx-2 flex min-h-11 w-[calc(100%+16px)] items-center justify-between gap-3 rounded-[6px] px-2 py-1.5 text-left enabled:hover:bg-admin-inset"
                      aria-current={state === "current" ? "step" : undefined}
                    >
                      <span>
                        <span className={cx("block text-[15px] leading-6", state === "current" ? "font-semibold" : state === "todo" ? "text-muted" : "font-medium")}>{LABEL[s]}</span>
                        {at && <span className="tabular block text-[13px] leading-5 text-muted">{formatDate(at)}</span>}
                      </span>
                      {order.status !== s && <span className="text-[13px] font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Set</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-line pt-4">
              {next && (
                <button onClick={() => setStatus(next)} className={btn("primary")}>
                  {NEXT_VERB[order.status] ?? `Mark ${LABEL[next].toLowerCase()}`} <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
              {order.status !== "CANCELLED" && (
                <button onClick={() => setStatus("CANCELLED")} className={btn("dangerGhost")}>
                  Cancel order
                </button>
              )}
            </div>
            <p className="helper">Stock goes down when you confirm an order and comes back if you cancel it.</p>
          </Panel>

          {/* Items */}
          <Panel title={<span className="tabular">Items · {units}</span>}>
            <ul className="-my-2">
              {order.items.map((i, n) => (
                <li key={n} className="flex items-start gap-3 border-b border-admin-line py-3 last:border-0">
                  <Thumb src={i.image ? imgUrl(i.image, 140) : null} className="size-14" />
                  <div className="min-w-0 flex-1">
                    {i.productId ? (
                      <Link href={`/admin/products/${i.productId}`} className="text-[15px] font-medium hover:underline">
                        {i.name}
                      </Link>
                    ) : (
                      <p className="text-[15px] font-medium">{i.name}</p>
                    )}
                    <p className="tabular text-[13px] text-muted">
                      {formatINR(i.price)} × {i.quantity}
                    </p>
                    {i.note && (
                      <p className="mt-1.5 flex items-start gap-1.5 rounded-[6px] bg-plinth px-2 py-1.5 text-[13px]">
                        <PenLine className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {i.note}
                      </p>
                    )}
                  </div>
                  <p className="tabular text-[15px] font-semibold">{formatINR(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="tabular mt-3 space-y-1.5 border-t border-admin-line pt-3 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatINR(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="text-success">−{formatINR(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{order.shipping ? formatINR(order.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between pt-1 text-[17px] font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(order.total)}</dd>
              </div>
            </dl>
            {order.notes && (
              <div className="mt-4 rounded-[6px] bg-plinth p-3 text-[14px]">
                <p className="text-[12px] font-semibold text-muted">Customer note</p>
                <p className="mt-0.5 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </Panel>

          {/* AI personal message — neel */}
          <AiPanel title="Personal message">
            <p className="text-[14px] text-ink-2">Pick what you want to say and AI drafts a warm note for {first}.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {AI_INTENTS.map((intent) => (
                <button
                  key={intent}
                  disabled={!!aiBusy}
                  onClick={() => aiMessage(intent)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ai-line bg-white px-3 text-[13px] font-medium text-ai-fg hover:border-ai-fg disabled:opacity-60 md:min-h-8"
                >
                  {aiBusy === intent && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                  {intent}
                </button>
              ))}
            </div>
            {aiMsg && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="ai-msg" className="label mb-0!">
                    Message
                  </label>
                  {!aiEdited && <AiDraftChip />}
                </div>
                <textarea id="ai-msg" value={aiMsg} onChange={(e) => (setAiMsg(e.target.value), setAiEdited(true))} rows={6} className={field} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href={waLink(order.phone, aiMsg)} target="_blank" rel="noreferrer" className={btn("wa")}>
                    <WhatsAppIcon className="size-4" /> Send on WhatsApp
                  </a>
                  <button onClick={async () => ((await copyText(aiMsg)) ? toast("Message copied") : toast("Could not copy", "err"))} className={btn("secondary")}>
                    <Copy className="size-4" aria-hidden /> Copy
                  </button>
                </div>
              </div>
            )}
          </AiPanel>
        </div>

        <div className="space-y-3 md:space-y-4">
          {/* Customer */}
          <Panel title="Customer">
            <p className="text-[18px] leading-6 font-semibold">{order.customerName}</p>
            <ul className="mt-3 space-y-2 text-[14px]">
              <li className="tabular flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-muted" aria-hidden /> {order.phone}
              </li>
              {order.email && (
                <li className="flex items-center gap-2 break-all">
                  <Mail className="size-4 shrink-0 text-muted" aria-hidden /> {order.email}
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /> {address}
                </li>
              )}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <a href={waLink(order.phone, `Hi ${first}! `)} target="_blank" rel="noreferrer" className={btn("waOutline", "px-2!")}>
                <WhatsAppIcon className="size-4" /> Chat
              </a>
              <a href={`tel:${order.phone}`} className={btn("secondary", "px-2!")}>
                <Phone className="size-4" aria-hidden /> Call
              </a>
              <button
                disabled={!address}
                onClick={async () => ((await copyText(`${order.customerName}\n${address}\n${order.phone}`)) ? toast("Address copied for the courier") : toast("Could not copy", "err"))}
                className={btn("secondary", "px-2!")}
              >
                <Copy className="size-4" aria-hidden /> Address
              </button>
            </div>
          </Panel>

          {/* Payment */}
          <Panel title="Payment">
            <div className="-mx-1 overflow-x-auto px-1">
              <Segmented label="Payment status" value={order.paymentStatus} onChange={(p) => setPayment(p)} items={PAYMENT_STATUSES.map((p) => ({ key: p, label: PAY_LABEL[p] }))} />
            </div>
            <label htmlFor="paid-via" className="label mt-4">
              Paid via
            </label>
            <select
              id="paid-via"
              value={ship.paymentMethod}
              onChange={async (e) => {
                const v = e.target.value;
                setShip((s) => ({ ...s, paymentMethod: v }));
                try {
                  await patch({ paymentMethod: v || null });
                  toast("Saved");
                } catch (err) {
                  toast(err instanceof Error ? err.message : "Could not save", "err");
                }
              }}
              className={field}
            >
              <option value="">Not set</option>
              {["UPI", "Bank transfer", "Cash on delivery", "Cash", "Other"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Panel>

          {/* Shipping & notes */}
          <Panel title="Shipping & notes">
            <div className="space-y-3">
              <div>
                <label htmlFor="courier" className="label">
                  Courier
                </label>
                <input id="courier" list="couriers" value={ship.courier} onChange={(e) => setShip({ ...ship, courier: e.target.value })} className={field} placeholder="e.g. India Post" />
                <datalist id="couriers">
                  {COURIERS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="tracking" className="label">
                  Tracking number
                </label>
                <input id="tracking" value={ship.trackingNumber} onChange={(e) => setShip({ ...ship, trackingNumber: e.target.value })} className={cx(field, "tabular")} />
                {ship.trackingNumber && ["CONFIRMED", "IN_MAKING", "PENDING"].includes(order.status) && <p className="helper">Saving will also mark this order as shipped.</p>}
              </div>
              <div>
                <label htmlFor="notes" className="label">
                  Private notes
                </label>
                <textarea id="notes" rows={3} value={ship.adminNotes} onChange={(e) => setShip({ ...ship, adminNotes: e.target.value })} className={field} placeholder="Only you can see these" />
              </div>
              <button disabled={saving || !shipDirty} onClick={saveShipping} className={btn("primary", "w-full")}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} Save shipping & notes
              </button>
            </div>
          </Panel>

          {order.history.length > 0 && (
            <details className="group rounded-[8px] border border-admin-line bg-white">
              <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 text-[16px] font-semibold md:px-5 md:text-[14px]">
                Activity <span className="tabular text-[13px] font-medium text-muted">{order.history.length}</span>
              </summary>
              <ol className="space-y-2 border-t border-admin-line px-4 py-3 text-[14px] md:px-5">
                {order.history
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <li key={i}>
                      <span className="font-medium">{LABEL[h.status as OrderStatus] ?? h.status}</span> <span className="tabular text-muted">· {formatDate(h.at)}</span>
                      {h.note && <span className="block text-[13px] text-muted">{h.note}</span>}
                    </li>
                  ))}
              </ol>
            </details>
          )}

          <button onClick={remove} className={btn("dangerGhost", "w-full justify-start")}>
            <Trash2 className="size-4" aria-hidden /> Delete order
          </button>
        </div>
      </div>

      {/* WhatsApp template sheet */}
      <Modal open={sheet} onClose={() => setSheet(false)} title={`Message ${first}`}>
        <p className="mb-2 text-[14px] text-muted">Opens WhatsApp with the message ready. You can edit it before sending.</p>
        <div className="-mx-2">
          {CUSTOMER_TEMPLATES.map((t) => (
            <SheetRow key={t.key} href={waLink(order.phone, t.build(order, extra))} external onClick={() => setSheet(false)} icon={<WhatsAppIcon className="size-5" />} tone="wa">
              <span className="block">{t.label}</span>
              <span className="line-clamp-1 block text-[13px] font-normal text-muted">{t.build(order, extra).replace(/\*/g, "").split("\n").filter(Boolean).slice(1, 2).join(" ")}</span>
            </SheetRow>
          ))}
          <SheetRow href={waLink(order.phone, `Hi ${first}! `)} external onClick={() => setSheet(false)} icon={<PenLine className="size-5" />}>
            Write my own message
          </SheetRow>
        </div>
      </Modal>
      {confirmDialog}
    </div>
  );
}
