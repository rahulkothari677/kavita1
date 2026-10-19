import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listProducts, saveProduct, type ProductInput } from "@/lib/repo";

export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const u = new URL(req.url);
  const products = await listProducts({ search: u.searchParams.get("q") ?? undefined, sort: "newest" });
  return { products };
});

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const body = (await req.json()) as ProductInput;
  if (!body.name?.trim()) bad("Product name is required");
  return saveProduct(body);
});
