// Live website check — run by .github/workflows/live-check.yml (or locally: SITE_URL=http://localhost:3000 node scripts/live-check.mjs)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const BASE = (process.env.SITE_URL || "https://kavita1.vercel.app").replace(/\/$/, "");
const OUT = "live-check";
mkdirSync(OUT, { recursive: true });
const problems = [];
const passed = [];
const ok = (m) => passed.push(m);
const fail = (m) => problems.push(m);

const ROUTES = ["/", "/shop", "/checkout", "/custom-order", "/gift-finder", "/about", "/faq", "/policies/shipping", "/policies/returns", "/policies/care", "/track", "/wishlist", "/review", "/admin/login"];

const browser = await chromium.launch();

for (const [label, ctxOpts] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["phone", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" }],
]) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fail(`[${label}] JS error on ${page.url()}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|404 \(Not Found\)/.test(m.text())) fail(`[${label}] console error on ${page.url()}: ${m.text().slice(0, 200)}`);
  });
  await page.route(/wa\.me/, (r) => r.fulfill({ status: 200, body: "whatsapp" }));

  // 1. Every page loads
  for (const r of ROUTES) {
    const t = Date.now();
    const res = await page.goto(BASE + r, { waitUntil: "networkidle" }).catch((e) => (fail(`[${label}] ${r} failed to load: ${e.message}`), null));
    if (!res) continue;
    const ms = Date.now() - t;
    if (res.status() >= 400) fail(`[${label}] ${r} returned HTTP ${res.status()}`);
    else ok(`[${label}] ${r} ${res.status()} in ${ms}ms`);
    const h1 = await page.locator("h1").first().textContent().catch(() => null);
    if (!h1?.trim() && r !== "/admin/login") fail(`[${label}] ${r} has no visible heading`);
    await page.screenshot({ path: `${OUT}/${label}${r.replace(/\//g, "_") || "_home"}.png`, fullPage: false });
  }

  // 2. Homepage content
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const productLinks = await page.locator('a[href^="/product/"]').count();
  productLinks > 0 ? ok(`[${label}] homepage shows ${productLinks} product links`) : fail(`[${label}] homepage shows no products`);
  const brokenImgs = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== "lazy").map((i) => i.src));
  brokenImgs.length ? fail(`[${label}] broken images: ${brokenImgs.join(", ")}`) : ok(`[${label}] homepage images load`);
  const topButtons = await page.locator('[aria-label*="top" i], [title*="top" i]').count();
  topButtons ? fail(`[${label}] found ${topButtons} back-to-top style control(s)`) : ok(`[${label}] no back-to-top button`);

  // 3. Shop + filter
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  const firstProduct = await page.locator('a[href^="/product/"]').first().getAttribute("href");
  firstProduct ? ok(`[${label}] shop lists products`) : fail(`[${label}] shop lists no products`);

  // 4. Product page → add to bag
  if (firstProduct) {
    await page.goto(BASE + firstProduct, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/${label}_product.png` });
    const add = page.getByRole("button", { name: /add to bag/i }).first();
    if (await add.count()) {
      await add.click();
      await page.waitForTimeout(1200);
      const bagCount = await page.evaluate(() => JSON.parse(localStorage.getItem("ka_cart") || "[]").length);
      bagCount > 0 ? ok(`[${label}] add to bag works (${bagCount} line)`) : fail(`[${label}] add to bag did not add anything`);
      await page.screenshot({ path: `${OUT}/${label}_after_add.png` });
    } else fail(`[${label}] no Add to bag button on ${firstProduct}`);
  }

  // 5. Checkout shows the bag + WhatsApp button (no order is submitted)
  await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
  const waBtn = await page.getByRole("button", { name: /whatsapp/i }).count();
  waBtn ? ok(`[${label}] checkout ready with WhatsApp button`) : fail(`[${label}] checkout has no WhatsApp order button`);
  await page.screenshot({ path: `${OUT}/${label}_checkout_filled.png`, fullPage: true });

  // 6. Search
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const searchBtn = page.getByRole("button", { name: /search/i }).first();
  if (await searchBtn.count()) {
    await searchBtn.click();
    await page.keyboard.type("mandala", { delay: 50 });
    await page.waitForTimeout(1500);
    const hits = await page.locator('[role="option"], a[href^="/product/"]').count();
    hits ? ok(`[${label}] search returns results`) : fail(`[${label}] search returned nothing for "mandala"`);
    await page.screenshot({ path: `${OUT}/${label}_search.png` });
    await page.keyboard.press("Escape");
  } else fail(`[${label}] no search button`);

  // 7. Full-page scroll-through screenshots of the homepage
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = ctxOpts.viewport.height;
  for (let y = 0, i = 0; y < H && i < 20; y += vh * 0.9, i++) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${label}_scroll_${String(i).padStart(2, "0")}.png` });
  }
  await ctx.close();
}

// 8. APIs
for (const [path, check] of [
  ["/api/products?limit=4", (j) => Array.isArray(j.products) && j.products.length > 0],
  ["/sitemap.xml", null],
  ["/robots.txt", null],
  ["/manifest.webmanifest", null],
]) {
  const res = await fetch(BASE + path);
  if (!res.ok) fail(`API ${path} returned ${res.status}`);
  else if (check && !check(await res.json())) fail(`API ${path} returned unexpected data`);
  else ok(`API ${path} ${res.status}`);
}

await browser.close();
const report = `LIVE CHECK ${BASE}\n\nPASSED (${passed.length}):\n${passed.map((p) => "  ✓ " + p).join("\n")}\n\nPROBLEMS (${problems.length}):\n${problems.map((p) => "  ✗ " + p).join("\n") || "  none"}\n`;
writeFileSync(`${OUT}/report.txt`, report);
console.log(report);
process.exit(problems.length ? 1 : 0);
