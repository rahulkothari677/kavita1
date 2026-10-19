"use client";

import { useId, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { WhatsAppIcon } from "@/components/Motifs";
import { useStore } from "@/components/store/StoreProvider";
import { FieldError, Spinner } from "@/components/store/pages/ui";

const TYPES = ["Name plate", "Wall art / Lippan", "Wedding / return gifts", "Festive decor", "Corporate gifts", "Painting / portrait", "Something else"];

type Concept = { title: string; concept: string; palette: string[]; size: string; elements: string[] };
type ErrKey = "description" | "name" | "phone";

function nationalDigits(raw: string) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

export function CustomOrderClient() {
  const { settings } = useStore();
  const id = useId();
  const [f, setF] = useState({ name: "", phone: "", email: "", type: TYPES[0], description: "", size: "", colors: "", budget: "", deadline: "" });
  const [errors, setErrors] = useState<Partial<Record<ErrKey, string>>>({});
  const [concept, setConcept] = useState<Concept | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = k === "phone" ? nationalDigits(e.target.value) : e.target.value;
    setF((x) => ({ ...x, [k]: v }));
    if (k in errors) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const fid = (k: string) => `${id}-${k}`;
  const a11y = (k: ErrKey) => ({
    id: fid(k),
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? fid(`${k}-err`) : undefined,
  });

  const shape = async () => {
    if (f.description.trim().length < 8) {
      setAiErr("Describe your idea in a few words first.");
      document.getElementById(fid("description"))?.focus();
      return;
    }
    setAiErr("");
    setAiBusy(true);
    try {
      const r = await fetch("/api/ai/custom-concept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setConcept(d);
    } catch (e) {
      setAiErr(e instanceof Error && e.message ? e.message : "Couldn’t write a brief right now. Your request will still reach us.");
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const next: Partial<Record<ErrKey, string>> = {
      description: f.description.trim() ? undefined : "Tell us a little about the piece.",
      name: f.name.trim() ? undefined : "Please add your name.",
      phone: f.phone.length === 10 ? undefined : "Enter your 10-digit WhatsApp number.",
    };
    setErrors(next);
    const first = (["description", "name", "phone"] as ErrKey[]).find((k) => next[k]);
    if (first) return document.getElementById(fid(first))?.focus();
    setBusy(true);
    const aiConcept = concept ? `${concept.title}: ${concept.concept}\nPalette: ${concept.palette.join(", ")}\nSize: ${concept.size}\nElements: ${concept.elements.join(", ")}` : "";
    try {
      const r = await fetch("/api/custom-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, phone: `+91 ${f.phone}`, aiConcept }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong");
      setDone(d.waUrl);
      window.open(d.waUrl, "_blank");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div role="status" className="mt-10 max-w-xl rounded-[2px] border border-line p-6 sm:p-10">
        <span aria-hidden className="grid size-12 place-items-center rounded-full border border-success text-success">
          <Check className="size-6" strokeWidth={1.5} />
        </span>
        <p className="t-h3 mt-6">
          Your idea is <em>with us</em>
        </p>
        <p className="mt-3 text-[15px] text-ink-2">Send the WhatsApp message, with any reference photos, and we’ll come back with a sketch and a quote.</p>
        <a href={done} target="_blank" rel="noreferrer" className="btn btn-wa btn-lg mt-7 max-[400px]:w-full">
          <WhatsAppIcon className="size-5" /> Open WhatsApp
        </a>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-6">
      <div className="space-y-8 lg:col-span-7">
        <fieldset>
          <legend className="label">What would you like?</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button type="button" key={t} aria-pressed={f.type === t} onClick={() => setF((x) => ({ ...x, type: t }))} className="chip min-h-11">
                {f.type === t && <Check aria-hidden className="size-3.5" strokeWidth={2} />}
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={fid("description")} className="label">
            Describe your idea
          </label>
          <textarea
            rows={5}
            value={f.description}
            onChange={set("description")}
            className="input"
            placeholder="e.g. A round Lippan name plate for our new home ‘Shanti Kunj’, blue and white to match the door, with a small Ganesha on top"
            {...a11y("description")}
          />
          <FieldError id={fid("description-err")}>{errors.description}</FieldError>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor={fid("size")} className="label">
              Size <span className="font-normal text-muted">(if known)</span>
            </label>
            <input id={fid("size")} value={f.size} onChange={set("size")} className="input" placeholder="e.g. 12 inch round" />
          </div>
          <div>
            <label htmlFor={fid("colors")} className="label">
              Colours
            </label>
            <input id={fid("colors")} value={f.colors} onChange={set("colors")} className="input" placeholder="e.g. teal, white, mirror" />
          </div>
          <div>
            <label htmlFor={fid("budget")} className="label">
              Budget
            </label>
            <select id={fid("budget")} value={f.budget} onChange={set("budget")} className="input">
              <option value="">Flexible</option>
              <option>Under ₹1,000</option>
              <option>₹1,000 – ₹2,500</option>
              <option>₹2,500 – ₹5,000</option>
              <option>₹5,000+</option>
            </select>
          </div>
          <div>
            <label htmlFor={fid("deadline")} className="label">
              Needed by
            </label>
            <input id={fid("deadline")} type="date" value={f.deadline} onChange={set("deadline")} className="input" />
          </div>
        </div>

        <fieldset className="grid gap-5 border-t border-line pt-8 sm:grid-cols-2 sm:gap-4">
          <legend className="sr-only">Your contact details</legend>
          <div>
            <label htmlFor={fid("name")} className="label">
              Your name
            </label>
            <input value={f.name} onChange={set("name")} className="input" autoComplete="name" {...a11y("name")} />
            <FieldError id={fid("name-err")}>{errors.name}</FieldError>
          </div>
          <div>
            <label htmlFor={fid("phone")} className="label">
              WhatsApp number
            </label>
            <div className={`input flex !p-0 ${errors.phone ? "!border-danger" : ""}`}>
              <span aria-hidden className="tabular flex shrink-0 items-center rounded-l-[3px] border-r border-line-strong bg-plinth px-3.5 text-ink-2">
                +91
              </span>
              <input
                type="tel"
                value={f.phone}
                onChange={set("phone")}
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={14}
                placeholder="98765 43210"
                className="tabular min-w-0 flex-1 bg-transparent px-3.5 outline-none placeholder:text-muted focus-visible:outline-none"
                {...a11y("phone")}
              />
            </div>
            <FieldError id={fid("phone-err")}>{errors.phone}</FieldError>
          </div>
        </fieldset>

        <div>
          <FieldError>{err}</FieldError>
          <button disabled={busy} aria-busy={busy || undefined} className="btn btn-wa btn-lg mt-2 w-full sm:w-auto">
            {busy ? <Spinner /> : <WhatsAppIcon className="size-5" />} {busy ? "Saving your request…" : "Send request on WhatsApp"}
          </button>
          <p className="mt-3 text-[13px] text-muted">No payment now. We’ll reply with a sketch and a quote first.</p>
        </div>
      </div>

      {/* ── Design brief helper ── */}
      <aside aria-labelledby={fid("brief-title")} className="lg:col-span-5 lg:col-start-8">
        <div className="rounded-[2px] bg-plinth p-5 sm:p-8 lg:sticky lg:top-[96px]">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Sparkles aria-hidden className="size-3.5 text-accent" strokeWidth={1.75} /> Design brief
          </p>
          <h3 id={fid("brief-title")} className="t-h3 mt-3">
            Shape your <em>idea</em>
          </h3>
          <p className="mt-2 text-[15px] text-ink-2">
            Not sure how to describe it? Write a rough idea and we’ll turn it into a clear brief, with colours, size and details, to attach to your request.
          </p>
          {settings.aiAvailable ? (
            <button type="button" onClick={shape} disabled={aiBusy} aria-busy={aiBusy || undefined} className="btn btn-outline mt-6 w-full">
              {aiBusy ? <Spinner /> : null}
              {aiBusy ? "Writing your brief…" : concept ? "Try another version" : "Write my design brief"}
            </button>
          ) : (
            <p className="mt-6 border-t border-line pt-4 text-[14px] text-muted">Just describe your idea. We’ll help shape it with you on WhatsApp.</p>
          )}
          <FieldError>{aiErr}</FieldError>
          {concept && (
            <div aria-live="polite" className="mt-6 animate-fade-up rounded-[2px] border border-line bg-surface p-5">
              <p className="font-display text-[22px] leading-tight">{concept.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{concept.concept}</p>
              {concept.palette.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Palette">
                  {concept.palette.map((c) => (
                    <li key={c} className="badge bg-plinth text-ink">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[14px]">
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-muted">Size</dt>
                  <dd>{concept.size}</dd>
                </div>
                {concept.elements.length > 0 && (
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 text-muted">Details</dt>
                    <dd>{concept.elements.join(" · ")}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 text-[13px] text-muted">This brief is attached to your request.</p>
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
