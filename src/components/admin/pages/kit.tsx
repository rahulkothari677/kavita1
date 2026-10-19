"use client";

/**
 * Shared building blocks for the admin section pages ("atelier back office").
 * Warm-neutral chrome, colour only for meaning: status chips, WhatsApp green, neel for AI.
 * Everything here composes the global tokens/classes from globals.css and the primitives in ../ui.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Loader2, Search, Sparkles, X } from "lucide-react";
import { Modal, useToast } from "../ui";
import { useAdminChrome } from "../core/chrome";
import { timeAgo } from "@/lib/format";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

/** Every lucide icon inside an admin page renders at stroke 1.75. */
export const ADMIN_ICONS = "[&_svg.lucide]:stroke-[1.75]";

// ─── Buttons ────────────────────────────────────────────────────────────────
// Admin buttons: 44px mobile / 36px desktop, radius 6px, Manrope 600 14px. One primary per area.
const BTN_BASE =
  "inline-flex h-11 shrink-0 select-none items-center justify-center gap-2 rounded-[6px] px-4 text-[14px] leading-none font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[.98] disabled:pointer-events-none disabled:border-transparent disabled:bg-plinth-strong disabled:text-muted disabled:shadow-none md:h-9 md:px-3.5";
const BTN = {
  primary: "bg-ink text-white hover:bg-ink-soft md:shadow-[inset_0_1px_0_rgb(255_255_255/.12),0_1px_0_rgb(28_25_22/.2)]",
  secondary: "border border-admin-line bg-white text-ink shadow-[inset_0_-1px_0_#E4E0DA] hover:bg-admin-inset",
  wa: "bg-wa text-white hover:bg-wa-hover",
  waOutline: "border border-wa bg-white text-ink hover:bg-[color-mix(in_srgb,var(--color-wa)_6%,white)] [&_svg]:text-wa",
  danger: "bg-danger text-white hover:bg-[#9a1e14]",
  dangerGhost: "text-danger hover:bg-status-danger-bg",
  ai: "bg-ai-fg text-white hover:bg-[#3f3a8c]",
  aiOutline: "border border-ai-line bg-white text-ai-fg hover:bg-ai-bg",
  ghost: "text-ink hover:bg-admin-sidebar",
  onInk: "border border-white/40 bg-transparent text-white hover:bg-white/10",
  onInkFill: "bg-white text-ink hover:bg-canvas",
} as const;
export type BtnKind = keyof typeof BTN;
export const btn = (kind: BtnKind = "secondary", extra = "") => cx(BTN_BASE, BTN[kind], extra);

/** Admin input: white, 1px line-strong, radius 6px, 48px / 16px text on mobile, 36px / 14px on desktop. */
export const field = "input rounded-[6px]! md:min-h-9! md:py-1.5! md:text-[14px]!";
export const fieldLabel = "label";

// ─── Toast with an optional action (Undo) ──────────────────────────────────
export type ToastActionT = { label: string; onClick: () => void };
type PushToast = (msg: string, kind?: "ok" | "err", action?: ToastActionT) => void;
/** The admin toast, typed with its optional action. Falls back gracefully if actions are unsupported. */
export function useActionToast() {
  return useToast() as unknown as PushToast;
}

// ─── Time + clipboard ───────────────────────────────────────────────────────
const RTF = typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl ? new Intl.RelativeTimeFormat("en-IN", { numeric: "auto", style: "narrow" }) : null;
/** '3h ago' via Intl.RelativeTimeFormat('en-IN'); older than a week shows the date. */
export function relTime(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  // Minutes and hours stay compact ('3h ago'); days read naturally ('yesterday', '3 days ago').
  if (!RTF || s < 86400 || s > 86400 * 7 || Number.isNaN(s)) return timeAgo(iso);
  return RTF.format(-Math.floor(s / 86400), "day");
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Download rows as a UTF-8 CSV (Excel-friendly BOM). */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = "﻿" + rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ─── Status chips (icon + label, never colour alone) ────────────────────────
export type Fill = "empty" | "half" | "full";
export function ProgressDot({ fill, className = "size-3" }: { fill: Fill; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={`shrink-0 ${className}`}>
      <circle cx="6" cy="6" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {fill === "half" && <path d="M6 2.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />}
      {fill === "full" && <circle cx="6" cy="6" r="3.5" fill="currentColor" />}
    </svg>
  );
}

const TONES = {
  warning: "bg-status-warning-bg text-status-warning-fg",
  info: "bg-status-info-bg text-status-info-fg",
  neutral: "bg-status-neutral-bg text-status-neutral-fg",
  danger: "bg-status-danger-bg text-status-danger-fg",
  success: "bg-status-success-bg text-status-success-fg",
} as const;
export type Tone = keyof typeof TONES;

export function StateChip({ tone, fill, children, struck, icon }: { tone: Tone; fill?: Fill; children: React.ReactNode; struck?: boolean; icon?: React.ReactNode }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11.5px] leading-none font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {icon ?? <ProgressDot fill={fill ?? "empty"} />}
      <span className={struck ? "line-through" : ""}>{children}</span>
    </span>
  );
}

