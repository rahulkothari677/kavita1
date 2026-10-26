import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/cached";
import { imgUrl } from "@/lib/format";
import { frameStyle } from "@/lib/frame";
import { Eyebrow } from "@/components/brand";
import { ArrowLink } from "@/components/store/pages/ui";

export const metadata: Metadata = { title: "Our story" };

/** First sentence becomes the pull quote; the rest stays as story paragraphs. */
function splitStory(story: string) {
  const paras = story
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paras.length) return { quote: null as string | null, rest: [] as string[] };
  const m = paras[0].match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  const quote = (m ? m[1] : paras[0]).trim();
  const remainder = m ? m[3].trim() : "";
  return { quote, rest: [remainder, ...paras.slice(1)].filter(Boolean) };
}

/** Italicise the last word of an editable title: “Hi, I’m *Kavita*”. */
function emphasiseLast(title: string) {
  const t = title.trim();
  const m = t.match(/^(.*?)(\S+?)([.!?,]*)$/);
  if (!m || !m[1]) return <em>{t}</em>;
  return (
    <>
      {m[1]}
      <em>{m[2]}</em>
      {m[3]}
    </>
  );
}

const VALUES = [
  { t: "Slow & handmade", s: "Every dot, mirror and brushstroke is placed by hand in a small home studio. No two pieces are exactly alike." },
  { t: "Made to last", s: "Careful finishing and sturdy, considered packing, so your piece arrives the way it left the table." },
  { t: "Personal, always", s: "You talk directly to the maker, from choosing colours to tracking your parcel." },
];

export default async function AboutPage() {
  const s = await getSettings();
  const artist = s.artistName || "Kavita";
  const { quote, rest } = splitStory(s.aboutStory || "");
  // Its own photo only (Site photos → About page); never the round home photo.
  const portraitSrc = s.aboutPageImage;
  const portrait = portraitSrc ? imgUrl(portraitSrc, 960) : "/brand/brand-board.jpg";
  const portraitAlt = portraitSrc ? `${artist}, the maker behind ${s.storeName}` : `${s.storeName} Lippan mirror medallion`;

  return (
    <div>
      {/* ── Portrait + story ── */}
      <section aria-labelledby="about-title" className="container-x pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <div className="arch aspect-[4/5] max-w-[26rem] bg-plinth lg:sticky lg:top-[96px] lg:max-w-none">
              <img src={portrait} alt={portraitAlt} fetchPriority="high" decoding="async" className="size-full object-cover" style={frameStyle(portraitSrc)} />
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-24">
            <Eyebrow>Handmade with love · India</Eyebrow>
            <h1 id="about-title" className="t-h1 mt-4 max-w-[14ch]">
              {emphasiseLast(s.aboutTitle || `Hi, I’m ${artist}`)}
            </h1>
            {quote && (
              <blockquote className="t-quote mt-8 max-w-[26ch]">
                <p>“{quote}”</p>
              </blockquote>
            )}
            {rest.length > 0 && (
              <div className="mt-8 max-w-[58ch] space-y-5 text-[17px] leading-[1.7] text-ink-2">
                {rest.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
            <p className="font-display mt-8 text-[28px] leading-none italic">{artist}</p>
            <p className="craft-line mt-2">Maker · {s.storeName}</p>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section aria-labelledby="values-title" className="container-x pb-16 lg:pb-24">
        <div className="hairline-t pt-6">
          <h2 id="values-title" className="eyebrow">
            What we care about
          </h2>
          <ol className="mt-8 grid gap-10 md:grid-cols-3 md:gap-6 lg:mt-10">
            {VALUES.map((v, i) => (
              <li key={v.t} className="border-t border-line pt-5">
                <span aria-hidden className="font-display tabular block text-[40px] leading-none text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="t-h3 mt-5">{v.t}</h3>
                <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-muted">{v.s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ── */}
      <section aria-labelledby="about-cta" className="container-x">
        <div className="hairline-t flex flex-col gap-8 pt-10 lg:flex-row lg:items-end lg:justify-between lg:pt-14">
          <h2 id="about-cta" className="t-h2 max-w-[16ch]">
            Bring a little handmade <em>happiness</em> home
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/shop" className="btn btn-primary max-[400px]:w-full">
              Explore the collection
            </Link>
            <ArrowLink href="/custom-order">Commission a piece</ArrowLink>
          </div>
        </div>
      </section>
    </div>
  );
}
