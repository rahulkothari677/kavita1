import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteProduct, duplicateProduct, getProductById, patchProduct, saveProduct, type ProductInput } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const p = await getProductById((await params).id);
  if (!p) bad("Not found", 404);
  return { product: p };
});

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const body = (await req.json()) as ProductInput;
  if (!body.name?.trim()) bad("Product name is required");
  return saveProduct(body, (await params).id);
});

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();
  if (body.action === "duplicate") return duplicateProduct(id);
  await patchProduct(id, body);
  return { ok: true };
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await deleteProduct((await params).id);
  return { ok: true };
});
