import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { X } from "lucide-react";
import { categoryTree, listProducts, type ProductFilter } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { EmptyArt, Eyebrow } from "@/components/brand";
import { ProductCard } from "@/components/store/ProductCard";
import { SortSelect } from "@/components/store/SortSelect";

type SP = Promise<Record<string, string | undefined>>;

const PRICE_RANGES = [
  { key: "0-999", label: "Under ₹1,000", min: 0, max: 999 },
  { key: "1000-1999", label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { key: "2000-3499", label: "₹2,000 – ₹3,499", min: 2000, max: 3499 },
  { key: "3500-", label: "₹3,500 & above", min: 3500, max: undefined },
];

const SORTS = ["featured", "newest", "popular", "price-asc", "price-desc"] as const;

/** Editorial tile goes before the 8th piece, then every 12 pieces after that. */
const TILE_FIRST = 7;
const TILE_EVERY = 12;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const tree = await categoryTree({ activeOnly: true });
  const all = tree.flatMap((c) => [c, ...(c.children ?? [])]);
  const cat = all.find((c) => c.slug === sp.category);
  return { title: cat ? cat.name : sp.q ? `Search: ${sp.q}` : "Shop all handmade pieces", description: cat?.description ?? undefined };
}

/** "Lippan mirror art" → Lippan mirror <em>art</em> (one italic word per headline). */
function italicLast(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return <em>{name}</em>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <em>{last}</em>
    </>
  );
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [tree, settings] = await Promise.all([categoryTree({ activeOnly: true }), getSettings()]);
  const all = tree.flatMap((c) => [c, ...(c.children ?? [])]);
  const current = all.find((c) => c.slug === sp.category) ?? null;
  const parent = current?.parentId ? (tree.find((t) => t.id === current.parentId) ?? null) : current ? (tree.find((t) => t.id === current.id) ?? null) : null;
  const range = PRICE_RANGES.find((r) => r.key === sp.price);
  const sort: NonNullable<ProductFilter["sort"]> = SORTS.includes(sp.sort as (typeof SORTS)[number]) ? (sp.sort as (typeof SORTS)[number]) : "featured";

  const products = await listProducts({
    activeOnly: true,
    category: sp.category,
    search: sp.q,
    sort,
    minPrice: range?.min,
    maxPrice: range?.max,
    inStockOnly: sp.stock === "1",
  });

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };

  const filtered = Boolean(sp.category || sp.price || sp.stock === "1" || sp.q);
  const title = sp.q ? (
    <>
      Results for <em>“{sp.q}”</em>
    </>
  ) : current ? (
    italicLast(current.name)
  ) : (
    <>
      Every piece, <em>by hand</em>
    </>
  );
  const intro = sp.q
    ? `${products.length} ${products.length === 1 ? "piece matches" : "pieces match"} your search.`
    : current?.description || "Each piece is made by hand in our home studio, so no two are exactly alike.";

  return (
    <div className="container-x">
      <header className="pt-6 pb-8 lg:pt-10 lg:pb-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              {current || sp.q ? (
                <Link href="/shop" className="hover:text-ink">
                  Shop
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  Shop
                </span>
              )}
            </li>
            {parent && current && parent.id !== current.id && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={href({ category: parent.slug })} className="hover:text-ink">
                    {parent.name}
                  </Link>
                </li>
              </>
            )}
            {(current || sp.q) && (
              <>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-ink">
                  {current ? current.name : "Search"}
                </li>
              </>
            )}
          </ol>
        </nav>
        <h1 className="t-h1 mt-5 max-w-[18ch]">{title}</h1>
        <p className="t-body-lg mt-4 max-w-[52ch] text-ink-2">{intro}</p>
      </header>

      {/* Filters */}
      <div className="space-y-3">
        <ChipRow label="Crafts">
          <Chip href={href({ category: undefined })} active={!sp.category}>
            All
          </Chip>
          {tree.map((c) => (
            <Chip key={c.id} href={href({ category: c.slug })} active={parent?.id === c.id}>
              {c.name}
            </Chip>
          ))}
        </ChipRow>
        {parent && parent.children && parent.children.length > 0 && (
          <ChipRow label={`${parent.name} types`}>
            <Chip href={href({ category: parent.slug })} active={current?.id === parent.id}>
              All {parent.name.toLowerCase()}
            </Chip>
            {parent.children.map((s) => (
              <Chip key={s.id} href={href({ category: s.slug })} active={current?.id === s.id}>
                {s.name}
              </Chip>
            ))}
          </ChipRow>
        )}
        <ChipRow label="Price and availability">
          {PRICE_RANGES.map((r) => (
            <Chip key={r.key} href={href({ price: sp.price === r.key ? undefined : r.key })} active={sp.price === r.key} removable>
              {r.label}
            </Chip>
          ))}
          <Chip href={href({ stock: sp.stock === "1" ? undefined : "1" })} active={sp.stock === "1"} removable>
            Ready to ship
          </Chip>
        </ChipRow>
      </div>

      <div className="hairline-b mt-5 flex items-center justify-between gap-4 pb-2">
        <p className="tabular text-[14px] text-muted" aria-live="polite">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
          {filtered && (
            <>
              {" · "}
              <Link href="/shop" scroll={false} className="link text-ink">
                Clear all
              </Link>
            </>
          )}
        </p>
        <Suspense fallback={<span className="h-11 w-40" />}>
          <SortSelect value={sort} />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center lg:py-28">
          <EmptyArt kind="plate" />
          <h2 className="font-display mt-6 text-[24px] leading-tight">Nothing on this wall yet</h2>
          <p className="mt-2 max-w-[40ch] text-[15px] text-muted">Try another filter, or ask for a piece made just for you.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/custom-order" className="btn btn-primary">
              Commission a piece
            </Link>
            <Link href="/shop" className="link text-[15px] font-medium">
              {filtered ? "Clear filters" : "View all pieces"} <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      ) : (
        <ul
          className="mt-8 grid grid-flow-row-dense grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 md:gap-y-10 lg:mt-10 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-12"
          aria-label="Pieces"
        >
          {products.map((p, i) => {
            const tileIndex = i >= TILE_FIRST && (i - TILE_FIRST) % TILE_EVERY === 0 ? (i - TILE_FIRST) / TILE_EVERY : -1;
            return (
              <Fragment key={p.id}>
                {tileIndex >= 0 && (
                  <li className="col-span-2">
                    {tileIndex % 2 === 0 ? <CommissionTile artistName={settings.artistName} /> : <CraftTile />}
                  </li>
                )}
                <li>
                  <ProductCard p={p} priority={i < 4} />
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="-mx-4 sm:-mx-6 md:mx-0">
      <ul
        aria-label={label}
        className={`no-scrollbar flex snap-x snap-mandatory scroll-px-4 -my-1 gap-2 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-24px),transparent)] sm:scroll-px-6 sm:px-6 md:flex-wrap md:overflow-visible md:px-0 md:[mask-image:none]`}
      >
        {children}
      </ul>
    </div>
  );
}

function Chip({ href, active, children, removable }: { href: string; active?: boolean; children: React.ReactNode; removable?: boolean }) {
  return (
    <li className="shrink-0 snap-start">
      <Link href={href} scroll={false} data-active={active ? "true" : undefined} aria-current={active ? "true" : undefined} className="chip">
        {children}
        {active && removable && <X aria-hidden className="-mr-1 size-3.5" strokeWidth={2} />}
      </Link>
    </li>
  );
}

function CommissionTile({ artistName }: { artistName: string }) {
  return (
    <div className="flex h-full flex-col justify-between gap-8 rounded-[2px] bg-plinth p-6 sm:p-8 lg:p-10">
      <div>
        <Eyebrow>Commissions</Eyebrow>
        <h2 className="t-h3 mt-4 max-w-[18ch]">
          Not quite <em>the one</em>?
        </h2>
        <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-ink-2">
          Share the size, colours and the wall it’s for. {artistName || "We"} will make it by hand, just for you.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/custom-order" className="btn btn-primary">
          Commission a piece
        </Link>
        <Link href="/gift-finder" className="link text-[15px] font-medium">
          Or find a gift <span className="arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

function CraftTile() {
  return (
    <div className="on-dark flex h-full flex-col justify-between gap-8 rounded-[2px] bg-ink-deep p-6 text-on-dark sm:p-8 lg:p-10">
      <div>
        <Eyebrow>The craft</Eyebrow>
        <h2 className="t-h3 mt-4 max-w-[18ch]">
          Mud, mirror and a <em>steady</em> hand.
        </h2>
        <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-muted-on-dark">
          Lippan is relief work from Kutch, Gujarat: clay shaped by hand, with small mirrors set in one at a time. It’s slow work, and that’s the point.
        </p>
      </div>
      <Link href="/about" className="link self-start text-[15px] font-medium">
        Read our story <span className="arrow">→</span>
      </Link>
    </div>
  );
}
