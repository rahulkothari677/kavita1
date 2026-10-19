import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/Motifs";

export const metadata: Metadata = { title: "FAQs" };

export default async function FaqPage() {
  const s = await getSettings();
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="text-center text-[12px] tracking-[0.3em] text-gold uppercase">Help</p>
      <h1 className="mt-2 text-center font-display text-5xl md:text-6xl">Questions, answered</h1>
      <div className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
        {s.faqs.map((f, i) => (
          <details key={i} className="group py-6" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl">
              {f.q}
              <span className="text-2xl font-light transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-ink/75">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="mt-12 rounded-3xl bg-cream p-8 text-center">
        <p className="font-display text-3xl">Still curious?</p>
        <p className="mt-2 text-muted">Kavita replies personally — usually within a few hours.</p>
        <a href={waLink(s.whatsappNumber, "Hi! I have a question 🌸")} target="_blank" rel="noreferrer" className="btn btn-wa mt-5">
          <WhatsAppIcon className="size-5" /> Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
