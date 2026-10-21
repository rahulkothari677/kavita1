const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const INR_COMPACT = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });

/** ₹1,850 · ₹1,25,000 */
export function formatINR(amount: number) {
  return INR.format(Math.round(amount));
}

/** ₹1.3L — for tight admin tiles */
export function formatINRCompact(amount: number) {
  return INR_COMPACT.format(Math.round(amount));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function discountPercent(price: number, compareAt: number | null | undefined) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

// Widths Next's image resizer serves (next.config.ts `images`); requests snap up to the next one.
const LOCAL_WIDTHS = [256, 384, 640, 828, 1080, 1200, 1920];

/** Sized URL for Cloudinary-hosted and built-in photos; other URLs are returned untouched. */

export function imgUrl(url: string | null | undefined, width = 800) {
  // Drop the admin's framing fragment (lib/frame.ts); it is applied as CSS, not by the server.
  url = url?.split("#")[0];
  if (!url) return "/demo/placeholder.svg";
  // Photos shipped with the site are resized (and cached near the visitor) by Next's image resizer.
  if (/^\/(home|stock|demo|brand)\/[^?]+\.(webp|jpe?g|png)$/i.test(url)) {
    const w = LOCAL_WIDTHS.find((x) => x >= width) ?? LOCAL_WIDTHS[LOCAL_WIDTHS.length - 1];
    return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
  }
  if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("/upload/f_auto")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  return url;
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function cleanPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return "91" + d;
  if (d.length === 11 && d.startsWith("0")) return "91" + d.slice(1);
  return d;
}
