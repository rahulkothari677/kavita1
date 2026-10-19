import type { Metadata } from "next";
import { listProducts } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { imgUrl } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/Motifs";
import { Eyebrow } from "@/components/brand";
import { CustomOrderClient } from "./CustomOrderClient";

export const metadata: Metadata = {
  title: "Custom orders",
  description: "Name plates, personalised gifts, wedding & return gifts and bespoke handmade decor, designed together with you.",
};

const STEPS = [
  { t: "Share your idea", s: "Tell us what you have in mind. A rough line is enough to start." },
  { t: "Get a sketch & quote", s: "We reply on WhatsApp with a design, a price and a timeline." },
  { t: "Made by hand", s: "Once you confirm, your piece is made in the studio, one step at a time." },
  { t: "Packed & delivered", s: "Wrapped with care and shipped safely to your door." },
];

export default async function CustomOrderPage() {
  const [products, settings] = await Promise.all([listProducts({ activeOnly: true, sort: "featured", limit: 12 }), getSettings()]);
  const examples = products.filter((p) => p.images[0]).slice(0, 3);
  const [lead, ...rest] = examples;

  return (
    <div>
      {/* ── Hero ── */}
      <section aria-labelledby="custom-title" className="container-x pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-6">
            <Eyebrow>Commissions</Eyebrow>
            <h1 id="custom-title" className="t-h1 mt-4 max-w-[14ch]">
              Made for your home, <em>by name</em>
            </h1>
            <p className="t-body-lg mt-5 max-w-[46ch] text-ink-2">
              Name plates, wedding and return gifts, a piece in your colours or for your pooja corner. Share the idea and we’ll design it together.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <a href="#request" className="btn btn-primary max-[400px]:w-full">
                Start your request
              </a>
              <a
                href={waLink(settings.whatsappNumber, "Hi! I'd like to discuss a custom piece.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium"
              >
                <WhatsAppIcon className="size-4 text-wa" />
                <span className="link">Or talk to us on WhatsApp</span>
              </a>
            </div>
          </div>
          {lead ? (
            <div className="grid grid-cols-5 gap-3 lg:col-span-5 lg:col-start-8">
              <div className={`img-well aspect-[4/5] ${rest.length ? "col-span-3" : "col-span-5"}`}>
                <img src={imgUrl(lead.images[0], 720)} alt={lead.name} fetchPriority="high" decoding="async" className="size-full object-cover" />
              </div>
              {rest.length > 0 && (
                <div className="col-span-2 flex flex-col gap-3 self-end">
                  {rest.map((p) => (
                    <div key={p.id} className="img-well aspect-[4/5]">
                      <img src={imgUrl(p.images[0], 400)} alt={p.name} loading="lazy" decoding="async" className="size-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── How a commission works ── */}
      <section aria-labelledby="process-title" className="container-x pb-16 lg:pb-24">
        <div className="hairline-t pt-6">
          <h2 id="process-title" className="eyebrow">
            How a commission works
          </h2>
          <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:mt-10 lg:grid-cols-4 lg:gap-x-6">
            {STEPS.map((x, i) => (
              <li key={x.t} className="border-t border-line pt-5">
                <span aria-hidden className="font-display tabular block text-[40px] leading-none text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[16px] leading-snug font-semibold">{x.t}</h3>
                <p className="mt-1.5 max-w-[30ch] text-[14px] leading-relaxed text-muted">{x.s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Request form ── */}
      <section id="request" aria-labelledby="request-title" className="container-x scroll-mt-24 pb-8">
        <div className="hairline-t pt-6">
          <Eyebrow>Your request</Eyebrow>
          <h2 id="request-title" className="t-h2 mt-3">
            Tell us your <em>idea</em>
          </h2>
        </div>
        <CustomOrderClient />
      </section>
    </div>
  );
}
