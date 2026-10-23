/**
 * Storefront themes. The owner picks one in Admin → Settings → Appearance.
 *
 * A theme is a whole look, not just a colour swap:
 *  - colours (every text/background pair checked for WCAG AA — scripts/check-theme-contrast.mjs),
 *  - fonts (script titles, display serif, body sans; theme fonts load only when used),
 *  - shape (corner radius of photos, cards and controls),
 *  - surface (a faint background pattern, a soft light glow, tinted section bands, card finish).
 * panel-a / panel-b colour the category tiles (white text), blush tints the About strip.
 */

export type ThemeId = "atelier" | "royal" | "limewash" | "terracotta" | "sage" | "festive" | "blush" | "midnight";

type Font = "dancing" | "fraunces" | "manrope" | "playfair" | "cormorant" | "greatvibes" | "yatra" | "kalam" | "jost";

export type ThemeStyle = {
  /** Section titles, tile names, wordmark */
  script: Font;
  /** Script titles in a serif italic instead of a true script font */
  scriptItalic?: boolean;
  scriptWeight: number;
  display: Font;
  sans: Font;
  /** Photo / card corner radius and control radius, px */
  radius: number;
  ctl: number;
  pattern: Pattern;
  /** Card finish: soft shadow, a fine coloured frame, or a glow (dark themes) */
  card: "soft" | "frame" | "glow";
};

type Pattern = "mandala" | "mirror" | "clay" | "leaf" | "diya" | "floret" | "stars" | "none";

export type Theme = { id: ThemeId; name: string; description: string; dark?: boolean; colors: Record<string, string>; style: ThemeStyle };