/** Small neel chip marking AI-filled content until it is edited. */
export function AiDraftChip({ label = "AI draft", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1 rounded-full border border-ai-line bg-ai-bg px-2 text-[11.5px] leading-none font-semibold whitespace-nowrap text-ai-fg ${className}`}>
      <Sparkles className="size-3" aria-hidden />
      {label}
    </span>
  );
}

// ─── Layout pieces ──────────────────────────────────────────────────────────
/** Detail-page header: back chevron + parent label, title, meta line and actions. */
export function DetailHeader({ back, title, meta, chips, actions }: { back: { href: string; label: string }; title: React.ReactNode; meta?: React.ReactNode; chips?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <Link href={back.href} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-[6px] pr-3 pl-1 text-[14px] font-medium text-muted hover:text-ink md:h-9">
        <ChevronLeft className="size-5" aria-hidden /> {back.label}
      </Link>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="tabular min-w-0 text-[28px] leading-[1.15] font-bold tracking-[-0.01em] break-words text-ink md:font-display md:font-[380]">{title}</h1>
            {chips && <div className="flex flex-wrap items-center gap-1.5">{chips}</div>}
          </div>
          {meta && <div className="mt-1 text-[14px] text-muted md:text-[13px]">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** White admin card shell for lists/tables (no padding). */
export const cardShell = "overflow-hidden rounded-[8px] border border-admin-line bg-white";

/** Neel AI card: text/icons in ai-fg on ai-bg with a 1px ai-line border and the Sparkles icon. */
export function AiPanel({ title, action, children, className = "" }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[8px] border border-ai-line bg-ai-bg ${className}`}>
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-ai-line px-4 py-3 md:px-5">
        <h2 className="flex items-center gap-2 text-[16px] leading-6 font-semibold text-ai-fg md:text-[14px] md:leading-5">
          <Sparkles className="size-4 shrink-0" aria-hidden /> {title}
        </h2>
        {action}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

/** Stepped AI progress card with a determinate 2px neel bar. */
export function AiProgress({ title, steps, progress }: { title: string; steps: { label: string; state: "done" | "current" | "todo" }[]; progress: number }) {
  return (
    <div role="status" aria-live="polite" className="overflow-hidden rounded-[8px] border border-ai-line bg-ai-bg">
      <div className="h-0.5 bg-ai-line" aria-hidden>
        <div className="h-full bg-ai-fg transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }} />
      </div>
      <div className="p-4 md:p-5">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-ai-fg">
          <Sparkles className="size-4" aria-hidden /> {title}
        </p>
        <ol className="mt-3 flex flex-col gap-2 text-[14px] md:flex-row md:flex-wrap md:items-center md:gap-x-2">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              {s.state === "done" ? (
                <span className="grid size-4 place-items-center rounded-full bg-ai-fg text-white">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
              ) : s.state === "current" ? (
                <Loader2 className="size-4 animate-spin text-ai-fg" aria-hidden />
              ) : (
                <span className="size-4 rounded-full border-[1.5px] border-ai-line bg-white" aria-hidden />
              )}
              <span className={s.state === "todo" ? "text-muted" : "font-medium text-ai-fg"}>
                {s.label}
                <span className="sr-only"> — {s.state === "done" ? "done" : s.state === "current" ? "in progress" : "waiting"}</span>
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden className="hidden text-muted md:inline">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Time-based progress for a single long AI request (eases toward 92% until done). */
export function useEasedProgress(active: boolean, seconds = 12) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) {
      setP(0);
      return;
    }
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      setP(0.92 * (1 - Math.exp(-t / (seconds / 2.5))));
    }, 250);
    return () => window.clearInterval(id);
  }, [active, seconds]);
  return p;
}

