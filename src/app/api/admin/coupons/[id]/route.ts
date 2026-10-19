import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteCoupon } from "@/lib/repo";

export const DELETE = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  await deleteCoupon((await params).id);
  return { ok: true };
});
