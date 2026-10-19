"use client";

import { Check, ExternalLink } from "lucide-react";
import { THEMES } from "@/lib/themes";

/** Visual theme chooser: each card is a tiny mock of the storefront in that theme. */
export function ThemePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {THEMES.map((t) => {
        const c = t.colors;
        const active = (value || "limewash") === t.id;
        return (
          <div key={t.id} className={`overflow-hidden rounded-[8px] border bg-white transition ${active ? "border-ink ring-1 ring-ink" : "border-admin-line hover:border-line-strong"}`}>
            <button type="button" onClick={() => onChange(t.id)} aria-pressed={active} className="block w-full text-left">
              {/* mini storefront */}
              <div style={{ background: c.canvas }} className="p-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: c.ink }} className="font-display text-[13px]">
                    Kavita’s Artistry<span style={{ background: c.accent }} className="ml-0.5 inline-block size-[3px] rounded-full align-baseline" />
                  </span>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ background: c.muted }} className="h-1 w-3 rounded-full opacity-60" />
                    ))}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-[1.2fr_1fr] gap-2">
                  <div>
                    <p style={{ color: c.ink }} className="font-display text-[17px] leading-tight">
                      Art made <em>slowly</em>
                    </p>
                    <span style={{ background: c.ink, color: c.canvas }} className="mt-2 inline-block rounded-[3px] px-2 py-1 text-[9px] font-medium">
                      Explore
                    </span>
                  </div>
                  <div style={{ background: c.plinth }} className="aspect-[4/5] rounded-t-full" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ background: c.plinth }} className="aspect-square rounded-[2px]" />
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
