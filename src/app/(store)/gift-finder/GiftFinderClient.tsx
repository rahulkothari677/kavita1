"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, RotateCcw, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { EmptyArt, Eyebrow } from "@/components/brand";
import { FieldError, Spinner } from "@/components/store/pages/ui";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

const RECIPIENTS = ["Mom / Dad", "Sister / Brother", "Friend", "Couple", "Colleague / Boss", "Teacher", "Myself"];
const OCCASIONS = ["Housewarming", "Diwali / festive", "Wedding", "Birthday", "Anniversary", "Raksha Bandhan", "Thank you", "Just because"];
const BASE_BUDGETS = [1000, 1500, 2000, 3500, 0];
const STEP_LABELS = ["Who", "Occasion", "Budget", "Details"];

type Result = { intro: string; picks: { product: Product; reason: string }[]; personalTouch?: string };

/** Reads homepage deep links: ?q=Housewarming | Diwali | Wedding | under-1500 | "Under 2000". */
function parseQ(raw: string): { occasion: string; budget: number | null } {
  const q = raw.trim().toLowerCase();
  if (!q) return { occasion: "", budget: null };
  const b = q.match(/under[\s_-]*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  if (b) {
    const n = Number(b[1].replace(/,/g, ""));
    return { occasion: "", budget: Number.isFinite(n) && n > 0 ? n : null };
  }
  const occasion = OCCASIONS.find((o) => o.toLowerCase() === q) ?? OCCASIONS.find((o) => o.toLowerCase().split(/[\s/]+/).includes(q)) ?? "";
  return { occasion, budget: null };
}

const budgetLabel = (v: number) => (v ? `Under ${formatINR(v)}` : "No limit");

export function GiftFinderClient({ initialQ = "" }: { initialQ?: string }) {
  const [init] = useState(() => parseQ(initialQ));
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [occasion, setOccasion] = useState(init.occasion);
  const [budget, setBudget] = useState<number | null>(init.budget);
  const [style, setStyle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const budgets = budget && !BASE_BUDGETS.includes(budget) ? [...BASE_BUDGETS.filter(Boolean), budget].sort((a, b) => a - b).concat(0) : BASE_BUDGETS;

  // Move focus to the new question so screen-reader and keyboard users follow along.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const run = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/ai/gift-finder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ occasion, recipient, budget: budget ?? 0, style }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
      setStep(4);
    } catch (e) {
      setErr(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep(0);
    setResult(null);
    setOccasion("");
    setRecipient("");
    setBudget(null);
    setStyle("");
  };

  const answers = [recipient, occasion, budget === null ? "" : budgetLabel(budget)];

  const Options = ({ list, value, onPick }: { list: { v: string; l: string }[]; value: string; onPick: (v: string) => void }) => (
    <div className="mt-8 flex flex-wrap gap-2.5">
      {list.map((o) => {
        const on = value === o.v;
        return (
          <button
            type="button"
            key={o.l}
            aria-pressed={on}
            onClick={() => onPick(o.v)}
            className={`chip min-h-11 ${on ? "" : "chip-outline"}`}
            style={{ fontSize: 15, paddingInline: 18 }}
          >
            {on && <Check aria-hidden className="size-4" strokeWidth={2} />}
            {o.l}
          </button>
        );
      })}
    </div>
  );

  const prompt = (text: React.ReactNode) => (
    <h2 ref={headingRef} tabIndex={-1} className="font-display text-[28px] leading-tight font-[380] tracking-[-0.01em] outline-none">
      {text}
    </h2>
  );

  return (
    <div className="container-x pt-10 pb-16 lg:pt-16 lg:pb-24">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <header className="lg:col-span-4">
          <Eyebrow>Gift finder</Eyebrow>
          <h1 className="t-h1 mt-4 max-w-[12ch]">
            A handmade <em>gift</em>, found
          </h1>
          <p className="mt-4 flex max-w-[40ch] items-start gap-2 text-[15px] text-muted">
            <Sparkles aria-hidden className="mt-1 size-3.5 shrink-0 text-accent" strokeWidth={1.75} />
            Answer three quick questions and we’ll suggest pieces from the studio, with a reason for each.
          </p>
        </header>

        <div className="lg:col-span-7 lg:col-start-6">
          {step < 4 && (
            <>
              {/* Step progress line */}
              <nav aria-label="Gift finder steps">
                <ol className="grid grid-cols-4 gap-2">
                  {STEP_LABELS.map((l, i) => (
                    <li key={l} aria-current={i === step ? "step" : undefined}>
                      <button
                        type="button"
                        onClick={() => i < step && setStep(i)}
                        disabled={i >= step}
                        className="block w-full min-h-11 text-left disabled:cursor-default"
                      >
                        <span className={`block truncate text-[11px] font-semibold tracking-[0.1em] uppercase ${i <= step ? "text-ink" : "text-muted"}`}>{l}</span>
                        <span className="mt-1 block truncate text-[13px] text-muted">{answers[i] || " "}</span>
                        <span aria-hidden className={`mt-2 block h-0.5 transition-colors duration-200 ${i <= step ? "bg-ink" : "bg-line"}`} />
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              <div key={step} className="mt-10 animate-fade-up">
                {step === 0 && (
                  <section>
                    {prompt(
                      <>
                        Who are you <em>gifting</em>?
                      </>,
                    )}
                    <Options list={RECIPIENTS.map((v) => ({ v, l: v }))} value={recipient} onPick={(v) => (setRecipient(v), setStep(1))} />
                  </section>
                )}
                {step === 1 && (
                  <section>
                    {prompt("What’s the occasion?")}
                    <Options list={OCCASIONS.map((v) => ({ v, l: v }))} value={occasion} onPick={(v) => (setOccasion(v), setStep(2))} />
                    {occasion && (
                      <button type="button" onClick={() => setStep(2)} className="btn btn-primary mt-8">
                        Continue with {occasion}
                      </button>
                    )}
                  </section>
                )}
                {step === 2 && (
                  <section>
                    {prompt("What’s your budget?")}
                    <Options
                      list={budgets.map((v) => ({ v: String(v), l: budgetLabel(v) }))}
                      value={budget === null ? "" : String(budget)}
                      onPick={(v) => (setBudget(Number(v)), setStep(3))}
                    />
                    {budget !== null && (
                      <button type="button" onClick={() => setStep(3)} className="btn btn-primary mt-8">
                        Continue
                      </button>
                    )}
                  </section>
                )}
                {step === 3 && (
                  <section>
                    {prompt("Anything else we should know?")}
                    <label htmlFor="gift-style" className="label mt-8">
                      Their taste <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <textarea
                      id="gift-style"
                      rows={3}
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      maxLength={200}
                      className="input"
                      placeholder="e.g. loves blue, minimal style, new flat, very spiritual"
                    />
                    <FieldError>{err}</FieldError>
                    <button type="button" onClick={run} disabled={busy} aria-busy={busy || undefined} className="btn btn-primary btn-lg mt-6 w-full sm:w-auto">
                      {busy ? <Spinner /> : null}
                      {busy ? "Finding pieces…" : "Show my gift ideas"}
                    </button>
                  </section>
                )}
              </div>

              {step > 0 && (
                <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-[14px] text-muted hover:text-ink">
                  <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} /> Back
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {step === 4 && result && (
        <section aria-labelledby="gift-results" className="mt-12 animate-fade-up lg:mt-16">
          <div className="hairline-t pt-6">
            <h2 id="gift-results" ref={headingRef} tabIndex={-1} className="eyebrow outline-none">
              {[recipient, occasion, budget === null ? "" : budgetLabel(budget)].filter(Boolean).join(" · ") || "Your suggestions"}
            </h2>
            {result.intro && <p className="t-quote mt-5 max-w-[34ch]">{result.intro.replace(/\s*[\p{Extended_Pictographic}️]+\s*$/u, "")}</p>}
          </div>

          {result.picks.length === 0 ? (
            <div className="mt-10 flex max-w-md flex-col items-start">
              <EmptyArt kind="mandala" size={56} />
              <p className="font-display mt-6 text-[24px] leading-tight">Nothing quite right in the studio yet</p>
              <p className="mt-2 text-[15px] text-muted">We can make something just for them.</p>
              <Link href="/custom-order" className="btn btn-primary mt-6">
                Commission a piece
              </Link>
            </div>
          ) : (
            <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-10">
              {result.picks.map(({ product: p, reason }) => (
                <li key={p.id}>
                  <ProductCard p={p} />
                  {reason && (
                    <p className="mt-3 border-t border-line pt-3 text-[14px] leading-relaxed text-ink-2">
                      <span className="sr-only">Why: </span>
                      {reason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {result.personalTouch && (
            <aside className="mt-12 max-w-2xl rounded-img border border-line p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <Sparkles aria-hidden className="size-3.5 text-accent" strokeWidth={1.75} /> A personal touch
              </p>
              <p className="mt-2 text-[15px] text-ink-2">{result.personalTouch}</p>
            </aside>
          )}

          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <button type="button" onClick={reset} className="btn btn-outline">
              <RotateCcw aria-hidden className="size-4" strokeWidth={1.75} /> Start over
            </button>
            <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium">
              <span className="link">
                Browse everything <span className="arrow">→</span>
              </span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
