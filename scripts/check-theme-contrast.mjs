// Checks every storefront theme's text/background pairs against WCAG AA.
// Run: node scripts/check-theme-contrast.mjs   (Node 23.6+ reads the TypeScript theme file directly)
import { THEMES } from "../src/lib/themes.ts";

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// [text, background, minimum] — 4.5 for body text, 3 for large titles / UI shapes
const PAIRS = [
  ["ink", "canvas", 4.5], ["muted", "canvas", 4.5], ["ink", "surface", 4.5], ["muted", "surface", 4.5],
  ["ink", "plinth", 4.5], ["muted", "plinth", 4.5], ["accent", "canvas", 4.5], ["accent", "surface", 4.5],
  ["canvas", "ink", 4.5], ["ink", "blush", 4.5], ["muted", "blush", 4.5], ["ink", "band", 4.5], ["muted", "band", 4.5],
  ["accent", "band", 4.5], ["accent", "accent-tint", 4.5], ["on-dark", "ink-deep", 4.5], ["muted-on-dark", "ink-deep", 4.5],
  ["accent-on-dark", "ink-deep", 4.5], ["muted-on-dark", "ink-deep-raised", 4.5], ["on-dark", "ink-deep-raised", 4.5],
  ["ink", "hero", 4.5], ["muted", "hero", 4.5], ["accent", "hero", 4.5], ["#ffffff", "panel-a", 4.5], ["#ffffff", "panel-b", 4.5], ["line-strong", "canvas", 3],
];

let bad = 0;
for (const t of THEMES) {
  const c = (k) => (k.startsWith("#") ? k : t.colors[k]);
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(c(fg), c(bg));
    if (r < min) {
      bad++;
      console.log(`✗ ${t.id}: ${fg} on ${bg} = ${r.toFixed(2)} (needs ${min})`);
    }
  }
}
console.log(bad ? `\n${bad} pair(s) fail` : `All ${THEMES.length} themes pass (${PAIRS.length} pairs each).`);
process.exit(bad ? 1 : 0);
