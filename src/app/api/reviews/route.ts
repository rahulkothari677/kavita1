import { handler, bad } from "@/lib/api";
import { createReview, getOrder } from "@/lib/repo";
import { rateLimit } from "@/lib/ratelimit";

export const POST = handler(async (req: Request) => {
  if (!rateLimit(req, "review", 5, 60 * 60 * 1000)) bad("Too many reviews. Please try later.", 429);
  const b = await req.json();
  const name = String(b.name ?? "").trim().slice(0, 60);
  const comment = String(b.comment ?? "").trim().slice(0, 1200);
  if (!name || !comment) bad("Please add your name and a few words.");
  let productId: string | null = b.productId ? String(b.productId) : null;
  if (!productId && b.orderNumber) {
    const o = await getOrder(String(b.orderNumber));
    productId = o?.items.find((i) => i.productId)?.productId ?? null;
  }
  await createReview({ productId, name, city: b.city ? String(b.city).slice(0, 40) : null, rating: Number(b.rating) || 5, comment });
  return { ok: true };
});
