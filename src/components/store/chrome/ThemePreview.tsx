"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTheme, themeCss, type Theme } from "@/lib/themes";

/**
 * Owner-only theme preview, applied in the browser from the `ka_theme_preview` cookie
 * (set by /api/theme-preview). Kept out of the server render so shop pages stay static
 * and can be served from the CDN instead of being rebuilt on every visit.
 */
export function ThemePreview() {
  const [preview, setPreview] = useState<Theme | null>(null);
  useEffect(() => {
    const id = document.cookie.match(/(?:^|;\s*)ka_theme_preview=([^;]+)/)?.[1];
    if (id) setPreview(getTheme(decodeURIComponent(id)));
  }, []);
  if (!preview) return null;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss(preview.id) }} />
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink px-4 py-2 text-center text-[13px] text-canvas">
        <span>
          Previewing the <b>{preview.name}</b> theme — only you can see this.
        </span>
        <Link href="/admin/settings#appearance" className="underline underline-offset-2">
          Apply in settings
        </Link>
        <a href="/api/theme-preview?theme=off" className="underline underline-offset-2">
          Exit preview
        </a>
      </div>
    </>
  );
}
