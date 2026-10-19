import Link from "next/link";
import { ArrowRight, Gift, HandHeart, Home as HomeIcon, MessageCircle, Package, PenTool, Sparkles, Truck } from "lucide-react";
import { HeroSlider } from "@/components/store/HeroSlider";
import { ProductCard } from "@/components/store/ProductCard";
import { DotDivider, Lotus, WhatsAppIcon } from "@/components/Motifs";
import { categoryTree, listProducts, listReviews } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { imgUrl } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

export default async function HomePage() {
  const [settings, categories, featured, newest, reviews] = await Promise.all([
    getSettings(),
    categoryTree({ activeOnly: true }),
    listProducts({ activeOnly: true, sort: "featured", limit: 8 }),
    listProducts({ activeOnly: true, sort: "newest", limit: 4 }),
    listReviews({ approvedOnly: true, featuredOnly: true, limit: 6 }),
  ]);
  const testimonials = reviews.length ? reviews : await listReviews({ approvedOnly: true, limit: 6 });

  return (
    <>
      <HeroSlider slides={settings.heroSlides} />

      {/* Promise strip */}
      <section className="border-b border-ink/10 bg-cream/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-8 md:grid-cols-4 md:px-6">
          {[
            { icon: HandHeart, t: "100% Handmade", s: "Every piece made by hand" },
            { icon: PenTool, t: "Custom Creations", s: "Your colours, your name" },
            { icon: MessageCircle, t: "Easy WhatsApp Orders", s: "Talk to the artist directly" },
            { icon: Truck, t: "Ships Across India", s: "Packed with love & care" },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex flex-col items-center gap-2 px-2 text-center">
              <Icon className="size-7 text-gold" strokeWidth={1.4} />
              <p className="text-[13px] font-medium tracking-[0.12em] uppercase">{t}</p>
              <p className="text-xs text-muted">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
          <SectionTitle eyebrow="Explore" title="Shop by category" />
          <div className="no-scrollbar -mx-4 mt-10 flex snap-x gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group w-[62%] shrink-0 snap-start text-center sm:w-[40%] md:w-auto">
                <div className="relative mx-auto aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl border-[6px] border-white bg-cream shadow-[0_18px_40px_-20px_rgba(22,36,74,0.45)]">
                  <img src={imgUrl(c.image, 500)} alt={c.name} className="size-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold">{c.name}</h3>
                <p className="text-sm text-muted">
                  {c.productCount ? `${c.productCount} piece${c.productCount === 1 ? "" : "s"}` : "Coming soon"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-24 md:px-6">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle eyebrow="Curated" title="Loved from the studio" align="left" />
            <Link href="/shop" className="hidden items-center gap-1 text-sm font-medium hover:text-gold md:flex">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 4} />
            ))}
          </div>
          <div className="mt-10 text-center md:hidden">
            <Link href="/shop" className="btn btn-outline">
              View all pieces
            </Link>
          </div>
        </section>
      )}

      {/* How ordering works */}
      <section className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-cream px-6 py-14 md:px-14">
          <Lotus className="absolute -right-6 -top-6 h-40 text-ink/[0.05]" />
          <SectionTitle eyebrow="Simple & personal" title="How ordering works" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", icon: Gift, t: "Pick your pieces", s: "Add what you love to your bag. Want a different colour, size or name? Just add a note." },
              { n: "02", icon: WhatsAppIcon, t: "Send on WhatsApp", s: "Checkout sends your order straight to Kavita on WhatsApp — no sign-ups, no hassle." },
              { n: "03", icon: Package, t: "We make & ship", s: "We confirm, share payment details, and your piece is lovingly made and shipped to you." },
            ].map(({ n, icon: Icon, t, s }) => (
              <div key={n} className="relative rounded-3xl bg-paper p-7 shadow-sm">
                <span className="font-display text-5xl text-gold/40">{n}</span>
                <Icon className="mt-2 size-7 text-ink" />
                <h3 className="mt-4 font-display text-2xl font-semibold">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      {newest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-24 md:px-6">
          <SectionTitle eyebrow="Just made" title="Fresh from the work table" />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {newest.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Custom + AI split */}
      <section className="mx-auto mt-24 grid max-w-7xl gap-5 px-4 md:grid-cols-2 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink p-9 text-cream md:p-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(circle, #f3ead8 1.5px, transparent 2px)", backgroundSize: "24px 24px" }}
          />
          <p className="relative text-[12px] tracking-[0.3em] text-gold-2 uppercase">Made just for you</p>
          <h3 className="relative mt-3 font-display text-4xl leading-tight md:text-5xl">Custom creations</h3>
          <p className="relative mt-4 max-w-md text-cream/80">
            Name plates, wedding gifts, return gifts, a piece that matches your sofa — share your idea and we&apos;ll design it together.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href="/custom-order" className="btn btn-gold">
              Start a custom order
            </Link>
            <a href={waLink(settings.whatsappNumber, "Hi! I'd like a custom piece made 🎨")} target="_blank" rel="noreferrer" className="btn border border-cream/30 text-cream hover:bg-cream/10">
              <WhatsAppIcon className="size-4" /> Discuss on WhatsApp
            </a>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-cream to-cream-2 p-9 md:p-12">
          <Sparkles className="absolute right-8 top-8 size-10 text-gold animate-shimmer" />
          <p className="text-[12px] tracking-[0.3em] text-gold uppercase">AI powered</p>
          <h3 className="mt-3 font-display text-4xl leading-tight md:text-5xl">Not sure what to gift?</h3>
          <p className="mt-4 max-w-md text-muted">
            Answer three quick questions — occasion, who it&apos;s for and your budget — and our AI gift finder will suggest the perfect handmade piece.
          </p>
          <Link href="/gift-finder" className="btn btn-primary mt-8">
            <Gift className="size-4" /> Find a gift in 30 seconds
          </Link>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto mt-24 grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        <div className="relative mx-auto w-full max-w-md">
          <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] border-8 border-white shadow-2xl">
            <img src={settings.artistImage ? imgUrl(settings.artistImage, 800) : "/brand/brand-board.jpg"} alt={settings.artistName} className="size-full object-cover" loading="lazy" />
          </div>
          <div className="absolute -bottom-6 -right-2 rounded-2xl bg-ink px-5 py-4 text-cream shadow-xl md:-right-8">
            <p className="font-script text-3xl text-gold-2">Handmade</p>
            <p className="text-xs tracking-[0.25em]">WITH LOVE</p>
          </div>
        </div>
        <div>
          <p className="text-[12px] tracking-[0.3em] text-gold uppercase">Our story</p>
          <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{settings.aboutTitle}</h2>
          <div className="prose-ka mt-6 text-[16px] text-ink/80">
            {settings.aboutStory
              .split("\n")
              .filter(Boolean)
              .slice(0, 2)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
          <Link href="/about" className="btn btn-outline mt-4">
            Read our story <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-24 md:px-6">
          <SectionTitle eyebrow="Kind words" title="From happy homes" />
          <div className="no-scrollbar -mx-4 mt-10 flex snap-x gap-5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
            {testimonials.slice(0, 6).map((r) => (
              <figure key={r.id} className="card w-[82%] shrink-0 snap-start p-7 md:w-auto">
                <p className="text-gold">{"★".repeat(r.rating)}</p>
                <blockquote className="mt-3 font-display text-xl leading-snug">“{r.comment}”</blockquote>
                <figcaption className="mt-5 text-sm text-muted">
                  — {r.name}
                  {r.city ? `, ${r.city}` : ""}
                  {r.productName ? <span className="block text-xs">on {r.productName}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="mx-auto mt-24 max-w-4xl px-4 text-center md:px-6">
        <DotDivider className="text-gold" />
        <p className="mt-6 font-script text-4xl text-gold md:text-5xl">Art that adds happiness to your space</p>
        <p className="mx-auto mt-4 max-w-xl text-muted">Have a question, a wall that needs love, or a gift in mind? We&apos;re one message away.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            <HomeIcon className="size-4" /> Shop the collection
          </Link>
          <a href={waLink(settings.whatsappNumber, "Hi Kavita's Artistry! 🌸")} target="_blank" rel="noreferrer" className="btn btn-wa">
            <WhatsAppIcon className="size-4" /> WhatsApp us
          </a>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ eyebrow, title, align = "center" }: { eyebrow: string; title: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="text-[12px] tracking-[0.3em] text-gold uppercase">{eyebrow}</p>
      <h2 className="mt-2 font-display text-4xl font-medium md:text-5xl">{title}</h2>
    </div>
  );
}
