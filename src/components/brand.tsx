import Link from "next/link";
import { formatINR } from "@/lib/format";

/** Brand signature: the sindoor "bindi" full stop. */
export function Bindi({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`bindi ${className}`} />;
}

/**
 * Wordmark — the medallion mark beside "Kavita’s Artistry" in maroon script.
 * `tagline` adds the small "Handmade with love · Art • Creativity • Decor" lines (header on desktop).
 */
export function Wordmark({
  withMark = true,
  onDark = false,
  className = "",
  size = "md",
  tagline = false,
}: {
  withMark?: boolean;
  onDark?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  tagline?: boolean;
}) {
  const text = size === "sm" ? "text-[24px]" : size === "lg" ? "text-[36px]" : "text-[28px] lg:text-[34px]";
  const mark = size === "sm" ? "size-9" : "size-11 lg:size-14";
  return (
    <span className={`inline-flex items-center gap-2.5 ${onDark ? "on-dark text-on-dark" : "text-ink"} ${className}`}>
      {withMark && (
        <img src="/brand/logo-mark.svg" alt="" width={56} height={56} className={`${mark} shrink-0 max-[339px]:hidden`} />
      )}
      <span className="flex flex-col items-center">
        <span className={`font-script leading-none whitespace-nowrap ${onDark ? "text-accent-on-dark" : "text-accent"} ${text}`}>Kavita’s Artistry</span>
        {tagline && (
          <>
            <span className="mt-1 text-[10px] leading-none font-semibold tracking-[0.28em] whitespace-nowrap uppercase">Handmade with love</span>
            <span className="mt-1 text-[9.5px] leading-none tracking-[0.22em] whitespace-nowrap text-muted">Art • Creativity • Decor</span>
          </>
        )}
      </span>
    </span>
  );
}

/** Leaf sprig ornament used beside script section titles. */
export function Sprig({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 40 24" width="40" height="24" aria-hidden className={`shrink-0 ${flip ? "-scale-x-100" : ""} ${className}`}>
      <path d="M2 20C12 18 24 12 36 3" fill="none" stroke="var(--color-panel-a)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 17c-1-4 1-7 5-8-0 4-2 7-5 8z" fill="var(--color-panel-a)" opacity=".85" />
      <path d="M20 13c0-4 3-6 7-6-1 4-3 6-7 6z" fill="var(--color-accent)" opacity=".55" />
      <path d="M27 9c1-3 4-5 7-4-1 3-4 5-7 4z" fill="var(--color-panel-a)" opacity=".7" />
      <path d="M14 18c3-2 7-2 9 0-3 2-6 2-9 0z" fill="var(--color-accent)" opacity=".4" />
    </svg>
  );
}

/** ● 02 — SHOP BY CRAFT */
export function Eyebrow({ children, className = "", dot = true }: { children: React.ReactNode; className?: string; dot?: boolean }) {
  return <p className={`eyebrow ${dot ? "" : "no-dot"} ${className}`}>{children}</p>;
}

/** Section header: script title between leaf sprigs, small "View all →" on the right. */
export function SectionHeader({
  eyebrow,
  title,
  link,
  className = "",
  as: As = "h2",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  link?: { href: string; label: string };
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={`reveal flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <div className={`flex items-center gap-2 ${eyebrow ? "mt-2" : ""}`}>
          <Sprig className="max-sm:hidden" />
          <As className="t-script">{title}</As>
          <Sprig flip className="max-sm:hidden" />
        </div>
      </div>
      {link && (
        <Link href={link.href} className="group inline-flex shrink-0 items-center gap-1.5 pb-1 text-[14px] font-medium text-ink hover:text-accent">
          {link.label} <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </div>
  );
}

/** Prices are always Manrope 500, tabular. */
export function Price({ value, compareAt, className = "" }: { value: number; compareAt?: number | null; className?: string }) {
  return (
    <span className={`tabular font-medium ${className}`}>
      {formatINR(value)}
      {compareAt && compareAt > value ? (
        <>
          {" "}
          <s className="font-normal text-muted">{formatINR(compareAt)}</s>
        </>
      ) : null}
    </span>
  );
}

/** Monoline empty-state illustrations (ink, stroke 1.5) with one sindoor dot. */
export function EmptyArt({ kind = "plate", size = 56 }: { kind?: "plate" | "diya" | "knot" | "mandala" | "bag"; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden className="text-ink">
      {kind === "plate" && (
        <>
          <circle cx="28" cy="28" r="22" {...common} />
          <circle cx="28" cy="28" r="14" {...common} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <circle key={i} cx={(28 + Math.cos(a) * 18).toFixed(2)} cy={(28 + Math.sin(a) * 18).toFixed(2)} r="1.6" {...common} />;
          })}
          <circle cx="28" cy="28" r="4" fill="var(--color-accent)" />
        </>
      )}
      {kind === "diya" && (
        <>
          <path d="M10 32c4 9 12 13 18 13s14-4 18-13H10z" {...common} />
          <path d="M28 30c-3-4-3-8 0-13 3 5 3 9 0 13z" {...common} />
          <circle cx="28" cy="22" r="2.2" fill="var(--color-accent)" />
        </>
      )}
      {kind === "knot" && (
        <>
          <path d="M28 6v10M22 6v8M34 6v8" {...common} />
          <path d="M20 16c0 8 16 8 16 0M18 24c0 10 20 10 20 0M22 34l-4 16M28 34v16M34 34l4 16" {...common} />
          <circle cx="28" cy="27" r="2.2" fill="var(--color-accent)" />
        </>
      )}
      {kind === "mandala" && (
        <>
          <circle cx="28" cy="28" r="20" {...common} />
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d="M28 8c3 5 3 9 0 12-3-3-3-7 0-12z" transform={`rotate(${i * 30} 28 28)`} {...common} />
          ))}
          <circle cx="28" cy="28" r="3" fill="var(--color-accent)" />
        </>
      )}
      {kind === "bag" && (
        <>
          <path d="M12 20h32l-3 26H15L12 20z" {...common} />
          <path d="M21 20v-3a7 7 0 0114 0v3" {...common} />
          <circle cx="28" cy="33" r="2.2" fill="var(--color-accent)" />
        </>
      )}
    </svg>
  );
}
