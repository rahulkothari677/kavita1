import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getSettings } from "@/lib/cached";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/Motifs";
import { PageIntro } from "@/components/store/pages/ui";

export const metadata: Metadata = { title: "FAQs" };

/* <details> accordion; the height animates where ::details-content + interpolate-size are supported. */
const DETAILS_ANIM =
  "[interpolate-size:allow-keywords] [&::details-content]:h-0 [&::details-content]:overflow-hidden [&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-[250ms] [&::details-content]:ease-[var(--ease-out)] [&::details-content]:[transition-behavior:allow-discrete] open:[&::details-content]:h-auto";

export default async function FaqPage() {
  const s = await getSettings();
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="container-x section-y">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[96px]">
            <PageIntro
              eyebrow="Help"
              title={
                <>
                  Questions, <em>answered</em>
                </>
              }
              lede="Ordering, delivery, payment and caring for handmade pieces."
            />
            <div className="mt-8 hidden border-t border-line pt-6 lg:block">
              <p className="text-[15px] text-muted">Can’t find it here?</p>
              <a href={waLink(s.whatsappNumber, "Hi! I have a question.")} target="_blank" rel="noreferrer" className="btn btn-wa-outline mt-4">
                <WhatsAppIcon className="size-5" /> Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {s.faqs.length > 0 ? (
            <div className="border-t border-line">
              {s.faqs.map((f, i) => (
                <details key={i} className={`group border-b border-line ${DETAILS_ANIM}`} open={i === 0}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                    <span>{f.q}</span>
                    <Plus aria-hidden className="size-4 shrink-0 transition-transform duration-[220ms] ease-[var(--ease-out)] group-open:rotate-45" strokeWidth={1.5} />
                  </summary>
                  <p className="max-w-[62ch] pb-5 text-[15px] leading-[1.65] text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-muted">We’re writing our answers. Ask us anything on WhatsApp in the meantime.</p>
          )}

          <div className="mt-12 lg:hidden">
            <p className="font-display text-[24px] leading-tight">Still curious?</p>
            <p className="mt-2 text-[15px] text-muted">Message the studio and we’ll answer personally.</p>
            <a href={waLink(s.whatsappNumber, "Hi! I have a question.")} target="_blank" rel="noreferrer" className="btn btn-wa-outline mt-5 w-full sm:w-auto">
              <WhatsAppIcon className="size-5" /> Ask on WhatsApp
            </a>
          </div>

          <p className="mt-10 text-[14px] text-muted">
            More detail in our{" "}
            <Link href="/policies/shipping" className="link">
              <span className="text-ink">shipping</span>
            </Link>
            ,{" "}
            <Link href="/policies/returns" className="link">
              <span className="text-ink">returns</span>
            </Link>{" "}
            and{" "}
            <Link href="/policies/care" className="link">
              <span className="text-ink">care</span>
            </Link>{" "}
            guides.
          </p>
        </div>
      </div>
    </div>
  );
}
