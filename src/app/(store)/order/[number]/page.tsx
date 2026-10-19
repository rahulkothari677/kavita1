import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Gift, Package } from "lucide-react";
import { getOrder } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import { formatDate, formatINR, imgUrl } from "@/lib/format";
import { orderMessageForShop, waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/Motifs";
import { Eyebrow } from "@/components/brand";
import { SummaryRow } from "@/components/store/pages/ui";
import { siteUrl } from "@/lib/site";
import { AutoOpenWhatsApp } from "@/components/store/AutoOpenWhatsApp";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const stripEmoji = (s: string) => s.replace(/^[\p{Extended_Pictographic}️\s]+/u, "");

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ placed?: string; p?: string; wa?: string }> }) {
  const { number } = await params;
  const sp = await searchParams;
  const order = await getOrder(number);
  // Orders are only visible with the matching phone number (privacy)
  const digits = (sp.p ?? "").replace(/\D/g, "").slice(-10);
  if (!order || !digits || order.phone.replace(/\D/g, "").slice(-10) !== digits) notFound();
  const settings = await getSettings();
  const resend = waLink(settings.whatsappNumber, orderMessageForShop(order, await siteUrl()));
  const firstName = order.customerName.trim().split(/\s+/)[0] || "friend";
  const placed = Boolean(sp.placed);
  const payment =
    order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "PARTIAL" ? "Partly paid" : settings.codAvailable ? "Due · UPI or cash on delivery" : "Due · details on WhatsApp";
  const address = [order.address, [order.city, order.state].filter(Boolean).join(", "), order.pincode].filter(Boolean);

  return (
    <div className="container-x pt-10 pb-16 lg:pt-16 lg:pb-24">
      {sp.wa && <AutoOpenWhatsApp url={resend} orderNumber={order.orderNumber} />}

      {/* ── Header: thank-you on arrival, a plain status title otherwise ── */}
      {placed ? (
        <header className="max-w-2xl">
          <span aria-hidden className="grid size-12 place-items-center rounded-full border border-success text-success">
            <Check className="size-6" strokeWidth={1.5} />
          </span>
          <Eyebrow className="mt-6">Order saved · {order.orderNumber}</Eyebrow>
          <h1 className="t-h1 mt-4">
            Thank you, <em>{firstName}</em>
          </h1>
          <p className="t-body-lg mt-4 max-w-[52ch] text-ink-2">
            One last step: press <strong className="font-semibold text-ink">send</strong> in WhatsApp. We’ll reply there to confirm your order and share payment details. No payment
            has been taken yet.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={resend} target="_blank" rel="noreferrer" className="btn btn-wa btn-lg">
              <WhatsAppIcon className="size-5" /> Send on WhatsApp again
            </a>
            <p className="text-[13px] text-muted">Use this if WhatsApp didn’t open.</p>
          </div>
        </header>
      ) : (
        <header className="max-w-2xl">
          <Eyebrow>Order {order.orderNumber}</Eyebrow>
          <h1 className="t-h1 mt-4">
            Your order, <em>so far</em>
          </h1>
          <p className="mt-3 text-[15px] text-muted">
            Placed <span className="tabular">{formatDate(order.createdAt)}</span>
          </p>
        </header>
      )}

      <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <section aria-labelledby="progress-title" className="hairline-t pt-6">
            <h2 id="progress-title" className="eyebrow no-dot">
              Progress
            </h2>
            <div className="mt-6">
              <OrderTimeline status={order.status} history={order.history} />
            </div>
            {(order.courier || order.trackingNumber) && (
              <div className="mt-8 flex items-start gap-3 rounded-[4px] bg-plinth p-4 text-[15px]">
                <Package aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                <p>
                  Shipped with <span className="font-semibold">{order.courier ?? "our courier"}</span>
                  {order.trackingNumber && (
                    <>
                      {" "}
                      · Tracking no. <span className="tabular font-semibold select-all">{order.trackingNumber}</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="items-title" className="hairline-t mt-12 pt-6">
            <h2 id="items-title" className="eyebrow no-dot">
              In this order
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((i, n) => (
                <li key={n} className="flex items-center gap-4 py-4">
                  <span className="img-well grid h-[70px] w-14 shrink-0 place-items-center">
                    {i.image ? (
                      <img src={imgUrl(i.image, 160)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                    ) : (
                      <Gift aria-hidden className="size-5 text-muted" strokeWidth={1.5} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[17px] leading-snug">{stripEmoji(i.name)}</p>
                    <p className="tabular mt-0.5 text-[13px] text-muted">
                      Qty {i.quantity}
                      {i.note ? ` · Note: ${i.note}` : ""}
                    </p>
                  </div>
                  <p className="tabular text-[15px] font-medium">{formatINR(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside aria-label="Order summary" className="lg:col-span-4 lg:col-start-9">
          <div className="rounded-img border border-line p-5 lg:sticky lg:top-[96px] lg:p-6">
            <p className="craft-line">Order</p>
            <p className="tabular mt-1 text-[20px] font-semibold tracking-[-0.01em]">{order.orderNumber}</p>
            <p className="tabular text-[13px] text-muted">{formatDate(order.createdAt)}</p>
            <dl className="mt-6 space-y-2.5 border-t border-line pt-5">
              <SummaryRow label="Subtotal" value={formatINR(order.subtotal)} />
              {order.discount > 0 && <SummaryRow label={order.couponCode ? `Discount · ${order.couponCode}` : "Discount"} value={`−${formatINR(order.discount)}`} tone="success" />}
              <SummaryRow label="Shipping" value={order.shipping ? formatINR(order.shipping) : "Free"} />
              <div className="border-t border-line pt-3">
                <SummaryRow label="Total" value={formatINR(order.total)} strong />
              </div>
              <SummaryRow label="Payment" value={payment} />
            </dl>
            {address.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="craft-line">Delivering to</p>
                <address className="mt-2 text-[15px] leading-relaxed not-italic text-ink-2">
                  {order.customerName}
                  {address.map((l, n) => (
                    <span key={n} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </div>
            )}
            <a
              href={waLink(settings.whatsappNumber, `Hi! A question about my order ${order.orderNumber}`)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-wa-outline mt-6 w-full"
            >
              <WhatsAppIcon className="size-5" /> Ask about this order
            </a>
          </div>
        </aside>
      </div>

      <div className="hairline-t mt-14 flex flex-col gap-3 pt-8 sm:flex-row">
        {order.status === "DELIVERED" && (
          <Link href={`/review?order=${order.orderNumber}`} className="btn btn-primary">
            Leave a review
          </Link>
        )}
        <Link href="/shop" className="btn btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
