import Link from "next/link";
import { Plus } from "lucide-react";
import { Eyebrow, GiantWordmark } from "@/components/brand";
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
    <footer className="on-dark bg-ink-deep pb-[calc(64px+env(safe-area-inset-bottom))] text-on-dark lg:pb-0">
      <div className="container-x pt-16 lg:pt-24">
        {/* Newsletter */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-6">
          <div className="lg:col-span-6">
            <Eyebrow>From the studio</Eyebrow>
            <h2 className="mt-4 max-w-[16ch] font-display text-[32px] leading-[1.1] font-[380] tracking-[-0.015em] lg:text-[40px]">
              Letters from the <em>studio</em>, once a month
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="mb-2 text-[14px] text-muted-on-dark">New pieces, festive drops and notes from Kavita’s work table. No spam.</p>
            <NewsletterForm />
          </div>
        </div>

        {/* Brand + link columns */}
        <div className="mt-14 grid gap-10 border-t border-line-on-dark pt-10 lg:mt-20 lg:grid-cols-12 lg:gap-6 lg:pt-14">
          <div className="lg:col-span-4">
            <span className="grid size-10 place-items-center rounded-full bg-canvas">
              <img src="/brand/medallion.webp" alt="" width={32} height={32} loading="lazy" decoding="async" className="size-8 rounded-full" />
            </span>
            <p className="eyebrow no-dot mt-5">Handmade with love · India</p>
            <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-muted-on-dark">
              Lippan mirror work, mandalas, festive and personalised pieces, made by hand in Kavita’s home studio. Every order is confirmed personally on WhatsApp.
            </p>
          </div>
          <div className="border-t border-line-on-dark lg:col-span-8 lg:grid lg:grid-cols-4 lg:gap-6 lg:border-t-0">
            {columns.map((c) => (
              <FooterColumn key={c.title} col={c} />
            ))}
          </div>
        </div>

        {/* Payments, copyright, socials */}
        <div className="mt-10 flex flex-col gap-5 border-t border-line-on-dark py-8 text-[13px] text-muted-on-dark lg:mt-16 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
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
      <GiantWordmark />
    </footer>
  );
}