export const THEMES: Theme[] = [
  {
    id: "atelier",
    name: "Warm Atelier",
    description: "Golden-beige walls with a faint mandala print, maroon script, olive and walnut panels. Rich, warm and made for handmade decor.",
    colors: { "canvas": "#f6ede3", "surface": "#fffaf4", "plinth": "#efe2d2", "plinth-strong": "#e6d3be", "line": "#e3d2be", "line-strong": "#9a8068", "ink": "#3b2a20", "ink-soft": "#5a4030", "ink-2": "#4e3a2c", "muted": "#6b5546", "accent": "#9e2b3a", "accent-hover": "#84222f", "accent-tint": "#f6dedf", "ink-deep": "#3f2e22", "ink-deep-raised": "#4b382a", "line-on-dark": "#5e4836", "on-dark": "#f8ede0", "muted-on-dark": "#d9c3ac", "accent-on-dark": "#f0b7a4", "panel-a": "#4f5a34", "panel-b": "#7a4b2a", "blush": "#f4e1dd", "glow": "#ffe2b8", "band": "#f1e3d1", "hero": "#e6cfb3" },
    style: { script: "dancing", scriptWeight: 600, display: "fraunces", sans: "manrope", radius: 14, ctl: 12, pattern: "mandala", card: "soft" },
  },
  {
    id: "royal",
    name: "Royal Mirror",
    description: "The logo’s own colours: deep navy, cream and mirror silver, with a Lippan mirror-dot print and elegant serif titles. Regal and on-brand.",
    colors: { "canvas": "#f4efe6", "surface": "#fffdf8", "plinth": "#ebe4d6", "plinth-strong": "#e0d6c3", "line": "#ddd3c1", "line-strong": "#837a6a", "ink": "#1b2645", "ink-soft": "#2c3a63", "ink-2": "#2a3556", "muted": "#555c72", "accent": "#1f3a7a", "accent-hover": "#172d62", "accent-tint": "#e2e7f3", "ink-deep": "#16213f", "ink-deep-raised": "#1f2c50", "line-on-dark": "#33416b", "on-dark": "#f1e7d6", "muted-on-dark": "#c5cbdc", "accent-on-dark": "#d8c8a4", "panel-a": "#1f2f5a", "panel-b": "#6b5532", "blush": "#ebe5d8", "glow": "#dfe7f7", "band": "#ece5d7", "hero": "#e5dccb" },
    style: { script: "playfair", scriptItalic: true, scriptWeight: 500, display: "playfair", sans: "manrope", radius: 12, ctl: 10, pattern: "mirror", card: "frame" },
  },
  {
    id: "limewash",
    name: "Limewash Gallery",
    description: "A white-walled gallery: sharp corners, refined Cormorant titles, clean Jost text and no pattern at all. Calm and timeless — lets colourful pieces shine.",
    colors: { "canvas": "#f7f4ef", "surface": "#ffffff", "plinth": "#efeae2", "plinth-strong": "#e4ddd1", "line": "#ddd5c8", "line-strong": "#8c8279", "ink": "#1c1916", "ink-soft": "#3a352f", "ink-2": "#4a443d", "muted": "#645d54", "accent": "#b3361f", "accent-hover": "#962c19", "accent-tint": "#f5e3dd", "ink-deep": "#161412", "ink-deep-raised": "#1f1c19", "line-on-dark": "#2e2a26", "on-dark": "#ede8df", "muted-on-dark": "#a39b8f", "accent-on-dark": "#e2603f", "panel-a": "#3a352f", "panel-b": "#6b3a2a", "blush": "#efe6dc", "glow": "#ffffff", "band": "#f0ece5", "hero": "#ebe5da" },
    style: { script: "cormorant", scriptItalic: true, scriptWeight: 600, display: "cormorant", sans: "jost", radius: 2, ctl: 2, pattern: "none", card: "frame" },
  },
  {
    id: "terracotta",
    name: "Terracotta Earth",
    description: "Sun-baked clay with a hand-pressed grain, handwritten Kalam titles and soft, rounded shapes. Earthy, warm and made by hand.",
    colors: { "canvas": "#f5ece2", "surface": "#fffaf5", "plinth": "#ecdccb", "plinth-strong": "#e0ccb7", "line": "#dbc8b4", "line-strong": "#8f7663", "ink": "#2b1e16", "ink-soft": "#46332a", "ink-2": "#55402f", "muted": "#6e5747", "accent": "#a13f1c", "accent-hover": "#86331a", "accent-tint": "#f6dfd2", "ink-deep": "#3a2418", "ink-deep-raised": "#46301f", "line-on-dark": "#5a3f2d", "on-dark": "#f5e9dc", "muted-on-dark": "#d2b9a3", "accent-on-dark": "#f0956b", "panel-a": "#5a4a2a", "panel-b": "#8a3e1e", "blush": "#f3e0d3", "glow": "#ffd2a8", "band": "#efdccb", "hero": "#efd9c2" },
    style: { script: "kalam", scriptWeight: 700, display: "fraunces", sans: "manrope", radius: 24, ctl: 999, pattern: "clay", card: "soft" },
  },
  {
    id: "sage",
    name: "Sage & Stone",
    description: "Soft sage stone with a scattered leaf print, Great Vibes script and clean Jost text. Fresh, natural and serene.",
    colors: { "canvas": "#f2f3ed", "surface": "#ffffff", "plinth": "#e4e7dc", "plinth-strong": "#d6dbcc", "line": "#d3d8c8", "line-strong": "#7b8570", "ink": "#1b241e", "ink-soft": "#2f3b32", "ink-2": "#3d4a40", "muted": "#59645a", "accent": "#2f6b4a", "accent-hover": "#24563b", "accent-tint": "#dcebe2", "ink-deep": "#18231c", "ink-deep-raised": "#212e25", "line-on-dark": "#2f3e33", "on-dark": "#e9eee6", "muted-on-dark": "#a7b5a8", "accent-on-dark": "#7fc79d", "panel-a": "#2f4a38", "panel-b": "#5b5a3a", "blush": "#e6ebdf", "glow": "#e8f5dc", "band": "#e7eadf", "hero": "#dde4d1" },
    style: { script: "greatvibes", scriptWeight: 400, display: "fraunces", sans: "jost", radius: 18, ctl: 999, pattern: "leaf", card: "soft" },
  },
  {
    id: "festive",
    name: "Royal Festive",
    description: "Ivory walls with a diya-and-dot print, deep maroon, haldi-gold frames and bold Yatra One titles. Celebratory — perfect for Diwali and wedding season.",
    colors: { "canvas": "#fbf6ef", "surface": "#ffffff", "plinth": "#f3e7d8", "plinth-strong": "#e8d7c2", "line": "#e3d2bd", "line-strong": "#93795f", "ink": "#2a1418", "ink-soft": "#43242a", "ink-2": "#523039", "muted": "#6d5157", "accent": "#8e1b3a", "accent-hover": "#74152f", "accent-tint": "#f5dde3", "ink-deep": "#3b0f1c", "ink-deep-raised": "#4a1726", "line-on-dark": "#5c2334", "on-dark": "#fbeedd", "muted-on-dark": "#ddb9a8", "accent-on-dark": "#e8b54a", "panel-a": "#6b1a30", "panel-b": "#7a5520", "blush": "#f6e6dc", "glow": "#ffd98a", "band": "#f6e9d6", "hero": "#f1dcb5" },
    style: { script: "yatra", scriptWeight: 400, display: "playfair", sans: "manrope", radius: 10, ctl: 8, pattern: "diya", card: "frame" },
  },
  {
    id: "blush",
    name: "Blush Atelier",
    description: "Soft blush plaster with tiny florets, flowing Great Vibes script and extra-round shapes. Gentle, romantic and gift-ready.",
    colors: { "canvas": "#fbf3f1", "surface": "#ffffff", "plinth": "#f3e3df", "plinth-strong": "#ead3cd", "line": "#e6d2cc", "line-strong": "#987a74", "ink": "#2a1a1f", "ink-soft": "#432a31", "ink-2": "#52363e", "muted": "#6c5157", "accent": "#a63d62", "accent-hover": "#8a3051", "accent-tint": "#f7dde6", "ink-deep": "#33202a", "ink-deep-raised": "#3f2a35", "line-on-dark": "#533a46", "on-dark": "#f8ebee", "muted-on-dark": "#d4b7bf", "accent-on-dark": "#f08fb0", "panel-a": "#5a3446", "panel-b": "#8a3e5c", "blush": "#f6e2e2", "glow": "#ffd9e4", "band": "#f6e6e3", "hero": "#f5e1de" },
    style: { script: "greatvibes", scriptWeight: 400, display: "playfair", sans: "manrope", radius: 28, ctl: 999, pattern: "floret", card: "soft" },
  },
  {
    id: "midnight",
    name: "Midnight Gallery",
    description: "A dark gallery at night under a sky of tiny stars: ivory Cormorant titles, glowing cards and an ember accent. Bold and luxurious.",
    dark: true,
    colors: { "canvas": "#141419", "surface": "#1c1c23", "plinth": "#22222a", "plinth-strong": "#2c2c36", "line": "#34343f", "line-strong": "#7a7a88", "ink": "#efebe3", "ink-soft": "#dcd7cd", "ink-2": "#d3cdc2", "muted": "#a8a297", "accent": "#e8835e", "accent-hover": "#f09a79", "accent-tint": "#3b2621", "ink-deep": "#0c0c10", "ink-deep-raised": "#16161c", "line-on-dark": "#2a2a33", "on-dark": "#efebe3", "muted-on-dark": "#a8a297", "accent-on-dark": "#e8835e", "panel-a": "#2a2a33", "panel-b": "#3b2a26", "blush": "#22222a", "glow": "#3a2a52", "band": "#1a1a21", "hero": "#26222f" },
    style: { script: "cormorant", scriptItalic: true, scriptWeight: 600, display: "cormorant", sans: "jost", radius: 6, ctl: 6, pattern: "stars", card: "glow" },
  },
];

