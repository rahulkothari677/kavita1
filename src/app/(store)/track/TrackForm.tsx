"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function TrackForm({ initialOrder }: { initialOrder: string }) {
  const [order, setOrder] = useState(initialOrder);
  const [phone, setPhone] = useState("");
  useEffect(() => {
    try {
      setPhone(JSON.parse(localStorage.getItem("ka_customer") ?? "{}").phone ?? "");
    } catch {}
  }, []);
  const [err, setErr] = useState("");
  const router = useRouter();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await fetch(`/api/orders/track?order=${encodeURIComponent(order)}&phone=${encodeURIComponent(phone)}`);
    if (r.ok) router.push(`/order/${encodeURIComponent(order.trim().toUpperCase())}?p=${encodeURIComponent(phone)}`);
    else setErr("We couldn't find that order. Please check the details or message us on WhatsApp.");
  };
  return (
    <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
      <div>
        <label className="label">Order number</label>
        <input required value={order} onChange={(e) => setOrder(e.target.value)} placeholder="KA-251019-1234" className="input uppercase" />
      </div>
      <div>
        <label className="label">WhatsApp number</label>
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="input" />
      </div>
      {err && <p className="text-sm text-rose">{err}</p>}
      <button className="btn btn-primary w-full">Track order</button>
    </form>
  );
}
