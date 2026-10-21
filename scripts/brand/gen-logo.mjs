// Regenerates public/brand/logo.svg, logo-mark.svg, medallion.webp and every app icon.
// Run outside the app: in an empty folder, npm i opentype.js@1.3.4 sharp@0.34.4, put Playfair.ttf
// (Playfair Display variable) and Montserrat-500.ttf / Montserrat-600.ttf in ./fonts, copy this file
// there and run: node gen-logo.mjs <outDir>. Then copy the outputs into public/ (icon.png -> src/app/).
// Builds Kavita's Artistry logo SVGs (text converted to outlines) and PNG icons.
// Usage: node gen.mjs <outDir>
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";
import sharp from "sharp";

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const font = (f) => opentype.parse(fs.readFileSync(new URL(`./fonts/${f}`, import.meta.url)).buffer);
const playfair = font("Playfair.ttf");
const montserrat = font("Montserrat-500.ttf");
const montserratBold = font("Montserrat-600.ttf");

export const C = {
  navy: "#1b2b52",
  navyDeep: "#14213f",
  ink: "#1d2b52",
  cream: "#f1e7d6",
  creamRim: "#e6d7bf",
  creamShade: "#cdbb9f",
};

const f = (n) => +n.toFixed(2);

/** Text as an SVG path, horizontally anchored ("middle" | "start" | "end") with letter spacing. */
function textPath(fnt, str, size, x, y, { anchor = "middle", spacing = 0 } = {}) {
  const scale = size / fnt.unitsPerEm;
  const glyphs = fnt.stringToGlyphs(str);
  let w = 0;
  const xs = [];
  glyphs.forEach((g, i) => {
    xs.push(w);
    w += g.advanceWidth * scale + (i < glyphs.length - 1 ? spacing : 0);
    if (i < glyphs.length - 1) w += fnt.getKerningValue(g, glyphs[i + 1]) * scale;
  });
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const d = glyphs.map((g, i) => g.getPath(x0 + xs[i], y, size).toPathData(2)).join("");
  return { d, width: w, x0 };
}

const petal = "M0,-36 C10,-26 19,-10 18,5 C17,19 8,24 0,24 C-8,24 -17,19 -18,5 C-19,-10 -10,-26 0,-36 Z";
// Inverted cream-outlined petal that sits between two mirrors (tip toward the centre)
const gapPetal = "M0,30 C9,18 15,4 13,-8 C11,-20 4,-26 0,-30 C-4,-26 -11,-20 -13,-8 C-15,4 -9,18 0,30 Z";

function ring({ petals, rPetal, rOuter, rInner, petalScale = 1, dots = true }) {
  const parts = [];
  parts.push(`<circle cx="256" cy="256" r="${rOuter}" fill="url(#band)"/>`);
  parts.push(`<circle cx="256" cy="256" r="${rOuter - 3.5}" fill="none" stroke="${C.creamRim}" stroke-width="7"/>`);
  for (let i = 0; i < petals; i++) {
    const a = (i * 360) / petals;
    parts.push(
      `<path d="${petal}" transform="rotate(${f(a)} 256 256) translate(256 ${256 - rPetal}) scale(${petalScale})" fill="url(#mirror)" stroke="${C.creamRim}" stroke-width="${f(5 / petalScale)}" stroke-linejoin="round"/>`,
    );
    const g = ((i + 0.5) * 360) / petals;
    parts.push(
      `<path d="${gapPetal}" transform="rotate(${f(g)} 256 256) translate(256 ${256 - (rInner + (rOuter - rInner) * 0.36)}) scale(${petalScale * 0.8})" fill="none" stroke="${C.creamRim}" stroke-width="${f(3.2 / (petalScale * 0.8))}" stroke-linejoin="round"/>`,
    );
    if (dots) {
      const b = ((i + 0.5) * 360) / petals;
      const rad = (b - 90) * (Math.PI / 180);
      const ro = rOuter - 18;
            parts.push(`<circle cx="${f(256 + ro * Math.cos(rad))}" cy="${f(256 + ro * Math.sin(rad))}" r="${f(7 * petalScale)}" fill="${C.creamRim}"/>`);
    }
  }
  parts.push(`<circle cx="256" cy="256" r="${rInner}" fill="url(#centre)" stroke="${C.creamRim}" stroke-width="7"/>`);
  parts.push(`<circle cx="256" cy="256" r="${rInner - 8}" fill="none" stroke="${C.creamShade}" stroke-width="1.2" opacity=".7"/>`);
  return parts.join("\n  ");
}

function lotus(cx, cy, s) {
  // five petals fanning upward + a small bud dot, navy
  const p = (rot, len, wid) =>
    `<path d="M0,0 C${wid},-${len * 0.35} ${wid * 0.7},-${len * 0.8} 0,-${len} C-${wid * 0.7},-${len * 0.8} -${wid},-${len * 0.35} 0,0 Z" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})" fill="${C.ink}"/>`;
  return [p(0, 30, 9), p(-30, 26, 8), p(30, 26, 8), p(-62, 21, 7), p(62, 21, 7)].join("");
}

