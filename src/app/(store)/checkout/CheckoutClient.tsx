"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift, Lock, Minus, Plus, Tag, Trash2 } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { WhatsAppIcon } from "@/components/Motifs";
import { calcTotals } from "@/lib/pricing";
import { formatINR, imgUrl } from "@/lib/format";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

type Form = { customerName: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; notes: string };
const EMPTY: Form = { customerName: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", notes: "" };

export function CheckoutClient() {
  const { cart, subtotal, updateQty, removeFromCart, clearCart, settings } = useStore();
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponErr, setCouponErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ka_customer");
      if (saved) setForm({ ...EMPTY, ...JSON.parse(saved), notes: "" });
    } catch {}
  }, []);

  // Re-validate coupon when cart changes
  useEffect(() => {
    if (!coupon) return;
    fetch("/api/coupon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: coupon.code, subtotal }) })
      .then((r) => r.json())
      .then((d) => (d.error ? (setCoupon(null), setCouponErr(d.error)) : setCoupon({ code: d.code, discount: d.discount })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const totals = calcTotals({
    subtotal,
    shippingFee: settings.shippingFee,
    freeShippingAbove: settings.freeShippingAbove,
    discount: coupon?.discount,
    giftWrap,
    giftWrapFee: settings.giftWrapFee,
  });

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyCoupon = async () => {
    setCouponErr("");
    if (!couponInput.trim()) return;
    const r = await fetch("/api/coupon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: couponInput, subtotal }) });
    const d = await r.json();
    if (d.error) setCouponErr(d.error);
    else setCoupon({ code: d.code, discount: d.discount });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid 10-digit mobile number.");
    setBusy(true);
    // Open a window synchronously so mobile browsers don't block the WhatsApp redirect
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const popup = !isMobile ? window.open("about:blank", "_blank") : null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, note: l.note })),
          couponCode: coupon?.code,
          giftWrap,
          giftMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");
      localStorage.setItem("ka_customer", JSON.stringify({ ...form, notes: "" }));
      clearCart();
      if (popup) popup.location.href = data.waUrl;
      else window.location.href = data.waUrl;
      router.push(`/order/${data.orderNumber}?placed=1&p=${encodeURIComponent(form.phone)}`);
    } catch (err) {
      popup?.close();
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  if (cart.length === 0 && !busy) {
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <h1 className="font-display text-5xl">Your bag is empty</h1>
        <p className="mt-3 text-muted">Find something handmade to love.</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="font-display text-5xl font-medium">Checkout</h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted">
        <WhatsAppIcon className="size-4 text-wa" /> No account, no online payment — we confirm your order personally on WhatsApp.
      </p>
      {!settings.acceptingOrders && <p className="mt-4 rounded-2xl bg-gold-2/20 p-4 text-sm">{settings.vacationMessage}</p>}

      <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-8">
          <fieldset className="card space-y-4 p-6 md:p-8">
            <legend className="sr-only">Contact</legend>
            <h2 className="font-display text-2xl font-semibold">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name *</label>
                <input required value={form.customerName} onChange={set("customerName")} className="input" autoComplete="name" />
              </div>
              <div>
                <label className="label">WhatsApp number *</label>
                <input required value={form.phone} onChange={set("phone")} className="input" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" />
              </div>
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input type="email" value={form.email} onChange={set("email")} className="input" autoComplete="email" />
            </div>
          </fieldset>

          <fieldset className="card space-y-4 p-6 md:p-8">
            <h2 className="font-display text-2xl font-semibold">Delivery address</h2>
            <div>
              <label className="label">House no, street, area *</label>
              <textarea required rows={2} value={form.address} onChange={set("address")} className="input" autoComplete="street-address" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">City *</label>
                <input required value={form.city} onChange={set("city")} className="input" autoComplete="address-level2" />
              </div>
              <div>
                <label className="label">State *</label>
                <select required value={form.state} onChange={set("state")} className="input">
                  <option value="">Select</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Pincode *</label>
                <input required value={form.pincode} onChange={set("pincode")} className="input" inputMode="numeric" pattern="[0-9]{6}" title="6-digit pincode" autoComplete="postal-code" />
              </div>
            </div>
            <div>
              <label className="label">Order notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={set("notes")} className="input" placeholder="Delivery instructions, occasion date, anything else…" />
            </div>
          </fieldset>

          {settings.giftWrapFee >= 0 && (
            <fieldset className="card p-6 md:p-8">
              <label className="flex cursor-pointer items-start gap-4">
                <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="mt-1.5 size-5 accent-[#16244a]" />
                <span>
                  <span className="flex items-center gap-2 font-display text-2xl font-semibold">
                    <Gift className="size-5 text-gold" /> Make it a gift
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    Hand-tied gift wrap and a handwritten card {settings.giftWrapFee > 0 ? `· ${formatINR(settings.giftWrapFee)}` : "· free"}
                  </span>
                </span>
              </label>
              {giftWrap && (
                <textarea
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  maxLength={240}
                  className="input mt-4"
                  placeholder="Your message for the card (we'll write it by hand)"
                />
              )}
            </fieldset>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6 md:p-8">
            <h2 className="font-display text-2xl font-semibold">Order summary</h2>
            <ul className="mt-5 divide-y divide-ink/10">
              {cart.map((l) => (
                <li key={l.productId} className="flex gap-3 py-3">
                  <img src={imgUrl(l.image, 160)} alt="" className="size-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{l.name}</p>
                    {l.note && <p className="line-clamp-1 text-xs text-muted">✏️ {l.note}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(l.productId, l.quantity - 1)} className="rounded-full border border-ink/15 p-1" aria-label="Decrease">
                        <Minus className="size-3" />
                      </button>
                      <span className="text-sm">{l.quantity}</span>
                      <button type="button" onClick={() => updateQty(l.productId, l.quantity + 1)} className="rounded-full border border-ink/15 p-1" aria-label="Increase">
                        <Plus className="size-3" />
                      </button>
                      <button type="button" onClick={() => removeFromCart(l.productId)} className="ml-1 text-muted hover:text-rose" aria-label="Remove">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{formatINR(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-ink/10 pt-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl bg-wa/10 px-3 py-2 text-sm text-wa">
                  <span className="flex items-center gap-2">
                    <Tag className="size-4" /> {coupon.code} applied
                  </span>
                  <button type="button" onClick={() => setCoupon(null)} className="underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Offer code" className="input py-2" />
                  <button type="button" onClick={applyCoupon} className="btn btn-outline btn-sm">
                    Apply
                  </button>
                </div>
              )}
              {couponErr && <p className="mt-1.5 text-xs text-rose">{couponErr}</p>}
            </div>

            <dl className="mt-5 space-y-2 text-[15px]">
              <Row label="Subtotal" value={formatINR(totals.subtotal)} />
              {totals.discount > 0 && <Row label="Discount" value={`−${formatINR(totals.discount)}`} accent />}
              <Row label="Shipping" value={totals.shipping ? formatINR(totals.shipping) : "Free"} />
              {giftWrap && <Row label="Gift wrap" value={totals.giftWrap ? formatINR(totals.giftWrap) : "Free"} />}
              <div className="flex justify-between border-t border-ink/10 pt-3 text-xl font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(totals.total)}</dd>
              </div>
            </dl>

            {error && <p className="mt-4 rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{error}</p>}
            <button disabled={busy} className="btn btn-wa mt-6 w-full py-4 text-base">
              <WhatsAppIcon className="size-5" /> {busy ? "Placing order…" : "Place order on WhatsApp"}
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0" /> Your order is saved and WhatsApp opens with all details filled in. Just press send — we&apos;ll reply with
              confirmation & payment options (UPI / bank transfer).
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? "text-wa" : ""}`}>
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
