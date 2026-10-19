"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <select
      value={value}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString());
        p.set("sort", e.target.value);
        router.push(`${pathname}?${p.toString()}`);
      }}
      className="input w-auto rounded-full py-2 pr-8 text-sm"
      aria-label="Sort products"
    >
      <option value="featured">Featured</option>
      <option value="newest">Newest</option>
      <option value="popular">Most loved</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}
