"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
import { api, Panel, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, btn, cx, DetailHeader, field, Thumb, useActionToast } from "@/components/admin/pages/kit";
import { formatINR, imgUrl } from "@/lib/format";
import type { OrderItem, Product } from "@/lib/types";

const SOURCES = ["whatsapp", "instagram", "facebook", "exhibition", "phone", "friend / referral", "other"];
const digits = (v: string) => v.replace(/\D/g, "");

export default function NewOrderPage() {
  const { data } = useLoad<{ products: Product[] }>("/api/admin/products");
  const toast = useActionToast();
  const router = useRouter();
  const [c, setC] = useState({ customerName: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", notes: "" });
  const [items, setItems] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState({ name: "", price: "" });
  const [shipping, setShipping] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [status, setStatus] = useState("CONFIRMED");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [source, setSource] = useState("whatsapp");
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const matches = useMemo(() => {
    if (!search) return [];
    const s = search.toLowerCase();
    return (data?.products ?? []).filter((p) => p.name.toLowerCase().includes(s)).slice(0, 6);
  }, [search, data]);

  const add = (p: Product) => {
    setItems((l) => (l.some((i) => i.productId === p.id) ? l.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)) : [...l, { productId: p.id, name: p.name, image: p.images[0] ?? null, price: p.price, quantity: 1 }]));
    setSearch("");
  };
  const addCustom = () => {
    if (!custom.name.trim() || !custom.price) return;
    setItems((l) => [...l, { productId: null, name: custom.name.trim(), image: null, price: Number(custom.price), quantity: 1 }]);
    setCustom({ name: "", price: "" });
  };
  const setItem = (n: number, p: Partial<OrderItem>) => setItems((l) => l.map((x, k) => (k === n ? { ...x, ...p } : x)));
  const removeItem = (n: number) => {
    const removed = items[n];
    setItems((l) => l.filter((_, k) => k !== n));
    toast(`Removed ${removed.name}`, "ok", { label: "Undo", onClick: () => setItems((l) => [...l.slice(0, n), removed, ...l.slice(n)]) });
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal + Number(shipping || 0) - Number(discount || 0));
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC({ ...c, [k]: e.target.value });

  const save = async () => {
    setTried(true);
    if (!c.customerName.trim() || !c.phone.trim()) return toast("Add the customer’s name and phone", "err");
    if (!items.length) return toast("Add at least one item", "err");
    setBusy(true);
    try {
      const r = await api<{ id: string }>("/api/admin/orders", { body: { ...c, items, shipping: Number(shipping), discount: Number(discount), status, paymentStatus, source } });
      toast("Order added");
      router.replace(`/admin/orders/${r.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save the order", "err");
      setBusy(false);
    }
  };

  const req = (v: string) => (tried && !v.trim() ? { "aria-invalid": true as const } : {});

  return (
    <div className={cx(ADMIN_ICONS, "pb-24 lg:pb-0")}>
      <DetailHeader back={{ href: "/admin/orders", label: "Orders" }} title="Record an order" meta="Orders from WhatsApp, Instagram, exhibitions or phone calls, so every sale lives in one place." />

      <div className="grid gap-3 md:gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3 md:space-y-4">
          <Panel title="Items">
            <div className="relative">
              <label htmlFor="find-product" className="sr-only">
                Search your products
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input id="find-product" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your pieces to add" className={cx(field, "pl-10!")} autoComplete="off" />
              {matches.length > 0 && (
                <ul className="shadow-float absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-admin-line bg-white py-1">
                  {matches.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => add(p)} className="flex min-h-12 w-full items-center gap-3 px-3 py-1.5 text-left text-[14px] hover:bg-admin-inset">
                        <Thumb src={imgUrl(p.images[0], 80)} className="size-9" />
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        <span className="tabular font-medium">{formatINR(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="Or a custom item" aria-label="Custom item name" className={cx(field, "min-w-0 flex-1")} />
              <input value={custom.price} onChange={(e) => setCustom({ ...custom, price: digits(e.target.value) })} onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="₹" aria-label="Custom item price" className={cx(field, "tabular w-24! shrink-0")} inputMode="numeric" />
              <button onClick={addCustom} disabled={!custom.name.trim() || !custom.price} className={btn("secondary", "w-11 px-0! md:w-9")} aria-label="Add custom item">
                <Plus className="size-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="mt-4 rounded-[6px] bg-admin-inset px-3 py-4 text-center text-[14px] text-muted">No items yet. Search above or add a custom piece.</p>
            ) : (
              <ul className="mt-3">
                {items.map((i, n) => (
                  <li key={n} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-admin-line py-3 last:border-0">
                    <Thumb src={i.image ? imgUrl(i.image, 80) : null} className="size-11" />
                    <span className="min-w-0 flex-1 text-[15px] font-medium">{i.name}</span>
                    <div className="flex w-full items-center gap-2 pl-14 sm:w-auto sm:pl-0">
                      <input
                        value={i.price}
                        onChange={(e) => setItem(n, { price: Number(digits(e.target.value)) || 0 })}
                        className={cx(field, "tabular w-24! text-right")}
                        inputMode="numeric"
                        aria-label={`Price of ${i.name}`}
                      />
                      <div className="flex items-center">
                        <button onClick={() => setItem(n, { quantity: Math.max(1, i.quantity - 1) })} className="grid size-11 place-items-center rounded-[6px] border border-line-strong md:size-9" aria-label="One fewer">
                          <Minus className="size-4" />
                        </button>
                        <span className="tabular w-9 text-center text-[15px] font-medium" aria-label="Quantity">
                          {i.quantity}
                        </span>
                        <button onClick={() => setItem(n, { quantity: i.quantity + 1 })} className="grid size-11 place-items-center rounded-[6px] border border-line-strong md:size-9" aria-label="One more">
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(n)} className="ml-auto grid size-11 place-items-center rounded-full text-muted hover:bg-status-danger-bg hover:text-danger md:size-9" aria-label={`Remove ${i.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Customer">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className="label">
                  Name
                </label>
                <input id="c-name" value={c.customerName} onChange={set("customerName")} className={field} autoComplete="off" {...req(c.customerName)} />
              </div>
              <div>
                <label htmlFor="c-phone" className="label">
                  WhatsApp / phone
                </label>
                <input id="c-phone" value={c.phone} onChange={set("phone")} className={cx(field, "tabular")} inputMode="tel" autoComplete="off" {...req(c.phone)} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-email" className="label">
                  Email <span className="font-normal text-muted">(optional)</span>
                </label>
                <input id="c-email" type="email" value={c.email} onChange={set("email")} className={field} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-address" className="label">
                  Address
                </label>
                <textarea id="c-address" value={c.address} onChange={set("address")} rows={2} className={field} />
              </div>
              <div>
                <label htmlFor="c-city" className="label">
                  City
                </label>
                <input id="c-city" value={c.city} onChange={set("city")} className={field} />
              </div>
              <div>
                <label htmlFor="c-state" className="label">
                  State
                </label>
                <input id="c-state" value={c.state} onChange={set("state")} className={field} />
              </div>
              <div>
                <label htmlFor="c-pin" className="label">
                  Pincode
                </label>
                <input id="c-pin" value={c.pincode} onChange={(e) => setC({ ...c, pincode: digits(e.target.value).slice(0, 6) })} className={cx(field, "tabular")} inputMode="numeric" maxLength={6} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-notes" className="label">
                  Order notes <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea id="c-notes" value={c.notes} onChange={set("notes")} rows={2} className={field} placeholder="Personalisation, delivery date, gift note…" />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-3 md:space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel title="Summary">
            <div className="tabular space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="s-ship" className="text-muted">
                  Shipping (₹)
                </label>
                <input id="s-ship" value={shipping} onChange={(e) => setShipping(digits(e.target.value))} className={cx(field, "w-28! text-right")} inputMode="numeric" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="s-disc" className="text-muted">
                  Discount (₹)
                </label>
                <input id="s-disc" value={discount} onChange={(e) => setDiscount(digits(e.target.value))} className={cx(field, "w-28! text-right")} inputMode="numeric" />
              </div>
              <div className="flex justify-between border-t border-admin-line pt-3 text-[17px] font-semibold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
          </Panel>
          <Panel title="Status">
            <div className="space-y-3">
              <div>
                <label htmlFor="s-src" className="label">
                  Received via
                </label>
                <select id="s-src" value={source} onChange={(e) => setSource(e.target.value)} className={cx(field, "capitalize")}>
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="s-status" className="label">
                  Order status
                </label>
                <select id="s-status" value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
                  <option value="PENDING">New</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_MAKING">Being made</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
              <div>
                <label htmlFor="s-pay" className="label">
                  Payment
                </label>
                <select id="s-pay" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={field}>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Part-paid</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
          </Panel>
          <button onClick={save} disabled={busy} className={btn("primary", "hidden w-full lg:inline-flex")}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save order · <span className="tabular">{formatINR(total)}</span>
          </button>
        </div>
      </div>

      {/* Mobile: sticky save */}
      <div className="fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-30 px-3 md:bottom-6 md:left-16 md:px-8 lg:hidden">
        <button onClick={save} disabled={busy} className={btn("primary", "shadow-float w-full")}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save order · <span className="tabular">{formatINR(total)}</span>
        </button>
      </div>
    </div>
  );
}
