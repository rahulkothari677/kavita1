"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [v, setV] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.trim()) return;
    await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contact: v }) });
    setDone(true);
  };
  if (done) return <p className="rounded-xl bg-on-ink/10 px-4 py-3 text-sm">Thank you! You&apos;re on the list 🌸</p>;
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Email or WhatsApp number"
        className="min-w-0 flex-1 rounded-full border border-on-ink/25 bg-transparent px-4 py-2.5 text-sm text-on-ink placeholder:text-on-ink/50 outline-none focus:border-accent-soft"
      />
      <button className="btn btn-accent btn-sm">Join</button>
    </form>
  );
}
