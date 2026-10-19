"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function ReviewForm({ productId, orderNumber }: { productId?: string; orderNumber?: string }) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [open, setOpen] = useState(Boolean(orderNumber));

  if (state === "done") return <p className="rounded-2xl bg-tint p-5 text-center">Thank you so much! 💛 Your review will appear once approved.</p>;
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn btn-outline">
        Write a review
      </button>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, orderNumber, rating, name, city, comment }),
    });
    setState(res.ok ? "done" : "error");
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={`size-6 ${n <= rating ? "fill-accent text-accent" : "text-ink/20"}`} />
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (optional)" className="input" />
      </div>
      <textarea required value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="How do you like your piece?" className="input" />
      {state === "error" && <p className="text-sm text-danger">Could not submit. Please try again.</p>}
      <button className="btn btn-primary" disabled={state === "busy"}>
        {state === "busy" ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
