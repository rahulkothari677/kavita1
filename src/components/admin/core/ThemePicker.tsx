"use client";

import { Check, ExternalLink } from "lucide-react";
import { THEMES, themeLook } from "@/lib/themes";

/** Visual theme chooser: each card is a tiny mock of the storefront in that theme. */
export function ThemePicker({ value, onChange, pattern = false }: { value: string; onChange: (id: string) => void; pattern?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {THEMES.map((t) => {
        const c = t.colors;
        const look = themeLook(t);
        const r = Math.min(look.radius, 16) / 2;
        const active = (value || "atelier") === t.id;
        return (
          <div key={t.id} className={`overflow-hidden rounded-[8px] border bg-white transition ${active ? "border-ink ring-1 ring-ink" : "border-admin-line hover:border-line-strong"}`}>
            <button type="button" onClick={() => onChange(t.id)} aria-pressed={active} className="block w-full text-left">
              {/* mini storefront */}
              <div style={{ backgroundColor: c.canvas, backgroundImage: pattern ? look.pattern : undefined, backgroundSize: look.patternSize, fontFamily: look.sans }} className="p-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: c.accent, fontFamily: look.script, fontStyle: look.scriptStyle, fontWeight: look.scriptWeight }} className="text-[15px] leading-none">
                    Kavita’s Artistry
                  </span>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ background: c.muted }} className="h-1 w-3 rounded-full opacity-60" />
                    ))}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-[1.2fr_1fr] gap-2">
                  <div>
                    <p style={{ color: c.ink, fontFamily: look.script, fontStyle: look.scriptStyle, fontWeight: look.scriptWeight }} className="text-[19px] leading-tight">
                      Handmade Art
                    </p>
                    <span style={{ background: c.ink, color: c.canvas, borderRadius: Math.min(t.style.ctl, 99) / 3 }} className="mt-2 inline-block px-2 py-1 text-[9px] font-medium">
                      Explore
                    </span>
                  </div>
                  <div style={{ background: c.hero, borderRadius: r * 1.5 }} className="aspect-[4/5]" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ background: i === 1 ? c["panel-b"] : c["panel-a"], borderRadius: r }} className="aspect-square" />
                  ))}
                </div>
              </div>
              <div style={{ background: c["ink-deep"] }} className="flex items-center gap-1.5 px-3 py-2">
                <span style={{ background: c["accent-on-dark"] }} className="size-1.5 rounded-full" />
                <span style={{ color: c["on-dark"] }} className="text-[10px] tracking-[0.12em] uppercase">
                  The making
                </span>
              </div>
            </button>
            <div className="flex items-start justify-between gap-3 border-t border-admin-line p-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[14px] font-semibold">
                  {active && <Check className="size-4 text-success" />}
                  {t.name}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t.description}</p>
              </div>
              <a
                href={`/api/theme-preview?theme=${t.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-[6px] border border-admin-line px-2 py-1 text-[12px] font-medium hover:bg-admin-inset"
                title="See your live website in this theme (only you see it)"
              >
                Preview <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
