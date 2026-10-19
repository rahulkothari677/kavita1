import Link from "next/link";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Eyebrow } from "@/components/brand";

/**
 * Shared building blocks for the secondary storefront pages
 * (checkout, order, track, wishlist, custom order, gift finder, about, FAQ, policies, review, 404).
 * Server-safe: no hooks, no "use client".
 */

/** Page intro: eyebrow, H1 with one italic word, optional body-lg lede. */
export function PageIntro({
  eyebrow,
  title,
  lede,
  align = "left",
  className = "",
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
}) {
  const center = align === "center";
  return (
    <header className={`${center ? "text-center" : ""} ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className={`t-h1 ${eyebrow ? "mt-4" : ""} ${center ? "mx-auto" : ""} max-w-[18ch]`}>{title}</h1>
      {lede ? <p className={`t-body-lg mt-4 max-w-[52ch] text-muted ${center ? "mx-auto" : ""}`}>{lede}</p> : null}
      {children}
    </header>
  );
}

/** Inline field error: 13px danger text with an alert icon. Pair with aria-invalid + aria-describedby. */
export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-danger">
      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}

/** Text link with underline draw and trailing arrow, padded to a 44px hit area. */
export function ArrowLink({
  href,
  children,
  icon,
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = `inline-flex min-h-11 items-center gap-2 text-[15px] font-medium ${className}`;
  const inner = (
    <>
      {icon}
      <span className="link">
        {children}{" "}
        <span aria-hidden className="arrow">
          →
        </span>
      </span>
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/** Segmented 2px progress bar with uppercase labels (checkout, gift finder). */
export function StepBar({ steps, current, label = "Progress" }: { steps: string[]; current: number; label?: string }) {
  return (
    <nav aria-label={label}>
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <li key={s} aria-current={i === current ? "step" : undefined} className="min-w-0">
            <span
              className={`block truncate text-[11px] leading-tight font-semibold tracking-[0.1em] uppercase ${i <= current ? "text-ink" : "text-muted"}`}
            >
              <span className="sr-only">{i < current ? "Done: " : i === current ? "Current: " : "Next: "}</span>
              {s}
            </span>
            <span aria-hidden className={`mt-2 block h-0.5 transition-colors duration-200 ${i <= current ? "bg-ink" : "bg-line"}`} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 16px spinner used inside buttons while busy. */
export function Spinner({ className = "" }: { className?: string }) {
  return <LoaderCircle aria-hidden className={`size-4 animate-spin ${className}`} strokeWidth={2} />;
}

/** Hairline-separated label/value row for summaries (tabular figures). */
export function SummaryRow({
  label,
  value,
  tone,
  strong = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "success";
  strong?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-[16px] font-semibold text-ink" : "text-[15px]"}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className={`tabular ${strong ? "" : "font-medium"} ${tone === "success" ? "text-success" : strong ? "" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
