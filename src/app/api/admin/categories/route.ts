import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { categoryTree, upsertCategory } from "@/lib/repo";
import { run } from "@/lib/db";

export const GET = handler(async () => {
  await requireAdmin();
  return { categories: await categoryTree() };
});

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const body = await req.json();
  if (body.action === "reorder") {
    // body.order: ids in the new order
    const ids = (body.order as string[]) ?? [];
    for (let i = 0; i < ids.length; i++) await run("UPDATE Category SET sortOrder = ? WHERE id = ?", [i, ids[i]]);
    return { ok: true };
  }
  if (!body.name?.trim()) bad("Category name is required");
  return { id: await upsertCategory(body) };
});
