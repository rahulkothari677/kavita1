import Link from "next/link";
import { SectionHeader } from "@/components/brand";
import { ProductCard } from "@/components/store/ProductCard";
import { CraftIndex, type CraftRow } from "@/components/store/home/CraftIndex";
import { DEFAULT_HERO_TITLE, Hero, type HeroLabel } from "@/components/store/home/Hero";
import { MakingStory, type MakingStep } from "@/components/store/home/MakingStory";
import { PieceOfTheWeek } from "@/components/store/home/PieceOfTheWeek";
import {
  CommissionAndGifts,
  FromYourHomes,
  HowOrdering,
  InstagramLine,
  MeetMaker,
  SECTION_BOTTOM,
  SECTION_TOP,
  instagramLink,
} from "@/components/store/home/Sections";
import { SnapRail } from "@/components/store/home/SnapRail";
import { TrustRow } from "@/components/store/home/TrustRow";
import { labelNo, responsiveImg, shortSize } from "@/components/store/home/img";
import { imgUrl } from "@/lib/format";
import { categoryTree, listProducts, listReviews } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import type { Category, Product } from "@/lib/types";

const BRAND_BOARD = "/brand/brand-board.jpg";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const MAKING_COPY: Omit<MakingStep, "image" | "alt">[] = [
  { title: "Sketch", body: "Every design begins as a pencil drawing, sized to the wall or the story it is made for.", note: "Pencil on board" },
  { title: "Shape", body: "Clay is rolled and pressed by hand into borders, petals and dots, then left to set.", note: "Clay, by hand" },
  { title: "Set & paint", body: "Mirrors are pressed in one by one, and colour goes on in slow, careful layers.", note: "Mirrors & colour" },
  { title: "Sign & pack", body: "The finished piece is signed, wrapped with care and packed for its journey to you.", note: "Signed · wrapped · sent" },
];

/** First sentence of a story, plus whatever remains (split into paragraphs). */
function splitStory(story: string) {
  const paras = story
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paras.length) return { quote: null, rest: [] as string[] };
  const m = paras[0].match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  const quote = (m ? m[1] : paras[0]).trim();
  const remainder = m ? m[3].trim() : "";
  return { quote, rest: [remainder, ...paras.slice(1)].filter(Boolean) };
}

