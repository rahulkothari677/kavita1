"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Camera, ChevronRight, Copy, Images, Loader2, Megaphone, MessageCircle, RotateCcw, Sparkles, TrendingUp } from "lucide-react";
import { api, PageHeader, Panel, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, AiDraftChip, AiPanel, btn, copyText, cx, field, Segmented, Sk, Thumb, useActionToast } from "@/components/admin/pages/kit";
import { InstagramIcon, WhatsAppIcon } from "@/components/Motifs";
import { imgUrl } from "@/lib/format";
import type { Product } from "@/lib/types";

type Caption = { caption: string; hashtags: string[]; storyText: string };
type Replies = { replies: { label: string; text: string }[] };

export default function AiStudio() {
  const { data: settings } = useLoad<{ system: { ai: string | null } }>("/api/admin/settings");
  const [tab, setTab] = useState<"caption" | "reply">("caption");
  const ai = settings?.system.ai;

  return (
    <div className={cx(ADMIN_ICONS, "space-y-3 md:space-y-4")}>
      <PageHeader title="AI Studio" subtitle="Your helper for posts, replies and listings. Everything it writes is a draft for you to check." />
      {settings && !ai && (
        <div role="note" className="flex gap-3 rounded-[8px] border border-admin-line bg-status-warning-bg p-4 text-[14px] leading-6 text-status-warning-fg">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            AI isn’t switched on yet. Add a free <b>GEMINI_API_KEY</b> (or ANTHROPIC_API_KEY) in your Vercel project under Settings → Environment Variables, then redeploy.{" "}
            <Link href="/admin/settings" className="font-semibold underline underline-offset-2">
              Open Settings
            </Link>
          </p>
        </div>
      )}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3 lg:grid-cols-4">
        <Feature href="/admin/products/new" icon={Camera} title="Snap & Sell" text="A photo becomes a full listing" />
        <Feature href="/admin/products/bulk" icon={Images} title="Bulk listings" text="Many photos at once" />
        <Feature href="/admin/marketing" icon={Megaphone} title="Campaign planner" text="Festive offers & broadcasts" />
        <Feature href="/admin" icon={TrendingUp} title="Business insights" text="On your home page" />
      </ul>
      <div className="pt-2">
        <Segmented
          label="AI tool"
          value={tab}
          onChange={setTab}
          items={[
            {
              key: "caption",
              label: (
                <>
                  <InstagramIcon className="size-4" /> Post writer
                </>
              ),
            },
            {
              key: "reply",
              label: (
                <>
                  <MessageCircle className="size-4" aria-hidden /> Reply helper
                </>
              ),
            },
          ]}
        />
      </div>
      {tab === "caption" ? <CaptionTool /> : <ReplyTool />}
    </div>
  );
}

