import Link from "next/link";
import { Gift, Heart, Package, Palette, Plus } from "lucide-react";
import { Eyebrow } from "@/components/brand";
import { InstagramIcon, WhatsAppIcon } from "@/components/Motifs";
import { InstallApp } from "@/components/InstallApp";
import { NewsletterForm } from "./NewsletterForm";
import type { Category, StoreSettings } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

type FooterLink = { href: string; label: string; external?: boolean };
type Column = { title: string; links: FooterLink[] };

function FooterAnchor({ l, className = "" }: { l: FooterLink; className?: string }) {
  const cls = `transition-colors hover:text-accent-on-dark ${className}`;
  return l.external ? (
    <a href={l.href} target="_blank" rel="noreferrer" className={cls}>
      {l.label}
    </a>
  ) : (
    <Link href={l.href} className={cls}>
      {l.label}
    </Link>
  );
}

/** Desktop: a plain column. Phones: a 52px accordion row (native <details>, no JS). */
function FooterColumn({ col }: { col: Column }) {
  const list = (
    <ul className="space-y-1 text-[14px] lg:space-y-2.5">
      {col.links.map((l) => (
        <li key={l.href + l.label}>
          <FooterAnchor l={l} className="inline-flex min-h-11 items-center lg:min-h-0" />
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <details className="group border-b border-line-on-dark lg:hidden">
        <summary className="flex h-[52px] cursor-pointer list-none items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-muted-on-dark uppercase [&::-webkit-details-marker]:hidden">
          {col.title}
          <Plus aria-hidden className="size-4 text-on-dark transition-transform duration-[220ms] group-open:rotate-45" strokeWidth={1.5} />
        </summary>
        <div className="pb-4">{list}</div>
      </details>
      <div className="hidden lg:block">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] text-muted-on-dark uppercase lg:text-[12px]">{col.title}</h3>
        <div className="mt-5">{list}</div>
      </div>
    </>
  );
}

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const wa = waLink(settings.whatsappNumber, "Hi Kavita’s Artistry! I have a question.");
  const columns: Column[] = [
    {
      title: "Shop",
      links: [
        { href: "/shop", label: "All pieces" },
        ...categories.slice(0, 6).map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
      ],
    },
    {
      title: "Help",
      links: [
        { href: "/track", label: "Track your order" },
        { href: "/faq", label: "FAQs" },
        { href: "/policies/shipping", label: "Shipping" },
        { href: "/policies/returns", label: "Returns & damage" },
        { href: "/policies/care", label: "Care guide" },
        { href: "/credits", label: "Photo credits" },
      ],
    },
    {
      title: "Studio",
      links: [
        { href: "/about", label: "Our story" },
        { href: "/custom-order", label: "Custom orders" },
        { href: "/gift-finder", label: "Gift finder" },
        { href: "/wishlist", label: "Wishlist" },
      ],
    },
    {
      title: "Contact",
      links: [
        { href: wa, label: "WhatsApp us", external: true },
        ...(settings.email ? [{ href: `mailto:${settings.email}`, label: settings.email, external: true }] : []),
        ...(settings.phone ? [{ href: `tel:${settings.phone.replace(/[^\d+]/g, "")}`, label: settings.phone, external: true }] : []),
      ],
    },
  ];

  const socials = ([
    settings.instagram ? { href: settings.instagram, label: "Instagram", external: true } : null,
    settings.facebook ? { href: settings.facebook, label: "Facebook", external: true } : null,
    settings.youtube ? { href: settings.youtube, label: "YouTube", external: true } : null,
    { href: wa, label: "WhatsApp", external: true },
  ] as (FooterLink | null)[]).filter((x): x is FooterLink => x !== null);

  // Only the methods actually offered (FAQ: UPI or bank transfer once confirmed on WhatsApp).
  const payments = ["UPI", "Bank transfer", ...(settings.codAvailable ? ["Cash on delivery"] : [])];

  return (
    <footer className="on-dark relative mt-6 overflow-x-clip bg-ink-deep pb-[calc(84px+env(safe-area-inset-bottom))] text-on-dark lg:mt-10 lg:pb-0">
      <MirrorEdge />
      {/* Faint mandala watermark */}
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 bottom-24 size-[320px] text-on-dark opacity-[0.05] lg:bottom-10 lg:size-[440px]">
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="100" cy="100" r="96" />
          <circle cx="100" cy="100" r="60" />
          {Array.from({ length: 16 }).map((_, i) => (
            <path key={`o${i}`} d="M100 4c9 14 9 26 0 36-9-10-9-22 0-36z" transform={`rotate(${i * 22.5} 100 100)`} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={`i${i}`} d="M100 40c6 9 6 15 0 20-6-5-6-11 0-20z" transform={`rotate(${i * 30} 100 100)`} />
          ))}
        </g>
      </svg>

      <div className="container-x relative pt-12 lg:pt-16">
        {/* Sign-off: the studio, and the two ways to reach it */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4">
              <img src="/brand/logo-mark.svg" alt="" width={64} height={64} className="size-14 shrink-0 lg:size-16" />
              <div>
                <p className="font-script text-[30px] leading-none text-accent-on-dark lg:text-[36px]">Kavita’s Artistry</p>
                <p className="mt-1.5 text-[11px] font-semibold tracking-[0.22em] text-muted-on-dark uppercase">Handmade with love · India</p>
              </div>
            </div>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-muted-on-dark">
              Lippan mirror work, mandalas, festive and personalised pieces, made by hand in Kavita’s home studio. Every order is confirmed personally on WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:flex-col xl:flex-row">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-full bg-wa px-5 text-[15px] font-semibold text-white transition-colors hover:bg-wa-hover"
            >
              <WhatsAppIcon className="size-5" /> Chat on WhatsApp
            </a>
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-full border border-line-on-dark px-5 text-[15px] font-semibold text-on-dark transition-colors hover:bg-ink-deep-raised"
              >
                <InstagramIcon className="size-5" /> Follow on Instagram
              </a>
            )}
          </div>
        </div>

        {/* Promises */}
        <ul className="mt-10 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4 lg:gap-4">
          {PROMISES.map(({ icon: Icon, label, note }) => (
            <li key={label} className="reveal flex items-center gap-3 rounded-[16px] bg-ink-deep-raised/70 px-3.5 py-3.5 ring-1 ring-line-on-dark lg:px-5 lg:py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-deep text-accent-on-dark ring-1 ring-line-on-dark">
                <Icon aria-hidden className="size-[18px]" strokeWidth={1.6} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] leading-tight font-semibold text-on-dark">{label}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted-on-dark max-sm:hidden">{note}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* Newsletter + links */}
        <div className="mt-10 grid gap-10 border-t border-line-on-dark pt-10 lg:mt-12 lg:grid-cols-12 lg:gap-6 lg:pt-12">
          <div className="lg:col-span-4">
            <Eyebrow>From the studio</Eyebrow>
            <h2 className="font-script mt-3 text-[26px] leading-tight text-on-dark lg:text-[28px]">Letters from the studio, once a month</h2>
            <p className="mt-2 mb-3 text-[14px] text-muted-on-dark">New pieces, festive drops and notes from Kavita’s work table. No spam.</p>
            <NewsletterForm />
            <InstallApp
              app="shop"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-line-on-dark px-4 text-[14px] font-medium text-on-dark transition-colors hover:bg-ink-deep-raised"
              helpClassName="mt-2 max-w-[34ch] text-[13px] leading-snug text-muted-on-dark"
            />
          </div>
          <div className="border-t border-line-on-dark lg:col-span-8 lg:grid lg:grid-cols-4 lg:gap-6 lg:border-t-0">
            {columns.map((c) => (
              <FooterColumn key={c.title} col={c} />
            ))}
          </div>
        </div>

        {/* Payments, copyright, socials */}
        <div className="mt-10 flex flex-col gap-5 border-t border-line-on-dark py-8 text-[13px] text-muted-on-dark lg:mt-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <p>
            <span className="sr-only">We accept: </span>
            {payments.join(" · ")}
          </p>
          <p>
            © {new Date().getFullYear()} Kavita’s Artistry · Handmade in India ·{" "}
            <span lang="hi" className="font-deva text-on-dark">
              हस्तनिर्मित
            </span>
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Social links">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="group inline-flex min-h-11 items-center text-on-dark lg:min-h-0">
                  <span className="link">{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** A row of Lippan-style scallops with a mirror dot in each, where the page meets the footer. */
function MirrorEdge() {
  return (
    <svg aria-hidden className="absolute inset-x-0 -top-[13px] block h-[14px] w-full text-ink-deep">
      <defs>
        <pattern id="mirror-edge" width="28" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14 A14 14 0 0 1 28 14 Z" fill="currentColor" />
          <circle cx="14" cy="8.5" r="2.4" fill="var(--color-accent-on-dark)" opacity="0.85" />
        </pattern>
      </defs>
      <rect width="100%" height="14" fill="url(#mirror-edge)" />
    </svg>
  );
}

const PROMISES = [
  { icon: Heart, label: "Handmade with love", note: "Every piece shaped and painted by hand" },
  { icon: Palette, label: "Premium quality", note: "Real mirrors, lasting colours, careful finish" },
  { icon: Gift, label: "Custom orders welcome", note: "Your colours, names and sizes" },
  { icon: Package, label: "Secure packaging", note: "Wrapped with care for the journey" },
];
