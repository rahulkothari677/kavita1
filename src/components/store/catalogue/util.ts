import { imgUrl } from "@/lib/format";

/**
 * src + srcSet for a product image. Cloudinary URLs get width variants; any other URL
 * (local demo photos, external hosts) is served as-is with no srcSet.
 */
export function productImg(url: string | null | undefined, widths: number[]) {
  const largest = widths[widths.length - 1];
  const src = imgUrl(url, largest);
  const resizable = imgUrl(url, widths[0]) !== src;
  return { src, srcSet: resizable ? widths.map((w) => `${imgUrl(url, w)} ${w}w`).join(", ") : undefined };
}

/** Sizes attribute for product grid cards (2 / 3 / 4 columns). */
export const CARD_SIZES = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw";

/** Mirror-work pieces get the once-per-hover glint. */
export function isMirrorWork(p: { name: string; categoryName?: string | null; tags?: string[] | null }) {
  const hay = [p.name, p.categoryName ?? "", ...(p.tags ?? [])].join(" ").toLowerCase();
  return hay.includes("mirror") || hay.includes("lippan");
}

/** Shared view-transition name for the card → product page image morph. */
export const morphName = (id: string) => `product-${id}`;

/** "Made to order in 7–10 days" from the product's lead time. */
export function leadTimeLabel(leadTimeDays: number | null | undefined) {
  const d = leadTimeDays ?? 7;
  return `${d}–${d + 3} days`;
}
