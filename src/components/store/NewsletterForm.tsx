"use client";

import { useId, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

/**
 * Inline sign-up for the kajal footer: transparent field on a 1px hairline with an
 * arrow button. Accepts an email or a WhatsApp number (the API stores either).
 */
export function NewsletterForm() {
  const id = useId();
  const [v, setV] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contact = v.trim();
    if (contact.length < 5) {
      setState("error");
      setError("Please enter your email or WhatsApp number.");
      return;
    }
    setState("busy");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contact }) });
      if (!res.ok) {
        const d = res.status < 500 ? await res.json().catch(() => ({})) : {};
        throw new Error(d.error || "That didn’t go through. Please try again.");
      }
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "That didn’t go through. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="flex min-h-[52px] items-center gap-2 border-b border-line-on-dark text-[16px] text-on-dark">
        <Check aria-hidden className="size-4 text-accent-on-dark" strokeWidth={2} /> Thank you. The next letter is yours.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-center gap-2 border-b border-line-on-dark transition-colors focus-within:border-accent-on-dark">
        <label htmlFor={`${id}-contact`} className="sr-only">
          Email or WhatsApp number
        </label>
        <input
          id={`${id}-contact`}
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            if (state === "error") setState("idle");
          }}
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder="Your email or WhatsApp number"
          aria-invalid={state === "error" || undefined}
          aria-describedby={state === "error" ? `${id}-err` : undefined}
          className="h-[52px] min-w-0 flex-1 bg-transparent text-[16px] text-on-dark outline-none placeholder:text-muted-on-dark"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          aria-label="Subscribe"
          className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-on-dark transition-colors hover:bg-ink-deep-raised disabled:opacity-60"
        >
          <ArrowRight className={`size-5 ${state === "busy" ? "animate-pulse" : ""}`} strokeWidth={1.5} />
        </button>
      </div>
      {state === "error" && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-[13px] text-accent-on-dark">
          {error}
        </p>
      )}
    </form>
  );
}
