"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, X } from "lucide-react";
import { adminBtn, ProgressCircle } from "../ui";
import { formatINR } from "@/lib/format";

const SW = 1.75;

// ─── Count-up (500ms, once per value, off under reduced motion) ─────────────
export function useCountUp(target: number, duration = 500) {
  const [v, setV] = useState(target);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === from.current) {
      setV(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setV(a + (target - a) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, duration]);
  return v;
}

// ─── Segmented control ───────────────────────────────────────────────────────
export function Segmented<T extends string | number>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 rounded-full bg-admin-sidebar p-1 md:h-8">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`tabular min-w-12 rounded-full px-3 text-[13px] font-semibold transition-colors duration-150 ${on ? "border border-admin-line bg-white text-ink" : "text-muted hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sparkline (axis-less, ink 60%, end dot) ─────────────────────────────────
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 3 - (v / max) * (h - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className={`h-8 w-full overflow-visible text-ink ${className}`}>
      <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2" fill="currentColor" />
    </svg>
  );
}

// ─── KPI tile ────────────────────────────────────────────────────────────────
export function KpiTile({
  label,
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  compact,
  delta,
  periodLabel,
  sub,
  spark,
  className = "",
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  compact?: (n: number) => string;
  delta?: { cur: number; prev: number };
  periodLabel?: string;
  sub?: string;
  spark?: number[];
  className?: string;
}) {
  const shown = useCountUp(value);
  let deltaEl: React.ReactNode = sub ? <span className="text-muted">{sub}</span> : null;
  if (delta) {
    const { cur, prev } = delta;
    if (!prev) deltaEl = <span className="text-muted">{cur ? `Nothing in the previous ${periodLabel}` : `No change vs previous ${periodLabel}`}</span>;
    else {
      const pct = Math.round(((cur - prev) / prev) * 100);
      deltaEl =
        pct === 0 ? (
          <span className="text-muted">Same as previous {periodLabel}</span>
        ) : (
          <span className={pct > 0 ? "text-success" : "text-danger"}>
            <span aria-hidden>{pct > 0 ? "▲" : "▼"}</span>
            <span className="sr-only">{pct > 0 ? "Up" : "Down"}</span> {Math.abs(pct)}% <span className="text-muted">vs previous {periodLabel}</span>
          </span>
        );
    }
  }
  return (
    <div className={`flex flex-col rounded-[8px] border border-admin-line bg-white p-4 md:p-5 ${className}`}>
      <p className="text-[13px] leading-5 text-muted">{label}</p>
      <p className="tabular mt-1.5 text-[28px] leading-none font-bold tracking-[-0.02em] text-ink md:text-[30px]">
        {compact ? (
          <>
            <span className="sm:hidden">{compact(shown)}</span>
            <span className="hidden sm:inline">{format(shown)}</span>
          </>
        ) : (
          format(shown)
        )}
      </p>
      {deltaEl && <p className="tabular mt-2 text-[12.5px] leading-[18px]">{deltaEl}</p>}
      {spark && <Sparkline values={spark} className="mt-auto pt-3" />}
    </div>
  );
}

