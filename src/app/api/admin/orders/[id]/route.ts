import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteOrder, getOrder, updateOrder } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const o = await getOrder((await params).id);
  if (!o) bad("Order not found", 404);
  return { order: o };
});

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const o = await updateOrder((await params).id, await req.json());
  if (!o) bad("Order not found", 404);
  return { order: o };
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await deleteOrder((await params).id);
  return { ok: true };
});
