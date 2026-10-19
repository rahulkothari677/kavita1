import Link from "next/link";
import { ArrowRight, Gift, Heart, Package, Palette } from "lucide-react";
import { responsiveImg } from "./img";

/* ─── Hero banner ────────────────────────────────────────────────────────── */

/**
 * One rounded, sunlit banner. Desktop: the photo fills the banner and a warm wash on the left
 * carries the script headline. Phones: photo on top, text on the same warm panel below.
 */
export function HeroBanner({
  title,
  lines,
  ctaLabel,
  ctaLink,
  image,
  imageAlt,
}: {
  title: string;
  lines: string[];
  ctaLabel: string;
  ctaLink: string;
  image: string;
  imageAlt: string;
}) {
  const img = responsiveImg(image, [640, 960, 1400]);
  return (
    <section aria-labelledby="hero-title" className="container-x pt-2 lg:pt-3">
      <div className="hero-wash relative overflow-hidden rounded-[22px] shadow-soft max-lg:flex max-lg:flex-col">
        <div className="relative aspect-[16/10] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[68%]">
          <img
            src={img.src}
            srcSet={img.srcSet}
            sizes="(min-width: 1024px) 68vw, 100vw"
            alt={imageAlt}
            fetchPriority="high"
            loading="eager"
            className="size-full object-cover"
          />
          <span aria-hidden className="hero-fade absolute inset-0 max-lg:hidden" />
        </div>
        <div className="relative px-5 pt-5 pb-6 sm:px-9 lg:flex lg:min-h-[min(56vh,460px)] lg:w-[46%] lg:flex-col lg:justify-center lg:px-14 lg:py-12">
          <h1 id="hero-title" className="font-script max-w-[14ch] text-[30px] leading-[1.08] text-ink sm:text-[42px] lg:text-[52px]">
            {title}
            <Heart aria-hidden className="ml-1.5 inline size-[0.45em] -translate-y-[0.2em] text-accent" strokeWidth={1.75} />
          </h1>
          {lines.length > 0 && (
            <div className="mt-3 space-y-0.5 text-[14px] text-ink-2 sm:mt-4 sm:text-[15px] lg:text-[16px]">
              {lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          )}
          <div className="mt-5 flex items-center gap-1 sm:mt-6 sm:gap-3">
            <Link href={ctaLink} className="btn bg-surface text-ink shadow-soft hover:bg-canvas max-sm:h-11 max-sm:px-5 max-sm:text-[14px]">
              {ctaLabel} <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
            </Link>
            <Link href="/custom-order" className="btn btn-sm px-3 text-ink underline underline-offset-4 sm:no-underline sm:hover:underline">
              Custom orders
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Category tiles ─────────────────────────────────────────────────────── */

export type Tile = { href: string; title: string; text: string; image: string; tone: "a" | "b" };

/** 2-column grid of photo + coloured panel tiles (olive / walnut), script titles, circled arrow. */
export function CategoryTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <section aria-label="Shop by collection" className="container-x pt-4 lg:pt-5">
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
        {tiles.map((t, i) => (
          <li key={t.title}>
            <Link
              href={t.href}
              className={`group relative flex h-full flex-col overflow-hidden rounded-[16px] text-white shadow-soft sm:h-[170px] sm:flex-row sm:rounded-[18px] lg:h-[200px] ${
                t.tone === "a" ? "bg-panel-a" : "bg-panel-b"
              }`}
            >
              <span className="relative h-[118px] w-full shrink-0 overflow-hidden sm:h-auto sm:w-[58%]">
                <img
                  src={t.image}
                  alt=""
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <span aria-hidden className={`absolute inset-y-0 right-0 w-1/3 bg-linear-to-l to-transparent max-sm:hidden ${t.tone === "a" ? "from-panel-a" : "from-panel-b"}`} />
              </span>
              <span className="flex flex-1 flex-col justify-center px-3 pt-2.5 pb-3 sm:py-4 sm:pr-4 sm:pl-2 lg:pr-7">
                <span className="font-script text-[20px] leading-[1.05] sm:text-[24px] lg:text-[30px]">{t.title}</span>
                <span className="mt-1 text-[12px] leading-snug text-white/85 sm:mt-2 sm:text-[13px] lg:text-[14px]">{t.text}</span>
                <span className="mt-3 grid size-7 place-items-center max-sm:hidden rounded-full border border-white/80 transition-colors group-hover:bg-white group-hover:text-ink lg:mt-4 lg:size-8">
                  <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─── About strip ────────────────────────────────────────────────────────── */

const PROMISES = [
  { icon: Heart, label: "Handmade with love" },
  { icon: Palette, label: "Premium quality" },
  { icon: Gift, label: "Custom orders welcome" },
  { icon: Package, label: "Secure packaging" },
];

export function AboutStrip({ name, intro, image }: { name: string; intro: string; image: string }) {
  return (
    <section aria-labelledby="about-title" className="container-x pt-10 lg:pt-14">
      <div className="relative overflow-hidden rounded-[22px] bg-blush px-6 py-7 sm:px-9 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-10 lg:px-12 lg:py-8">
        <div className="flex items-center gap-5 lg:contents">
          <img src={image} alt="" loading="lazy" decoding="async" className="size-24 shrink-0 rounded-full object-cover shadow-soft ring-4 ring-surface lg:size-32" />
          <div className="min-w-0">
            <h2 id="about-title" className="font-script text-[26px] leading-tight text-ink lg:text-[30px]">
              About {name}
            </h2>
            <p className="mt-1.5 line-clamp-3 max-w-[52ch] text-[14px] leading-relaxed text-ink-2">{intro}</p>
            <Link href="/about" className="btn btn-sm mt-4 bg-surface text-ink shadow-soft hover:bg-canvas">
              My journey <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
        <ul className="mt-7 grid grid-cols-4 gap-2 border-t border-ink/10 pt-6 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          {PROMISES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center text-center lg:w-[104px]">
              <span className="grid size-12 place-items-center rounded-full bg-surface/70 text-accent">
                <Icon aria-hidden className="size-5" strokeWidth={1.5} />
              </span>
              <span className="mt-2 text-[12px] leading-tight text-ink-2">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
