"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Minus, Plus, Tag } from "lucide-react";
import { useStore, type CartLine } from "@/components/store/StoreProvider";
import { WhatsAppIcon } from "@/components/Motifs";
import { EmptyArt, Eyebrow } from "@/components/brand";
import { FieldError, Spinner, StepBar, SummaryRow } from "@/components/store/pages/ui";
import { calcTotals } from "@/lib/pricing";
import { formatINR, imgUrl } from "@/lib/format";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

type Form = { customerName: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; notes: string };
type FieldKey = "customerName" | "phone" | "email" | "address" | "city" | "state" | "pincode";
const EMPTY: Form = { customerName: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", notes: "" };

/** Keep only the 10-digit national number (strips +91 / 91 / leading 0 from pasted numbers). */
function nationalDigits(raw: string) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

const norm = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
function matchState(name: string) {
  const n = norm(name);
  return STATES.find((s) => norm(s) === n) ?? STATES.find((s) => n && (norm(s).startsWith(n) || n.startsWith(norm(s)))) ?? "";
}

function validate(f: Form): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (!f.customerName.trim()) e.customerName = "Please add your name.";
  if (f.phone.length !== 10) e.phone = "Enter your 10-digit WhatsApp number.";
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "That email doesn’t look right.";
  if (!f.address.trim()) e.address = "Add your house number, street and area.";
  if (!/^\d{6}$/.test(f.pincode)) e.pincode = "Enter a 6-digit pincode.";
  if (!f.city.trim()) e.city = "Add your city.";
  if (!f.state) e.state = "Choose your state.";
  return e;
}

const FIELD_ORDER: FieldKey[] = ["customerName", "phone", "email", "address", "pincode", "city", "state"];

