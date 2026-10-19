import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteProduct, patchProduct, saveProduct, type ProductInput } from "@/lib/repo";

/** Bulk actions on many products, or bulk-create from AI drafts. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { action, ids, patch, products } = (await req.json()) as { action: string; ids?: string[]; patch?: Record<string, unknown>; products?: ProductInput[] };
  if (action === "create") {
    const created = [];
    for (const p of (products ?? []).slice(0, 50)) if (p.name?.trim()) created.push(await saveProduct(p));
    return { created };
  }
  if (!ids?.length) bad("Nothing selected");
  for (const id of ids) {
    if (action === "delete") await deleteProduct(id);
    else if (action === "patch" && patch) await patchProduct(id, patch);
    else if (action === "price") {
      // percentage price change, e.g. {percent: 10} or {percent: -15}
      const pct = Number(patch?.percent ?? 0);
      const { getProductById } = await import("@/lib/repo");
      const p = await getProductById(id);
      if (p) await patchProduct(id, { price: Math.max(0, Math.round((p.price * (100 + pct)) / 100 / 10) * 10 - (pct ? 1 : 0)) });
    }
  }
  return { ok: true };
});
