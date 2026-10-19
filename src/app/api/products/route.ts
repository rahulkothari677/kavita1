import { handler } from "@/lib/api";
import { getProductsByIds, listProducts } from "@/lib/repo";
import type { Product } from "@/lib/types";

const card = (p: Product) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  images: p.images.slice(0, 2),
  badge: p.badge,
  stock: p.stock,
  madeToOrder: p.madeToOrder,
  customizable: p.customizable,
  categoryName: p.categoryName,
  rating: p.rating,
  reviewCount: p.reviewCount,
});

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const ids = url.searchParams.get("ids");
  if (ids) {
    const list = ids.split(",").filter(Boolean).slice(0, 24);
    const found = (await getProductsByIds(list)).filter((p) => p.isActive);
    return { products: list.map((id) => found.find((p) => p.id === id)).filter(Boolean).map((p) => card(p!)) };
  }
  const q = url.searchParams.get("q") ?? undefined;
  const products = await listProducts({ activeOnly: true, search: q, limit: Number(url.searchParams.get("limit")) || 8, sort: q ? "popular" : "featured" });
  return { products: products.map(card) };
});
