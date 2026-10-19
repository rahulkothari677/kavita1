import { formatINR } from "@/lib/format";

const COD_RE = /\b(cod|cash[\s-]+on[\s-]+delivery|pay[\s-]+on[\s-]+delivery)\b/i;

/**
 * Turns the admin's free-text announcement into up to 3 clean items:
 * split on '·' (or '|'), strip leading emoji, format rupee amounts, and drop any
 * cash-on-delivery claim unless COD is actually offered.
 */
export function announcementItems(text: string | null | undefined, codAvailable: boolean) {
  if (!text) return [];
  return text
    .split(/[·|•]/)
    .map((s) =>
      s
        .replace(/^[^\p{L}\p{N}₹]+/u, "")
        .replace(/[\s\p{Extended_Pictographic}️]+$/u, "")
        .replace(/₹\s?(\d{4,})(?![\d,])/g, (_, n: string) => formatINR(Number(n)))
        .trim(),
    )
    .filter((s) => s.length > 0 && (codAvailable || !COD_RE.test(s)))
    .slice(0, 3);
}

/** Kajal strip above the header. Static: no marquee, no rotation, no close button, not sticky. */
export function AnnouncementBar({ text, codAvailable }: { text: string | null | undefined; codAvailable: boolean }) {
  const items = announcementItems(text, codAvailable);
  if (items.length === 0) return null;
  return (
    <div className="on-dark bg-ink-deep text-on-dark">
      <div className="container-x flex h-8 items-center justify-center text-[12.5px] leading-none font-medium tracking-[0.02em] md:h-9">
        {/* Phones: one static line */}
        <p className="truncate md:hidden">{items[0]}</p>
        {/* Tablet & desktop: up to three items separated by bindis */}
        <ul className="hidden items-center gap-4 md:flex" aria-label="Store announcements">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 whitespace-nowrap">
              {i > 0 && <span aria-hidden className="size-1 shrink-0 rounded-full bg-accent-on-dark [[data-season=festive]_&]:bg-haldi" />}
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