// ─── Revenue chart ───────────────────────────────────────────────────────────
const dayFmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export function RevenueChart({ daily }: { daily: { date: string; revenue: number; orders: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const tableId = useId();
  const total = daily.reduce((s, d) => s + d.revenue, 0);
  if (!daily.length) return null;
  return (
    <figure>
      <div className="flex items-baseline justify-between text-[12px] text-muted">
        <span className="tabular">{formatINR(max)} peak</span>
        <span className="tabular">{formatINR(total)} total</span>
      </div>
      <div className="relative mt-2 h-[180px] rounded-[6px] bg-plinth px-2 pt-3" aria-hidden>
        <div className={`flex h-full items-end ${daily.length > 45 ? "gap-px" : "gap-[3px]"}`}>
          {daily.map((d, i) => {
            const isToday = i === daily.length - 1;
            return (
              <div key={d.date} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t-[2px] bg-ink transition-opacity group-hover:opacity-80" style={{ height: d.revenue ? `${Math.max(3, (d.revenue / max) * 100)}%` : "2px", opacity: d.revenue ? 1 : 0.18 }} />
                {isToday && <span className="absolute -bottom-[5px] left-1/2 size-[6px] -translate-x-1/2 rounded-full bg-accent" />}
                <div className="shadow-float pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-[6px] bg-ink px-2.5 py-1.5 text-[12px] whitespace-nowrap text-canvas group-hover:block">
                  <span className="tabular">
                    {dayFmt(d.date)} · {formatINR(d.revenue)} · {d.orders} {d.orders === 1 ? "order" : "orders"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-line-strong/50" />
      </div>
      <figcaption className="mt-2.5 flex justify-between text-[12px] text-muted">
        <span>{dayFmt(daily[0].date)}</span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" /> Today
        </span>
      </figcaption>
      <table id={tableId} className="sr-only">
        <caption>Daily sales</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Sales</th>
            <th scope="col">Orders</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <th scope="row">{dayFmt(d.date)}</th>
              <td>{formatINR(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// ─── Needs you ───────────────────────────────────────────────────────────────
export type NeedRow = { href: string; label: string; n: number; tone: "warning" | "info" | "danger" | "neutral"; fill: "empty" | "half" | "full" };
const TONE_FG = { warning: "text-status-warning-fg", info: "text-status-info-fg", danger: "text-status-danger-fg", neutral: "text-ink" } as const;
const TONE_BG = { warning: "bg-status-warning-bg", info: "bg-status-info-bg", danger: "bg-status-danger-bg", neutral: "bg-status-neutral-bg" } as const;

export function NeedsYou({ rows }: { rows: NeedRow[] }) {
  const live = rows.filter((r) => r.n > 0);
  return (
    <section className="rounded-[8px] border border-admin-line bg-white" aria-labelledby="needs-you">
      <h2 id="needs-you" className="border-b border-admin-line px-4 py-3 text-[16px] font-semibold md:px-5 md:text-[14px]">
        Needs you
      </h2>
      {live.length === 0 ? (
        <p className="flex items-center gap-2.5 px-4 py-5 text-[15px] md:px-5 md:text-[14px]">
          <span className="grid size-6 place-items-center rounded-full bg-status-neutral-bg">
            <Check className="size-3.5" strokeWidth={2} aria-hidden />
          </span>
          You’re all caught up
        </p>
      ) : (
        <ul>
          {live.map((r) => (
            <li key={r.label} className="border-b border-admin-line last:border-0">
              <Link href={r.href} className="flex min-h-14 items-center gap-3 px-4 transition-colors hover:bg-admin-inset md:px-5">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${TONE_BG[r.tone]} ${TONE_FG[r.tone]}`}>
                  <ProgressCircle fill={r.fill} className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 text-[15px] leading-5 md:text-[14px]">{r.label}</span>
                <span className="tabular text-[15px] font-semibold md:text-[14px]">{r.n}</span>
                <ChevronRight className="size-4 text-muted" strokeWidth={SW} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Setup guide ─────────────────────────────────────────────────────────────
export type SetupStep = { key: string; title: string; text: string; done: boolean; action?: React.ReactNode };

export function SetupGuide({ steps, onDismiss }: { steps: SetupStep[]; onDismiss: () => void }) {
  const done = steps.filter((s) => s.done).length;
  const complete = done === steps.length;
  const firstOpen = steps.find((s) => !s.done)?.key ?? null;
  const [open, setOpen] = useState<string | null>(firstOpen);
  const pct = Math.round((done / steps.length) * 100);
  return (
    <section className="overflow-hidden rounded-[8px] border border-admin-line bg-white" aria-labelledby="setup-title">
      <div className="flex items-start gap-3 px-4 pt-4 md:px-5">
        <div className="min-w-0 flex-1">
          <h2 id="setup-title" className="text-[16px] font-semibold md:text-[14px]">
            {complete ? "Your studio is ready" : "Get your studio ready"} <span className="tabular font-medium text-muted">· {done} of {steps.length} done</span>
          </h2>
          <p className="mt-0.5 text-[14px] text-muted md:text-[13px]">{complete ? "Every step is done. You can hide this guide now." : "A few small steps so customers can find, trust and pay you."}</p>
        </div>
        {complete && (
          <button type="button" onClick={onDismiss} className="icon-btn -mt-2 -mr-2 text-muted hover:text-ink" aria-label="Hide setup guide">
            <X className="size-5" strokeWidth={SW} />
          </button>
        )}
      </div>
      <div className="mx-4 mt-3 h-0.5 overflow-hidden rounded-full bg-admin-sidebar md:mx-5" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Setup progress">
        <div className="h-full bg-accent transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-2 pb-1">
        {steps.map((s) => {
          const isOpen = open === s.key;
          return (
            <li key={s.key} className="border-t border-admin-line first:border-0">
              <button type="button" onClick={() => setOpen(isOpen ? null : s.key)} aria-expanded={isOpen} className="flex min-h-12 w-full items-center gap-3 px-4 text-left hover:bg-admin-inset md:px-5">
                {s.done ? (
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink text-white">
                    <Check className="size-3" strokeWidth={2.5} aria-hidden />
                  </span>
                ) : (
                  <span className="size-5 shrink-0 rounded-full border-[1.5px] border-dashed border-line-strong" aria-hidden />
                )}
                <span className={`min-w-0 flex-1 text-[15px] md:text-[14px] ${s.done ? "text-muted line-through decoration-line-strong" : "font-medium"}`}>{s.title}</span>
                <span className="sr-only">{s.done ? "(done)" : "(to do)"}</span>
                <ChevronDown className={`size-4 shrink-0 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={SW} aria-hidden />
              </button>
              {isOpen && (
                <div className="animate-fade-in pr-4 pb-4 pl-12 md:pr-5 md:pl-[52px]">
                  <p className="text-[14px] leading-5 text-muted md:text-[13px]">{s.text}</p>
                  {s.action && <div className="mt-3 flex flex-wrap gap-2">{s.action}</div>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function CopyLinkButton({ url, onCopied }: { url: string; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt("Copy your shop link", url);
        }
        setCopied(true);
        onCopied();
        setTimeout(() => setCopied(false), 1800);
      }}
      className={adminBtn.secondary}
    >
      {copied ? <Check className="size-4" strokeWidth={2} aria-hidden /> : <Copy className="size-4" strokeWidth={SW} aria-hidden />}
      {copied ? "Copied" : "Copy shop link"}
    </button>
  );
}