export default async function HomePage() {
  const [settings, categories, products, approvedReviews] = await Promise.all([
    getSettings(),
    categoryTree({ activeOnly: true }),
    listProducts({ activeOnly: true, sort: "featured" }),
    listReviews({ approvedOnly: true }),
  ]);

  const withImage = products.filter((p) => p.images[0]);
  const featured = withImage.filter((p) => p.isFeatured);
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const flatCats: Category[] = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  // Stable catalogue numbers for wall labels: N° 001 is the oldest piece still on sale.
  const catalogueNo = new Map(
    [...products].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).map((p, i) => [p.id, i + 1]),
  );
  const wallNo = (p: Product) => labelNo(catalogueNo.get(p.id) ?? 1);

  /* ── 1. Hero ─────────────────────────────────────────────────────────── */
  const slide = settings.heroSlides?.[0];
  const slideImage = slide?.image?.trim() || "";
  // The wall label only names a piece when the photo really is that piece.
  const heroPiece: Product | null = slideImage
    ? (products.find((p) => p.images.includes(slideImage)) ?? null)
    : (featured[0] ?? withImage[0] ?? null);
  const heroImage = slideImage || heroPiece?.images[0] || BRAND_BOARD;
  const heroLabel: HeroLabel | null = heroPiece
    ? { href: `/product/${heroPiece.slug}`, no: wallNo(heroPiece), craft: heroPiece.categoryName ?? null, name: heroPiece.name, price: heroPiece.price }
    : null;
  const heroAlt = heroPiece
    ? `${heroPiece.name}${heroPiece.categoryName ? `, ${heroPiece.categoryName.toLowerCase()}` : ""}, handmade by ${settings.artistName || "Kavita"}`
    : heroImage === BRAND_BOARD
      ? `${settings.storeName} Lippan mirror medallion`
      : `Handmade piece from ${settings.storeName}`;

  const reviewCount = approvedReviews.length;
  const reviewAvg = reviewCount ? approvedReviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  const proofParts: string[] = [];
  if (reviewCount > 0) proofParts.push(`${reviewAvg.toFixed(1)} average from ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`);
  if (settings.codAvailable) proofParts.push("Cash on delivery");
  const proof = proofParts.length ? proofParts.join(" · ") : null;

  /* ── 3. Crafts ───────────────────────────────────────────────────────── */
  const crafts: CraftRow[] = categories
    .filter((c) => (c.productCount ?? 0) > 0)
    .map((c) => {
      const slugs = new Set([c.slug, ...(c.children ?? []).map((ch) => ch.slug)]);
      const fallback = withImage.find((p) => p.categorySlug && slugs.has(p.categorySlug))?.images[0];
      const image = c.image || fallback || null;
      return {
        slug: c.slug,
        name: c.name,
        count: c.productCount ?? 0,
        image: image ? imgUrl(image, 640) : null,
        subs: (c.children ?? []).filter((ch) => (ch.productCount ?? 0) > 0).map((ch) => ch.name),
      };
    });

  /* ── 4. New in the studio ────────────────────────────────────────────── */
  const newIn = newest.slice(0, 8);

  /* ── 5. Piece of the week — rotates weekly through featured pieces ───── */
  const notHero = (p: Product) => p.id !== heroPiece?.id;
  const potwPool = featured.filter(notHero).length ? featured.filter(notHero) : newest.filter((p) => notHero(p) && p.images[0]);
  const potw = potwPool.length ? potwPool[Math.floor(Date.now() / WEEK_MS) % potwPool.length] : (heroPiece ?? null);
  const potwLabel = potw ? [wallNo(potw), potw.categoryName, shortSize(potw.size)].filter(Boolean).join(" · ") : "";

  /* ── 7. The Making — four distinct product photos stand in for process shots ── */
  // Prefer pieces not already shown above (hero, piece of the week); reuse them only if needed.
  const shownIds = new Set([heroPiece?.id, potw?.id]);
  const usedImages = new Set<string>([heroImage, ...(potw?.images ?? [])]);
  const making: { src: string; alt: string }[] = [];
  for (const pass of [0, 1]) {
    for (const p of [...featured, ...newest]) {
      if (making.length >= 4) break;
      if (pass === 0 && shownIds.has(p.id)) continue; // one photo per piece on the first pass
      const order = pass === 0 ? [1, 0] : [0, 1, 2, 3];
      for (const idx of order) {
        const src = p.images[idx];
        if (src && !usedImages.has(src)) {
          usedImages.add(src);
          making.push({ src, alt: idx === 0 ? p.name : `Detail of ${p.name}` });
          shownIds.add(p.id);
          break;
        }
      }
    }
  }
  const makingSteps: MakingStep[] = MAKING_COPY.map((c, i) => {
    const img = making.length ? making[i % making.length] : { src: BRAND_BOARD, alt: `${settings.storeName} Lippan mirror medallion` };
    return { ...c, image: imgUrl(img.src, 1000), alt: img.alt };
  });

  /* ── 8. Commission image: a customisable piece, else the name-plate craft ── */
  const customPiece = withImage.find((p) => p.customizable);
  const namePlateCat = flatCats.find((c) => c.image && /name/i.test(`${c.slug} ${c.name}`));
  const commissionSrc = customPiece?.images[0] ?? namePlateCat?.image ?? BRAND_BOARD;
  const commissionAlt = customPiece ? customPiece.name : namePlateCat ? namePlateCat.name : `${settings.storeName} Lippan mirror medallion`;

  /* ── 9. Meet the maker ───────────────────────────────────────────────── */
  const story = splitStory(settings.aboutStory || "");
  const artistName = settings.artistName || "Kavita";
  const portraitSrc = settings.artistImage || BRAND_BOARD;
  const portraitAlt = settings.artistImage ? `${artistName}, the maker behind ${settings.storeName}` : `${settings.storeName} Lippan mirror medallion`;
  const sellsLippan = [...flatCats, ...products].some((x) => /lippan/i.test(x.name));

  /* ── 10. Reviews: featured first, newest next ────────────────────────── */
  const shownReviews = [...approvedReviews].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).slice(0, 6);

  const insta = instagramLink(settings.instagram || "");

  return (
    <>
      <Hero
        title={slide?.title?.trim() || DEFAULT_HERO_TITLE}
        subtitle={slide?.subtitle}
        ctaLabel={slide?.ctaLabel?.trim() || "Explore the collection"}
        ctaLink={slide?.ctaLink?.trim() || "/shop"}
        image={heroImage}
        imageAlt={heroAlt}
        label={heroLabel}
        proof={proof}
      />

      <TrustRow settings={settings} />

      {crafts.length > 0 && (
        <section aria-labelledby="crafts-title" className={SECTION_TOP}>
          <div className="container-x">
            <SectionHeader
              className="reveal"
              eyebrow="01 — Shop by craft"
              title={
                <span id="crafts-title">
                  Something for every <em>corner</em>
                </span>
              }
              link={{ href: "/shop", label: "View all crafts" }}
            />
            <div className="reveal mt-12 hidden lg:block">
              <CraftIndex rows={crafts} />
            </div>
            <SnapRail label="Crafts" className="mt-8 lg:hidden">
              {crafts.map((c) => (
                <Link key={c.slug} href={`/shop?category=${encodeURIComponent(c.slug)}`} className="hover-zoom group block w-[72vw] shrink-0 snap-start sm:w-[42vw]">
                  <span className="block aspect-[3/4] overflow-hidden rounded-[2px] bg-plinth">
                    {c.image ? <img src={c.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" /> : null}
                  </span>
                  <span className="font-display mt-3 block text-[20px] leading-tight">{c.name}</span>
                  <span className="craft-line tabular mt-1 block">
                    {c.count} {c.count === 1 ? "piece" : "pieces"}
                  </span>
                </Link>
              ))}
            </SnapRail>
          </div>
        </section>
      )}

      {newIn.length > 0 && (
        <section aria-labelledby="new-title" className={`${SECTION_TOP} ${SECTION_BOTTOM}`}>
          <div className="container-x">
            <SectionHeader
              className="reveal"
              eyebrow="02 — New in the studio"
              title={
                <span id="new-title">
                  Fresh from the <em>work table</em>
                </span>
              }
              link={{ href: "/shop?sort=newest", label: "View all" }}
            />
            <div className="reveal mt-8 grid grid-cols-2 gap-x-3 gap-y-7 md:mt-12 md:grid-cols-3 md:gap-x-5 md:gap-y-10 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-12 md:max-xl:[&>*:nth-child(n+7)]:hidden">
              {newIn.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {potw && potw.images[0] ? <PieceOfTheWeek p={potw} label={potwLabel} /> : null}

      <HowOrdering codAvailable={settings.codAvailable} artistName={artistName} />

      {/* The page's one kajal band — never adjacent to the footer */}
      <section aria-labelledby="making-title" className="on-dark section-y bg-ink-deep text-on-dark">
        <div className="container-x">
          <div className="reveal border-t border-line-on-dark pt-6">
            <p className="eyebrow">03 — The making</p>
            <h2 id="making-title" className="t-h2 mt-3 text-on-dark">
              From clay to <em>your wall</em>.
            </h2>
            <p className="mt-4 max-w-[48ch] text-[16px] text-muted-on-dark">How a piece comes together on the studio table, one stage at a time.</p>
          </div>
          <MakingStory steps={makingSteps} />
        </div>
      </section>

      <div className={SECTION_BOTTOM}>
        <CommissionAndGifts image={responsiveImg(commissionSrc, [640, 960])} imageAlt={commissionAlt} />

        <MeetMaker
          portrait={responsiveImg(portraitSrc, [640, 960])}
          portraitAlt={portraitAlt}
          quote={story.quote}
          paragraphs={story.rest.slice(0, 2)}
          artistName={artistName}
          showLippanNote={sellsLippan}
        />

        {shownReviews.length > 0 && <FromYourHomes reviews={shownReviews} total={reviewCount} average={reviewAvg} />}

        {insta && <InstagramLine href={insta.href} handle={insta.handle} />}
      </div>
    </>
  );
}
