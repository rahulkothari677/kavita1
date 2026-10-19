import { listProducts } from "./repo";
import type { Product, StoreSettings } from "./types";

/** Compact catalogue description fed to the AI so it can recommend real products. */
export async function catalogContext(limit = 120) {
  const products = await listProducts({ activeOnly: true, sort: "featured", limit });
  const lines = products.map(
    (p) =>
      `${p.id} | ${p.name} | ${p.categoryName ?? "-"} | ₹${p.price} | ${p.stock > 0 ? "in stock" : p.madeToOrder ? `made to order (${p.leadTimeDays ?? 7}+ days)` : "sold out"}${p.customizable ? " | personalisable" : ""} | ${[...p.tags, ...p.colors].join(", ")} | ${p.shortDescription.slice(0, 110)}`,
  );
  return { products, text: lines.join("\n") };
}

export function storeFacts(s: StoreSettings) {
  return `Store facts:
- Ordering: customers add items to bag and checkout; the order is sent to us on WhatsApp where we confirm and share payment details (UPI/bank transfer). No online card payment.
- Shipping: ₹${s.shippingFee}${s.freeShippingAbove ? `, free above ₹${s.freeShippingAbove}` : ""}. ${s.shippingPolicy}
- Returns: ${s.returnPolicy}
- Custom orders are welcome via the Custom Order page (/custom-order) or WhatsApp.
- Gift wrap with handwritten card available at checkout${s.giftWrapFee ? ` for ₹${s.giftWrapFee}` : ""}.
- Care: ${s.careGuide}`;
}

/** Simple keyword fallback when no AI key is configured. */
export function keywordMatch(products: Product[], text: string, max = 4) {
  const words = text.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  const budget = Number((text.match(/(?:₹|rs\.?|under|below)\s*([0-9][0-9,]*)/i)?.[1] ?? "").replace(/,/g, "")) || 0;
  const scored = products
    .filter((p) => !budget || p.price <= budget)
    .map((p) => {
      const hay = `${p.name} ${p.categoryName} ${p.tags.join(" ")} ${p.colors.join(" ")} ${p.shortDescription}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) + (p.isBestseller ? 0.5 : 0) + (p.isFeatured ? 0.3 : 0);
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.p);
}

export const toMini = (p: Product) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null });
