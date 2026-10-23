"use client";

import { Check } from "lucide-react";
import { BODY_FONTS, TITLE_FONTS, fontFamily, getTheme, themeLook, type FontChoice } from "@/lib/themes";

/**
 * Pick the website's title font and body font. Each option is written in its own font;
 * "Theme's own" keeps whatever the chosen theme uses.
 */
export function FontPicker({
  theme,
  title,
  body,
  onTitle,
  onBody,
}: {
  theme: string;
  title: string;
  body: string;
  onTitle: (id: string) => void;
  onBody: (id: string) => void;
}) {
  const look = themeLook(getTheme(theme));
  return (
    <div className="space-y-5">
      <Group
        heading="Title font"
        text="Section titles, category tiles and your name in the header."
        sample="Kavita’s Artistry"
        size={24}
        options={TITLE_FONTS}
        value={title}
        onChange={onTitle}
        themeDefault={{ family: look.script, italic: look.scriptStyle === "italic", weight: look.scriptWeight }}
      />
      <Group
        heading="Body font"
        text="Everything else: product names, prices, descriptions and buttons."
        sample="Handmade Lippan art · ₹1,499"
        size={16}
        options={BODY_FONTS}
        value={body}
        onChange={onBody}
        themeDefault={{ family: look.sans, italic: false, weight: 400 }}
      />
    </div>
  );
}

function Group({
  heading,
  text,
  sample,
  size,
  options,
  value,
  onChange,
  themeDefault,
}: {
  heading: string;
  text: string;
  sample: string;
  size: number;
  options: FontChoice[];
  value: string;
  onChange: (id: string) => void;
  themeDefault: { family: string; italic: boolean; weight: number };
}) {
  const all = [{ id: "", label: "Theme’s own", ...themeDefault }, ...options.map((o) => ({ id: o.id, label: o.label, family: fontFamily(o), italic: !!o.italic, weight: o.weight }))];
  return (
    <div>
      <p className="text-[14px] font-semibold">{heading}</p>
      <p className="mt-0.5 text-[12.5px] text-muted">{text}</p>
      <div role="radiogroup" aria-label={heading} className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {all.map((o) => {
          const active = (value || "") === o.id;
          return (
            <button
              key={o.id || "theme"}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.id)}
              className={`rounded-[8px] border bg-white px-3 py-2.5 text-left transition ${active ? "border-ink ring-1 ring-ink" : "border-admin-line hover:border-line-strong"}`}
            >
              <span className="block truncate leading-tight text-ink" style={{ fontFamily: o.family, fontStyle: o.italic ? "italic" : "normal", fontWeight: o.weight, fontSize: size }}>
                {sample}
              </span>
              <span className="mt-1 flex items-center gap-1 text-[12px] text-muted">
                {active && <Check className="size-3.5 text-success" aria-hidden />}
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
