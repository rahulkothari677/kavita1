"use client";

import { useMemo, useState } from "react";
import { Download, Phone, Repeat, Users } from "lucide-react";
import { Empty, PageHeader, useLoad } from "@/components/admin/ui";
import { ADMIN_ICONS, btn, cardShell, cx, downloadCsv, FilterChips, relTime, SearchField, SkeletonRows, StateChip } from "@/components/admin/pages/kit";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { Customer } from "@/lib/analytics";

type Seg = "all" | "repeat" | "vip" | "lapsed";
const SEGS: { key: Seg; label: string; test: (c: Customer) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "repeat", label: "Repeat", test: (c) => c.orders > 1 },
  { key: "vip", label: "₹5k+ spent", test: (c) => c.spent >= 5000 },
  { key: "lapsed", label: "Quiet for 90 days", test: (c) => Date.now() - new Date(c.lastOrder).getTime() > 90 * 86400000 },
];

export default function CustomersPage() {
  const { data, loading } = useLoad<{ customers: Customer[] }>("/api/admin/customers");
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<Seg>("all");
  const all = useMemo(() => data?.customers ?? [], [data]);
  const counts = useMemo(() => Object.fromEntries(SEGS.map((s) => [s.key, all.filter(s.test).length])) as Record<Seg, number>, [all]);
  const list = useMemo(() => {
    let l = all.filter((SEGS.find((s) => s.key === seg) ?? SEGS[0]).test);
    if (q) l = l.filter((c) => `${c.name} ${c.phone} ${c.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    return l;
  }, [all, q, seg]);

  const exportCsv = () =>
    downloadCsv("customers.csv", [["Name", "Phone", "City", "Orders", "Spent", "Last order"], ...list.map((c) => [c.name, c.phone, c.city ?? "", c.orders, c.spent, c.lastOrder.slice(0, 10)])]);

  const hello = (c: Customer) => waLink(c.phone, `Hi ${c.name.split(" ")[0]}! `);

  return (
    <div className={ADMIN_ICONS}>
      <PageHeader
        title="Customers"
        subtitle={data ? `${all.length} ${all.length === 1 ? "customer" : "customers"}, built from your orders` : "Built from your orders"}
        actions={
          <button onClick={exportCsv} disabled={!list.length} className={btn("secondary")}>
            <Download className="size-4" aria-hidden /> Export CSV
          </button>
        }
      />
      <div className="mb-4 flex flex-col gap-3">
        <FilterChips label="Customer groups" value={seg} onChange={setSeg} items={SEGS.map((s) => ({ key: s.key, label: s.label, count: counts[s.key] }))} />
        <SearchField value={q} onChange={setQ} label="Search customers" placeholder="Search name, phone or city" className="md:max-w-md" />
      </div>

      {loading && !data ? (
        <SkeletonRows rows={6} />
      ) : list.length === 0 ? (
        <div className={cardShell}>
          <Empty icon={<Users />} title={all.length ? "No one matches" : "Your first customer will appear here"} text={all.length ? "Try another group or search." : "Customers are added automatically after their first order."} />
        </div>
      ) : (
        <>
          {/* Mobile rows */}
          <ul className={cx(cardShell, "md:hidden")}>
            {list.map((c) => (
              <li key={c.phone} className="flex min-h-[76px] items-center gap-3 border-b border-admin-line py-3 pr-2 pl-4 last:border-0">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-plinth text-[16px] font-semibold" aria-hidden>
                  {c.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[16px] leading-6 font-semibold">{c.name}</p>
                    <p className="tabular shrink-0 text-[16px] leading-6 font-semibold">{formatINR(c.spent)}</p>
                  </div>
                  <p className="tabular truncate text-[14px] leading-5 text-muted">
                    {c.orders} {c.orders === 1 ? "order" : "orders"}
                    {c.city ? ` · ${c.city}` : ""} · {relTime(c.lastOrder)}
                  </p>
                  {c.orders > 1 && (
                    <div className="mt-1.5">
                      <StateChip tone="neutral" icon={<Repeat className="size-3" aria-hidden />}>
                        Repeat
                      </StateChip>
                    </div>
                  )}
                </div>
                <a href={hello(c)} target="_blank" rel="noreferrer" className="icon-btn shrink-0 text-wa!" aria-label={`WhatsApp ${c.name}`}>
                  <WhatsAppIcon className="size-[22px]" />
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className={cx(cardShell, "hidden overflow-visible md:block")}>
            <table className="w-full border-separate border-spacing-0 text-[14px]">
              <thead>
                <tr className="text-left text-[12px] text-muted">
                  {["Customer", "Phone", "City", "Orders", "Spent", "Last order", ""].map((h, i) => (
                    <th key={i} scope="col" className={cx("sticky top-0 z-10 h-10 border-b border-admin-line bg-admin-inset px-3 font-semibold first:rounded-tl-[8px] first:pl-4 last:rounded-tr-[8px]", (h === "Orders" || h === "Spent") && "text-right")}>
                      {h || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.phone} className="h-11 hover:bg-admin-inset [&>td]:border-b [&>td]:border-admin-line last:[&>td]:border-0">
                    <td className="py-1.5 pr-3 pl-4">
                      <span className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-plinth text-[13px] font-semibold" aria-hidden>
                          {c.name.trim()[0]?.toUpperCase() ?? "?"}
                        </span>
                        <span className="truncate font-medium">{c.name}</span>
                        {c.orders > 1 && (
                          <StateChip tone="neutral" icon={<Repeat className="size-3" aria-hidden />}>
                            Repeat
                          </StateChip>
                        )}
                      </span>
                    </td>
                    <td className="tabular px-3 whitespace-nowrap">{c.phone}</td>
                    <td className="px-3 text-muted">{c.city ?? "—"}</td>
                    <td className="tabular px-3 text-right">{c.orders}</td>
                    <td className="tabular px-3 text-right font-semibold">{formatINR(c.spent)}</td>
                    <td className="tabular px-3 whitespace-nowrap text-muted">{relTime(c.lastOrder)}</td>
                    <td className="w-24 pr-2">
                      <span className="flex justify-end gap-0.5">
                        <a href={`tel:${c.phone}`} className="grid size-9 place-items-center rounded-full hover:bg-admin-sidebar" aria-label={`Call ${c.name}`}>
                          <Phone className="size-4" />
                        </a>
                        <a href={hello(c)} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full text-wa hover:bg-admin-sidebar" aria-label={`WhatsApp ${c.name}`}>
                          <WhatsAppIcon className="size-[18px]" />
                        </a>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tabular mt-3 text-[13px] text-muted">Tip: export a group as CSV to build a WhatsApp broadcast list.</p>
        </>
      )}
    </div>
  );
}