function diamondFlower(cx, cy, s) {
  const leaf = (r) => `<path d="M0,0 C3,-3 3,-7 0,-10 C-3,-7 -3,-3 0,0 Z" transform="translate(${cx} ${cy}) rotate(${r}) scale(${s})" fill="${C.ink}"/>`;
  return [0, 90, 180, 270].map(leaf).join("");
}

const defs = `<defs>
    <radialGradient id="band" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${C.navy}"/><stop offset="1" stop-color="${C.navyDeep}"/></radialGradient>
    <linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d9e1ea"/><stop offset=".7" stop-color="#aeb9c6"/><stop offset="1" stop-color="#e9eef3"/></linearGradient>
    <radialGradient id="centre" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#f7efe2"/><stop offset="1" stop-color="${C.cream}"/></radialGradient>
  </defs>`;

function fullLogo() {
  const name = textPath(playfair, "Kavita’s", 70, 256, 268);
  const artistry = textPath(playfair, "ARTISTRY", 25, 352, 300, { anchor: "end", spacing: 2.2 });
  const handmade = textPath(montserratBold, "HANDMADE WITH LOVE", 13.5, 256, 334, { spacing: 2.2 });
  const tag = textPath(montserrat, "Art  •  Creativity  •  Decor", 12, 256, 381, { spacing: 0.4 });
  const lineEnd = artistry.x0 - 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Kavita’s Artistry — Handmade with love">
  ${defs}
  ${ring({ petals: 16, rPetal: 207, rOuter: 252, rInner: 170 })}
  ${lotus(256, 200, 1.2)}
  <path d="${name.d}" fill="${C.ink}"/>
  <path d="${artistry.d}" fill="${C.ink}"/>
  <path d="M${f(lineEnd - 92)} 292.5 H${f(lineEnd)} M${f(lineEnd - 70)} 298 H${f(lineEnd)}" stroke="${C.ink}" stroke-width="1.4"/>
  <path d="${handmade.d}" fill="${C.ink}"/>
  ${diamondFlower(256, 356, 0.9)}
  <path d="${tag.d}" fill="${C.ink}"/>
</svg>`;
}

/** Simplified mark for small sizes: same ring with 12 bigger mirrors, lotus + K monogram. */
function markLogo() {
  const k = textPath(playfair, "K", 196, 262, 338);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Kavita’s Artistry">
  ${defs}
  ${ring({ petals: 12, rPetal: 218, rOuter: 252, rInner: 186, petalScale: 0.95, dots: false })}
  ${lotus(256, 152, 1.05)}
  <path d="${k.d}" fill="${C.ink}"/>
</svg>`;
}

const full = fullLogo();
const mark = markLogo();
fs.writeFileSync(path.join(out, "logo.svg"), full);
fs.writeFileSync(path.join(out, "logo-mark.svg"), mark);

// Square app icon: medallion on navy, inside the maskable safe zone (80% circle).
const iconSvg = (inner, { badge, safe = false } = {}) => {
  // "any" icons fill the square; maskable ones keep the medallion inside the 80% safe circle.
  const k = safe ? 0.742 : badge ? 0.82 : 0.94;
  const ox = (512 - 512 * k) / 2;
  const oy = badge && !safe ? 14 : ox;
  const body = inner.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  // Pill sits lower on full icons; on maskable ones it stays inside the safe circle.
  const py = safe ? 330 : 402;
  const pill = badge
    ? `<rect x="146" y="${py}" width="220" height="62" rx="31" fill="#9e2b3a" stroke="${C.cream}" stroke-width="5"/>` +
      `<path d="${textPath(montserratBold, badge, 30, 256, py + 42, { spacing: 2.5 }).d}" fill="${C.cream}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${C.navyDeep}"/><g transform="translate(${f(ox)} ${f(oy)}) scale(${k})">${body}</g>${pill}</svg>`;
};
const png = (svg, size, file, flatten) => {
  let s = sharp(Buffer.from(svg), { density: 72 * (size / 512) * 2 }).resize(size, size);
  if (flatten) s = s.flatten({ background: C.navyDeep });
  return s.png({ compressionLevel: 9 }).toFile(path.join(out, file));
};

await Promise.all([
  png(iconSvg(full), 512, "icon-512.png"),
  png(iconSvg(full, { safe: true }), 512, "icon-maskable-512.png"),
  png(iconSvg(mark), 192, "icon-192.png"),
  png(iconSvg(mark), 180, "apple-touch-icon.png"),
  png(iconSvg(mark), 64, "icon.png"),
  png(iconSvg(full, { badge: "ADMIN" }), 512, "admin-icon-512.png"),
  png(iconSvg(mark, { badge: "ADMIN", safe: true }), 512, "admin-icon-maskable-512.png"),
  png(iconSvg(mark, { badge: "ADMIN" }), 192, "admin-icon-192.png"),
  png(iconSvg(mark, { badge: "ADMIN" }), 180, "admin-apple-touch-icon.png"),
  sharp(Buffer.from(full), { density: 288 }).resize(512, 512).webp({ quality: 90 }).toFile(path.join(out, "medallion.webp")),
  sharp(Buffer.from(full), { density: 288 }).resize(1024, 1024).png().toFile(path.join(out, "logo-1024.png")),
]);
console.log("ok", fs.readdirSync(out).join(", "));
