import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteCategory, upsertCategory } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const body = await req.json();
  if (!body.name?.trim()) bad("Category name is required");
  return { id: await upsertCategory({ ...body, id: (await params).id }) };
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await deleteCategory((await params).id);
  return { ok: true };
});
