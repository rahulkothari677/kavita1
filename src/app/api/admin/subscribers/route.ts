import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listSubscribers } from "@/lib/repo";

export const GET = handler(async () => {
  await requireAdmin();
  return { subscribers: await listSubscribers() };
});
