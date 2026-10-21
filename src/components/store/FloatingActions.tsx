"use client";

import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { WhatsAppIcon } from "../Motifs";
import { waLink } from "@/lib/whatsapp";
import { useStore } from "./StoreProvider";
import { AssistantPanel } from "./chrome/AssistantPanel";

// Desktop only: on phones the helper (or Custom orders) is the raised centre button of the tab dock.
const LAUNCHER =
  "chat-launcher max-lg:hidden! fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-[44] grid size-[52px] place-items-center rounded-full shadow-float transition-[scale,background-color,opacity,bottom] duration-200 ease-out active:scale-[0.92] lg:right-6 lg:bottom-6";

/**
 * Single floating chat launcher. With the AI assistant on: an ink circle with a canvas
 * sparkle that opens the assistant. With it off: a WhatsApp launcher in wa green.
 */
export function FloatingActions() {
  const { settings, assistantOpen, setAssistantOpen, cartOpen } = useStore();
  const showAi = settings.aiAssistantEnabled;

  // The bag and the assistant share the right edge; opening the bag tucks the assistant away.
  useEffect(() => {
    if (cartOpen) setAssistantOpen(false);
  }, [cartOpen, setAssistantOpen]);

  if (!showAi) {
    return (
      <a
        href={waLink(settings.whatsappNumber, "Hi Kavita’s Artistry! I have a question.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat on WhatsApp"
        className={`${LAUNCHER} bg-wa text-white hover:bg-wa-hover`}
      >
        <WhatsAppIcon className="size-6" />
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        aria-label={`Ask ${settings.aiAssistantName}, our gift and decor helper`}
        aria-haspopup="dialog"
        aria-expanded={assistantOpen}
        title={`Ask ${settings.aiAssistantName}`}
        className={`${LAUNCHER} bg-ink text-canvas hover:bg-ink-soft ${assistantOpen ? "pointer-events-none scale-90 opacity-0" : ""}`}
      >
        <Sparkles className="size-[22px]" strokeWidth={1.5} />
      </button>
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  );
}
