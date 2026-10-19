import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listCustomRequests } from "@/lib/repo";

export const GET = handler(async () => {
  await requireAdmin();
  return { requests: await listCustomRequests() };
});
