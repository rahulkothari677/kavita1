import { handler, bad } from "@/lib/api";
import { findOrdersForTracking } from "@/lib/repo";
import { rateLimit } from "@/lib/ratelimit";

export const GET = handler(async (req: Request) => {
  if (!rateLimit(req, "trackorder", 20, 60 * 60 * 1000)) bad("Too many attempts", 429);
  const u = new URL(req.url);
  const found = await findOrdersForTracking(u.searchParams.get("order") ?? "", u.searchParams.get("phone") ?? "");
  if (!found.length) bad("Not found", 404);
  return { ok: true };
});
