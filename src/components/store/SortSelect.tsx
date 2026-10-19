"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

const OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most loved" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Quiet native select dressed as a text control: "Sort: Featured ▾". */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <label
      className={`relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-[4px] pr-1 pl-2 text-[14px] font-medium text-ink transition-colors hover:bg-plinth has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-solid ${
        pending ? "opacity-60" : ""
      }`}
    >
      <span className="text-muted">Sort:</span>
      <span>{current.label}</span>
      <ChevronDown aria-hidden className="size-4 text-ink" strokeWidth={1.5} />
      <select
        value={current.value}
        onChange={(e) => {
          const p = new URLSearchParams(sp.toString());
          if (e.target.value === "featured") p.delete("sort");
          else p.set("sort", e.target.value);
          const qs = p.toString();
          start(() => router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
        }}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
        aria-label="Sort pieces"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
