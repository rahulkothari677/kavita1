import { Check, CircleAlert } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "PENDING", label: "Order placed", desc: "We’ve received your order" },
  { key: "CONFIRMED", label: "Confirmed", desc: "Confirmed on WhatsApp" },
  { key: "IN_MAKING", label: "Being made", desc: "Made by hand in the studio" },
  { key: "SHIPPED", label: "Shipped", desc: "On its way to you" },
  { key: "DELIVERED", label: "Delivered", desc: "Enjoy your piece" },
];

/**
 * Order progress. 1px rail; ink dots for done, a sindoor dot for the current step, outlines for upcoming.
 * Vertical on mobile, horizontal from lg.
 */
export function OrderTimeline({ status, history }: { status: OrderStatus; history: { status: string; at: string }[] }) {
  if (status === "CANCELLED")
    return (
      <p role="status" className="flex items-start gap-2 rounded-[4px] border border-line p-4 text-[15px] text-danger">
        <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        This order was cancelled. Message us on WhatsApp if this is unexpected.
      </p>
    );
  const idx = Math.max(0, STEPS.findIndex((s) => s.key === status));
  const last = STEPS.length - 1;
  return (
    <ol className="lg:grid lg:grid-cols-5 lg:gap-4" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i < idx || (i === idx && idx === last);
        const current = i === idx && idx !== last;
        const at = history.filter((h) => h.status === s.key).pop()?.at;
        return (
          <li key={s.key} aria-current={current ? "step" : undefined} className="relative pb-7 pl-9 last:pb-0 lg:pt-9 lg:pb-0 lg:pl-0">
            {i < last && (
              <span
                aria-hidden
                className={`absolute top-5 bottom-0 left-[7.5px] w-px lg:top-[7.5px] lg:right-[-16px] lg:bottom-auto lg:left-5 lg:h-px lg:w-auto ${i < idx ? "bg-ink" : "bg-line"}`}
              />
            )}
            <span
              aria-hidden
              className={`absolute top-0.5 left-0 grid size-4 place-items-center rounded-full lg:top-0 ${
                done ? "bg-ink text-canvas" : current ? "bg-accent ring-4 ring-accent-tint" : "border border-line-strong bg-surface"
              }`}
            >
              {done && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            <span className="sr-only">{done ? "Done: " : current ? "Current step: " : "Upcoming: "}</span>
            <span className={`block text-[15px] leading-tight font-semibold ${done || current ? "text-ink" : "text-muted"}`}>{s.label}</span>
            <span className="tabular mt-1 block text-[13px] text-muted">{at ? formatDate(at).split(",").slice(0, 1).join("") : s.desc}</span>
          </li>
        );
      })}
    </ol>
  );
}
