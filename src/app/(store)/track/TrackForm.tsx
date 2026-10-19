"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { FieldError, Spinner } from "@/components/store/pages/ui";

function nationalDigits(raw: string) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

export function TrackForm({ initialOrder }: { initialOrder: string }) {
  const id = useId();
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ order?: string; phone?: string }>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setPhone(nationalDigits(JSON.parse(localStorage.getItem("ka_customer") ?? "{}").phone ?? ""));
    } catch {}
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const next = {
      order: order.trim() ? undefined : "Enter your order number.",
      phone: phone.length === 10 ? undefined : "Enter the 10-digit WhatsApp number you ordered with.",
    };
    setErrors(next);
    if (next.order) return document.getElementById(`${id}-order`)?.focus();
    if (next.phone) return document.getElementById(`${id}-phone`)?.focus();
    setBusy(true);
    try {
      const r = await fetch(`/api/orders/track?order=${encodeURIComponent(order.trim())}&phone=${encodeURIComponent(phone)}`);
      if (r.ok) {
        router.push(`/order/${encodeURIComponent(order.trim().toUpperCase())}?p=${encodeURIComponent(phone)}`);
        return;
      }
      setErr(r.status === 429 ? "Too many attempts. Please wait a little, or message us on WhatsApp." : "We couldn’t find that order. Check both details, or message us on WhatsApp.");
    } catch {
      setErr("Couldn’t reach the studio just now. Please try again.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-img border border-line bg-surface p-5 sm:p-8">
      <div>
        <label htmlFor={`${id}-order`} className="label">
          Order number
        </label>
        <input
          id={`${id}-order`}
          value={order}
          onChange={(e) => {
            setOrder(e.target.value.toUpperCase());
            setErrors((x) => ({ ...x, order: undefined }));
          }}
          placeholder="KA-251019-1234"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={errors.order ? true : undefined}
          aria-describedby={errors.order ? `${id}-order-err` : undefined}
          className="input tabular uppercase"
        />
        <FieldError id={`${id}-order-err`}>{errors.order}</FieldError>
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className="label">
          WhatsApp number
        </label>
        <div className={`input flex !p-0 ${errors.phone ? "!border-danger" : ""}`}>
          <span aria-hidden className="tabular flex shrink-0 items-center rounded-l-[3px] border-r border-line-strong bg-plinth px-3.5 text-ink-2">
            +91
          </span>
          <input
            id={`${id}-phone`}
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(nationalDigits(e.target.value));
              setErrors((x) => ({ ...x, phone: undefined }));
            }}
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={14}
            placeholder="98765 43210"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${id}-phone-err` : undefined}
            className="tabular min-w-0 flex-1 bg-transparent px-3.5 outline-none placeholder:text-muted focus-visible:outline-none"
          />
        </div>
        <FieldError id={`${id}-phone-err`}>{errors.phone}</FieldError>
      </div>
      <FieldError>{err}</FieldError>
      <button disabled={busy} aria-busy={busy || undefined} className="btn btn-primary btn-lg w-full">
        {busy ? <Spinner /> : null}
        {busy ? "Finding your order…" : "Track order"}
      </button>
    </form>
  );
}