export function CheckoutClient() {
  const { cart, subtotal, updateQty, removeFromCart, clearCart, settings } = useStore();
  const router = useRouter();
  const uid = useId();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponErr, setCouponErr] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [place, setPlace] = useState<string | null>(null);
  const autoFilled = useRef<{ city: string; state: string }>({ city: "", state: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ka_customer");
      if (saved) {
        const s = JSON.parse(saved) as Partial<Form>;
        setForm({ ...EMPTY, ...s, phone: nationalDigits(s.phone ?? ""), pincode: String(s.pincode ?? "").replace(/\D/g, "").slice(0, 6), notes: "" });
      }
    } catch {}
  }, []);

  // Re-validate coupon when cart changes
  useEffect(() => {
    if (!coupon) return;
    fetch("/api/coupon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: coupon.code, subtotal }) })
      .then((r) => r.json())
      .then((d) => (d.error ? (setCoupon(null), setCouponErr(d.error)) : setCoupon({ code: d.code, discount: d.discount })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  // Pincode → city + state (India Post public API). Fails silently; fields stay editable.
  useEffect(() => {
    const pin = form.pincode;
    if (!/^\d{6}$/.test(pin)) {
      setPlace(null);
      return;
    }
    const ctl = new AbortController();
    fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const po = Array.isArray(d) && d[0]?.Status === "Success" ? d[0].PostOffice?.[0] : null;
        if (!po) return;
        const city = String(po.District || po.Block || po.Name || "").trim();
        const state = matchState(String(po.State || ""));
        setForm((f) => {
          const next = { ...f };
          if (city && (!f.city.trim() || f.city === autoFilled.current.city)) next.city = city;
          if (state && (!f.state || f.state === autoFilled.current.state)) next.state = state;
          return next;
        });
        autoFilled.current = { city, state };
        setErrors((e) => ({ ...e, city: city ? undefined : e.city, state: state ? undefined : e.state }));
        setPlace([city, po.State].filter(Boolean).join(", "));
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [form.pincode]);

  const totals = calcTotals({
    subtotal,
    shippingFee: settings.shippingFee,
    freeShippingAbove: settings.freeShippingAbove,
    discount: coupon?.discount,
    giftWrap,
    giftWrapFee: settings.giftWrapFee,
  });
  const itemCount = cart.reduce((n, l) => n + l.quantity, 0);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "phone") v = nationalDigits(v);
    if (k === "pincode") v = v.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, [k]: v }));
    if (k in errors) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const fid = (k: string) => `${uid}-${k}`;
  const a11y = (k: FieldKey, helper?: boolean) => ({
    id: fid(k),
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": [errors[k] ? fid(`${k}-err`) : "", helper ? fid(`${k}-help`) : ""].filter(Boolean).join(" ") || undefined,
  });

  const applyCoupon = async () => {
    setCouponErr("");
    if (!couponInput.trim()) return setCouponErr("Enter an offer code first.");
    setCouponBusy(true);
    try {
      const r = await fetch("/api/coupon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: couponInput, subtotal }) });
      const d = await r.json();
      if (d.error) setCouponErr(d.error);
      else {
        setCoupon({ code: d.code, discount: d.discount });
        setCouponInput("");
      }
    } catch {
      setCouponErr("Couldn’t check that code. Please try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errs = validate(form);
    setErrors(errs);
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) {
      document.getElementById(fid(first))?.focus();
      return;
    }
    setBusy(true);
    // Open a window synchronously so mobile browsers don't block the WhatsApp redirect
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const popup = !isMobile ? window.open("about:blank", "_blank") : null;
    const phone = `+91 ${form.phone}`;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, note: l.note })),
          couponCode: coupon?.code,
          giftWrap,
          giftMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");
      try {
        localStorage.setItem("ka_customer", JSON.stringify({ ...form, notes: "" }));
      } catch {}
      clearCart();
      if (popup) popup.location.href = data.waUrl;
      router.push(`/order/${data.orderNumber}?placed=1${popup ? "" : "&wa=1"}&p=${encodeURIComponent(form.phone)}`);
    } catch (err) {
      popup?.close();
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  if (cart.length === 0 && !busy) {
    return (
      <div className="container-x section-y">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <EmptyArt kind="bag" size={56} />
          <h1 className="font-display mt-6 text-[24px] leading-tight">Your bag is waiting for its first piece</h1>
          <p className="mt-2 text-[15px] text-muted">Add something handmade, then come back here to send your order on WhatsApp.</p>
          <Link href="/shop" className="btn btn-primary mt-8 max-[400px]:w-full">
            Explore the collection
          </Link>
        </div>
      </div>
    );
  }

  const submitBlock = (className: string) => (
    <div className={className}>
      {!settings.acceptingOrders && settings.vacationMessage ? (
        <p className="mb-4 flex items-start gap-2 text-[13px] text-ink-2">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
          {settings.vacationMessage}
        </p>
      ) : null}
      {error ? (
        <div className="mb-4">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}
      <button type="submit" disabled={busy} aria-busy={busy || undefined} className="btn btn-wa btn-lg w-full">
        {busy ? <Spinner /> : <WhatsAppIcon className="size-5" />}
        {busy ? "Saving your order…" : "Send order on WhatsApp"}
      </button>
      <p className="mt-3 text-center text-[13px] text-muted">We will confirm on WhatsApp. No payment taken yet.</p>
    </div>
  );

  return (
    <div className="container-x pt-8 pb-16 lg:pt-12 lg:pb-24">
      <div className="mx-auto max-w-[560px] lg:mx-0 lg:max-w-none">
        <StepBar steps={["Bag", "Details", "Confirm on WhatsApp"]} current={1} label="Checkout steps" />
        <header className="mt-8 lg:mt-10">
          <Eyebrow>Checkout</Eyebrow>
          <h1 className="t-h1 mt-4">
            Almost <em>yours</em>
          </h1>
          <p className="mt-3 flex items-start gap-2 text-[15px] text-muted">
            <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-wa" />
            No account and no online payment. Your order opens in WhatsApp, ready to send.
          </p>
        </header>
      </div>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-6">
        {/* ── Order summary: collapsible on mobile (top), sticky column on desktop ── */}
        <aside aria-label="Order summary" className="mx-auto w-full max-w-[560px] lg:order-2 lg:col-span-5 lg:col-start-8 lg:mx-0 lg:max-w-none">
          <div className="rounded-[2px] bg-plinth lg:sticky lg:top-[96px]">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-expanded={summaryOpen}
              aria-controls={fid("summary")}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left lg:hidden"
            >
              <span className="text-[15px] font-medium">
                {summaryOpen ? "Hide" : "Show"} order summary <span className="text-muted">· {itemCount} {itemCount === 1 ? "piece" : "pieces"}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular text-[16px] font-semibold">{formatINR(totals.total)}</span>
                <ChevronDown aria-hidden className={`size-4 transition-transform duration-200 ${summaryOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
              </span>
            </button>
            <div id={fid("summary")} className={`${summaryOpen ? "block" : "hidden"} border-t border-line px-4 pb-5 lg:block lg:border-t-0 lg:p-6`}>
              <h2 className="font-display hidden text-[24px] leading-tight lg:block">Order summary</h2>
              <ul className="divide-y divide-line lg:mt-4">
                {cart.map((l) => (
                  <SummaryLine key={l.productId} line={l} onQty={(q) => updateQty(l.productId, q)} onRemove={() => removeFromCart(l.productId)} />
                ))}
              </ul>

              <div className="border-t border-line pt-4">
                {coupon ? (
                  <div className="flex min-h-11 items-center justify-between gap-3 text-[14px]">
                    <span className="flex items-center gap-2 text-success">
                      <Tag aria-hidden className="size-4" strokeWidth={1.75} />
                      <span>
                        <span className="font-semibold">{coupon.code}</span> applied
                      </span>
                    </span>
                    <button type="button" onClick={() => setCoupon(null)} className="link min-h-11 text-[14px] text-muted">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor={fid("coupon")} className="label">
                      Offer code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={fid("coupon")}
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponErr("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        aria-invalid={couponErr ? true : undefined}
                        aria-describedby={couponErr ? fid("coupon-err") : undefined}
                        autoComplete="off"
                        className="input min-w-0 flex-1 uppercase"
                      />
                      <button type="button" onClick={applyCoupon} disabled={couponBusy} className="btn btn-outline shrink-0 px-5">
                        {couponBusy ? <Spinner /> : "Apply"}
                      </button>
                    </div>
                    <FieldError id={fid("coupon-err")}>{couponErr}</FieldError>
                  </div>
                )}
              </div>

              <dl className="mt-5 space-y-2.5">
                <SummaryRow label="Subtotal" value={formatINR(totals.subtotal)} />
                {totals.discount > 0 && <SummaryRow label="Discount" value={`−${formatINR(totals.discount)}`} tone="success" />}
                <SummaryRow label="Shipping" value={totals.shipping ? formatINR(totals.shipping) : "Free"} />
                {giftWrap && <SummaryRow label="Gift wrap" value={totals.giftWrap ? formatINR(totals.giftWrap) : "Free"} />}
                <div className="border-t border-line pt-3">
                  <SummaryRow label="Total" value={formatINR(totals.total)} strong />
                </div>
              </dl>
              {totals.shipping > 0 && settings.freeShippingAbove > 0 ? (
                <p className="mt-2 text-[13px] text-muted">
                  Free shipping on orders over <span className="tabular">{formatINR(settings.freeShippingAbove)}</span>.
                </p>
              ) : null}
              {settings.codAvailable ? <p className="mt-2 text-[13px] text-muted">Cash on delivery available. Choose it when we confirm on WhatsApp.</p> : null}

              {submitBlock("mt-6 hidden lg:block")}
            </div>
          </div>
        </aside>

        {/* ── Details ── */}
        <div className="mx-auto w-full max-w-[560px] space-y-10 lg:order-1 lg:col-span-7 lg:mx-0 lg:max-w-[640px]">
          <fieldset className="space-y-5">
            <legend className="font-display mb-5 text-[24px] leading-tight">Your details</legend>
            <div>
              <label htmlFor={fid("customerName")} className="label">
                Full name
              </label>
              <input value={form.customerName} onChange={set("customerName")} className="input" autoComplete="name" {...a11y("customerName")} />
              <FieldError id={fid("customerName-err")}>{errors.customerName}</FieldError>
            </div>
            <div>
              <label htmlFor={fid("phone")} className="label">
                WhatsApp number
              </label>
              <div className={`input flex !p-0 ${errors.phone ? "!border-danger" : ""}`}>
                <span aria-hidden className="tabular flex shrink-0 items-center rounded-l-[3px] border-r border-line-strong bg-plinth px-3.5 text-[16px] text-ink-2">
                  +91
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  inputMode="tel"
                  autoComplete="tel-national"
                  maxLength={14}
                  placeholder="98765 43210"
                  className="tabular min-w-0 flex-1 bg-transparent px-3.5 text-[16px] outline-none placeholder:text-muted focus-visible:outline-none"
                  {...a11y("phone", true)}
                />
              </div>
              <FieldError id={fid("phone-err")}>{errors.phone}</FieldError>
              <p id={fid("phone-help")} className="helper">
                Indian number (+91). We send your order confirmation here.
              </p>
            </div>
            <div>
              <label htmlFor={fid("email")} className="label">
                Email <span className="font-normal text-muted">(optional)</span>
              </label>
              <input type="email" value={form.email} onChange={set("email")} className="input" autoComplete="email" inputMode="email" {...a11y("email")} />
              <FieldError id={fid("email-err")}>{errors.email}</FieldError>
            </div>
          </fieldset>

          <fieldset className="space-y-5 border-t border-line pt-8">
            <legend className="sr-only">Delivery address</legend>
            <p aria-hidden className="font-display text-[24px] leading-tight">
              Delivery address
            </p>
            <div>
              <label htmlFor={fid("address")} className="label">
                House no, street, area
              </label>
              <textarea rows={2} value={form.address} onChange={set("address")} className="input" autoComplete="street-address" {...a11y("address")} />
              <FieldError id={fid("address-err")}>{errors.address}</FieldError>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
              <div>
                <label htmlFor={fid("pincode")} className="label">
                  Pincode
                </label>
                <input
                  value={form.pincode}
                  onChange={set("pincode")}
                  className="input tabular"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  {...a11y("pincode", true)}
                />
                <FieldError id={fid("pincode-err")}>{errors.pincode}</FieldError>
                <p id={fid("pincode-help")} aria-live="polite" className={`mt-1.5 flex items-start gap-1 text-[13px] ${place ? "text-success" : "text-muted"}`}>
                  {place ? (
                    <>
                      <Check aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
                      {place}
                    </>
                  ) : (
                    "Fills city and state"
                  )}
                </p>
              </div>
              <div>
                <label htmlFor={fid("city")} className="label">
                  City
                </label>
                <input value={form.city} onChange={set("city")} className="input" autoComplete="address-level2" {...a11y("city")} />
                <FieldError id={fid("city-err")}>{errors.city}</FieldError>
              </div>
              <div>
                <label htmlFor={fid("state")} className="label">
                  State
                </label>
                <select value={form.state} onChange={set("state")} className="input" autoComplete="address-level1" {...a11y("state")}>
                  <option value="">Select</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <FieldError id={fid("state-err")}>{errors.state}</FieldError>
              </div>
            </div>
            <div>
              <label htmlFor={fid("notes")} className="label">
                Order notes <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id={fid("notes")}
                rows={2}
                value={form.notes}
                onChange={set("notes")}
                className="input"
                placeholder="Delivery instructions, occasion date, anything else"
              />
            </div>
          </fieldset>

          {settings.giftWrapFee >= 0 && (
            <fieldset className="border-t border-line pt-8">
              <legend className="sr-only">Gift options</legend>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="mt-1 size-5 shrink-0" />
                <span>
                  <span className="block text-[16px] font-semibold">Make it a gift</span>
                  <span className="mt-0.5 block text-[14px] text-muted">
                    Hand-tied wrap and a handwritten card ·{" "}
                    <span className="tabular">{settings.giftWrapFee > 0 ? formatINR(settings.giftWrapFee) : "free"}</span>
                  </span>
                </span>
              </label>
              {giftWrap && (
                <div className="mt-4 animate-fade-up pl-8">
                  <label htmlFor={fid("gift")} className="label">
                    Card message
                  </label>
                  <textarea
                    id={fid("gift")}
                    rows={3}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    maxLength={240}
                    aria-describedby={fid("gift-help")}
                    className="input"
                    placeholder="We’ll write it by hand"
                  />
                  <p id={fid("gift-help")} className="helper tabular text-right">
                    {giftMessage.length}/240
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {submitBlock("border-t border-line pt-8 lg:hidden")}
        </div>
      </form>
    </div>
  );
}

function SummaryLine({ line: l, onQty, onRemove }: { line: CartLine; onQty: (q: number) => void; onRemove: () => void }) {
  const max = l.maxQty ?? 50;
  return (
    <li className="flex gap-3 py-4">
      <Link href={`/product/${l.slug}`} className="img-well block h-[70px] w-14 shrink-0" tabIndex={-1} aria-hidden>
        <img src={imgUrl(l.image, 160)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${l.slug}`} className="font-display line-clamp-2 text-[17px] leading-snug">
            {l.name}
          </Link>
          <span className="tabular shrink-0 text-[15px] font-medium">{formatINR(l.price * l.quantity)}</span>
        </div>
        {l.note && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">Note: {l.note}</p>}
        <div className="-ml-1.5 mt-1 flex items-center">
          <button type="button" onClick={() => onQty(l.quantity - 1)} disabled={l.quantity <= 1} aria-label={`Decrease quantity of ${l.name}`} className="group grid size-11 place-items-center disabled:opacity-40">
            <span className="grid size-8 place-items-center rounded-[4px] border border-line-strong bg-surface group-hover:border-ink">
              <Minus aria-hidden className="size-3.5" strokeWidth={1.75} />
            </span>
          </button>
          <span className="tabular w-6 text-center text-[15px] font-medium">
            {l.quantity}
          </span>
          <button type="button" onClick={() => onQty(l.quantity + 1)} disabled={l.quantity >= max} aria-label={`Increase quantity of ${l.name}`} className="group grid size-11 place-items-center disabled:opacity-40">
            <span className="grid size-8 place-items-center rounded-[4px] border border-line-strong bg-surface group-hover:border-ink">
              <Plus aria-hidden className="size-3.5" strokeWidth={1.75} />
            </span>
          </button>
          <button type="button" onClick={onRemove} className="ml-auto min-h-11 px-1 text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
