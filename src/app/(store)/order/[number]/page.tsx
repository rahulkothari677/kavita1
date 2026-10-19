import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getOrder } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import { formatDate, formatINR, imgUrl } from "@/lib/format";
import { orderMessageForShop, waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/Motifs";
import { siteUrl } from "@/lib/site";
import { AutoOpenWhatsApp } from "@/components/store/AutoOpenWhatsApp";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ placed?: string; p?: string; wa?: string }> }) {
  const { number } = await params;
  const sp = await searchParams;
  const order = await getOrder(number);
  // Orders are only visible with the matching phone number (privacy)
  const digits = (sp.p ?? "").replace(/\D/g, "").slice(-10);
  if (!order || !digits || order.phone.replace(/\D/g, "").slice(-10) !== digits) notFound();
  const settings = await getSettings();
  const resend = waLink(settings.whatsappNumber, orderMessageForShop(order, await siteUrl()));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      {sp.wa && <AutoOpenWhatsApp url={resend} orderNumber={order.orderNumber} />}
      {sp.placed && (
        <div className="mb-10 text-center">
          <CheckCircle2 className="mx-auto size-16 text-wa" strokeWidth={1.3} />
          <h1 className="mt-4 font-display text-5xl">Thank you, {order.customerName.split(" ")[0]}!</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Your order <b className="text-ink">{order.orderNumber}</b> is saved. Please make sure you pressed <b>send</b> on WhatsApp — we&apos;ll confirm and share payment details there.
          </p>
          <a href={resend} target="_blank" rel="noreferrer" className="btn btn-wa mt-6">
            <WhatsAppIcon className="size-5" /> Didn&apos;t open? Send on WhatsApp
          </a>
        </div>
      )}
      <div className="card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted uppercase">Order</p>
            <p className="font-display text-3xl">{order.orderNumber}</p>
            <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
          </div>
          <p className="text-2xl font-semibold">{formatINR(order.total)}</p>
        </div>
        <div className="mt-8">
          <OrderTimeline status={order.status} history={order.history} />
        </div>
        {(order.courier || order.trackingNumber) && (
          <div className="mt-6 rounded-2xl bg-tint p-4 text-sm">
            📦 Shipped via <b>{order.courier ?? "courier"}</b>
            {order.trackingNumber && (
              <>
                {" "}· Tracking no. <b className="select-all">{order.trackingNumber}</b>
              </>
            )}
          </div>
        )}
        <ul className="mt-8 divide-y divide-ink/10 border-t border-ink/10">
          {order.items.map((i, n) => (
            <li key={n} className="flex items-center gap-3 py-3">
              {i.image ? <img src={imgUrl(i.image, 120)} alt="" className="size-14 rounded-xl object-cover" /> : <div className="grid size-14 place-items-center rounded-xl bg-tint">🎁</div>}
              <div className="flex-1">
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-muted">Qty {i.quantity}{i.note ? ` · ✏️ ${i.note}` : ""}</p>
              </div>
              <p className="text-sm">{formatINR(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-wa"><dt>Discount</dt><dd>−{formatINR(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shipping ? formatINR(order.shipping) : "Free"}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd>{order.paymentStatus === "PAID" ? "Paid ✓" : order.paymentStatus === "PARTIAL" ? "Partially paid" : "Pending — details on WhatsApp"}</dd></div>
        </dl>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-outline">Continue shopping</Link>
        {order.status === "DELIVERED" && <Link href={`/review?order=${order.orderNumber}`} className="btn btn-primary">Leave a review</Link>}
      </div>
    </div>
  );
}