function Feature({ href, icon: Icon, title, text }: { href: string; icon: React.ElementType; title: string; text: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3 rounded-[8px] border border-admin-line bg-white p-3 transition-colors hover:bg-admin-inset md:p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-[8px] border border-ai-line bg-ai-bg text-ai-fg">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{title}</span>
          <span className="block text-[13px] text-muted">{text}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}

function CaptionTool() {
  const { data } = useLoad<{ products: Product[] }>("/api/admin/products");
  const toast = useActionToast();
  const [productId, setProductId] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("warm");
  const [extra, setExtra] = useState("");
  const [out, setOut] = useState<Caption | null>(null);
  const [busy, setBusy] = useState(false);
  const product = data?.products.find((p) => p.id === productId);

  const go = async () => {
    if (!productId) return toast("Pick a piece first", "err");
    setBusy(true);
    try {
      setOut(await api<Caption>("/api/admin/ai/write", { body: { task: "caption", input: { productId, platform, language, tone, extra } } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not write this", "err");
    } finally {
      setBusy(false);
    }
  };
  const tags = out ? out.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ") : "";
  const full = out ? `${out.caption}\n\n${tags}` : "";

  return (
    <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
      <Panel title="What should we post?">
        <div className="space-y-4">
          <div>
            <label htmlFor="cap-product" className="label">
              Piece
            </label>
            <div className="flex items-center gap-3">
              {product && <Thumb src={imgUrl(product.images[0], 160)} className="aspect-[4/5] w-12" />}
              <select id="cap-product" value={productId} onChange={(e) => setProductId(e.target.value)} className={field}>
                <option value="">Choose a piece…</option>
                {data?.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Chips label="Platform" options={["Instagram", "WhatsApp status", "Facebook", "Pinterest"]} value={platform} onChange={setPlatform} />
          <Chips label="Language" options={["English", "Hindi", "Hinglish", "Gujarati", "Marathi"]} value={language} onChange={setLanguage} />
          <Chips label="Tone" options={["warm", "festive", "luxurious", "playful", "minimal"]} value={tone} onChange={setTone} />
          <div>
            <label htmlFor="cap-extra" className="label">
              Anything to mention? <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="cap-extra" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="e.g. 10% off this week, only 2 left" className={field} />
          </div>
          <button onClick={go} disabled={busy} className={btn("ai", "w-full")}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} Write my post
          </button>
        </div>
      </Panel>
      <AiPanel title="Your post" action={out ? <AiDraftChip /> : undefined}>
        {busy && !out ? (
          <div className="space-y-2" role="status" aria-label="Writing">
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-11/12" />
            <Sk className="h-4 w-3/4" />
          </div>
        ) : !out ? (
          <p className="py-10 text-center text-[14px] text-ai-fg">Your caption, hashtags and story text will appear here.</p>
        ) : (
          <div className="space-y-4" aria-live="polite">
            <p className="text-[15px] leading-6 whitespace-pre-wrap text-ink">{out.caption}</p>
            <p className="text-[14px] text-ai-fg">{tags}</p>
            <div className="rounded-[8px] bg-ink-deep px-4 py-6 text-center font-display text-[22px] leading-snug text-on-dark">{out.storyText}</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={async () => ((await copyText(full)) ? toast("Copied. Paste it in Instagram.") : toast("Could not copy", "err"))} className={btn("primary")}>
                <Copy className="size-4" aria-hidden /> Copy caption
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noreferrer" className={btn("wa")}>
                <WhatsAppIcon className="size-4" /> Share
              </a>
              <button onClick={go} disabled={busy} className={btn("aiOutline")}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />} Try again
              </button>
            </div>
          </div>
        )}
      </AiPanel>
    </div>
  );
}

function ReplyTool() {
  const toast = useActionToast();
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [out, setOut] = useState<Replies | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!message.trim()) return toast("Paste the customer’s message first", "err");
    setBusy(true);
    try {
      setOut(await api<Replies>("/api/admin/ai/write", { body: { task: "reply", input: { message, context } } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI could not write replies", "err");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
      <Panel title="The customer’s message">
        <label htmlFor="rp-msg" className="sr-only">
          Customer message
        </label>
        <textarea id="rp-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className={field} placeholder="e.g. Hi, do you have the blue mandala in 18 inch? How much for 5 pieces as return gifts? Need by 20th." />
        <label htmlFor="rp-ctx" className="label mt-3">
          Your notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="rp-ctx" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. yes possible, ₹1,200 each, 10 days" className={field} />
        <button onClick={go} disabled={busy} className={btn("ai", "mt-4 w-full")}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} Suggest replies
        </button>
      </Panel>
      <AiPanel title="Reply options" action={out ? <AiDraftChip /> : undefined}>
        {busy && !out ? (
          <div className="space-y-3" role="status" aria-label="Writing">
            <Sk className="h-20 w-full" />
            <Sk className="h-20 w-full" />
          </div>
        ) : !out ? (
          <p className="py-10 text-center text-[14px] text-ai-fg">Three ready-to-send replies will appear here.</p>
        ) : (
          <ul className="space-y-3" aria-live="polite">
            {out.replies.map((r, i) => (
              <li key={i} className="rounded-[8px] border border-ai-line bg-white p-4">
                <p className="text-[12px] font-semibold tracking-[0.08em] text-ai-fg uppercase">{r.label}</p>
                <p className="mt-1.5 text-[14px] leading-6 whitespace-pre-wrap text-ink">{r.text}</p>
                <button onClick={async () => ((await copyText(r.text)) ? toast("Reply copied") : toast("Could not copy", "err"))} className="mt-2 -ml-2 inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-[13px] font-medium hover:bg-admin-inset">
                  <Copy className="size-3.5" aria-hidden /> Copy
                </button>
              </li>
            ))}
          </ul>
        )}
      </AiPanel>
    </div>
  );
}

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={cx("inline-flex min-h-10 items-center rounded-full px-3.5 text-[14px] font-medium capitalize md:min-h-8 md:text-[13px]", value === o ? "bg-ink text-white" : "border border-admin-line bg-white text-ink hover:bg-admin-inset")}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
