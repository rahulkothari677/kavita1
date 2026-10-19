"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Copy, Loader2, Megaphone, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { api, PageHeader, Panel, useLoad, useToast } from "@/components/admin/ui";
import { InstagramIcon as Instagram, WhatsAppIcon } from "@/components/Motifs";
import { imgUrl } from "@/lib/format";
import type { Product } from "@/lib/types";

type Caption = { caption: string; hashtags: string[]; storyText: string };
type Replies = { replies: { label: string; text: string }[] };

export default function AiStudio() {
  const { data: settings } = useLoad<{ system: { ai: string | null } }>("/api/admin/settings");
  const [tab, setTab] = useState<"caption" | "reply">("caption");
  const ai = settings?.system.ai;

  return (
    <div className="space-y-6">
      <PageHeader title="AI Studio" subtitle="Your creative assistant for posts, replies and listings." />
      {settings && !ai && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          AI is not switched on yet. Add a free <b>GEMINI_API_KEY</b> (or ANTHROPIC_API_KEY) in your Vercel project settings → Environment Variables, then redeploy. See <Link href="/admin/settings" className="underline">Settings</Link>.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Feature href="/admin/products/new" icon={Camera} title="Snap & Sell" text="Photo → full listing" />
        <Feature href="/admin/products/bulk" icon={Sparkles} title="Bulk AI listings" text="Many photos at once" />
        <Feature href="/admin/marketing" icon={Megaphone} title="Campaign planner" text="Festive offers & broadcasts" />
        <Feature href="/admin" icon={TrendingUp} title="Business coach" text="Weekly insights" />
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => setTab("caption")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${tab === "caption" ? "bg-ink text-on-ink" : "bg-white text-muted"}`}>
          <Instagram className="size-4" /> Post & caption writer
        </button>
        <button onClick={() => setTab("reply")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${tab === "reply" ? "bg-ink text-on-ink" : "bg-white text-muted"}`}>
          <MessageCircle className="size-4" /> Customer reply helper
        </button>
      </div>
      {tab === "caption" ? <CaptionTool /> : <ReplyTool />}
    </div>
  );
}

function Feature({ href, icon: Icon, title, text }: { href: string; icon: React.ElementType; title: string; text: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-ink/[0.07] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-accent-soft/40 to-tint">
        <Icon className="size-5 text-ink" />
      </span>
      <p className="mt-3 font-medium">{title}</p>
      <p className="text-xs text-muted">{text}</p>
    </Link>
  );
}

function CaptionTool() {
  const { data } = useLoad<{ products: Product[] }>("/api/admin/products");
  const toast = useToast();
  const [productId, setProductId] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("warm");
  const [extra, setExtra] = useState("");
  const [out, setOut] = useState<Caption | null>(null);
  const [busy, setBusy] = useState(false);
  const product = data?.products.find((p) => p.id === productId);

  const go = async () => {
    if (!productId) return toast("Pick a product", "err");
    setBusy(true);
    try {
      setOut(await api<Caption>("/api/admin/ai/write", { body: { task: "caption", input: { productId, platform, language, tone, extra } } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI failed", "err");
    } finally {
      setBusy(false);
    }
  };
  const full = out ? `${out.caption}\n\n${out.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="What should we post?">
        <div className="space-y-3">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
            <option value="">Choose a product…</option>
            {data?.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {product && <img src={imgUrl(product.images[0], 400)} alt="" className="aspect-square w-40 rounded-2xl object-cover" />}
          <Chips label="Platform" options={["Instagram", "WhatsApp status", "Facebook", "Pinterest"]} value={platform} onChange={setPlatform} />
          <Chips label="Language" options={["English", "Hindi", "Hinglish", "Gujarati", "Marathi"]} value={language} onChange={setLanguage} />
          <Chips label="Tone" options={["warm", "festive", "luxurious", "playful", "minimal"]} value={tone} onChange={setTone} />
          <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Anything to mention? e.g. 10% off this week, only 2 left" className="input" />
          <button onClick={go} disabled={busy} className="btn btn-primary w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Write my post
          </button>
        </div>
      </Panel>
      <Panel title="Your post">
        {!out ? (
          <p className="py-10 text-center text-sm text-muted">Your caption, hashtags and story text will appear here.</p>
        ) : (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{out.caption}</p>
            <p className="text-sm text-ink-soft">{out.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</p>
            <div className="rounded-xl bg-ink p-4 text-center font-display text-xl text-on-ink">{out.storyText}</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(full);
                  toast("Copied — paste in Instagram");
                }}
                className="btn btn-primary btn-sm"
              >
                <Copy className="size-4" /> Copy caption
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm">
                <WhatsAppIcon className="size-4" /> Share
              </a>
              <button onClick={go} disabled={busy} className="btn btn-outline btn-sm">
                Try again
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function ReplyTool() {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [out, setOut] = useState<Replies | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!message.trim()) return;
    setBusy(true);
    try {
      setOut(await api<Replies>("/api/admin/ai/write", { body: { task: "reply", input: { message, context } } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI failed", "err");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Paste the customer's message">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="input" placeholder="e.g. Hi, do you have the blue mandala in 18 inch? How much for 5 pieces as return gifts? Need by 20th." />
        <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Your notes (optional) — e.g. yes possible, ₹1200 each, 10 days" className="input mt-3" />
        <button onClick={go} disabled={busy} className="btn btn-primary mt-3 w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Suggest replies
        </button>
      </Panel>
      <Panel title="Reply options">
        {!out ? (
          <p className="py-10 text-center text-sm text-muted">Three ready-to-send replies will appear here.</p>
        ) : (
          <div className="space-y-3">
            {out.replies.map((r, i) => (
              <div key={i} className="rounded-xl border border-ink/10 p-4">
                <p className="text-xs font-medium tracking-wide text-accent uppercase">{r.label}</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{r.text}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(r.text);
                    toast("Copied");
                  }}
                  className="mt-2 flex items-center gap-1 text-xs text-ink-soft"
                >
                  <Copy className="size-3.5" /> Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`rounded-full border px-3 py-1 text-sm capitalize ${value === o ? "border-ink bg-ink text-on-ink" : "border-ink/12 bg-white"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
