import { listCustomRequests, listOrders, listProducts, listReviews } from "./repo";
import type { Order } from "./types";

export type Customer = { phone: string; name: string; city: string | null; orders: number; spent: number; lastOrder: string; firstOrder: string };

export function customersFrom(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const o of orders) {
    const key = o.phone.replace(/\D/g, "").slice(-10);
    const counted = o.status !== "CANCELLED";
    const c = map.get(key);
    if (!c) {
      map.set(key, { phone: o.phone, name: o.customerName, city: o.city, orders: counted ? 1 : 0, spent: counted ? o.total : 0, lastOrder: o.createdAt, firstOrder: o.createdAt });
    } else {
      if (counted) {
        c.orders += 1;
        c.spent += o.total;
      }
      if (o.createdAt > c.lastOrder) {
        c.lastOrder = o.createdAt;
        c.name = o.customerName;
        c.city = o.city ?? c.city;
      }
      if (o.createdAt < c.firstOrder) c.firstOrder = o.createdAt;
    }
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent);
}

export async function dashboardStats(days = 30) {
  const [orders, products, requests, reviews] = await Promise.all([listOrders(), listProducts(), listCustomRequests(), listReviews()]);
  const live = orders.filter((o) => o.status !== "CANCELLED");
  const since = Date.now() - days * 86400000;
  const prevSince = since - days * 86400000;
  const inRange = live.filter((o) => new Date(o.createdAt).getTime() >= since);
  const prevRange = live.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= prevSince && t < since;
  });
  const sum = (l: Order[]) => l.reduce((s, o) => s + o.total, 0);

  const daily: { date: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = inRange.filter((o) => o.createdAt.slice(0, 10) === key);
    daily.push({ date: key, revenue: sum(dayOrders), orders: dayOrders.length });
  }

  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of live)
    for (const it of o.items) {
      if (!it.productId) continue;
      const cur = productSales.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += it.price * it.quantity;
      productSales.set(it.productId, cur);
    }

  const statusCounts: Record<string, number> = {};
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  const customers = customersFrom(orders);
  const unpaid = live.filter((o) => o.paymentStatus !== "PAID" && o.status !== "PENDING");

  return {
    revenue: sum(inRange),
    revenuePrev: sum(prevRange),
    orders: inRange.length,
    ordersPrev: prevRange.length,
    aov: inRange.length ? Math.round(sum(inRange) / inRange.length) : 0,
    allTimeRevenue: sum(live),
    allTimeOrders: live.length,
    statusCounts,
    daily,
    pendingOrders: orders.filter((o) => o.status === "PENDING").slice(0, 6),
    toShip: orders.filter((o) => o.status === "CONFIRMED" || o.status === "IN_MAKING").length,
    unpaidAmount: sum(unpaid),
    unpaidCount: unpaid.length,
    topProducts: [...productSales.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    mostViewed: [...products].sort((a, b) => b.views + b.whatsappClicks * 3 - (a.views + a.whatsappClicks * 3)).slice(0, 5).map((p) => ({ id: p.id, name: p.name, views: p.views, clicks: p.whatsappClicks, image: p.images[0] ?? null })),
    lowStock: products.filter((p) => p.isActive && !p.madeToOrder && p.stock <= 1).map((p) => ({ id: p.id, name: p.name, stock: p.stock, image: p.images[0] ?? null })),
    productCount: products.length,
    activeProducts: products.filter((p) => p.isActive).length,
    demoProducts: products.filter((p) => p.isDemo).length,
    newRequests: requests.filter((r) => r.status === "NEW").length,
    pendingReviews: reviews.filter((r) => !r.isApproved).length,
    customers: customers.length,
    repeatCustomers: customers.filter((c) => c.orders > 1).length,
  };
}
