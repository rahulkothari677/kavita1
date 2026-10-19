import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, HandHeart, PackageCheck, Ruler, Sparkles, Truck } from "lucide-react";
import { getProductBySlug, listProducts, listReviews } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { discountPercent, formatINR, imgUrl } from "@/lib/format";
import { Gallery } from "@/components/store/Gallery";
import { ProductActions } from "@/components/store/ProductActions";
import { ProductCard } from "@/components/store/ProductCard";
import { ReviewForm } from "@/components/store/ReviewForm";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { StickyBuyBar } from "@/components/store/StickyBuyBar";
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
  const off = discountPercent(p.price, p.compareAtPrice);
  const soldOut = p.stock <= 0 && !p.madeToOrder;

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
        <nav className="mb-5 text-xs text-muted">
          <Link href="/">Home</Link> / <Link href="/shop">Shop</Link>
          {p.categoryName && (
            <>
              {" "}/ <Link href={`/shop?category=${p.categorySlug}`}>{p.categoryName}</Link>
            </>
          )}
        </nav>
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Gallery images={p.images} name={p.name} />
          <div className="md:pt-4">
            {p.badge && <span className="mb-3 inline-block rounded-full bg-cream px-3 py-1 text-xs tracking-wide">{p.badge}</span>}
            <h1 className="font-display text-4xl leading-tight font-medium md:text-5xl">{p.name}</h1>
            {p.reviewCount ? (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                <span className="text-gold">{"★".repeat(Math.round(p.rating ?? 5))}</span> {p.rating?.toFixed(1)} · {p.reviewCount} review
                {p.reviewCount > 1 ? "s" : ""}
              </a>
            ) : null}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-medium">{formatINR(p.price)}</span>
              {off > 0 && (
                <>
                  <span className="text-lg text-muted line-through">{formatINR(p.compareAtPrice!)}</span>
                  <span className="rounded-full bg-rose/10 px-2.5 py-0.5 text-sm font-medium text-rose">Save {off}%</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">Inclusive of all taxes. Shipping calculated at checkout.</p>
            <p className="mt-6 text-[16.5px] leading-relaxed text-ink/80">{p.shortDescription}</p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {soldOut ? (
                <span className="rounded-full bg-ink/5 px-3 py-1.5">Sold out — can be remade on request</span>
              ) : p.madeToOrder ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-gold">
                  <Clock className="size-4" /> Made to order · ready in {p.leadTimeDays ?? 7}–{(p.leadTimeDays ?? 7) + 3} days
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-wa/10 px-3 py-1.5 text-wa">
                  <PackageCheck className="size-4" /> {p.stock <= 2 ? `Only ${p.stock} left` : "In stock"} · ships in 2–4 days
                </span>
              )}
              {p.customizable && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5">
                  <Sparkles className="size-4" /> Personalisable
                </span>
              )}
            </div>

            <div id="buy">
              <ProductActions
                p={{ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null, stock: p.stock, madeToOrder: p.madeToOrder, customizable: p.customizable }}
              />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-muted">
              <div className="rounded-2xl bg-cream/70 p-3">
                <HandHeart className="mx-auto mb-1.5 size-5 text-gold" strokeWidth={1.5} />
                Handmade
              </div>
              <div className="rounded-2xl bg-cream/70 p-3">
                <Truck className="mx-auto mb-1.5 size-5 text-gold" strokeWidth={1.5} />
                {settings.freeShippingAbove > 0 ? `Free ship over ${formatINR(settings.freeShippingAbove)}` : "Pan-India shipping"}
              </div>
              <div className="rounded-2xl bg-cream/70 p-3">
                <PackageCheck className="mx-auto mb-1.5 size-5 text-gold" strokeWidth={1.5} />
                Safe packaging
              </div>
            </div>

            <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
              <Details title="The story" open>
                <div className="prose-ka">
                  {p.description.split("\n").filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </Details>
              {(p.size || p.materials.length > 0 || p.colors.length > 0) && (
                <Details title="Details & dimensions">
                  <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[15px]">
                    {p.size && (
                      <>
                        <dt className="flex items-center gap-1.5 text-muted">
                          <Ruler className="size-4" /> Size
                        </dt>
                        <dd>{p.size}</dd>
                      </>
                    )}
                    {p.materials.length > 0 && (
                      <>
                        <dt className="text-muted">Materials</dt>
                        <dd>{p.materials.join(", ")}</dd>
                      </>
                    )}
                    {p.colors.length > 0 && (
                      <>
                        <dt className="text-muted">Colours</dt>
                        <dd>{p.colors.join(", ")}</dd>
                      </>
                    )}
                  </dl>
                </Details>
              )}
              <Details title="Care">
                <p className="text-[15px] leading-relaxed">{p.care || settings.careGuide}</p>
              </Details>
              <Details title="Shipping & returns">
                <p className="text-[15px] leading-relaxed">{settings.shippingPolicy}</p>
                <p className="mt-3 text-[15px] leading-relaxed">{settings.returnPolicy}</p>
              </Details>
            </div>
          </div>
        </div>
      </div>

      <section id="reviews" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-20 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Reviews</h2>
            {p.reviewCount ? (
              <p className="mt-1 text-muted">
                <span className="text-gold">★</span> {p.rating?.toFixed(1)} from {p.reviewCount} happy home{p.reviewCount > 1 ? "s" : ""}
              </p>
            ) : (
              <p className="mt-1 text-muted">Be the first to share your thoughts.</p>
            )}
          </div>
        </div>
        {reviews.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="card p-6">
                <p className="text-gold">{"★".repeat(r.rating)}<span className="text-ink/15">{"★".repeat(5 - r.rating)}</span></p>
                <p className="mt-2 leading-relaxed">{r.comment}</p>
                <p className="mt-3 text-sm text-muted">
                  — {r.name}
                  {r.city ? `, ${r.city}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 max-w-xl">
          <ReviewForm productId={p.id} />
        </div>
      </section>

      {relatedAll.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl">You may also love</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {relatedAll.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
      <RecentlyViewed excludeId={p.id} />
      {!soldOut && <StickyBuyBar name={p.name} price={p.price} image={p.images[0] ?? null} />}
    </>
  );
}

function Details({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group py-5" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-xl font-semibold">
        {title}
        <span className="text-2xl font-light transition group-open:rotate-45">+</span>
      </summary>
      <div className="pt-3 text-ink/80">{children}</div>
    </details>
  );
}
