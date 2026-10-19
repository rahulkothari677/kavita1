import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteDemoProducts } from "@/lib/repo";

export const DELETE = handler(async () => {
  await requireAdmin();
  await deleteDemoProducts();
  return { ok: true };
});
