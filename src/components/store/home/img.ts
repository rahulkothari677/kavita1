import { imgUrl } from "@/lib/format";

/**
 * src + srcSet for an image. Cloudinary URLs get width variants; any other URL
 * (local demo photos, external hosts) is served as-is with no srcSet.
 */
export function responsiveImg(url: string | null | undefined, widths: number[]) {
  const largest = widths[widths.length - 1];
  const src = imgUrl(url, largest);
  const resizable = imgUrl(url, widths[0]) !== src;
  return {
    src,
    srcSet: resizable ? widths.map((w) => `${imgUrl(url, w)} ${w}w`).join(", ") : undefined,
  };
}

/** Wall-label numbering: N° 007 */
export function labelNo(n: number) {
  return `N° ${String(n).padStart(3, "0")}`;
}

/** "12 inch (30 cm) diameter" → "12 inch" for a compact wall label. */
export function shortSize(size: string | null) {
  if (!size) return null;
  const s = size.split("(")[0].replace(/\s*diameter\s*$/i, "").trim();
  return s || size;
}
