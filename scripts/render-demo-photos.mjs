// Renders the demo artworks (public/demo/*.svg) as realistic "product photos":
// the piece hanging on a textured plaster wall with soft window light, plus a close-up detail.
// Output: public/demo/photos/<name>.webp and <name>-detail.webp
// Run: node scripts/render-demo-photos.mjs   (needs Playwright's Chromium + python3 Pillow)
import { createRequire } from "module";
import { readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { execFileSync } from "child_process";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");

const WALLS = {
  "mirror-mandala": "#ece6dc",
  "peacock-lippan": "#e9e4da",
  "terracotta-torans": "#efe9df",
  "lotus-wall-plate": "#ebe5db",
  "jharokha-frame": "#e8e2d8",
  "sunburst-mirror": "#eee8de",
  "name-plate": "#e7e1d6",
  "diya-tray": "#ece6dc",
};

const page = (svg, wall, mode) => `<!doctype html><html><head><style>
html,body{margin:0;width:1200px;height:1500px;overflow:hidden}
.wall{position:absolute;inset:0;background:${wall}}
.tex{position:absolute;inset:0;opacity:.55;mix-blend-mode:multiply}
.light{position:absolute;inset:0;background:
  radial-gradient(120% 80% at 18% 8%, rgba(255,250,240,.75), rgba(255,250,240,0) 55%),
  linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(60,45,30,.10) 100%)}
.art{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);width:${mode === "detail" ? 2100 : 1020}px;height:${mode === "detail" ? 2100 : 1020}px;
  filter: drop-shadow(14px 26px 22px rgba(52,38,24,.28)) drop-shadow(3px 6px 4px rgba(52,38,24,.22))}
.art svg{width:100%;height:100%}
.vig{position:absolute;inset:0;background:radial-gradient(90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(40,28,18,.12) 100%)}
${mode === "detail" ? ".art{top:40%;left:44%} .blur{position:absolute;inset:0;backdrop-filter:blur(0px)}" : ""}
</style></head><body>
<div class="wall"></div>
<svg class="tex" width="1200" height="1500"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .4  0 0 0 0 .35  0 0 0 .35 0"/></filter>
<filter id="p"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="4" seed="3"/><feDiffuseLighting lighting-color="#fff" surfaceScale="2.2"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting></filter>
<rect width="1200" height="1500" filter="url(#p)" opacity=".35"/><rect width="1200" height="1500" filter="url(#n)"/></svg>
<div class="light"></div>
<div class="art">${svg}</div>
<div class="vig"></div>
</body></html>`;

// Strip the flat square background from the source artwork so it reads as an object on the wall
function objectOnly(svg) {
  return svg.replace(/<rect width="800" height="800" fill="[^"]+"\/>/, "");
}

const SRC = "public/demo";
const OUT = "public/demo/photos";
const TMP = "/tmp/claude-0/demo-render";
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 1500 } });
for (const file of readdirSync(SRC).filter((f) => f.endsWith(".svg"))) {
  const name = file.replace(".svg", "");
  const svg = objectOnly(readFileSync(`${SRC}/${file}`, "utf8"));
  for (const mode of ["main", "detail"]) {
    await p.setContent(page(svg, WALLS[name] ?? "#ece6dc", mode));
    await p.waitForTimeout(150);
    const png = `${TMP}/${name}-${mode}.png`;
    await p.screenshot({ path: png });
    const out = `${OUT}/${name}${mode === "detail" ? "-detail" : ""}.webp`;
    execFileSync("python3", ["-c", `from PIL import Image; Image.open("${png}").convert("RGB").resize((960,1200), Image.LANCZOS).save("${out}", "WEBP", quality=82, method=6)`]);
  }
  console.log("rendered", name);
}
await b.close();
rmSync(TMP, { recursive: true, force: true });
