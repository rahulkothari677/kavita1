import type { Metadata } from "next";
import { CustomOrderClient } from "./CustomOrderClient";
import { listProducts } from "@/lib/repo";
import { imgUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "Custom orders",
  description: "Name plates, personalised gifts, wedding & return gifts and bespoke handmade decor — designed together with you.",
};

export default async function CustomOrderPage() {
  const examples = await listProducts({ activeOnly: true, sort: "featured", limit: 6 });
  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-on-ink">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, var(--color-on-ink) 1.5px, transparent 2px)", backgroundSize: "26px 26px" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
          <p className="text-[12px] tracking-[0.35em] text-accent-soft uppercase">Made just for you</p>
          <h1 className="mt-4 font-display text-5xl leading-tight md:text-7xl">Let&apos;s create something personal</h1>
          <p className="mx-auto mt-5 max-w-2xl text-on-ink/80">
            Name plates, wedding & return gifts, a piece that matches your sofa, your pet, your family — tell us your idea and we&apos;ll design it together.
          </p>
          <div className="no-scrollbar mx-auto mt-10 flex max-w-3xl justify-center gap-3 overflow-x-auto">
            {examples.map((p) => (
              <img key={p.id} src={imgUrl(p.images[0], 200)} alt="" className="size-20 shrink-0 rounded-full border-2 border-on-ink/40 object-cover md:size-24" />
            ))}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            ["1", "Share your idea", "Tell us what you have in mind — use AI to shape it if you like."],
            ["2", "Get a design & quote", "We reply on WhatsApp with a sketch, price and timeline."],
            ["3", "Handmade for you", "Once confirmed, your piece is made by hand with care."],
            ["4", "Delivered with love", "Packed safely and shipped to your door."],
          ].map(([n, t, d]) => (
            <div key={n} className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-tint font-display text-2xl text-accent">{n}</span>
              <p className="mt-3 font-display text-xl font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
        <CustomOrderClient />
      </div>
    </div>
  );
}
