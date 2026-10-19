"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Minus, Plus, Share2 } from "lucide-react";
import { useStore } from "./StoreProvider";
import { WhatsAppIcon } from "../Motifs";
import { productEnquiryMessage, waLink } from "@/lib/whatsapp";

type P = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  madeToOrder: boolean;
  customizable: boolean;
};

const NOTE_MAX = 120;

/** Buy box: personalisation, quantity + Add to bag, WhatsApp enquiry, save/share/buy now. */
export function ProductActions({ p }: { p: P }) {
  const { addToCart, wishlist, toggleWishlist, settings, pushRecent, setCartOpen, toast } = useStore();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const noteId = useId();
  const sold = p.stock <= 0 && !p.madeToOrder;
  const max = p.madeToOrder ? 20 : Math.max(1, p.stock);
  const wished = wishlist.includes(p.id);

  useEffect(() => {
    pushRecent(p.id);
    setPageUrl(window.location.href);
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: p.id, event: "view" }) }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  useEffect(() => () => void (addedTimer.current && clearTimeout(addedTimer.current)), []);

  const line = { productId: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, maxQty: max, note: note.trim() || undefined };

  const add = () => {
    addToCart(line, qty);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1600);
    // Desktop opens the bag; phones get the "Added to your bag · View bag" toast.
    if (window.matchMedia("(min-width: 1024px)").matches) setCartOpen(true);
  };

  const trackWa = () =>
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: p.id, event: "whatsapp" }) }).catch(() => {});

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      } catch {
        toast("Couldn’t copy the link");
      }
    }
  };

  const askHref = waLink(
    settings.whatsappNumber,
    sold ? `Hi! *${p.name}* is sold on your website. Could you make one like it for me?${pageUrl ? `\n${pageUrl}` : ""}` : productEnquiryMessage(p.name, p.price, pageUrl),
  );

  return (
    <div className="mt-8 space-y-4">
      {p.customizable && !sold && (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={noteId} className="label">
              Personalisation <span className="font-normal text-muted">· optional</span>
            </label>
            <span className="tabular text-[12px] text-muted" aria-live="polite">
              {note.length}/{NOTE_MAX}
            </span>
          </div>
          <input
            id={noteId}
            name="personalisation"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A name, colours or size, e.g. ‘Sharma Niwas’"
            className="input"
            data-pdp-note
            autoComplete="off"
          />
          <div
            aria-hidden={!note.trim()}
            className={`grid transition-[grid-template-rows,opacity] duration-[250ms] ease-out ${note.trim() ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              <div className="flex min-h-16 items-center gap-3 rounded-[4px] bg-plinth px-4 py-3">
                <span className="craft-line shrink-0">Preview</span>
                <p className="min-w-0 truncate text-[24px] leading-tight text-ink" style={{ fontFamily: "var(--font-fraunces), var(--font-tiro), serif", fontWeight: 380 }}>
                  {note.trim() || " "}
                </p>
              </div>
            </div>
          </div>
          <p className="helper">We’ll confirm the details with you on WhatsApp before making it.</p>
        </div>
      )}

      {sold ? (
        <Link href="/custom-order" className="btn btn-primary btn-lg w-full">
          Commission a similar piece
        </Link>
      ) : (
        <div id="pdp-add" className="flex items-center gap-3">
          <div role="group" aria-label="Quantity" className="flex h-[52px] shrink-0 items-center">
            <StepButton label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus className="size-3.5" strokeWidth={1.75} />
            </StepButton>
            <output className="tabular w-8 text-center text-[16px] font-medium" aria-live="polite" aria-label={`Quantity ${qty}`}>
              {qty}
            </output>
            <StepButton label="Increase quantity" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))}>
              <Plus className="size-3.5" strokeWidth={1.75} />
            </StepButton>
          </div>
          <button type="button" onClick={add} className="btn btn-primary btn-lg min-w-0 flex-1" aria-live="polite">
            <span className="grid place-items-center">
              <span className={`col-start-1 row-start-1 transition-opacity duration-200 ${added ? "opacity-0" : "opacity-100"}`}>Add to bag</span>
              <span aria-hidden={!added} className={`col-start-1 row-start-1 inline-flex items-center gap-2 transition-opacity duration-200 ${added ? "opacity-100" : "opacity-0"}`}>
                <Check className="size-4" strokeWidth={2} /> Added
              </span>
            </span>
          </button>
        </div>
      )}

      <a href={askHref} target="_blank" rel="noreferrer" onClick={trackWa} className="btn btn-wa-outline btn-lg w-full">
        <WhatsAppIcon className="size-5" /> Ask about this piece
      </a>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="-ml-3 flex items-center">
          <button
            type="button"
            onClick={() => toggleWishlist(p.id)}
            aria-pressed={wished}
            className="inline-flex h-11 items-center gap-2 rounded-[4px] px-3 text-[14px] font-medium transition-colors hover:bg-plinth"
          >
            <Heart key={wished ? "on" : "off"} strokeWidth={1.5} className={`size-[18px] ${wished ? "animate-pop fill-accent text-accent" : ""}`} />
            {wished ? "Saved" : "Save"}
          </button>
          <button type="button" onClick={share} className="inline-flex h-11 items-center gap-2 rounded-[4px] px-3 text-[14px] font-medium transition-colors hover:bg-plinth">
            <Share2 strokeWidth={1.5} className="size-[18px]" /> Share
          </button>
        </div>
        {!sold && (
          <button
            type="button"
            onClick={() => {
              addToCart(line, qty);
              router.push("/checkout");
            }}
            className="link text-[14px] font-medium"
          >
            Buy it now <span className="arrow">→</span>
          </button>
        )}
      </div>
    </div>
  );
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="group grid size-11 place-items-center disabled:cursor-not-allowed">
      <span className="grid size-8 place-items-center rounded-[4px] border border-line-strong text-ink transition-colors group-hover:bg-plinth group-active:scale-[0.92] group-disabled:border-line group-disabled:text-muted group-disabled:group-hover:bg-transparent">
        {children}
      </span>
    </button>
  );
}
