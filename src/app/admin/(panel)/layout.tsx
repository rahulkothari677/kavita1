import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio Admin", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const [row] = await query<{ o: number; r: number; v: number }>(
    `SELECT (SELECT COUNT(*) FROM "Order" WHERE status = 'PENDING') AS o,
            (SELECT COUNT(*) FROM CustomRequest WHERE status = 'NEW') AS r,
            (SELECT COUNT(*) FROM Review WHERE isApproved = 0) AS v`,
  );
  return <AdminShell counts={{ pendingOrders: Number(row?.o ?? 0), newRequests: Number(row?.r ?? 0), pendingReviews: Number(row?.v ?? 0) }}>{children}</AdminShell>;
}
