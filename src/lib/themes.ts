/**
 * Storefront colour themes. The owner picks one in Admin → Settings → Appearance.
 * Every theme was checked for WCAG AA contrast on all text/background pairs.
 * Themes only change colours; layout and fonts stay the same.
 */

export type ThemeId = "limewash" | "terracotta" | "sage" | "festive" | "blush" | "midnight";

export type Theme = { id: ThemeId; name: string; description: string; dark?: boolean; colors: Record<string, string> };

export const THEMES: Theme[] = [
  { id: "limewash", name: "Limewash Gallery", description: "Warm gallery white, ink black and a sindoor bindi. Calm, timeless — lets colourful pieces shine.", colors: { "canvas": "#f7f4ef", "surface": "#ffffff", "plinth": "#efeae2", "plinth-strong": "#e4ddd1", "line": "#ddd5c8", "line-strong": "#8c8279", "ink": "#1c1916", "ink-soft": "#3a352f", "ink-2": "#4a443d", "muted": "#645d54", "accent": "#b3361f", "accent-hover": "#962c19", "accent-tint": "#f5e3dd", "ink-deep": "#161412", "ink-deep-raised": "#1f1c19", "line-on-dark": "#2e2a26", "on-dark": "#ede8df", "muted-on-dark": "#a39b8f", "accent-on-dark": "#e2603f" } },
  { id: "terracotta", name: "Terracotta Earth", description: "Sun-baked clay walls, deep brown ink and a terracotta accent. Earthy, warm and handmade.", colors: { "canvas": "#f5ece2", "surface": "#fffaf5", "plinth": "#ecdccb", "plinth-strong": "#e0ccb7", "line": "#dbc8b4", "line-strong": "#8f7663", "ink": "#2b1e16", "ink-soft": "#46332a", "ink-2": "#55402f", "muted": "#6e5747", "accent": "#a13f1c", "accent-hover": "#86331a", "accent-tint": "#f6dfd2", "ink-deep": "#3a2418", "ink-deep-raised": "#46301f", "line-on-dark": "#5a3f2d", "on-dark": "#f5e9dc", "muted-on-dark": "#d2b9a3", "accent-on-dark": "#f0956b" } },
  { id: "sage", name: "Sage & Stone", description: "Soft sage stone, forest ink and a leaf-green accent. Fresh, natural and serene.", colors: { "canvas": "#f2f3ed", "surface": "#ffffff", "plinth": "#e4e7dc", "plinth-strong": "#d6dbcc", "line": "#d3d8c8", "line-strong": "#7b8570", "ink": "#1b241e", "ink-soft": "#2f3b32", "ink-2": "#3d4a40", "muted": "#59645a", "accent": "#2f6b4a", "accent-hover": "#24563b", "accent-tint": "#dcebe2", "ink-deep": "#18231c", "ink-deep-raised": "#212e25", "line-on-dark": "#2f3e33", "on-dark": "#e9eee6", "muted-on-dark": "#a7b5a8", "accent-on-dark": "#7fc79d" } },
  { id: "festive", name: "Royal Festive", description: "Ivory walls, deep maroon and haldi gold. Rich and celebratory — perfect for Diwali and wedding season.", colors: { "canvas": "#fbf6ef", "surface": "#ffffff", "plinth": "#f3e7d8", "plinth-strong": "#e8d7c2", "line": "#e3d2bd", "line-strong": "#93795f", "ink": "#2a1418", "ink-soft": "#43242a", "ink-2": "#523039", "muted": "#6d5157", "accent": "#8e1b3a", "accent-hover": "#74152f", "accent-tint": "#f5dde3", "ink-deep": "#3b0f1c", "ink-deep-raised": "#4a1726", "line-on-dark": "#5c2334", "on-dark": "#fbeedd", "muted-on-dark": "#ddb9a8", "accent-on-dark": "#e8b54a" } },
  { id: "blush", name: "Blush Atelier", description: "Soft blush plaster, plum ink and a rose accent. Gentle, romantic and gift-ready.", colors: { "canvas": "#fbf3f1", "surface": "#ffffff", "plinth": "#f3e3df", "plinth-strong": "#ead3cd", "line": "#e6d2cc", "line-strong": "#987a74", "ink": "#2a1a1f", "ink-soft": "#432a31", "ink-2": "#52363e", "muted": "#6c5157", "accent": "#a63d62", "accent-hover": "#8a3051", "accent-tint": "#f7dde6", "ink-deep": "#33202a", "ink-deep-raised": "#3f2a35", "line-on-dark": "#533a46", "on-dark": "#f8ebee", "muted-on-dark": "#d4b7bf", "accent-on-dark": "#f08fb0" } },
  { id: "midnight", name: "Midnight Gallery", description: "A dark, dramatic gallery at night with warm ivory type and an ember accent. Bold and luxurious.", dark: true, colors: { "canvas": "#141419", "surface": "#1c1c23", "plinth": "#22222a", "plinth-strong": "#2c2c36", "line": "#34343f", "line-strong": "#7a7a88", "ink": "#efebe3", "ink-soft": "#dcd7cd", "ink-2": "#d3cdc2", "muted": "#a8a297", "accent": "#e8835e", "accent-hover": "#f09a79", "accent-tint": "#3b2621", "ink-deep": "#0c0c10", "ink-deep-raised": "#16161c", "line-on-dark": "#2a2a33", "on-dark": "#efebe3", "muted-on-dark": "#a8a297", "accent-on-dark": "#e8835e" } },
];

export const DEFAULT_THEME: ThemeId = "limewash";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** CSS that overrides the design tokens for the chosen theme. */
export function themeCss(id: string | null | undefined) {
  const t = getTheme(id);
  const vars = Object.entries(t.colors).map(([k, v]) => `--color-${k}:${v}`).join(";");
  return `:root{${vars};color-scheme:${t.dark ? "dark" : "light"}}`;
}
