"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { formatINR, imgUrl } from "@/lib/format";
import type { Product } from "@/lib/types";

const OCCASIONS = ["Housewarming", "Diwali / festive", "Wedding", "Birthday", "Anniversary", "Raksha Bandhan", "Thank you", "Just because"];
const RECIPIENTS = ["Mom / Dad", "Sister / Brother", "Friend", "Couple", "Colleague / Boss", "Teacher", "Myself 💛"];
const BUDGETS = [
  { v: 1000, l: "Under ₹1,000" },
  { v: 2000, l: "Under ₹2,000" },
  { v: 3500, l: "Under ₹3,500" },
  { v: 0, l: "No limit" },
];

type Result = { intro: string; picks: { product: Product; reason: string }[]; personalTouch?: string };

export function GiftFinderClient() {
  const { addToCart } = useStore();
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState("");
  const [recipient, setRecipient] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [style, setStyle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState("");

  const run = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/ai/gift-finder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ occasion, recipient, budget, style }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
      setStep(4);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
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

  const Options = ({ list, value, onPick }: { list: string[]; value: string; onPick: (v: string) => void }) => (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {list.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={`rounded-2xl border px-4 py-4 text-left text-[15px] transition hover:-translate-y-0.5 hover:shadow-md ${value === o ? "border-ink bg-ink text-on-ink" : "border-ink/12 bg-white"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-tint px-4 py-1.5 text-[12px] tracking-[0.25em] text-accent uppercase">
          <Sparkles className="size-3.5" /> AI Gift Finder
        </p>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">The perfect handmade gift</h1>
        {step < 4 && <p className="mt-3 text-muted">Three quick questions. Our AI picks from pieces we&apos;ve made by hand.</p>}
      </div>

      {step < 4 && (
        <div className="mx-auto mt-10 flex max-w-xs gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-ink/10"}`} />
          ))}
        </div>
      )}

      <div className="mt-10">
        {step === 0 && (
          <section className="animate-fade-up">
            <h2 className="text-center font-display text-3xl">What&apos;s the occasion?</h2>
            <Options list={OCCASIONS} value={occasion} onPick={(v) => (setOccasion(v), setStep(1))} />
          </section>
        )}
        {step === 1 && (
          <section className="animate-fade-up">
            <h2 className="text-center font-display text-3xl">Who is it for?</h2>
            <Options list={RECIPIENTS} value={recipient} onPick={(v) => (setRecipient(v), setStep(2))} />
          </section>
        )}
        {step === 2 && (
          <section className="animate-fade-up">
            <h2 className="text-center font-display text-3xl">What&apos;s your budget?</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BUDGETS.map((b) => (
                <button
                  key={b.l}
                  onClick={() => (setBudget(b.v), setStep(3))}
                  className={`rounded-2xl border px-4 py-5 text-[15px] transition hover:-translate-y-0.5 hover:shadow-md ${budget === b.v ? "border-ink bg-ink text-on-ink" : "border-ink/12 bg-white"}`}
                >
                  {b.l}
                </button>
              ))}
            </div>
          </section>
        )}
        {step === 3 && (
          <section className="mx-auto max-w-xl animate-fade-up">
            <h2 className="text-center font-display text-3xl">Anything else we should know?</h2>
            <textarea
              rows={3}
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="input mt-8"
              placeholder="Optional — e.g. she loves blue, minimal style, new flat, very spiritual…"
            />
            {err && <p className="mt-3 text-sm text-danger">{err}</p>}
            <button onClick={run} disabled={busy} className="btn btn-primary mt-5 w-full py-4 text-base">
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />} {busy ? "Finding the perfect piece…" : "Show my gift ideas"}
            </button>
          </section>
        )}
        {step > 0 && step < 4 && (
          <button onClick={() => setStep((s) => s - 1)} className="mx-auto mt-8 flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Back
          </button>
        )}

        {step === 4 && result && (
          <section className="animate-fade-up">
            <p className="mx-auto max-w-2xl text-center font-display text-2xl text-ink/80">{result.intro}</p>
            {result.picks.length === 0 ? (
              <p className="mt-10 text-center text-muted">
                We couldn&apos;t find a perfect match — <Link href="/custom-order" className="underline">let us make one for you</Link>!
              </p>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {result.picks.map(({ product: p, reason }) => (
                  <div key={p.id} className="card overflow-hidden">
                    <Link href={`/product/${p.slug}`}>
                      <img src={imgUrl(p.images[0], 600)} alt={p.name} className="aspect-square w-full object-cover" />
                    </Link>
                    <div className="p-5">
                      <Link href={`/product/${p.slug}`} className="font-display text-xl font-semibold">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 font-medium">{formatINR(p.price)}</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{reason}</p>
                      <button
                        onClick={() => addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, price: p.price })}
                        className="btn btn-primary btn-sm mt-4 w-full"
                      >
                        Add to bag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {result.personalTouch && (
              <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-tint p-5 text-center">
                <p className="text-xs tracking-[0.25em] text-accent uppercase">A personal touch</p>
                <p className="mt-2">{result.personalTouch}</p>
              </div>
            )}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button onClick={reset} className="btn btn-outline">
                <RotateCcw className="size-4" /> Start over
              </button>
              <Link href="/shop" className="btn btn-primary">
                Browse everything <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
