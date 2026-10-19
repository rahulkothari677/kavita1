import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { imgUrl } from "@/lib/format";
import { DotDivider, Lotus } from "@/components/Motifs";

export const metadata: Metadata = { title: "Our story" };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:grid-cols-2 md:px-6 md:py-24">
        <div>
          <p className="text-[12px] tracking-[0.3em] text-gold uppercase">Our story</p>
          <h1 className="mt-3 font-display text-5xl leading-tight md:text-7xl">{s.aboutTitle}</h1>
          <p className="mt-4 font-script text-3xl text-gold">Handmade with love</p>
          <div className="prose-ka mt-8 text-[17px] text-ink/80">
            {s.aboutStory.split("\n").filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-6 font-script text-4xl">— {s.artistName}</p>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] border-8 border-white shadow-2xl">
            <img src={s.artistImage ? imgUrl(s.artistImage, 900) : "/brand/brand-board.jpg"} alt={s.artistName} className="size-full object-cover" />
          </div>
          <Lotus className="absolute -bottom-8 -left-8 h-24 text-gold/40" />
        </div>
      </section>
      <section className="bg-ink py-20 text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 text-center md:grid-cols-3 md:px-6">
          {[
            ["Slow & handmade", "No machines, no mass production. Every dot, mirror and brushstroke is placed by hand."],
            ["Made to last", "Quality materials, careful finishing and sturdy packaging so your piece arrives perfect."],
            ["Personal, always", "You talk directly to the artist — from choosing colours to tracking your parcel."],
          ].map(([t, d]) => (
            <div key={t}>
              <Lotus className="mx-auto h-10 text-gold-2" />
              <h3 className="mt-4 font-display text-3xl">{t}</h3>
              <p className="mt-2 text-cream/75">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 pt-20 text-center">
        <DotDivider className="text-gold" />
        <h2 className="mt-6 font-display text-4xl md:text-5xl">Bring a little handmade happiness home</h2>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">Shop the collection</Link>
          <Link href="/custom-order" className="btn btn-outline">Request a custom piece</Link>
        </div>
      </section>
    </div>
  );
}
