"use client";

import { useId, useState } from "react";
import { AlertCircle, Star } from "lucide-react";

const RATING_WORDS = ["", "Not for me", "It’s okay", "Good", "Lovely", "Love it"];

export function ReviewForm({ productId, orderNumber }: { productId?: string; orderNumber?: string }) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [open, setOpen] = useState(Boolean(orderNumber));
  const id = useId();

  if (state === "done")
    return (
      <div role="status" className="rounded-[4px] bg-plinth px-5 py-4">
        <p className="font-display text-[22px] leading-tight">
          Thank you<span className="bindi" aria-hidden />
        </p>
        <p className="mt-1 text-[15px] text-ink-2">Your review will appear here once it’s approved.</p>
      </div>
    );
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline">
        Write a review
      </button>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, orderNumber, rating, name, city, comment }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[2px] border border-line bg-surface p-5 sm:p-6">
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="-ml-2.5 flex items-center" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="grid size-11 place-items-center rounded-full transition-transform active:scale-[0.92]"
            >
              <Star strokeWidth={1.5} className={`size-6 ${n <= rating ? "fill-ink text-ink" : "text-line-strong"}`} />
            </button>
          ))}
          <span className="ml-2 text-[14px] text-muted">{RATING_WORDS[rating]}</span>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="label">
            Your name
          </label>
          <input id={`${id}-name`} required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="input" />
        </div>
        <div>
          <label htmlFor={`${id}-city`} className="label">
            City <span className="font-normal text-muted">· optional</span>
          </label>
          <input id={`${id}-city`} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-comment`} className="label">
          Your review
        </label>
        <textarea
          id={`${id}-comment`}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="How does the piece look in your home?"
          className="input"
        />
      </div>
      {state === "error" && (
        <p role="alert" className="flex items-center gap-1.5 text-[13px] text-danger">
          <AlertCircle className="size-4" strokeWidth={1.75} /> We couldn’t send that. Please try again.
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={state === "busy"}>
        {state === "busy" ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
