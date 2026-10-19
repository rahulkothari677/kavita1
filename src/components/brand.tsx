import Link from "next/link";
import { formatINR } from "@/lib/format";

/** Brand signature: the sindoor "bindi" full stop. */
export function Bindi({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`bindi ${className}`} />;
}

/**
 * Typeset wordmark — "Kavita’s Artistry" in Fraunces with a bindi full stop.
 * The medallion logo appears only as a small mark beside it (never sampled for colour).
 */
export function Wordmark({
  withMark = true,
  onDark = false,
  className = "",
  size = "md",
}: {
  withMark?: boolean;
  onDark?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "sm" ? "text-[19px]" : size === "lg" ? "text-[28px]" : "text-[22px] lg:text-[24px]";
  return (
    <span className={`inline-flex items-center gap-2 ${onDark ? "on-dark text-on-dark" : "text-ink"} ${className}`}>
      {withMark && (
        <span className={`grid shrink-0 place-items-center rounded-full ${onDark ? "bg-canvas p-[3px]" : ""} max-[339px]:hidden`}>
          <img src="/brand/medallion.webp" alt="" width={28} height={28} className="size-7 rounded-full" />
        </span>
      )}
      <span className={`font-display leading-none font-normal tracking-[-0.01em] whitespace-nowrap ${text}`}>
        Kavita’s Artistry
        <Bindi />
      </span>
    </span>
  );
}

/** Giant edge-to-edge footer sign-off. Decorative: the real name is elsewhere. */
export function GiantWordmark() {
  return (
    <div aria-hidden className="on-dark overflow-hidden select-none">
      <p className="font-display -mb-[0.12em] text-[15.5vw] leading-[0.85] font-[340] tracking-[-0.04em] whitespace-nowrap text-on-dark">
        Kavita’s <em>Artistry</em>
        <Bindi />
      </p>
    </div>
  );
}

/** ● 02 — SHOP BY CRAFT */
export function Eyebrow({ children, className = "", dot = true }: { children: React.ReactNode; className?: string; dot?: boolean }) {
  return <p className={`eyebrow ${dot ? "" : "no-dot"} ${className}`}>{children}</p>;
}

/** Section header: hairline on top, eyebrow + serif H2 left, "View all →" right. */
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
    <div className={`hairline-t pt-6 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <As className={`${As === "h1" ? "t-h1" : "t-h2"} ${eyebrow ? "mt-3" : ""}`}>{title}</As>
        </div>
        {link && (
          <Link href={link.href} className="link self-start text-[15px] font-medium md:self-auto">
            {link.label} <span className="arrow">→</span>
          </Link>
        )}
      </div>
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
