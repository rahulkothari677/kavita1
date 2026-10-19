import type { MetadataRoute } from "next";
import { categoryTree, listProducts } from "@/lib/repo";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const [products, cats] = await Promise.all([listProducts({ activeOnly: true }), categoryTree({ activeOnly: true })]);
  const pages = ["", "/shop", "/custom-order", "/gift-finder", "/about", "/faq", "/credits", "/policies/shipping", "/policies/returns", "/policies/care"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...cats.flatMap((c) => [c, ...(c.children ?? [])]).map((c) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
