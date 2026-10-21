import type { CSSProperties } from "react";

/**
 * Photo framing chosen in the admin ("Adjust"): which point of the photo stays in view and how far
 * it is zoomed. It travels with the photo's address as a fragment, e.g. "…/photo.webp#f=40,30,1.25",
 * so any image field can carry it without a database change and the original photo is never cut.
 * Browsers and image servers ignore the fragment; imgUrl() strips it before resizing.
 */
export type Frame = { x: number; y: number; z: number };

export const DEFAULT_FRAME: Frame = { x: 50, y: 50, z: 1 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function splitFrame(url: string | null | undefined): { src: string; frame: Frame } {
  const raw = url ?? "";
  const i = raw.indexOf("#f=");
  if (i < 0) return { src: raw, frame: DEFAULT_FRAME };
  const [x, y, z] = raw
    .slice(i + 3)
    .split(",")
    .map(Number);
  return {
    src: raw.slice(0, i),
    frame: {
      x: Number.isFinite(x) ? clamp(x, 0, 100) : 50,
      y: Number.isFinite(y) ? clamp(y, 0, 100) : 50,
      z: Number.isFinite(z) ? clamp(z, 1, 4) : 1,
    },
  };
}

export function withFrame(src: string, f: Frame): string {
  const base = splitFrame(src).src;
  const r = (n: number) => Math.round(n * 10) / 10;
  if (r(f.x) === 50 && r(f.y) === 50 && f.z <= 1.001) return base;
  return `${base}#f=${r(f.x)},${r(f.y)},${Math.round(f.z * 100) / 100}`;
}

/** Style for an object-cover <img> inside an overflow-hidden box. */
export function frameStyle(url: string | null | undefined): CSSProperties | undefined {
  const { frame: f } = splitFrame(url);
  if (f.x === 50 && f.y === 50 && f.z === 1) return undefined;
  const pos = `${f.x}% ${f.y}%`;
  return { objectPosition: pos, transformOrigin: pos, transform: f.z > 1 ? `scale(${f.z})` : undefined };
}
