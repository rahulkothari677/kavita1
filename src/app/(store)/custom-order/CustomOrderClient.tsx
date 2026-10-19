"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/Motifs";
import { useStore } from "@/components/store/StoreProvider";

const TYPES = ["Name plate", "Wall art / Lippan", "Wedding / return gifts", "Festive decor", "Corporate gifts", "Painting / portrait", "Something else"];

type Concept = { title: string; concept: string; palette: string[]; size: string; elements: string[] };

export function CustomOrderClient() {
  const { settings } = useStore();
  const [f, setF] = useState({ name: "", phone: "", email: "", type: TYPES[0], description: "", size: "", colors: "", budget: "", deadline: "" });
  const [concept, setConcept] = useState<Concept | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const shape = async () => {
    if (f.description.trim().length < 8) return setAiErr("Describe your idea in a few words first.");
    setAiErr("");
    setAiBusy(true);
    try {
      const r = await fetch("/api/ai/custom-concept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setConcept(d);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Couldn't generate ideas right now.");
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const aiConcept = concept ? `${concept.title}: ${concept.concept}\nPalette: ${concept.palette.join(", ")}\nSize: ${concept.size}\nElements: ${concept.elements.join(", ")}` : "";
    const r = await fetch("/api/custom-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, aiConcept }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error || "Something went wrong");
    setDone(d.waUrl);
    window.open(d.waUrl, "_blank");
  };

  if (done)
    return (
      <div className="card mx-auto mt-14 max-w-xl p-10 text-center">
        <p className="font-display text-4xl">Thank you! 🎨</p>
        <p className="mt-3 text-muted">Your idea is saved. Send the WhatsApp message (and any reference photos) and we&apos;ll get back with a design & quote.</p>
        <a href={done} target="_blank" rel="noreferrer" className="btn btn-wa mt-6">
          <WhatsAppIcon className="size-5" /> Open WhatsApp
        </a>
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="card space-y-5 p-6 md:p-8">
        <h2 className="font-display text-3xl">Tell us your idea</h2>
        <div>
          <label className="label">What would you like?</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button type="button" key={t} onClick={() => setF((x) => ({ ...x, type: t }))} className={`rounded-full border px-3.5 py-1.5 text-sm ${f.type === t ? "border-ink bg-ink text-cream" : "border-ink/15"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Describe your idea *</label>
          <textarea required rows={5} value={f.description} onChange={set("description")} className="input" placeholder="e.g. A round lippan name plate for our new home 'Shanti Kunj', blue and white to match our door, with a small Ganesha on top…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Size (if known)</label>
            <input value={f.size} onChange={set("size")} className="input" placeholder="e.g. 12 inch round" />
          </div>
          <div>
            <label className="label">Colours</label>
            <input value={f.colors} onChange={set("colors")} className="input" placeholder="e.g. navy, white, gold" />
          </div>
          <div>
            <label className="label">Budget</label>
            <select value={f.budget} onChange={set("budget")} className="input">
              <option value="">Flexible</option>
              <option>Under ₹1,000</option>
              <option>₹1,000 – ₹2,500</option>
              <option>₹2,500 – ₹5,000</option>
              <option>₹5,000+</option>
            </select>
          </div>
          <div>
            <label className="label">Needed by</label>
            <input type="date" value={f.deadline} onChange={set("deadline")} className="input" />
          </div>
        </div>
        <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
          <div>
            <label className="label">Your name *</label>
            <input required value={f.name} onChange={set("name")} className="input" />
          </div>
          <div>
            <label className="label">WhatsApp number *</label>
            <input required value={f.phone} onChange={set("phone")} className="input" inputMode="tel" />
          </div>
        </div>
        {err && <p className="text-sm text-rose">{err}</p>}
        <button disabled={busy} className="btn btn-wa w-full py-4 text-base">
          <WhatsAppIcon className="size-5" /> {busy ? "Sending…" : "Send request on WhatsApp"}
        </button>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[1.75rem] border border-gold/30 bg-gradient-to-br from-cream to-cream-2 p-6 md:p-8">
          <p className="flex items-center gap-2 text-[12px] tracking-[0.3em] text-gold uppercase">
            <Sparkles className="size-4" /> AI design helper
          </p>
          <h3 className="mt-2 font-display text-3xl">Shape your idea</h3>
          <p className="mt-2 text-sm text-muted">Not sure how to describe it? Write a rough idea and let AI turn it into a clear design brief — colours, size and details.</p>
          {settings.aiAvailable ? (
            <button type="button" onClick={shape} disabled={aiBusy} className="btn btn-primary mt-5 w-full">
              {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} {aiBusy ? "Imagining…" : concept ? "Try another idea" : "Create my design brief"}
            </button>
          ) : (
            <p className="mt-5 rounded-xl bg-white/60 p-3 text-sm text-muted">Just describe your idea — we&apos;ll help shape it on WhatsApp.</p>
          )}
          {aiErr && <p className="mt-3 text-sm text-rose">{aiErr}</p>}
          {concept && (
            <div className="mt-6 animate-fade-up rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-display text-2xl font-semibold">{concept.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{concept.concept}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {concept.palette.map((c) => (
                  <span key={c} className="rounded-full bg-cream px-2.5 py-1 text-xs">{c}</span>
                ))}
              </div>
              <p className="mt-3 text-sm"><b>Suggested size:</b> {concept.size}</p>
              <ul className="mt-2 list-inside list-disc text-sm text-ink/80">
                {concept.elements.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">This brief will be attached to your request.</p>
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
