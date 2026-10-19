import Link from "next/link";
import { Eyebrow, Price } from "@/components/brand";
import type { Product } from "@/lib/types";
import { responsiveImg } from "./img";

function availability(p: Product) {
  if (p.madeToOrder) return p.leadTimeDays ? `Made to order, in about ${p.leadTimeDays} days` : "Made to order";
  if (p.stock <= 0) return "Sold. Ask us for a similar piece";
  if (p.stock === 1) return "Ready to ship · last piece";
  if (p.stock <= 3) return `Ready to ship · only ${p.stock} left`;
  return "Ready to ship";
}

/** Real facts only, straight from the product record. */
function facts(p: Product) {
  const rows: { k: string; v: string }[] = [];
  if (p.size) rows.push({ k: "Size", v: p.size });
  if (p.materials.length) rows.push({ k: "Materials", v: p.materials.join(", ") });
  if (p.colors.length) rows.push({ k: "Colours", v: p.colors.join(", ") });
  rows.push({ k: "Availability", v: availability(p) });
  if (p.customizable) rows.push({ k: "Personalise", v: "Yes, add your note when you order" });
  return rows;
}

/** The page's ONE plinth band: an asymmetric 7/5 editorial on a single piece. */
export function PieceOfTheWeek({ p, label }: { p: Product; label: string }) {
  const main = responsiveImg(p.images[0], [640, 960, 1280]);
  const detail = p.images[1] ? responsiveImg(p.images[1], [400, 640]) : null;
  const href = `/product/${p.slug}`;

  return (
    <section aria-labelledby="potw-title" className="section-y bg-plinth">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="grid grid-cols-7 items-end gap-3 lg:col-span-7 lg:gap-6">
          <Link href={href} tabIndex={-1} aria-hidden className="reveal hover-zoom col-span-7 block aspect-[4/5] overflow-hidden rounded-[2px] bg-plinth-strong sm:col-span-5">
            <img
              src={main.src}
              srcSet={main.srcSet}
              sizes="(min-width: 1024px) 36vw, (min-width: 640px) 70vw, 100vw"
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </Link>
          {detail ? (
            <div className="reveal hidden aspect-[4/5] overflow-hidden rounded-[2px] bg-plinth-strong sm:col-span-2 sm:block">
              <img src={detail.src} srcSet={detail.srcSet} sizes="(min-width: 1024px) 15vw, 28vw" alt={`Detail of ${p.name}`} loading="lazy" decoding="async" className="size-full object-cover" />
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-4 lg:col-start-9 lg:pt-24">
          <Eyebrow>Piece of the week</Eyebrow>
          <h2 id="potw-title" className="t-h2 mt-4">
            {p.name}
          </h2>
          <p className="craft-line tabular mt-4">{label}</p>
          {p.shortDescription ? <p className="mt-5 max-w-[46ch] text-[16px] text-ink-2">{p.shortDescription}</p> : null}

          <dl className="mt-8 border-t border-line text-[14px]">
            {facts(p).map((f) => (
              <div key={f.k} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 border-b border-line py-3">
                <dt className="text-muted">{f.k}</dt>
                <dd className="text-ink">{f.v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-[20px]">
            <Price value={p.price} compareAt={p.compareAtPrice} />
          </p>
          <Link href={href} className="btn btn-primary btn-lg mt-5 w-full sm:w-auto">
            View piece
          </Link>
        </div>
      </div>
    </section>
  );
}
