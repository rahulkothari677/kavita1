import type { Order, OrderItem } from "./types";
import { cleanPhone, formatINR } from "./format";

export function waLink(number: string, text: string) {
  return `https://wa.me/${cleanPhone(number)}?text=${encodeURIComponent(text)}`;
}

function itemLines(items: OrderItem[]) {
  return items
    .map((i, n) => `${n + 1}. ${i.name} × ${i.quantity} — ${formatINR(i.price * i.quantity)}${i.note ? `\n   ✏️ ${i.note}` : ""}`)
    .join("\n");
}

/** Message the customer sends to the shop when placing an order. */
export function orderMessageForShop(o: Pick<Order, "orderNumber" | "customerName" | "phone" | "address" | "city" | "state" | "pincode" | "notes" | "items" | "subtotal" | "shipping" | "discount" | "couponCode" | "total">, siteUrl?: string) {
  const addr = [o.address, o.city, o.state, o.pincode].filter(Boolean).join(", ");
  return [
    `🪔 *New Order — ${o.orderNumber}*`,
    ``,
    `Hello Kavita's Artistry! I'd like to order:`,
    ``,
    itemLines(o.items),
    ``,
    `Subtotal: ${formatINR(o.subtotal)}`,
    o.discount ? `Discount${o.couponCode ? ` (${o.couponCode})` : ""}: −${formatINR(o.discount)}` : null,
    `Shipping: ${o.shipping ? formatINR(o.shipping) : "Free"}`,
    `*Total: ${formatINR(o.total)}*`,
    ``,
    `👤 ${o.customerName}`,
    `📞 ${o.phone}`,
    addr ? `📍 ${addr}` : null,
    o.notes ? `📝 ${o.notes}` : null,
    siteUrl ? `\nTrack: ${siteUrl}/track?order=${o.orderNumber}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function productEnquiryMessage(name: string, price: number, url: string) {
  return `Hi! I'm interested in *${name}* (${formatINR(price)}).\n${url}\n\nIs it available?`;
}

/** Templates the admin sends to customers. */
export const CUSTOMER_TEMPLATES: { key: string; label: string; build: (o: Order, extra: { storeName: string; upiId?: string; siteUrl?: string }) => string }[] = [
  {
    key: "confirm",
    label: "Confirm order + payment details",
    build: (o, x) =>
      `Hi ${o.customerName.split(" ")[0]} 🌸\n\nThank you for ordering from ${x.storeName}! Your order *${o.orderNumber}* is confirmed.\n\n${itemLines(o.items)}\n\n*Total: ${formatINR(o.total)}*\n\n${x.upiId ? `You can pay via UPI to: *${x.upiId}*\nPlease share a screenshot once done 🙏` : "We'll share payment details shortly."}`,
  },
  {
    key: "payment",
    label: "Payment received",
    build: (o, x) => `Hi ${o.customerName.split(" ")[0]}, we've received your payment of ${formatINR(o.total)} for order *${o.orderNumber}* ✅\n\nYour piece is now being lovingly made. We'll update you soon!\n— ${x.storeName}`,
  },
  {
    key: "making",
    label: "Being made (progress update)",
    build: (o, x) => `Hi ${o.customerName.split(" ")[0]} 🎨\n\nA little update — your order *${o.orderNumber}* is on my work table right now! Mirrors are going in one by one ✨\n\n— ${x.storeName}`,
  },
  {
    key: "shipped",
    label: "Shipped with tracking",
    build: (o, x) =>
      `Hi ${o.customerName.split(" ")[0]} 📦\n\nYour order *${o.orderNumber}* has been shipped!${o.courier ? `\nCourier: ${o.courier}` : ""}${o.trackingNumber ? `\nTracking no: ${o.trackingNumber}` : ""}\n\nPlease record an unboxing video when it arrives. Thank you for supporting handmade 💛\n— ${x.storeName}`,
  },
  {
    key: "delivered",
    label: "Delivered — ask for review",
    build: (o, x) =>
      `Hi ${o.customerName.split(" ")[0]} 💛\n\nHope your piece reached safely and is brightening your home! Would you share a photo or a short review? It means the world to a small studio like ours.${x.siteUrl ? `\n\nReview here: ${x.siteUrl}/review?order=${o.orderNumber}` : ""}\n\n— ${x.storeName}`,
  },
];
