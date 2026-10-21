import Link from "next/link";
import { Gift, Heart, Package, Palette, Plus } from "lucide-react";
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

/** Desktop: a plain column. Phones: a 48px accordion row (native <details>, no JS). */
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
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-muted-on-dark uppercase [&::-webkit-details-marker]:hidden">
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
  ] as (FooterLink | null)[]).filter((x): x is FooterLink => x !== null);

  // Only the methods actually offered (FAQ: UPI or bank transfer once confirmed on WhatsApp).
  const payments = ["UPI", "Bank transfer", ...(settings.codAvailable ? ["Cash on delivery"] : [])];

  return (
    <footer className="on-dark relative mt-6 overflow-x-clip bg-ink-deep pb-[calc(84px+env(safe-area-inset-bottom))] text-on-dark lg:mt-10 lg:pb-0">
      <MirrorEdge />
      {/* Faint mandala watermark */}
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-20 -bottom-10 size-[260px] text-on-dark opacity-[0.05] lg:-right-16 lg:bottom-6 lg:size-[400px]">
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

      <div className="container-x relative pt-9 lg:pt-14">
        <div className="grid gap-7 lg:grid-cols-12 lg:gap-6">
          {/* Sign-off: the studio, the two ways to reach it, and what it promises */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <img src="/brand/logo-mark.svg" alt="" width={48} height={48} className="size-11 shrink-0 lg:size-12" />
              <div>
                <p className="font-script text-[26px] leading-none text-accent-on-dark lg:text-[30px]">Kavita’s Artistry</p>
                <p className="mt-1 text-[10.5px] font-semibold tracking-[0.2em] text-muted-on-dark uppercase">Handmade with love · India</p>
              </div>
            </div>
            <p className="mt-3.5 max-w-[42ch] text-[14px] leading-relaxed text-muted-on-dark">
              Lippan mirror work and personalised decor, made by hand in Kavita’s home studio. Every order is confirmed on WhatsApp.
            </p>
            <div className="mt-4 flex gap-2.5">
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-wa px-4 text-[14.5px] font-semibold text-white transition-colors hover:bg-wa-hover lg:flex-none"
              >
                <WhatsAppIcon className="size-[18px]" /> Chat on WhatsApp
              </a>
              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Kavita’s Artistry on Instagram"
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-line-on-dark text-on-dark transition-colors hover:bg-ink-deep-raised"
                >
                  <InstagramIcon className="size-5" />
                </a>
              )}
            </div>
            <ul className="mt-5 grid grid-cols-4 gap-1 text-center">
              {PROMISES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-1.5">
                  <span className="grid size-9 place-items-center rounded-full text-accent-on-dark ring-1 ring-line-on-dark">
                    <Icon aria-hidden className="size-4" strokeWidth={1.6} />
                  </span>
                  <span className="text-[11px] leading-tight text-muted-on-dark">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns: accordions on phones */}
          <div className="border-t border-line-on-dark lg:col-span-5 lg:grid lg:grid-cols-4 lg:gap-5 lg:border-t-0">
            {columns.map((c) => (
              <FooterColumn key={c.title} col={c} />
            ))}
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3">
            <p className="text-[14px] font-semibold text-on-dark">Letters from the studio, once a month</p>
            <p className="mt-0.5 mb-1 text-[13px] text-muted-on-dark">New pieces and festive drops. No spam.</p>
            <NewsletterForm />
            <InstallApp
              app="shop"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-line-on-dark px-4 text-[14px] font-medium text-on-dark transition-colors hover:bg-ink-deep-raised"
              helpClassName="mt-2 max-w-[34ch] text-[13px] leading-snug text-muted-on-dark"
            />
          </div>
        </div>

        {/* Payments, copyright, socials */}
        <div className="mt-7 flex flex-col gap-2 border-t border-line-on-dark py-5 text-[12.5px] text-muted-on-dark lg:mt-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-7">
          <p>
            <span className="sr-only">We accept: </span>
            {payments.join(" · ")}
            {socials.map((s) => (
              <span key={s.label}>
                {" · "}
                <a href={s.href} target="_blank" rel="noreferrer" className="link text-on-dark">
                  {s.label}
                </a>
              </span>
            ))}
          </p>
          <p>
            © {new Date().getFullYear()} Kavita’s Artistry · Handmade in India ·{" "}
            <span lang="hi" className="font-deva text-on-dark">
              हस्तनिर्मित
            </span>
          </p>
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
  { icon: Heart, label: "Handmade" },
  { icon: Palette, label: "Premium quality" },
  { icon: Gift, label: "Custom orders" },
  { icon: Package, label: "Packed with care" },
];
