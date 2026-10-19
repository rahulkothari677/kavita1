import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { customersFrom } from "@/lib/analytics";
import { listOrders } from "@/lib/repo";

export const GET = handler(async () => {
  await requireAdmin();
  return { customers: customersFrom(await listOrders()) };
});
