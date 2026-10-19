"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, Sparkles, X } from "lucide-react";
import { useStore } from "./StoreProvider";
import { WhatsAppIcon } from "../Motifs";
import { formatINR, imgUrl } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

type Msg = { role: "user" | "assistant"; content: string; products?: { id: string; slug: string; name: string; price: number; image: string | null }[] };

const STARTERS = ["Gift ideas under ₹1500", "Something for my living room wall", "Do you make name plates?", "How does ordering work?"];

export function FloatingActions() {
  const { settings, assistantOpen, setAssistantOpen } = useStore();
  const showAi = settings.aiAssistantEnabled;
  return (
    <>
      <div className="wa-float fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-[60] flex flex-col items-end gap-3 md:bottom-7 md:right-7">
        {showAi && !assistantOpen && (
          <button
            onClick={() => setAssistantOpen(true)}
            className="group hidden items-center gap-2 rounded-full bg-ink py-3 pl-3.5 pr-4 text-on-ink md:flex shadow-[0_12px_30px_-8px_color-mix(in_srgb,var(--color-ink)_60%,transparent)] transition hover:-translate-y-0.5"
          >
            <span className="grid size-7 place-items-center rounded-full bg-accent-soft/90 text-ink">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-medium">Ask {settings.aiAssistantName}</span>
          </button>
        )}
        <a
          href={waLink(settings.whatsappNumber, "Hi Kavita's Artistry! 🌸 I have a question.")}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="grid size-12 place-items-center rounded-full bg-wa text-white md:size-14 shadow-[0_12px_30px_-8px_rgba(31,168,85,0.7)] transition hover:scale-105"
        >
          <WhatsAppIcon className="size-7" />
        </a>
      </div>
      {showAi && assistantOpen && <AssistantPanel onClose={() => setAssistantOpen(false)} />}
    </>
  );
}

function AssistantPanel({ onClose }: { onClose: () => void }) {
  const { settings, setAssistantOpen } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Namaste! I'm ${settings.aiAssistantName}, ${settings.storeName}'s little helper ✨ Tell me who you're shopping for, your space or your budget — I'll suggest handmade pieces you'll love.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || data.error || "Sorry, something went wrong.", products: data.products }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "I couldn't connect just now. You can always message us on WhatsApp 💛" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-end md:inset-auto md:bottom-7 md:right-7">
      <div className="absolute inset-0 bg-ink/30 md:hidden" onClick={onClose} />
      <div className="relative flex h-[85vh] w-full animate-fade-up flex-col overflow-hidden rounded-t-3xl bg-canvas shadow-2xl md:h-[620px] md:w-[400px] md:rounded-3xl">
        <div className="flex items-center gap-3 bg-ink px-5 py-4 text-on-ink">
          <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-ink">
            <Sparkles className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-display text-xl font-semibold leading-none">{settings.aiAssistantName}</p>
            <p className="mt-1 text-xs text-on-ink/70">AI gift & decor helper</p>
          </div>
          <button onClick={onClose} aria-label="Close assistant" className="rounded-full p-2 hover:bg-on-ink/10">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed ${m.role === "user" ? "bg-ink text-on-ink" : "bg-white shadow-sm"}`}>
                {m.content}
              </div>
              {m.products && m.products.length > 0 && (
                <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                  {m.products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => setAssistantOpen(false)}
                      className="w-36 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm"
                    >
                      <img src={imgUrl(p.image, 300)} alt={p.name} className="aspect-square w-full object-cover" />
                      <div className="p-2">
                        <p className="line-clamp-2 text-xs font-medium leading-snug">{p.name}</p>
                        <p className="mt-0.5 text-xs text-muted">{formatINR(p.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex w-16 gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          {msgs.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-ink/10 bg-white p-3"
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…" className="input rounded-full" />
          <button className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-on-ink disabled:opacity-50" disabled={busy || !input.trim()} aria-label="Send">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
