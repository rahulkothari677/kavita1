"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-ink px-4 text-[14px] font-semibold text-white transition-colors hover:bg-ink-soft active:scale-[0.98] md:h-9">
      <Printer className="size-4" strokeWidth={1.75} aria-hidden /> Print or save PDF
    </button>
  );
}