export const DEFAULT_THEME: ThemeId = "atelier";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/* ── Background patterns ──────────────────────────────────────────────
 * Tiny SVG tiles drawn in the theme's own ink at low opacity, so they read as texture, not decoration. */

const svg = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;

function patternCss(p: Pattern, c: Record<string, string>, dark?: boolean): { image: string; size: string } {
  const ink = dark ? c["ink"] : c["ink"];
  const acc = c["accent"];
  const o = dark ? 0.09 : 0.06;
  switch (p) {
    case "mandala": // four-petal rosettes on a dotted lattice
      return {
        size: "56px 56px",
        image: svg(56, 56, `<g fill='${ink}' fill-opacity='${o}'><path d='M28 20c2.5 3 2.5 5.5 0 8-2.5-2.5-2.5-5 0-8zM28 36c2.5-3 2.5-5.5 0-8-2.5 2.5-2.5 5 0 8zM20 28c3-2.5 5.5-2.5 8 0-2.5 2.5-5 2.5-8 0zM36 28c-3-2.5-5.5-2.5-8 0 2.5 2.5 5 2.5 8 0z'/><circle cx='0' cy='0' r='1.4'/><circle cx='56' cy='0' r='1.4'/><circle cx='0' cy='56' r='1.4'/><circle cx='56' cy='56' r='1.4'/></g><circle cx='28' cy='28' r='1.3' fill='${acc}' fill-opacity='${o * 2}'/>`),
      };
    case "mirror": // Lippan diamonds with a mirror dot
      return {
        size: "44px 44px",
        image: svg(44, 44, `<path d='M22 6l10 16-10 16-10-16z' fill='none' stroke='${ink}' stroke-opacity='${o * 1.2}' stroke-width='1'/><circle cx='22' cy='22' r='3' fill='${ink}' fill-opacity='${o * 1.3}'/><circle cx='0' cy='0' r='1.6' fill='${ink}' fill-opacity='${o}'/><circle cx='44' cy='0' r='1.6' fill='${ink}' fill-opacity='${o}'/><circle cx='0' cy='44' r='1.6' fill='${ink}' fill-opacity='${o}'/><circle cx='44' cy='44' r='1.6' fill='${ink}' fill-opacity='${o}'/>`),
      };
    case "clay": // hand-pressed grain
      return {
        size: "64px 64px",
        image: svg(64, 64, `<g fill='${ink}' fill-opacity='${o}'>${[[7, 9, 1.1], [23, 4, 0.8], [41, 12, 1.3], [57, 6, 0.9], [14, 27, 0.9], [33, 24, 1.2], [50, 31, 0.8], [5, 45, 1.2], [26, 41, 0.8], [44, 49, 1.1], [60, 44, 0.9], [17, 58, 1], [36, 60, 0.8], [53, 59, 1.2]].map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}'/>`).join("")}</g>`),
      };
    case "leaf": // scattered sprigs
      return {
        size: "72px 72px",
        image: svg(72, 72, `<g fill='${acc}' fill-opacity='${o * 1.3}'><path d='M14 20c4-6 10-7 14-6-3 5-8 8-14 6z'/><path d='M50 54c4-6 10-7 14-6-3 5-8 8-14 6z' transform='rotate(40 57 51)'/></g><g fill='none' stroke='${acc}' stroke-opacity='${o * 1.3}'><path d='M10 24c6-2 12-6 18-10'/><path d='M46 58c6-2 12-6 18-10' transform='rotate(40 57 51)'/></g>`),
      };
    case "diya": // little lamps and gold dots
      return {
        size: "60px 60px",
        image: svg(60, 60, `<path d='M22 34c2 4 5 6 8 6s6-2 8-6z' fill='${acc}' fill-opacity='${o * 1.4}'/><path d='M30 32c-2-3-2-5 0-8 2 3 2 5 0 8z' fill='#c98a12' fill-opacity='${o * 2.2}'/><circle cx='4' cy='6' r='1.5' fill='#c98a12' fill-opacity='${o * 2}'/><circle cx='54' cy='52' r='1.5' fill='#c98a12' fill-opacity='${o * 2}'/>`),
      };
    case "floret": // tiny five-dot florets
      return {
        size: "52px 52px",
        image: svg(52, 52, `<g fill='${acc}' fill-opacity='${o * 1.2}'>${[0, 72, 144, 216, 288].map((a) => `<circle cx='${(14 + Math.cos((a * Math.PI) / 180) * 3).toFixed(1)}' cy='${(14 + Math.sin((a * Math.PI) / 180) * 3).toFixed(1)}' r='1.5'/>`).join("")}<circle cx='40' cy='40' r='1.3'/></g>`),
      };
    case "stars": // a sky of tiny stars
      return {
        size: "120px 120px",
        image: svg(120, 120, `<g fill='${c["on-dark"]}'>${[[12, 18, 0.9, 0.5], [58, 9, 0.6, 0.35], [97, 30, 1.1, 0.55], [33, 52, 0.7, 0.3], [80, 66, 0.9, 0.45], [8, 88, 0.6, 0.3], [49, 98, 1, 0.5], [104, 104, 0.7, 0.35]].map(([x, y, r, op]) => `<circle cx='${x}' cy='${y}' r='${r}' fill-opacity='${op}'/>`).join("")}</g>`),
      };
    default:
      return { image: "none", size: "auto" };
  }
}

const FONT_VAR: Record<Font, string> = {
  dancing: 'var(--font-dancing), "Segoe Script", cursive',
  fraunces: "var(--font-fraunces), ui-serif, Georgia, serif",
  manrope: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
  playfair: "var(--font-playfair), ui-serif, Georgia, serif",
  cormorant: "var(--font-cormorant), ui-serif, Georgia, serif",
  greatvibes: 'var(--font-greatvibes), "Segoe Script", cursive',
  yatra: "var(--font-yatra), ui-serif, Georgia, serif",
  kalam: 'var(--font-kalam), "Segoe Print", cursive',
  jost: "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
};

/* ── Owner's font choice (Admin → Settings → Appearance) ─────────────── */

export type FontChoice = { id: string; label: string; font: Font; italic?: boolean; weight: number };

/** Title fonts: script headings, tile names and the wordmark. "" = the theme's own. */
export const TITLE_FONTS: FontChoice[] = [
  { id: "dancing", label: "Dancing Script", font: "dancing", weight: 600 },
  { id: "greatvibes", label: "Great Vibes", font: "greatvibes", weight: 400 },
  { id: "playfair", label: "Playfair (elegant serif)", font: "playfair", italic: true, weight: 500 },
  { id: "cormorant", label: "Cormorant (gallery serif)", font: "cormorant", italic: true, weight: 600 },
  { id: "fraunces", label: "Fraunces (soft serif)", font: "fraunces", italic: true, weight: 500 },
  { id: "kalam", label: "Kalam (handwritten)", font: "kalam", weight: 700 },
  { id: "yatra", label: "Yatra One (festive)", font: "yatra", weight: 400 },
];
/** Body fonts: all other text. "" = the theme's own. */
export const BODY_FONTS: FontChoice[] = [
  { id: "manrope", label: "Manrope (clear, modern)", font: "manrope", weight: 400 },
  { id: "jost", label: "Jost (clean, geometric)", font: "jost", weight: 400 },
];

export function fontFamily(f: FontChoice) {
  return FONT_VAR[f.font];
}

export type ThemeOptions = { pattern?: boolean; titleFont?: string; bodyFont?: string };

/** The look of a theme as plain values, for the admin's theme cards. */
export function themeLook(t: Theme) {
  const pat = patternCss(t.style.pattern, t.colors, t.dark);
  return {
    pattern: pat.image,
    patternSize: pat.size,
    script: FONT_VAR[t.style.script],
    scriptStyle: t.style.scriptItalic ? "italic" : "normal",
    scriptWeight: t.style.scriptWeight,
    sans: FONT_VAR[t.style.sans],
    radius: t.style.radius,
  };
}

/**
 * CSS that overrides the design tokens for the chosen theme (colours, fonts, shape, surface).
 * The background is plain unless the owner switches the printed pattern on; the owner's own title
 * and body fonts, when chosen, replace the theme's.
 */
export function themeCss(id: string | null | undefined, opts: ThemeOptions = {}) {
  const t = getTheme(id);
  const c = t.colors;
  const title = TITLE_FONTS.find((f) => f.id === opts.titleFont);
  const body = BODY_FONTS.find((f) => f.id === opts.bodyFont);
  const s: ThemeStyle = {
    ...t.style,
    ...(title ? { script: title.font, scriptItalic: !!title.italic, scriptWeight: title.weight } : {}),
    ...(body ? { sans: body.font } : {}),
  };
  const pat = opts.pattern ? patternCss(s.pattern, c, t.dark) : { image: "none", size: "auto" };
  const vars: Record<string, string> = {
    ...Object.fromEntries(Object.entries(c).map(([k, v]) => [`--color-${k}`, v])),
    "--font-script": FONT_VAR[s.script],
    "--font-display": FONT_VAR[s.display],
    "--font-sans": FONT_VAR[s.sans],
    "--script-style": s.scriptItalic ? "italic" : "normal",
    "--script-weight": String(s.scriptWeight),
    "--radius-img": `${s.radius}px`,
    "--radius-ctl": `${Math.min(s.ctl, 999)}px`,
    "--radius-tile": `${Math.max(s.radius, 2) + 2}px`,
    "--theme-pattern": pat.image,
    // The soft top glow belongs to the patterned look; a plain background has none.
    ...(opts.pattern ? {} : { "--color-glow": "transparent" }),
    "--theme-pattern-size": pat.size,
    "--card-ring": s.card === "frame" ? `0 0 0 1px ${c["line-strong"]}33` : "0 0 0 0 transparent",
    "--card-glow": s.card === "glow" ? `0 0 0 1px ${c["line"]}, 0 18px 40px -18px ${c["accent"]}66` : "var(--shadow-soft)",
  };
  return `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")};color-scheme:${t.dark ? "dark" : "light"}}`;
}
