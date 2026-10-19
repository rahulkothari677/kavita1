import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteReview, updateReview } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  await updateReview((await params).id, await req.json());
  return { ok: true };
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await deleteReview((await params).id);
  return { ok: true };
});
