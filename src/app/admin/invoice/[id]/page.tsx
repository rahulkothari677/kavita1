import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { getOrder } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/format";
import { Wordmark } from "@/components/brand";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

const PAY_LABEL: Record<string, string> = { PAID: "Paid", PARTIAL: "Partly paid", REFUNDED: "Refunded", UNPAID: "Due" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const [o, s] = await Promise.all([getOrder(id), getSettings()]);
  if (!o) notFound();
  const date = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const shipTo = [o.city, o.state, o.pincode].filter(Boolean).join(", ");
  const contact = [s.phone, s.email].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-admin px-4 py-6 text-ink print:bg-white print:p-0 sm:py-10">
      <div className="mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/orders/${o.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-ink hover:underline">
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden /> Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-[760px] rounded-[8px] border border-admin-line bg-white p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Wordmark />
            {s.tagline && <p className="mt-2 text-[13px] text-muted">{s.tagline}</p>}
            {(contact || s.address) && (
              <p className="mt-1 text-[13px] leading-5 text-muted">
                {contact}
                {contact && s.address ? <br /> : null}
                {s.address}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="eyebrow no-dot">Invoice</p>
            <p className="tabular mt-1.5 text-[20px] font-semibold">{o.orderNumber}</p>
            <p className="tabular text-[13px] text-muted">{date}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-line py-6 text-[14px] leading-6 sm:grid-cols-2">
          <div>
            <p className="eyebrow no-dot">Bill & ship to</p>
            <p className="mt-2 font-semibold">{o.customerName}</p>
            {o.address && <p>{o.address}</p>}
            {shipTo && <p>{shipTo}</p>}
            <p className="tabular">{o.phone}</p>
          </div>
          <div className="sm:text-right">
            <p className="eyebrow no-dot">Payment</p>
            <p className="mt-2 font-semibold">{PAY_LABEL[o.paymentStatus] ?? o.paymentStatus}</p>
            {o.paymentMethod && <p>{o.paymentMethod}</p>}
            {s.upiId && o.paymentStatus !== "PAID" && o.paymentStatus !== "REFUNDED" && <p className="text-muted">UPI: {s.upiId}</p>}
          </div>
        </section>

        <table className="mt-2 w-full text-[14px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-3 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Item</th>
              <th scope="col" className="w-14 py-3 text-right text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Qty</th>
              <th scope="col" className="hidden w-28 py-3 text-right text-[11px] font-semibold tracking-[0.1em] text-muted uppercase sm:table-cell print:table-cell">Price</th>
              <th scope="col" className="w-28 py-3 text-right text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={n} className="border-b border-line align-top">
                <td className="py-3 pr-3">
                  <span className="font-medium">{i.name}</span>
                  {i.note && <span className="block text-[13px] text-muted">{i.note}</span>}
                </td>
                <td className="tabular py-3 text-right">{i.quantity}</td>
                <td className="tabular hidden py-3 text-right sm:table-cell print:table-cell">{formatINR(i.price)}</td>
                <td className="tabular py-3 text-right font-medium">{formatINR(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="tabular mt-4 ml-auto w-full max-w-[280px] space-y-1.5 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatINR(o.subtotal)}</dd>
          </div>
          {o.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Discount{o.couponCode ? ` (${o.couponCode})` : ""}</dt>
              <dd>−{formatINR(o.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{o.shipping ? formatINR(o.shipping) : "Free"}</dd>
          </div>
          <div className="flex justify-between border-t border-ink pt-2.5 text-[17px] font-semibold">
            <dt>Total</dt>
            <dd>{formatINR(o.total)}</dd>
          </div>
        </dl>

        <footer className="mt-12 border-t border-line pt-6 text-center">
          <p className="font-display text-[22px] font-[340] tracking-[-0.01em]">
            Thank you for supporting <em>handmade</em>
          </p>
          <p className="mt-1.5 text-[13px] text-muted">Every piece is made by hand. Small variations are what make it yours.</p>
        </footer>
      </article>
    </div>
  );
}
