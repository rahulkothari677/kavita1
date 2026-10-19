import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/Motifs";
import { PageIntro } from "@/components/store/pages/ui";

const MAP = {
  shipping: { title: "Shipping", lead: "Shipping", em: "& delivery", key: "shippingPolicy" },
  returns: { title: "Returns & damage", lead: "Returns", em: "& damage", key: "returnPolicy" },
  care: { title: "Care guide", lead: "Caring for", em: "handmade", key: "careGuide" },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: MAP[slug as keyof typeof MAP]?.title ?? "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MAP[slug as keyof typeof MAP];
  if (!m) notFound();
  const s = await getSettings();
  const paras = String(s[m.key] ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="container-x section-y">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[96px]">
            <PageIntro
              eyebrow="Policies"
              title={
                <>
                  {m.lead} <em>{m.em}</em>
                </>
              }
            />
            <nav aria-label="Policies" className="mt-8 border-t border-line pt-4">
              <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
                {[...(Object.keys(MAP) as (keyof typeof MAP)[]).map((k) => ({ href: `/policies/${k}`, label: MAP[k].title, active: k === slug })), { href: "/faq", label: "FAQs", active: false }].map((l) => (
                  <li key={l.href}>
                    <span className="lg:hidden">
                      <Link href={l.href} aria-current={l.active ? "page" : undefined} data-active={l.active || undefined} className="chip min-h-11">
                        {l.label}
                      </Link>
                    </span>
                    <Link
                      href={l.href}
                      aria-current={l.active ? "page" : undefined}
                      className={`hidden min-h-11 items-center gap-2 text-[15px] lg:flex ${l.active ? "font-semibold text-ink" : "text-muted hover:text-ink"}`}
                    >
                      {l.active && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        <div className="lg:col-span-7 lg:col-start-6 lg:pt-2">
          {paras.length ? (
            <div className="max-w-[62ch] space-y-5 text-[17px] leading-[1.7] text-ink-2">
              {paras.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-muted">This page is being written. Message us on WhatsApp with any questions.</p>
          )}
          <div className="hairline-t mt-12 pt-6">
            <p className="text-[15px] text-muted">Something we haven’t covered?</p>
            <a href={waLink(s.whatsappNumber, `Hi! A question about ${m.title.toLowerCase()}.`)} target="_blank" rel="noreferrer" className="btn btn-wa-outline mt-4 max-[400px]:w-full">
              <WhatsAppIcon className="size-5" /> Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
