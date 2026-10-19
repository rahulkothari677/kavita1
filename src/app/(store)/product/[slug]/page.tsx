import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, Package, Plus, RefreshCcw, Truck } from "lucide-react";
import { getProductBySlug, listProducts, listReviews } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { formatINR, imgUrl } from "@/lib/format";
import { EmptyArt, Eyebrow, Price, SectionHeader } from "@/components/brand";
import { Gallery } from "@/components/store/Gallery";
import { ProductActions } from "@/components/store/ProductActions";
import { ProductCard } from "@/components/store/ProductCard";
import { ReviewForm } from "@/components/store/ReviewForm";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { StickyBuyBar } from "@/components/store/StickyBuyBar";
import { leadTimeLabel, productImg } from "@/components/store/catalogue/util";
import { siteUrl } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Not found" };
  const img = p.images[0] ? imgUrl(p.images[0], 1200) : "/brand/brand-board.jpg";
  return {
    title: p.seoTitle || p.name,
    description: p.seoDescription || p.shortDescription,
    openGraph: { title: p.name, description: p.shortDescription, images: [img] },
  };
}

/** "12 inch (30 cm) diameter" → "12 inch" for the wall label. */
function shortSize(size: string | null) {
  if (!size) return null;
  const s = size.split("(")[0].replace(/\s*diameter\s*$/i, "").trim();
  return s || size;
}

