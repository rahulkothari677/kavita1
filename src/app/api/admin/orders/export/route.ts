import { requireAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/repo";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const orders = await listOrders();
  const header = ["Order", "Date", "Status", "Payment", "Customer", "Phone", "Email", "Address", "City", "State", "Pincode", "Items", "Subtotal", "Shipping", "Discount", "Total", "Source", "Courier", "Tracking", "Notes"];
  const rows = orders.map((o) =>
    [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString("en-IN"),
      o.status,
      o.paymentStatus,
      o.customerName,
      o.phone,
      o.email,
      o.address,
      o.city,
      o.state,
      o.pincode,
      o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
      o.subtotal,
      o.shipping,
      o.discount,
      o.total,
      o.source,
      o.courier,
      o.trackingNumber,
      o.notes,
    ]
      .map(esc)
      .join(","),
  );
  return new Response("﻿" + [header.map(esc).join(","), ...rows].join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
