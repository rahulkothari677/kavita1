import { SectionHeader } from "@/components/brand";
import { ProductCard } from "@/components/store/ProductCard";
import { AboutStrip, CategoryTiles, HeroBanner, type Tile } from "@/components/store/home/Atelier";
import { CommissionAndGifts, FromYourHomes, HowOrdering, InstagramLine, SECTION_TOP, instagramLink } from "@/components/store/home/Sections";
import { responsiveImg } from "@/components/store/home/img";
import { categoryTree, listProducts, listReviews } from "@/lib/cached";
import { getSettings } from "@/lib/cached";
import type { Category, Product } from "@/lib/types";
import { frameStyle } from "@/lib/frame";

const BRAND_BOARD = "/brand/brand-board.jpg";
const HERO_SCENE = "/home/hero-scene.webp";
const DEFAULT_TITLE = "Handmade Art for a Happier Home";
const DEFAULT_LINES = ["Unique pieces • Customised creations", "Art • Home Decor • More"];
// Earlier defaults that may still be saved in settings — shown as the new copy instead.
const OLD_TITLES = ["art that adds happiness to your space"];
const OLD_SUBTITLE_START = "lippan art, wall decor, festive pieces";

function firstParagraph(story: string) {
  return (
    story
      .split(/\n+/)
      .map((p) => p.trim())
      .find(Boolean) ?? ""
  );
}

export default async function HomePage() {
  const [settings, categories, products, approvedReviews] = await Promise.all([
    getSettings(),
    categoryTree({ activeOnly: true }),
    listProducts({ activeOnly: true, sort: "featured" }),
    listReviews({ approvedOnly: true }),
  ]);

  const withImage = products.filter((p) => p.images[0]);
  const flatCats: Category[] = categories.flatMap((c) => [c, ...(c.children ?? [])]);
  const catSlugs = new Set(flatCats.map((c) => c.slug));

  /* Hero — the owner's slide copy and photo when set, else the studio scene */
  const slide = settings.heroSlides?.[0];
  const rawTitle = slide?.title?.trim() || "";
  const title = !rawTitle || OLD_TITLES.includes(rawTitle.toLowerCase()) ? DEFAULT_TITLE : rawTitle;
  const rawSub = slide?.subtitle?.trim() || "";
  const lines = !rawSub || rawSub.toLowerCase().startsWith(OLD_SUBTITLE_START) ? DEFAULT_LINES : rawSub.split(/\n+/).filter(Boolean);
  const heroImage = slide?.image?.trim() || HERO_SCENE;
  const rawCta = slide?.ctaLabel?.trim() || "";
  const ctaLabel = !rawCta || rawCta === "Explore the collection" ? "Explore our collection" : rawCta;

  /* Tiles (Admin → Site photos). A link to a collection that no longer exists falls back to /shop. */
  const tiles: Tile[] = settings.homeTiles
    .filter((t) => t.title.trim() || t.image)
    .map((t, i) => {
      const cat = t.link.match(/^\/shop\?category=([^&]+)/)?.[1];
      return { title: t.title, text: t.text, image: t.image, tone: i % 2 ? "b" : "a", href: cat && !catSlugs.has(cat) ? "/shop" : t.link || "/shop" };
    });

  /* Featured: featured → bestsellers → the rest, 8 pieces */
  const rank = (p: Product) => (p.isFeatured ? 0 : p.isBestseller ? 1 : 2);
  const featured = [...withImage].sort((a, b) => rank(a) - rank(b)).slice(0, 8);
  const shown = new Set(featured.map((p) => p.id));
  const newest = [...withImage]
    .filter((p) => !shown.has(p.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  /* Commission image: a customisable piece, else the name-plate craft */
  const customPiece = withImage.find((p) => p.customizable);
  const namePlateCat = flatCats.find((c) => c.image && /name/i.test(`${c.slug} ${c.name}`));
  const commissionSrc = settings.commissionImage || customPiece?.images[0] || namePlateCat?.image || BRAND_BOARD;
  const commissionAlt = settings.commissionImage
    ? `A personalised piece from ${settings.storeName}`
    : customPiece
      ? customPiece.name
      : namePlateCat
        ? namePlateCat.name
        : `${settings.storeName} Lippan mirror medallion`;

  const artistName = settings.artistName || "Kavita";
  const intro = firstParagraph(settings.aboutStory || "") || `Hi, I’m ${artistName} — the artist behind ${settings.storeName}.`;

  const reviewCount = approvedReviews.length;
  const reviewAvg = reviewCount ? approvedReviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  const shownReviews = [...approvedReviews].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).slice(0, 6);
  const insta = instagramLink(settings.instagram || "");

  return (
    <>
      <HeroBanner
        title={title}
        lines={lines}
        ctaLabel={ctaLabel}
        ctaLink={slide?.ctaLink?.trim() || "/shop"}
        image={heroImage}
        imageAlt={`Handmade decor from ${settings.storeName} in a sunlit room`}
      />

      <CategoryTiles tiles={tiles} />

      {featured.length > 0 && (
        <section aria-labelledby="featured-title" className="container-x pt-10 lg:pt-14">
          <SectionHeader title={<span id="featured-title">Featured Products</span>} link={{ href: "/shop", label: "View all" }} />
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 lg:mt-6 xl:grid-cols-4 xl:gap-x-5 md:max-xl:[&>*:nth-child(n+7)]:hidden">
            {featured.map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      <AboutStrip name={artistName} intro={intro} image={settings.artistImage || "/home/about-studio.webp"} />

      {/* New arrivals and the making story sit on a tinted band (globals.css .band) */}
      <div className="band">
        {newest.length > 0 && (
          <section aria-labelledby="new-title" className="container-x pt-10 lg:pt-14">
            <SectionHeader title={<span id="new-title">New Arrivals</span>} link={{ href: "/shop?sort=newest", label: "View all" }} />
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 md:gap-x-4 lg:mt-6 xl:grid-cols-4 xl:gap-x-5">
              {newest.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="making-title" className={`container-x ${SECTION_TOP}`}>
          <SectionHeader title={<span id="making-title">From Clay to Your Wall</span>} link={{ href: "/about", label: "Our story" }} />
          <ol className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-6 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
            {settings.makingSteps.map((m, i) => {
              const img = responsiveImg(m.image, [480, 720]);
              return (
                <li key={i} className="w-[64vw] shrink-0 snap-start sm:w-[40vw] lg:w-auto">
                  <div className="aspect-[4/3] overflow-hidden rounded-img bg-plinth shadow-soft">
                    <img src={img.src} srcSet={img.srcSet} sizes="(min-width: 1024px) 24vw, 64vw" alt={m.title} loading="lazy" decoding="async" className="size-full object-cover" style={frameStyle(m.image)} />
                  </div>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="font-script text-[22px] leading-none text-accent">{i + 1}.</span>
                    <span className="text-[15px] font-semibold">{m.title}</span>
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{m.body}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <HowOrdering codAvailable={settings.codAvailable} artistName={artistName} />

      <div className="pb-[clamp(2.5rem,1.5rem_+_3vw,4.5rem)]">
        <CommissionAndGifts image={{ ...responsiveImg(commissionSrc, [640, 960]), style: frameStyle(commissionSrc) }} imageAlt={commissionAlt} />
        {shownReviews.length > 0 && <FromYourHomes reviews={shownReviews} total={reviewCount} average={reviewAvg} />}
        {insta && <InstagramLine href={insta.href} handle={insta.handle} />}
      </div>
    </>
  );
}
