import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { dashboardStats } from "@/lib/analytics";

export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const days = Number(new URL(req.url).searchParams.get("days")) || 30;
  return dashboardStats(Math.min(365, Math.max(7, days)));
});
