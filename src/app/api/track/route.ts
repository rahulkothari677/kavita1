import { handler } from "@/lib/api";
import { bumpProductCounter } from "@/lib/repo";
import { rateLimit } from "@/lib/ratelimit";

export const POST = handler(async (req: Request) => {
  const { productId, event } = await req.json();
  if (!productId || !rateLimit(req, `track:${productId}:${event}`, 3, 60 * 60 * 1000)) return { ok: true };
  await bumpProductCounter(String(productId), event === "whatsapp" ? "whatsappClicks" : "views");
  return { ok: true };
});
