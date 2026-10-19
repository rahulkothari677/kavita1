import { handler, bad } from "@/lib/api";
import { createOrder, evaluateCoupon, getProductsByIds, makeOrderNumber } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { calcTotals } from "@/lib/pricing";
import { orderMessageForShop, waLink } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/ratelimit";
import { siteUrl } from "@/lib/site";
import type { OrderItem } from "@/lib/types";

type Body = {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
  items: { productId: string; quantity: number; note?: string }[];
  couponCode?: string;
  giftWrap?: boolean;
  giftMessage?: string;
};

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");

export const POST = handler(async (req: Request) => {
  if (!rateLimit(req, "order", 10, 60 * 60 * 1000)) bad("Too many orders from this device. Please message us on WhatsApp.", 429);
  const b = (await req.json()) as Body;
  if (!clip(b.customerName, 80) || clip(b.phone, 20).replace(/\D/g, "").length < 10) bad("Please enter your name and a valid phone number.");
  if (!Array.isArray(b.items) || b.items.length === 0) bad("Your bag is empty.");

  const settings = await getSettings();
  const products = await getProductsByIds(b.items.slice(0, 50).map((i) => String(i.productId)));
  const items: OrderItem[] = [];
  for (const it of b.items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p || !p.isActive) bad("One of the items in your bag is no longer available. Please refresh and try again.");
    const qty = Math.max(1, Math.min(50, Math.floor(Number(it.quantity) || 1)));
    if (!p.madeToOrder && p.stock < qty) bad(`Only ${p.stock} of “${p.name}” left in stock.`);
    items.push({ productId: p.id, name: p.name, image: p.images[0] ?? null, price: p.price, quantity: qty, note: clip(it.note, 200) || undefined });
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  let discount = 0;
  let couponCode: string | null = null;
  if (b.couponCode) {
    const c = await evaluateCoupon(b.couponCode, subtotal);
    if ("error" in c) bad(c.error);
    discount = c.discount;
    couponCode = c.code;
  }
  const t = calcTotals({ subtotal, shippingFee: settings.shippingFee, freeShippingAbove: settings.freeShippingAbove, discount, giftWrap: b.giftWrap, giftWrapFee: settings.giftWrapFee });
  if (b.giftWrap) items.push({ productId: null, name: "🎁 Gift wrap + handwritten card", image: null, price: t.giftWrap, quantity: 1 });

  const notes = [clip(b.notes, 500), b.giftWrap && clip(b.giftMessage, 240) ? `Gift card message: “${clip(b.giftMessage, 240)}”` : ""].filter(Boolean).join("\n") || null;
  const orderNumber = makeOrderNumber();
  const order = {
    orderNumber,
    customerName: clip(b.customerName, 80),
    phone: clip(b.phone, 20),
    email: clip(b.email, 120) || null,
    address: clip(b.address, 300) || null,
    city: clip(b.city, 60) || null,
    state: clip(b.state, 60) || null,
    pincode: clip(b.pincode, 10) || null,
    notes,
    items,
    subtotal: subtotal + t.giftWrap,
    shipping: t.shipping,
    discount: t.discount,
    couponCode,
    total: t.total,
    status: "PENDING" as const,
    paymentStatus: "UNPAID" as const,
    paymentMethod: null,
    courier: null,
    trackingNumber: null,
    source: "website",
    adminNotes: null,
  };
  await createOrder(order);
  const message = orderMessageForShop(order, await siteUrl());
  return { orderNumber, waUrl: waLink(settings.whatsappNumber, message) };
});
