// Generates lippan-style placeholder artwork for demo products (public/demo/*.svg).
// Run: node scripts/gen-demo-art.mjs
import { mkdirSync, writeFileSync } from "fs";

const designs = [
  { name: "mirror-mandala", bg: "#1b2a4e", base: "#1d2d55", accent: "#e8d3a3", shape: "circle", rings: [8, 16, 24] },
  { name: "peacock-lippan", bg: "#0f4c5c", base: "#f6efe2", accent: "#2a9d8f", shape: "circle", rings: [10, 20] },
  { name: "terracotta-torans", bg: "#f3ead8", base: "#b5562b", accent: "#f3ead8", shape: "arch", rings: [12, 18] },
  { name: "lotus-wall-plate", bg: "#efe6d4", base: "#7a1f3d", accent: "#f0d9a8", shape: "circle", rings: [6, 12, 18] },
  { name: "jharokha-frame", bg: "#14213d", base: "#2f5d50", accent: "#f1e4c4", shape: "square", rings: [12, 20] },
  { name: "sunburst-mirror", bg: "#f7f0e3", base: "#d99a2b", accent: "#1b2a4e", shape: "circle", rings: [12, 24, 36] },
  { name: "name-plate", bg: "#e8e0cf", base: "#1b2a4e", accent: "#f3ead8", shape: "plate", rings: [14] },
  { name: "diya-tray", bg: "#2d1b3d", base: "#5b2a5e", accent: "#f0c96a", shape: "circle", rings: [8, 14] },
];

function mirror(x, y, r, rot, accent) {
  const leaf = `M0,${-r * 1.4} C${r},${-r * 0.4} ${r},${r * 0.6} 0,${r} C${-r},${r * 0.6} ${-r},${-r * 0.4} 0,${-r * 1.4}Z`;
  return `<g transform="translate(${x},${y}) rotate(${rot})">
    <path d="${leaf}" fill="none" stroke="${accent}" stroke-width="${r * 0.32}" stroke-linejoin="round"/>
    <path d="${leaf}" fill="url(#mirror)" transform="scale(0.72)"/>
  </g>`;
}

function dot(x, y, r, c) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
}

function render(d) {
  const S = 800, C = S / 2;
  let body = "";
  let outline = "";
  if (d.shape === "circle") outline = `<circle cx="${C}" cy="${C}" r="330" fill="${d.base}"/><circle cx="${C}" cy="${C}" r="318" fill="none" stroke="${d.accent}" stroke-width="10"/>`;
  if (d.shape === "square") outline = `<rect x="90" y="90" width="620" height="620" rx="30" fill="${d.base}"/><rect x="110" y="110" width="580" height="580" rx="22" fill="none" stroke="${d.accent}" stroke-width="10"/>`;
  if (d.shape === "arch") outline = `<path d="M130,720 L130,360 A270,270 0 0 1 670,360 L670,720 Z" fill="${d.base}"/><path d="M150,700 L150,362 A250,250 0 0 1 650,362 L650,700 Z" fill="none" stroke="${d.accent}" stroke-width="10"/>`;
  if (d.shape === "plate") outline = `<rect x="80" y="220" width="640" height="360" rx="180" fill="${d.base}"/><rect x="100" y="240" width="600" height="320" rx="160" fill="none" stroke="${d.accent}" stroke-width="8"/>`;

  if (d.shape === "plate") {
    for (let i = 0; i < 14; i++) {
      const x = 170 + i * 35;
      body += dot(x, 275, 7, d.accent) + dot(x, 525, 7, d.accent);
    }
    body += mirror(170, 400, 26, -90, d.accent) + mirror(630, 400, 26, 90, d.accent);
    body += `<text x="${C}" y="415" font-family="Georgia, serif" font-size="74" text-anchor="middle" fill="${d.accent}" font-style="italic">Welcome</text>`;
  } else {
    d.rings.forEach((count, ri) => {
      const radius = 80 + ri * 85;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const x = C + Math.cos(a) * radius;
        const y = C + Math.sin(a) * radius;
        body += mirror(x, y, 16 + ri * 4, (a * 180) / Math.PI + 90, d.accent);
        const a2 = a + Math.PI / count;
        body += dot(C + Math.cos(a2) * radius, C + Math.sin(a2) * radius, 6 + ri, d.accent);
      }
    });
    body += `<circle cx="${C}" cy="${C}" r="44" fill="url(#mirror)" stroke="${d.accent}" stroke-width="12"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#cfd8e3"/><stop offset="0.55" stop-color="#9aa8b8"/><stop offset="1" stop-color="#eef2f7"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-opacity="0.28"/></filter>
  </defs>
  <rect width="${S}" height="${S}" fill="${d.bg}"/>
  <g filter="url(#shadow)">${outline}</g>
  ${body}
</svg>`;
}

mkdirSync("public/demo", { recursive: true });
for (const d of designs) writeFileSync(`public/demo/${d.name}.svg`, render(d));
console.log("wrote", designs.length, "designs");
