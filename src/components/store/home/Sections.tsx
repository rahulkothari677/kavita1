import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Eyebrow, SectionHeader } from "@/components/brand";
import { InstagramIcon } from "@/components/Motifs";
import type { Review } from "@/lib/types";
import { TextLink } from "./TextLink";

/** Top padding shared by canvas sections (the section rhythm from the spec). */
export const SECTION_TOP = "pt-[clamp(2.5rem,1.5rem_+_3vw,4.5rem)]";
export const SECTION_BOTTOM = "pb-[clamp(2.5rem,1.5rem_+_3vw,4.5rem)]";

/* ─── How ordering works ─────────────────────────────────────────────────── */

export function HowOrdering({ codAvailable, artistName }: { codAvailable: boolean; artistName: string }) {
  const steps = [
    { t: "Choose your piece", s: "Browse the studio, or ask for something made just for you." },
    { t: "Add to bag", s: "Leave a note for names, colours or sizes if you’d like." },
    { t: "Send on WhatsApp", s: `Your order reaches ${artistName || "us"} as a WhatsApp message. No account needed.` },
    {
      t: "We confirm & ship",
      s: codAvailable
        ? "We confirm on WhatsApp, then pack and ship. Cash on delivery available."
        : "We confirm on WhatsApp, share payment details, then pack and ship.",
    },
  ];
  return (
    <section aria-labelledby="how-title" className={SECTION_TOP}>
      <div className="container-x">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="how-title" className="t-script">
            How ordering works
          </h2>
          <TextLink href="/faq">Read the FAQ</TextLink>
        </div>
        <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:mt-10 lg:grid-cols-4 lg:gap-x-6">
          {steps.map((x, i) => (
            <li key={x.t} className="rounded-img bg-surface/70 p-5">
              <span aria-hidden className="font-script tabular block text-[34px] leading-none text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-[15px] leading-snug font-semibold">{x.t}</h3>
              <p className="mt-1.5 max-w-[30ch] text-[14px] leading-relaxed text-muted">{x.s}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── Commission + gift finder ───────────────────────────────────────────── */

const GIFT_CHIPS = [
  { label: "Housewarming", q: "Housewarming" },
  { label: "Diwali", q: "Diwali" },
  { label: "Wedding", q: "Wedding" },
  { label: "Under ₹2,000", q: "Under 2000" },
];

export function CommissionAndGifts({ image, imageAlt }: { image: { src: string; srcSet?: string }; imageAlt: string }) {
  return (
    <section className={SECTION_TOP}>
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-6">
        <div className="grid gap-6 sm:grid-cols-7 sm:items-end lg:col-span-7">
          <div className="reveal aspect-[4/3] overflow-hidden rounded-img bg-plinth shadow-soft sm:col-span-4 sm:aspect-[4/5]">
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 55vw, 100vw"
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
          <div className="sm:col-span-3 sm:pb-2">
            <Eyebrow>Commissions</Eyebrow>
            <h2 className="font-script mt-2 text-[30px] leading-tight text-accent">Made for your home, by name</h2>
            <p className="mt-3 text-[15px] text-ink-2">Name plates, wedding and return gifts, or a piece in your colours. Share the idea and we’ll design it together.</p>
            <Link href="/custom-order" className="btn btn-primary mt-6 max-[400px]:w-full">
              Start a commission
            </Link>
          </div>
        </div>

        <div className="rounded-img bg-surface p-6 shadow-soft sm:p-8 lg:col-span-5">
          <h2 className="font-script text-[28px] leading-tight text-accent">Who are you gifting?</h2>
          <p className="mt-2 text-[15px] text-muted">Pick an occasion and we’ll suggest handmade pieces that suit it.</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {GIFT_CHIPS.map((c) => (
              <li key={c.label}>
                <Link href={`/gift-finder?q=${encodeURIComponent(c.q)}`} className="chip chip-outline min-h-11">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <TextLink href="/gift-finder" className="mt-5" icon={<Sparkles aria-hidden className="size-3.5 text-accent" strokeWidth={1.75} />}>
            Try the gift finder
          </TextLink>
        </div>
      </div>
    </section>
  );
}

/* ─── From your homes (real, approved reviews only) ──────────────────────── */

export function FromYourHomes({ reviews, total, average }: { reviews: Review[]; total: number; average: number }) {
  return (
    <section aria-label="Customer reviews" className={SECTION_TOP}>
      <div className="container-x">
        <SectionHeader className="reveal" title="From your homes" />
        <p className="tabular mt-3 text-[14px] text-muted">
          {total} {total === 1 ? "review" : "reviews"} · {average.toFixed(1)} out of 5
        </p>
        <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
          {reviews.map((r) => (
            <li key={r.id} className="w-[84vw] shrink-0 snap-start sm:w-[58vw] lg:w-auto">
              <figure className="flex h-full flex-col rounded-img bg-surface p-6 shadow-soft">
                <blockquote className="font-display line-clamp-6 text-[17px] leading-[1.45] italic">“{r.comment}”</blockquote>
                <figcaption className="mt-auto pt-6">
                  <span className="block text-[13px] font-semibold text-ink">
                    {r.name}
                    {r.city ? ` · ${r.city}` : ""}
                  </span>
                  {r.productName ? <span className="craft-line mt-1 block">{r.productName}</span> : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── Instagram (link only — no feed, no fake grid) ──────────────────────── */

export function instagramLink(raw: string) {
  const v = raw.trim();
  if (!v) return null;
  const href = /^https?:\/\//i.test(v) ? v : `https://instagram.com/${v.replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "")}`;
  let handle: string | null = null;
  try {
    const seg = new URL(href).pathname.split("/").filter(Boolean)[0];
    if (seg) handle = `@${seg}`;
  } catch {}
  return { href, handle };
}

export function InstagramLine({ href, handle }: { href: string; handle: string | null }) {
  return (
    <section aria-label="Instagram" className={SECTION_TOP}>
      <div className="container-x">
        <div className="hairline-t flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {handle ? <p className="eyebrow">{handle}</p> : null}
            <p className="mt-2 text-[15px] text-muted">New pieces, works in progress and studio days.</p>
          </div>
          <TextLink href={href} external icon={<InstagramIcon className="size-4" />}>
            Follow along on Instagram
          </TextLink>
        </div>
      </div>
    </section>
  );
}
