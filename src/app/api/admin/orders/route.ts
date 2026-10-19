import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createOrder, getProductsByIds, listOrders } from "@/lib/repo";
import type { Order, OrderItem } from "@/lib/types";

export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const u = new URL(req.url);
  return { orders: await listOrders({ status: u.searchParams.get("status") ?? undefined, search: u.searchParams.get("q") ?? undefined }) };
});

/** Manual order entry — for orders received directly on WhatsApp, Instagram, exhibitions etc. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = (await req.json()) as Partial<Order> & { items: OrderItem[] };
  if (!b.customerName?.trim() || !b.phone?.trim()) bad("Customer name and phone are required");
  if (!b.items?.length) bad("Add at least one item");
  const products = await getProductsByIds(b.items.map((i) => i.productId).filter(Boolean) as string[]);
  const items = b.items.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    return { productId: p?.id ?? null, name: i.name || p?.name || "Item", image: i.image ?? p?.images[0] ?? null, price: Math.round(Number(i.price) || 0), quantity: Math.max(1, Number(i.quantity) || 1), note: i.note };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = Math.round(Number(b.shipping) || 0);
  const discount = Math.round(Number(b.discount) || 0);
  return createOrder({
    customerName: b.customerName.trim(),
    phone: b.phone.trim(),
    email: b.email || null,
    address: b.address || null,
    city: b.city || null,
    state: b.state || null,
    pincode: b.pincode || null,
    notes: b.notes || null,
    items,
    subtotal,
    shipping,
    discount,
    couponCode: null,
    total: Math.max(0, subtotal + shipping - discount),
    status: b.status ?? "CONFIRMED",
    paymentStatus: b.paymentStatus ?? "UNPAID",
    paymentMethod: b.paymentMethod || null,
    courier: null,
    trackingNumber: null,
    source: b.source || "whatsapp",
    adminNotes: b.adminNotes || null,
  });
});
