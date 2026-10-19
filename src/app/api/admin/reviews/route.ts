import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createReview, listReviews } from "@/lib/repo";

export const GET = handler(async () => {
  await requireAdmin();
  return { reviews: await listReviews() };
});

/** Admin can add testimonials received on WhatsApp/Instagram. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await req.json();
  if (!b.name || !b.comment) bad("Name and review are required");
  return { id: await createReview({ ...b, productId: b.productId || null, isApproved: true }) };
});
