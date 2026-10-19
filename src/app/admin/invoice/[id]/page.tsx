import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getOrder } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { formatDate, formatINR } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const [o, s] = await Promise.all([getOrder(id), getSettings()]);
  if (!o) notFound();
  return (
    <div className="min-h-screen bg-white p-6 text-ink print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex justify-end print:hidden">
          <PrintButton />
        </div>
        <div className="flex items-start justify-between border-b border-ink/15 pb-6">
          <div className="flex items-center gap-3">
            <img src="/brand/medallion.webp" alt="" className="size-16 rounded-full" />
            <div>
              <p className="font-display text-3xl font-semibold">{s.storeName}</p>
              <p className="text-sm text-muted">{s.tagline}</p>
              {s.phone && <p className="text-xs text-muted">{s.phone}</p>}
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-display text-2xl">Invoice</p>
            <p>{o.orderNumber}</p>
            <p className="text-muted">{formatDate(o.createdAt).split(",").slice(0, 2).join(",")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <p className="text-xs tracking-widest text-muted uppercase">Bill / Ship to</p>
            <p className="mt-1 font-medium">{o.customerName}</p>
            <p>{o.address}</p>
            <p>{[o.city, o.state, o.pincode].filter(Boolean).join(", ")}</p>
            <p>{o.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest text-muted uppercase">Payment</p>
            <p className="mt-1">{o.paymentStatus === "PAID" ? "Paid" : o.paymentStatus === "PARTIAL" ? "Partially paid" : "Due"}</p>
            {o.paymentMethod && <p>{o.paymentMethod}</p>}
            {s.upiId && o.paymentStatus !== "PAID" && <p className="text-muted">UPI: {s.upiId}</p>}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-ink/15 text-left text-xs text-muted uppercase">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={n} className="border-b border-ink/10">
                <td className="py-2.5">
                  {i.name}
                  {i.note && <span className="block text-xs text-muted">{i.note}</span>}
                </td>
                <td className="py-2.5 text-right">{i.quantity}</td>
                <td className="py-2.5 text-right">{formatINR(i.price)}</td>
                <td className="py-2.5 text-right">{formatINR(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-4 w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatINR(o.subtotal)}</span></div>
          {o.discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span>−{formatINR(o.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{o.shipping ? formatINR(o.shipping) : "Free"}</span></div>
          <div className="flex justify-between border-t border-ink/15 pt-2 text-lg font-semibold"><span>Total</span><span>{formatINR(o.total)}</span></div>
        </div>
        <p className="mt-12 text-center font-script text-3xl text-accent">Thank you for supporting handmade</p>
        <p className="mt-2 text-center text-xs text-muted">Every piece is handmade — small variations make it unique.</p>
      </div>
    </div>
  );
}