/** The sentence of the return policy that covers damage in transit (or its first sentence). */
function policySummary(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [text.trim()];
  const pick = sentences.find((s) => /damag/i.test(s)) ?? sentences[0] ?? "";
  return pick.length > 180 ? `${pick.slice(0, 177).trimEnd()}…` : pick;
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p || !p.isActive) notFound();
  const [settings, related, reviews, base] = await Promise.all([
    getSettings(),
    listProducts({ activeOnly: true, category: p.categorySlug ?? undefined, excludeId: p.id, limit: 4 }),
    listReviews({ productId: p.id, approvedOnly: true }),
    siteUrl(),
  ]);
  const more = related.length < 4 ? await listProducts({ activeOnly: true, excludeId: p.id, sort: "popular", limit: 8 }) : [];
  const relatedAll = [...related, ...more.filter((m) => !related.some((r) => r.id === m.id))].slice(0, 4);
  const soldOut = p.stock <= 0 && !p.madeToOrder;
  const lead = leadTimeLabel(p.leadTimeDays);
  const artist = settings.artistName?.trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription,
    image: p.images.map((i) => (i.startsWith("http") ? i : `${base}${i}`)),
    sku: p.id,
    brand: { "@type": "Brand", name: settings.storeName },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: p.price,
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${base}/product/${p.slug}`,
    },
    ...(p.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: (p.rating ?? 5).toFixed(1), reviewCount: p.reviewCount } } : {}),
  };

  const wallLabel = [p.categoryName, shortSize(p.size)].filter(Boolean).join(" · ");
  const meta = [
    artist ? `Handmade by ${artist}` : "Handmade",
    soldOut ? null : p.madeToOrder ? `Made to order in ${lead}` : "Ships in 2–4 days",
    settings.codAvailable && !soldOut ? "COD available" : null,
  ].filter(Boolean) as string[];

  const shippingLine =
    settings.freeShippingAbove > 0
      ? `Free shipping over ${formatINR(settings.freeShippingAbove)}${settings.shippingFee > 0 ? `, otherwise ${formatINR(settings.shippingFee)}` : ""}`
      : settings.shippingFee > 0
        ? `Shipping across India for ${formatINR(settings.shippingFee)}`
        : "Free shipping across India";
  const returnsLine = settings.returnPolicy ? policySummary(settings.returnPolicy) : null;

  const details: [string, string][] = [
    ...(p.size ? ([["Size", p.size]] as [string, string][]) : []),
    ...(p.materials.length ? ([["Materials", p.materials.join(", ")]] as [string, string][]) : []),
    ...(p.colors.length ? ([["Colours", p.colors.join(", ")]] as [string, string][]) : []),
    ["Availability", soldOut ? "Sold" : p.madeToOrder ? `Made to order · ${lead}` : p.stock === 1 ? "One of one, ready to ship" : "Ready to ship"],
    ...(p.customizable ? ([["Personalisation", "Available, add a note above"]] as [string, string][]) : []),
  ];

  const story = p.description.split("\n").map((s) => s.trim()).filter(Boolean);
  const storyImage = p.images.length > 1 ? p.images[p.images.length - 1] : null;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-x pt-4 lg:pt-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-x-1.5 text-[13px] text-muted">
            <li>
              <Link href="/shop" className="hover:text-ink">
                Shop
              </Link>
            </li>
            {p.categoryName && p.categorySlug && (
              <>
                <li aria-hidden>/</li>
                <li className="shrink-0">
                  <Link href={`/shop?category=${p.categorySlug}`} className="hover:text-ink">
                    {p.categoryName}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden className="max-sm:hidden">
              /
            </li>
            <li aria-current="page" className="truncate text-ink max-sm:hidden">
              {p.name}
            </li>
          </ol>
        </nav>

        <div className="mt-4 grid gap-8 lg:mt-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Gallery images={p.images} name={p.name} productId={p.id} />
          </div>

          <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
            {wallLabel && <Eyebrow>{wallLabel}</Eyebrow>}
            <h1 className="font-display mt-3 text-[clamp(1.75rem,1.3rem_+_1.6vw,2.5rem)] leading-[1.1] tracking-[-0.015em]">{p.name}</h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Price value={p.price} compareAt={p.compareAtPrice} className="text-[20px]" />
              {p.reviewCount ? (
                <a href="#reviews" className="tabular text-[14px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                  <span aria-hidden>★ </span>
                  {(p.rating ?? 5).toFixed(1)} · {p.reviewCount} {p.reviewCount === 1 ? "review" : "reviews"}
                </a>
              ) : null}
            </div>
            <p className="mt-1 text-[13px] text-muted">Inclusive of taxes</p>

            {p.shortDescription && <p className="mt-5 text-[16px] leading-[1.65] text-ink-2">{p.shortDescription}</p>}

            <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14px] text-muted">
              {meta.map((m, i) => (
                <span key={m} className="inline-flex items-center gap-2.5">
                  {i > 0 && <span aria-hidden className="size-1 rounded-full bg-accent" />}
                  {m}
                </span>
              ))}
            </p>

            {soldOut ? (
              <p className="mt-4 text-[14px] text-ink">This piece has found its home. {artist || "We"} can make one like it for you.</p>
            ) : !p.madeToOrder && p.stock > 1 && p.stock <= 3 ? (
              <p className="mt-4 text-[14px] font-medium text-warning">Only {p.stock} left</p>
            ) : !p.madeToOrder && p.stock === 1 ? (
              <p className="mt-4">
                <span className="badge badge-accent">One of one</span>
              </p>
            ) : null}

            <div id="buy" className="scroll-mt-28">
              <ProductActions
                p={{ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null, stock: p.stock, madeToOrder: p.madeToOrder, customizable: p.customizable }}
              />
            </div>

            <ul className="mt-6 space-y-3 rounded-[4px] bg-plinth p-4 text-[14px] leading-snug text-ink">
              <AssuranceItem icon={<Truck />}>{shippingLine}</AssuranceItem>
              <AssuranceItem icon={<Package />}>Packed by hand, with care, for the journey</AssuranceItem>
              {returnsLine && <AssuranceItem icon={<RefreshCcw />}>{returnsLine}</AssuranceItem>}
              {settings.codAvailable && <AssuranceItem icon={<Banknote />}>Cash on delivery available</AssuranceItem>}
            </ul>

            <div className="mt-8 border-t border-line">
              <Accordion title="Details & size" open>
                <table className="tabular w-full text-left text-[14px]">
                  <tbody>
                    {details.map(([k, v]) => (
                      <tr key={k} className="border-b border-line last:border-0">
                        <th scope="row" className="w-[38%] py-2.5 pr-4 align-top font-medium text-muted">
                          {k}
                        </th>
                        <td className="py-2.5 text-ink">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Accordion>
              <Accordion title="Materials & care">
                {p.materials.length > 0 && <p>Made with {p.materials.join(", ").toLowerCase()}.</p>}
                <p className={p.materials.length ? "mt-3" : ""}>{p.care || settings.careGuide}</p>
              </Accordion>
              <Accordion title="Delivery & returns">
                <p>{shippingLine}.</p>
                {settings.shippingPolicy && <p className="mt-3">{settings.shippingPolicy}</p>}
                {settings.returnPolicy && <p className="mt-3">{settings.returnPolicy}</p>}
              </Accordion>
              <Accordion title="A handmade note">
                <p>
                  Every piece is made by hand{artist ? ` by ${artist}` : ""}, so small variations in colour, texture and placement are the signature of the hand, not flaws. Yours will be
                  one of a kind.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {story.length > 0 && (
        <section aria-labelledby="behind-title" className="container-x pt-16 lg:pt-24">
          <div className={`hairline-t grid gap-8 pt-6 ${storyImage ? "lg:grid-cols-12 lg:gap-6" : ""}`}>
            {storyImage && (
              <div className="img-well aspect-[3/2] lg:col-span-7">
                <img
                  {...productImg(storyImage, [600, 900, 1200])}
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  alt={`${p.name}, detail`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </div>
            )}
            <div className={storyImage ? "lg:col-span-4 lg:col-start-9 lg:pt-24" : ""}>
              <Eyebrow>Behind the piece</Eyebrow>
              <h2 id="behind-title" className="t-h3 mt-3">
                The story of <em>this one</em>
              </h2>
              <div className="prose-ka mt-5 text-[16px] text-ink-2">
                {story.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="reviews" aria-labelledby="reviews-title" className="container-x scroll-mt-24 pt-16 lg:pt-24">
        <div className="hairline-t pt-6">
          <Eyebrow>Reviews</Eyebrow>
          <h2 id="reviews-title" className="t-h2 mt-3">
            In your <em>homes</em>
          </h2>
          {reviews.length > 0 && (
            <p className="tabular mt-3 text-[15px] text-muted">
              {avg.toFixed(1)} average · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </p>
          )}
        </div>
        {reviews.length > 0 ? (
          <>
            <ul className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id}>
                  <figure className="border-t border-line pt-5">
                    <blockquote className="font-display text-[20px] leading-[1.4] italic">“{r.comment}”</blockquote>
                    <figcaption className="mt-4 text-[13px]">
                      <span className="font-semibold text-ink">
                        {r.name}
                        {r.city ? ` · ${r.city}` : ""}
                      </span>
                      <span className="tabular ml-2 text-muted">
                        <span className="sr-only">Rated </span>
                        {r.rating}/5
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <div className="mt-10 max-w-xl">
              <ReviewForm productId={p.id} />
            </div>
          </>
        ) : (
          <div className="mt-8 flex max-w-xl flex-col items-start lg:mt-12">
            <EmptyArt kind="plate" />
            <p className="font-display mt-5 text-[24px] leading-tight">Be the first to share this piece in your home</p>
            <p className="mt-2 text-[15px] text-muted">A line or two helps the next person choose.</p>
            <div className="mt-6 w-full">
              <ReviewForm productId={p.id} />
            </div>
          </div>
        )}
      </section>

      {relatedAll.length > 0 && (
        <section aria-labelledby="related-title" className="container-x pt-16 lg:pt-24">
          <SectionHeader
            eyebrow="More like this"
            title={
              <span id="related-title">
                From the same <em>wall</em>
              </span>
            }
            link={p.categorySlug && p.categoryName ? { href: `/shop?category=${p.categorySlug}`, label: `All ${p.categoryName.toLowerCase()}` } : { href: "/shop", label: "View all" }}
          />
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-5 md:gap-y-10 lg:mt-12 xl:gap-x-6 xl:gap-y-12">
            {relatedAll.map((r) => (
              <li key={r.id}>
                <ProductCard p={r} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecentlyViewed excludeId={p.id} excludeIds={relatedAll.map((r) => r.id)} />

      {!soldOut && (
        <StickyBuyBar
          name={p.name}
          price={p.price}
          image={p.images[0] ?? null}
          product={{ id: p.id, slug: p.slug, stock: p.stock, madeToOrder: p.madeToOrder, customizable: p.customizable, compareAtPrice: p.compareAtPrice }}
        />
      )}
    </>
  );
}

function AssuranceItem({ icon, children }: { icon: React.ReactElement<{ className?: string; strokeWidth?: number }>; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="mt-px shrink-0 [&>svg]:size-4 [&>svg]:stroke-[1.5]">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details
      className="group border-b border-line [interpolate-size:allow-keywords] [&::details-content]:h-0 [&::details-content]:overflow-clip [&::details-content]:transition-[height,content-visibility] [&::details-content]:[transition-behavior:allow-discrete] [&::details-content]:duration-[250ms] open:[&::details-content]:h-auto"
      open={open}
    >
      <summary className="flex h-14 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium select-none [&::-webkit-details-marker]:hidden">
        {title}
        <Plus aria-hidden className="size-4 shrink-0 transition-transform duration-[220ms] ease-out group-open:rotate-45" strokeWidth={1.5} />
      </summary>
      <div className="pb-5 text-[15px] leading-[1.65] text-ink-2">{children}</div>
    </details>
  );
}
