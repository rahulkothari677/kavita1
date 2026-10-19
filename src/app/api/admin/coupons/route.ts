import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listCoupons, saveCoupon } from "@/lib/repo";

export const GET = handler(async () => {
  await requireAdmin();
  return { coupons: await listCoupons() };
});

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await req.json();
  if (!b.code || !b.value) bad("Code and value are required");
  try {
    return { id: await saveCoupon(b) };
  } catch {
    bad("That code already exists");
  }
});
