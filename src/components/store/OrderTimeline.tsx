import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "PENDING", label: "Order placed", desc: "We've received your order" },
  { key: "CONFIRMED", label: "Confirmed", desc: "Confirmed on WhatsApp" },
  { key: "IN_MAKING", label: "Being made", desc: "Handcrafted with love" },
  { key: "SHIPPED", label: "Shipped", desc: "On its way to you" },
  { key: "DELIVERED", label: "Delivered", desc: "Enjoy your piece!" },
];

export function OrderTimeline({ status, history }: { status: OrderStatus; history: { status: string; at: string }[] }) {
  if (status === "CANCELLED") return <p className="rounded-2xl bg-rose/10 p-4 text-center text-rose">This order was cancelled. Message us on WhatsApp if this is unexpected.</p>;
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="relative grid grid-cols-5 gap-1">
      <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-ink/10" />
      <div className="absolute left-[10%] top-4 h-0.5 bg-wa transition-all" style={{ width: `${(Math.max(0, idx) / (STEPS.length - 1)) * 80}%` }} />
      {STEPS.map((s, i) => {
        const done = i <= idx;
        const at = history.filter((h) => h.status === s.key).pop()?.at;
        return (
          <li key={s.key} className="relative flex flex-col items-center text-center">
            <span className={`z-10 grid size-8 place-items-center rounded-full border-2 ${done ? "border-wa bg-wa text-white" : "border-ink/15 bg-white text-ink/30"}`}>
              {done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <span className={`mt-2 text-[11.5px] font-medium leading-tight sm:text-sm ${done ? "" : "text-muted"}`}>{s.label}</span>
            <span className="mt-0.5 hidden text-xs text-muted sm:block">{at ? formatDate(at).split(",")[0] : s.desc}</span>
          </li>
        );
      })}
    </ol>
  );
}
