"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { api, Panel, useLoad, useToast } from "@/components/admin/ui";
import { formatINR, imgUrl } from "@/lib/format";
import type { OrderItem, Product } from "@/lib/types";

const SOURCES = ["whatsapp", "instagram", "facebook", "exhibition", "phone", "friend / referral", "other"];

export default function NewOrderPage() {
  const { data } = useLoad<{ products: Product[] }>("/api/admin/products");
  const toast = useToast();
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

  const matches = useMemo(() => {
    if (!search) return [];
    const s = search.toLowerCase();
    return (data?.products ?? []).filter((p) => p.name.toLowerCase().includes(s)).slice(0, 6);
  }, [search, data]);

  const add = (p: Product) => {
    setItems((l) => (l.some((i) => i.productId === p.id) ? l.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)) : [...l, { productId: p.id, name: p.name, image: p.images[0] ?? null, price: p.price, quantity: 1 }]));
    setSearch("");
  };
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal + Number(shipping || 0) - Number(discount || 0));
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC({ ...c, [k]: e.target.value });

  const save = async () => {
    if (!c.customerName || !c.phone) return toast("Customer name and phone are required", "err");
    if (!items.length) return toast("Add at least one item", "err");
    setBusy(true);
    try {
      const r = await api<{ id: string }>("/api/admin/orders", { body: { ...c, items, shipping: Number(shipping), discount: Number(discount), status, paymentStatus, source } });
      toast("Order added");
      router.replace(`/admin/orders/${r.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="grid size-9 place-items-center rounded-full bg-white shadow-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-semibold">Add an order</h1>
          <p className="text-sm text-muted">Record orders you received on WhatsApp, Instagram, exhibitions or by phone — so all sales are in one place.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <div className="relative">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your products to add…" className="input" />
              {matches.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-xl">
                  {matches.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => add(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-cream/50">
                        <img src={imgUrl(p.images[0], 80)} alt="" className="size-9 rounded-lg object-cover" />
                        <span className="flex-1">{p.name}</span>
                        <span>{formatINR(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Or custom item name" className="input py-2 text-sm" />
              <input value={custom.price} onChange={(e) => setCustom({ ...custom, price: e.target.value.replace(/\D/g, "") })} placeholder="₹" className="input w-24 py-2 text-sm" inputMode="numeric" />
              <button
                onClick={() => {
                  if (!custom.name || !custom.price) return;
                  setItems((l) => [...l, { productId: null, name: custom.name, image: null, price: Number(custom.price), quantity: 1 }]);
                  setCustom({ name: "", price: "" });
                }}
                className="btn btn-outline btn-sm"
                aria-label="Add custom item"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {items.length > 0 && (
              <ul className="mt-4 divide-y divide-ink/[0.06]">
                {items.map((i, n) => (
                  <li key={n} className="flex items-center gap-3 py-2.5">
                    {i.image ? <img src={imgUrl(i.image, 80)} alt="" className="size-10 rounded-lg object-cover" /> : <div className="size-10 rounded-lg bg-cream" />}
                    <span className="flex-1 text-sm">{i.name}</span>
                    <input
                      value={i.price}
                      onChange={(e) => setItems((l) => l.map((x, k) => (k === n ? { ...x, price: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))}
                      className="input w-24 py-1.5 text-sm"
                      inputMode="numeric"
                      aria-label="Price"
                    />
                    <input
                      type="number"
                      min={1}
                      value={i.quantity}
                      onChange={(e) => setItems((l) => l.map((x, k) => (k === n ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x)))}
                      className="input w-16 py-1.5 text-sm"
                      aria-label="Quantity"
                    />
                    <button onClick={() => setItems((l) => l.filter((_, k) => k !== n))} className="text-muted hover:text-rose" aria-label="Remove">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Customer">
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={c.customerName} onChange={set("customerName")} placeholder="Name *" className="input" />
              <input value={c.phone} onChange={set("phone")} placeholder="WhatsApp / phone *" className="input" inputMode="tel" />
              <input value={c.email} onChange={set("email")} placeholder="Email" className="input sm:col-span-2" />
              <textarea value={c.address} onChange={set("address")} placeholder="Address" rows={2} className="input sm:col-span-2" />
              <input value={c.city} onChange={set("city")} placeholder="City" className="input" />
              <input value={c.state} onChange={set("state")} placeholder="State" className="input" />
              <input value={c.pincode} onChange={set("pincode")} placeholder="Pincode" className="input" />
              <textarea value={c.notes} onChange={set("notes")} placeholder="Notes" rows={2} className="input sm:col-span-2" />
            </div>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Summary">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Shipping</span>
                <input value={shipping} onChange={(e) => setShipping(e.target.value.replace(/\D/g, ""))} className="input w-28 py-1.5 text-right" inputMode="numeric" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Discount</span>
                <input value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))} className="input w-28 py-1.5 text-right" inputMode="numeric" />
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-lg font-semibold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
          </Panel>
          <Panel title="Status">
            <div className="space-y-3">
              <div>
                <label className="label">Received via</label>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="input capitalize">
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Order status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                  <option value="PENDING">New / pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_MAKING">Being made</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
              <div>
                <label className="label">Payment</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input">
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Part-paid</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
          </Panel>
          <button onClick={save} disabled={busy} className="btn btn-primary w-full py-3.5">
            {busy && <Loader2 className="size-4 animate-spin" />} Save order
          </button>
        </div>
      </div>
    </div>
  );
}
