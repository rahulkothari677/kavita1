import Link from "next/link";
import { formatINR } from "@/lib/format";
import { TextLink } from "./TextLink";
import { responsiveImg } from "./img";

export const DEFAULT_HERO_TITLE = "Art that adds happiness to your space";

export type HeroLabel = { href: string; no: string; craft: string | null; name: string; price: number };

function Title({ text }: { text: string }) {
  if (text.trim().toLowerCase() === DEFAULT_HERO_TITLE.toLowerCase()) {
    return (
      <>
        Art that adds <em>happiness</em> to your space
      </>
    );
  }
  return <>{text}</>;
}

/**
 * Stagger for the line-rise intro (text only; the LCP image is never animated).
 * --rise-step drops to 0 under reduced motion so nothing waits to appear.
 */
const delay = (i: number) => ({ animationDelay: `calc(var(--rise-step, 90ms) * ${i})` });

/**
 * Homepage hero — no carousel, no overlay, no text on the photo.
 * Mobile: arch image first, height min(52svh, 440px) but never so tall that the headline + CTA
 * drop below the fold (360×640 keeps the CTA visible).
 * Desktop: text in cols 1–5, one 4:5 arch image in cols 6–12 with a floating wall label.
 */
export function Hero({
  title,
  subtitle,
  ctaLabel,
  ctaLink,
  image,
  imageAlt,
  label,
  proof,
}: {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  imageAlt: string;
  label: HeroLabel | null;
  proof: string | null;
}) {
  const img = responsiveImg(image, [640, 960, 1400]);

  return (
    <section aria-labelledby="hero-title" className="container-x pt-3 pb-12 motion-reduce:[--rise-step:0ms] sm:pt-6 lg:pt-8 lg:pb-16">
      <div className="flex flex-col lg:grid lg:min-h-[min(84vh,820px)] lg:grid-cols-12 lg:items-center lg:gap-6">
        {/* Text */}
        <div className="mt-5 flex flex-col lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:pt-12">
          <p className="rise">
            <span style={delay(0)}>
              <span className="eyebrow">
                Handmade in India ·{" "}
                <span lang="hi" className="font-deva text-[13px] leading-none font-normal tracking-normal normal-case">
                  हस्तनिर्मित
                </span>
              </span>
            </span>
          </p>

          <h1 id="hero-title" className="rise t-display mt-3 pt-[0.06em] pb-[0.14em] sm:max-w-[11ch]">
            <span style={delay(1)}>
              <Title text={title} />
            </span>
          </h1>

          {subtitle ? (
            <p className="rise order-4 mt-5 lg:order-none lg:mt-5">
              <span style={delay(2)} className="t-body-lg max-w-[34ch] text-muted">
                {subtitle}
              </span>
            </p>
          ) : null}

          {/* padded so focus rings are not clipped by the rise mask */}
          <div className="rise order-3 -mx-1 mt-4 p-1 lg:order-none lg:mt-7">
            <span style={delay(3)}>
              <span className="flex flex-wrap items-center gap-x-7 gap-y-2">
                <Link href={ctaLink} className="btn btn-primary max-[400px]:w-full">
                  {ctaLabel}
                </Link>
                <TextLink href="/custom-order">Commission a piece</TextLink>
              </span>
            </span>
          </div>

          {proof ? (
            <p className="rise order-5 mt-4 lg:order-none lg:mt-6">
              <span style={delay(4)} className="tabular text-[13px] text-muted">
                {proof}
              </span>
            </p>
          ) : null}
        </div>

        {/* Image — painted immediately: no clip, fade or delay */}
        <div className="relative order-first w-full sm:max-w-[28rem] lg:order-none lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:w-[min(100%,calc(min(78vh,760px)*0.8))] lg:max-w-none lg:justify-self-end">
          <div className="arch h-[max(240px,min(52svh,440px,calc(100svh_-_380px)))] bg-plinth lg:aspect-[4/5] lg:h-auto">
            <img
              src={img.src}
              srcSet={img.srcSet}
              sizes="(min-width: 1024px) 46vw, (min-width: 640px) 28rem, 100vw"
              alt={imageAlt}
              fetchPriority="high"
              loading="eager"
              className="size-full object-cover"
            />
          </div>

          {label ? (
            <Link
              href={label.href}
              className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-[2px] border border-line bg-surface px-4 py-3 transition-colors duration-150 hover:border-line-strong lg:bottom-10 lg:-left-6 lg:max-w-[22rem]"
            >
              <span className="craft-line tabular block">
                {label.no}
                {label.craft ? ` · ${label.craft}` : ""}
              </span>
              <span className="mt-1 block truncate text-[14px] leading-snug font-medium">
                {label.name} · <span className="tabular">{formatINR(label.price)}</span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
