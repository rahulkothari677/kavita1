import type { Metadata } from "next";
import { getSettings } from "@/lib/cached";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/Motifs";
import { PageIntro } from "@/components/store/pages/ui";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const [sp, settings] = await Promise.all([searchParams, getSettings()]);
  return (
    <div className="container-x section-y">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          <PageIntro
            eyebrow="Order status"
            title={
              <>
                Where’s my <em>piece</em>?
              </>
            }
            lede="Enter your order number and the WhatsApp number you ordered with. You’ll see each step, from the studio table to your door."
          />
          <div className="mt-8 border-t border-line pt-6 text-[15px] text-muted">
            <p>Your order number is in the WhatsApp message you sent us, and starts with KA.</p>
            <a
              href={waLink(settings.whatsappNumber, "Hi! Could you help me find my order?")}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium text-ink"
            >
              <WhatsAppIcon className="size-4 text-wa" />
              <span className="link">Ask us on WhatsApp</span>
            </a>
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <TrackForm initialOrder={sp.order ?? ""} />
        </div>
      </div>
    </div>
  );
}
