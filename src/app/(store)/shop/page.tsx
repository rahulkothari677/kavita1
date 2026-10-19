import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { categoryTree, listProducts } from "@/lib/repo";
import { ProductCard } from "@/components/store/ProductCard";
import { SortSelect } from "@/components/store/SortSelect";
import { Lotus } from "@/components/Motifs";

type SP = Promise<Record<string, string | undefined>>;

const PRICE_RANGES = [
  { key: "0-999", label: "Under ₹1,000", min: 0, max: 999 },
  { key: "1000-1999", label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { key: "2000-3499", label: "₹2,000 – ₹3,499", min: 2000, max: 3499 },
  { key: "3500-", label: "₹3,500 & above", min: 3500, max: undefined },
];

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const tree = await categoryTree({ activeOnly: true });
  const all = tree.flatMap((c) => [c, ...(c.children ?? [])]);
  const cat = all.find((c) => c.slug === sp.category);
  return { title: cat ? cat.name : sp.q ? `Search: ${sp.q}` : "Shop all handmade pieces", description: cat?.description ?? undefined };
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const tree = await categoryTree({ activeOnly: true });
  const all = tree.flatMap((c) => [c, ...(c.children ?? [])]);
  const current = all.find((c) => c.slug === sp.category) ?? null;
  const parent = current?.parentId ? tree.find((t) => t.id === current.parentId) : current && tree.find((t) => t.id === current.id);
  const range = PRICE_RANGES.find((r) => r.key === sp.price);
  const sort = (sp.sort as "featured") || "featured";

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

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/10 bg-tint/70">
        <Lotus className="absolute -right-8 top-4 h-48 text-ink/[0.04]" />
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <nav className="mb-3 text-xs text-muted">
            <Link href="/">Home</Link> / <Link href="/shop">Shop</Link>
            {parent && current && parent.id !== current.id && (
              <>
                {" "}/ <Link href={href({ category: parent.slug })}>{parent.name}</Link>
              </>
            )}
            {current && <> / {current.name}</>}
          </nav>
          <h1 className="font-display text-5xl font-medium md:text-6xl">{sp.q ? `“${sp.q}”` : current ? current.name : "All handmade pieces"}</h1>
          <p className="mt-3 max-w-2xl text-muted">
            {current?.description || "Every piece is made by hand in our home studio — no two are exactly alike."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Category chips */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-6 md:mx-0 md:flex-wrap md:px-0">
          <Chip href={href({ category: undefined })} active={!sp.category}>
            All
          </Chip>
          {tree.map((c) => (
            <Chip key={c.id} href={href({ category: c.slug })} active={parent?.id === c.id}>
              {c.name}
            </Chip>
          ))}
        </div>
        {parent && parent.children && parent.children.length > 0 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-3 md:mx-0 md:flex-wrap md:px-0">
            <Chip small href={href({ category: parent.slug })} active={current?.id === parent.id}>
              All {parent.name}
            </Chip>
            {parent.children.map((s) => (
              <Chip small key={s.id} href={href({ category: s.slug })} active={current?.id === s.id}>
                {s.name}
              </Chip>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-ink/10 pb-5">
          {PRICE_RANGES.map((r) => (
            <Chip small key={r.key} href={href({ price: sp.price === r.key ? undefined : r.key })} active={sp.price === r.key}>
              {r.label}
            </Chip>
          ))}
          <Chip small href={href({ stock: sp.stock === "1" ? undefined : "1" })} active={sp.stock === "1"}>
            Available now
          </Chip>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted">{products.length} pieces</span>
            <Suspense>
              <SortSelect value={sort} />
            </Suspense>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-3xl">Nothing here yet</p>
            <p className="mt-2 text-muted">Try another filter — or ask us to make it for you!</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/shop" className="btn btn-outline">
                Clear filters
              </Link>
              <Link href="/custom-order" className="btn btn-primary">
                Request a custom piece
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ href, active, children, small }: { href: string; active?: boolean; children: React.ReactNode; small?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`shrink-0 rounded-full border transition ${small ? "px-3.5 py-1.5 text-[13px]" : "px-4 py-2 text-sm"} ${
        active ? "border-ink bg-ink text-on-ink" : "border-ink/15 bg-white hover:border-ink/40"
      }`}
    >
      {children}
    </Link>
  );
}
