"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR, imgUrl } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { useStore } from "../StoreProvider";
import { useFocusTrap, useMediaQuery, usePresence, useScrollLock, useSwipeDismiss } from "./hooks";

type Product = { id: string; slug: string; name: string; price: number; image: string | null };
type Msg = { role: "user" | "assistant"; content: string; products?: Product[] };

const STARTERS = ["Gift ideas under ₹1,500", "Something for my living room wall", "Do you make name plates?", "How does ordering work?"];

/**
 * The AI shopping helper. Desktop: a 400px floating surface panel (non-modal).
 * Phones: a bottom sheet with a grabber and swipe-down dismiss (modal).
 */
export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, setAssistantOpen } = useStore();
  const { mounted, visible } = usePresence(open, 260);
  const isPhone = useMediaQuery("(max-width: 1023px)");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Namaste, I’m ${settings.aiAssistantName}. Tell me who you’re shopping for, the space, or your budget, and I’ll suggest pieces from Kavita’s studio.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const swipe = useSwipeDismiss(panelRef, onClose);

  useFocusTrap(panelRef, open, { onEscape: onClose, initialFocus: inputRef, trap: isPhone });
  useScrollLock(open && isPhone);
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy, open]);

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
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || data.error || "Sorry, something went wrong. Please try again.", products: data.products }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "I couldn’t connect just now. You can always message Kavita on WhatsApp." }]);
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;
  const help = waLink(settings.whatsappNumber, "Hi Kavita’s Artistry! I have a question.");

  return (
    <div className="fixed inset-0 z-[60] lg:pointer-events-none">
      {/* Scrim: phones only (desktop panel is non-modal) */}
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-ink-deep/40 transition-opacity duration-200 lg:hidden ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isPhone ? "true" : undefined}
        aria-labelledby="assistant-title"
        tabIndex={-1}
        style={swipe.style}
        className={`pointer-events-auto absolute inset-x-0 bottom-0 flex max-h-[88dvh] min-h-[60dvh] flex-col overflow-hidden rounded-t-[20px] bg-surface shadow-float outline-none transition-[translate,opacity] ease-drawer lg:inset-x-auto lg:right-6 lg:bottom-6 lg:h-[min(640px,calc(100dvh-120px))] lg:max-h-none lg:min-h-0 lg:w-[400px] lg:rounded-[4px] lg:ease-out ${
          visible
            ? "translate-y-0 opacity-100 duration-[420ms] lg:duration-200"
            : "translate-y-full duration-[260ms] lg:translate-y-2 lg:opacity-0 lg:duration-200"
        }`}
      >
        {/* Header (also the swipe handle on phones) */}
        <div {...swipe.handlers} className="shrink-0 touch-none border-b border-line lg:touch-auto">
          <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-line-strong lg:hidden" />
          <div className="flex items-start gap-3 px-5 pt-3 pb-4 lg:pt-5">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                <Sparkles aria-hidden className="size-3.5 text-accent" /> Gift &amp; decor helper
              </p>
              <h2 id="assistant-title" className="mt-1 font-display text-[24px] leading-tight">
                Ask {settings.aiAssistantName}
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close assistant" className="icon-btn -mt-1 -mr-2.5 shrink-0">
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Conversation */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-5" aria-live="polite" aria-busy={busy}>
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={`max-w-[88%] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "rounded-[14px] rounded-br-[4px] bg-ink text-canvas" : "rounded-[14px] rounded-bl-[4px] bg-plinth text-ink"
                }`}
              >
                {m.content}
              </div>
              {m.products && m.products.length > 0 && (
                <ul className="snap-row mt-3 -mr-5 gap-3 pr-5">
                  {m.products.map((p) => (
                    <li key={p.id} className="w-32 shrink-0">
                      <Link href={`/product/${p.slug}`} onClick={() => setAssistantOpen(false)} className="group block">
                        <span className="block aspect-[4/5] overflow-hidden rounded-img bg-plinth">
                          <img src={imgUrl(p.image, 300)} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                        </span>
                        <span className="mt-2 line-clamp-2 font-display text-[15px] leading-snug">{p.name}</span>
                        <span className="mt-0.5 block text-[13px] font-medium tabular">{formatINR(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex w-16 items-center justify-center gap-1 rounded-[14px] rounded-bl-[4px] bg-plinth px-4 py-3.5" aria-label="Typing">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 180}ms` }} />
              ))}
            </div>
          )}
          {msgs.length === 1 && !busy && (
            <div className="flex flex-wrap gap-2 pt-1">
              {STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="chip">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-line px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:pb-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Message {settings.aiAssistantName}
            </label>
            <input
              id="assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a gift, a wall, a budget…"
              autoComplete="off"
              className="input min-w-0"
            />
            <button
              type="submit"
              className="btn btn-primary w-12 shrink-0 px-0!"
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <ArrowUp className="size-5" strokeWidth={1.75} />
            </button>
          </form>
          <a href={help} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <WhatsAppIcon className="size-3.5 text-wa" /> Prefer a person? Message Kavita on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