// ─── Filters & search ───────────────────────────────────────────────────────
export function FilterChips<K extends string>({ items, value, onChange, label, className = "" }: { items: { key: K; label: string; count?: number }[]; value: K; onChange: (k: K) => void; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cx("snap-row -mx-4 gap-1.5 px-4 md:mx-0 md:flex-wrap md:px-0", className)}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(it.key)}
            className={cx(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 md:h-8 md:text-[13px]",
              on ? "bg-ink text-white" : "border border-admin-line bg-white text-ink hover:bg-admin-inset",
            )}
          >
            {it.label}
            {it.count !== undefined && <span className={cx("tabular text-[12px] font-semibold", on ? "text-white/75" : "text-muted")}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder, label, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <div className={cx("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} className={cx(field, "pr-10 pl-10!")} />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink md:size-8" aria-label="Clear search">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/** 32px segmented control: white pill on an admin-sidebar track. */
export function Segmented<K extends string>({ items, value, onChange, label }: { items: { key: K; label: React.ReactNode; aria?: string }[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 items-center gap-0.5 rounded-[8px] bg-admin-sidebar p-1 md:h-8">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          role="radio"
          aria-checked={value === it.key}
          aria-label={it.aria}
          onClick={() => onChange(it.key)}
          className={cx(
            "inline-flex h-full items-center gap-1.5 rounded-[6px] px-3 text-[13px] font-semibold transition-colors duration-150",
            value === it.key ? "border border-admin-line bg-white text-ink" : "text-muted hover:text-ink",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────
export function Sk({ className = "" }: { className?: string }) {
  return <div aria-hidden className={cx("skeleton rounded-[6px]!", className)} />;
}

export function SkeletonRows({ rows = 6, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <div role="status" aria-label="Loading" className={cardShell}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-[76px] items-center gap-3 border-b border-admin-line px-4 last:border-0 lg:min-h-11">
          {thumb && <Sk className="size-11 shrink-0" />}
          <div className="flex-1 space-y-2">
            <Sk className="h-3.5 w-1/2" />
            <Sk className="h-3 w-1/3" />
          </div>
          <Sk className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Sk className="aspect-[4/5] w-full" />
          <Sk className="mt-2.5 h-3.5 w-3/4" />
          <Sk className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Confirm dialog (irreversible deletes only) ─────────────────────────────
type ConfirmOpts = { title: string; body?: React.ReactNode; confirmLabel?: string };
/** A styled dialog that replaces window.confirm for irreversible actions. */
export function useConfirm() {
  const [state, setState] = useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null);
  const ask = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ opts, resolve })), []);
  const close = useCallback(
    (v: boolean) => {
      setState((s) => {
        s?.resolve(v);
        return null;
      });
    },
    [],
  );
  const dialog = (
    <Modal open={!!state} onClose={() => close(false)} title={state?.opts.title ?? ""}>
      {state && (
        <div>
          {state.opts.body && <div className="text-[15px] leading-6 text-ink-2">{state.opts.body}</div>}
          <p className="mt-2 text-[13px] text-muted">This can’t be undone.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => close(false)} className={btn("secondary")}>
              Keep it
            </button>
            <button type="button" onClick={() => close(true)} className={btn("danger")}>
              {state.opts.confirmLabel ?? "Delete"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
  return [ask, dialog] as const;
}

// ─── Contextual save bar ────────────────────────────────────────────────────
/**
 * When a form is dirty: a sticky 56px ink bar at the top on desktop, a 64px bar at the bottom on
 * mobile that replaces the floating nav. Discard is white-outline, Save is white-filled.
 */
export function ContextBar({
  show,
  message = "Unsaved changes",
  busy,
  primaryLabel = "Save",
  onPrimary,
  secondaryLabel = "Discard",
  onSecondary,
  primaryDisabled,
}: {
  show: boolean;
  message?: React.ReactNode;
  busy?: boolean;
  primaryLabel?: React.ReactNode;
  onPrimary: () => void;
  secondaryLabel?: React.ReactNode;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
}) {
  const { setSaveBarActive } = useAdminChrome();
  const setRef = useRef(setSaveBarActive);
  useEffect(() => {
    setRef.current = setSaveBarActive;
  }, [setSaveBarActive]);
  useEffect(() => {
    setRef.current(show);
    return () => setRef.current(false);
  }, [show]);
  if (!show) return null;
  return (
    <div
      role="region"
      aria-label="Save changes"
      className="on-dark fixed inset-x-0 bottom-0 z-[60] bg-ink pb-[env(safe-area-inset-bottom)] text-white transition-[translate,opacity] duration-200 ease-[var(--ease-out)] starting:translate-y-full md:top-0 md:bottom-auto md:left-16 md:pb-0 md:starting:-translate-y-full lg:left-[240px]"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 md:h-14 md:px-8">
        <p className="mr-auto min-w-0 truncate text-[14px] font-medium text-white/85">{message}</p>
        {onSecondary && (
          <button type="button" onClick={onSecondary} disabled={busy} className={btn("onInk")}>
            {secondaryLabel}
          </button>
        )}
        <button type="button" onClick={onPrimary} disabled={busy || primaryDisabled} className={btn("onInkFill", "min-w-24")}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Small bits ─────────────────────────────────────────────────────────────
/** Plinth thumbnail, radius 6px. */
export function Thumb({ src, className = "size-11", alt = "" }: { src: string | null | undefined; className?: string; alt?: string }) {
  return (
    <span className={cx("block shrink-0 overflow-hidden rounded-[6px] bg-plinth", className)}>
      {src ? <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" /> : null}
    </span>
  );
}

/** A 56px row inside an action sheet. */
export function SheetRow({ icon, children, onClick, href, external, tone }: { icon: React.ReactNode; children: React.ReactNode; onClick?: () => void; href?: string; external?: boolean; tone?: "danger" | "wa" }) {
  const cls = cx(
    "flex min-h-14 w-full items-center gap-3 rounded-[6px] px-3 text-left text-[15px] font-medium hover:bg-admin-inset",
    tone === "danger" ? "text-danger" : "text-ink",
    tone === "wa" && "[&>span:first-child]:text-wa",
  );
  const inner = (
    <>
      <span className="grid size-6 shrink-0 place-items-center" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </>
  );
  if (href)
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} onClick={onClick} className={cls}>
        {inner}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Origin of the storefront for share links (client only). */
export function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}
