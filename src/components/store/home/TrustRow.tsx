import { Banknote, HandHeart, MessageCircle, Package, PenLine, Truck, type LucideIcon } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

type Claim = { icon: LucideIcon; title: string; sub: string };

/** Four true claims only — every line is backed by a store setting or the ordering model. */
export function trustClaims(s: Pick<StoreSettings, "codAvailable" | "freeShippingAbove" | "shippingFee" | "artistName">): Claim[] {
  const items: Claim[] = [{ icon: HandHeart, title: "Handmade in our home studio", sub: "Every piece, start to finish" }];
  if (s.codAvailable) items.push({ icon: Banknote, title: "Cash on delivery", sub: "Pay when it reaches you" });
  if (s.shippingFee <= 0) {
    items.push({ icon: Truck, title: "Free shipping", sub: "On every order" });
  } else if (s.freeShippingAbove > 0) {
    items.push({ icon: Truck, title: `Free shipping from ${formatINR(s.freeShippingAbove)}`, sub: `${formatINR(s.shippingFee)} flat below that` });
  }
  items.push({ icon: MessageCircle, title: "Help on WhatsApp", sub: `Talk to ${s.artistName || "us"} directly` });
  if (items.length < 4) items.push({ icon: Package, title: "Packed with care", sub: "For a safe journey home" });
  if (items.length < 4) items.push({ icon: PenLine, title: "Custom orders welcome", sub: "Your name, your colours" });
  return items.slice(0, 4);
}

export function TrustRow({ settings }: { settings: StoreSettings }) {
  const items = trustClaims(settings);
  return (
    <section aria-label="Why shop with us" className="container-x">
      <ul className="hairline-t hairline-b no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto overscroll-x-contain px-4 py-5 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {items.map(({ icon: Icon, title, sub }) => (
          <li
            key={title}
            className="flex w-[68vw] max-w-[18rem] shrink-0 snap-start items-start gap-3 border-l border-line px-4 first:border-l-0 first:pl-0 sm:w-[42vw] lg:w-auto lg:max-w-none lg:px-6 lg:first:pl-0"
          >
            <Icon aria-hidden className="mt-[3px] size-4 shrink-0 text-ink" strokeWidth={1.5} />
            <div>
              <p className="text-[14px] leading-snug font-medium text-ink">{title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">{sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
