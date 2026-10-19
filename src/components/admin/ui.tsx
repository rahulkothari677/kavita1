"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, Sparkles, X } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

// ─── Toasts ──────────────────────────────────────────────────────────────────
// Ink pill, optional action (e.g. "Undo"). 5s plain, 8s with an action.
export type ToastAction = { label: string; onClick: () => void };
type Toast = { id: number; msg: string; kind: "ok" | "err"; action?: ToastAction };
type PushToast = (msg: string, kind?: "ok" | "err", action?: ToastAction) => void;
const ToastCtx = createContext<PushToast>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setList((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback<PushToast>(
    (msg, kind = "ok", action) => {
      const id = Date.now() + Math.random();
      setList((l) => [...l.slice(-2), { id, msg, kind, action }]);
      setTimeout(() => dismiss(id), action ? 8000 : 5000);
    },
    [dismiss],
  );
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[200] flex flex-col items-center gap-2 px-4 md:bottom-6 md:left-16 lg:left-[240px]"
      >
        {list.map((t) => (
          <div
            key={t.id}
            className="shadow-float pointer-events-auto flex max-w-[min(92vw,480px)] animate-fade-up items-center gap-2.5 rounded-full bg-ink py-3 pr-2 pl-4 text-[14px] leading-snug font-medium text-canvas"
          >
            {t.kind === "ok" ? <Check className="size-4 shrink-0" strokeWidth={2} aria-hidden /> : <AlertTriangle className="size-4 shrink-0 text-accent-on-dark" strokeWidth={1.75} aria-hidden />}
            <span className="min-w-0 flex-1 pr-2">
              {t.kind === "err" && <span className="sr-only">Error: </span>}
              {t.msg}
            </span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="on-dark -my-1 min-h-9 shrink-0 rounded-full px-3 text-[14px] font-semibold text-accent-on-dark hover:bg-white/10"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} className="on-dark grid size-8 shrink-0 place-items-center rounded-full text-canvas/70 hover:bg-white/10 hover:text-canvas" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ─── API helper ──────────────────────────────────────────────────────────────
export async function api<T = Record<string, unknown>>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "content-type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/admin/login";
  }
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export function useLoad<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      setData(await api<T>(url));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, setData, error, loading, reload };
}

// ─── Primitives ──────────────────────────────────────────────────────────────
/**
 * Admin button class strings (36px desktop / 44px mobile, radius 6px, Manrope 600 14px).
 * Usage: <button className={adminBtn.primary}>Save</button>. One primary per area.
 */
const BTN_BASE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[6px] px-4 text-[14px] font-semibold whitespace-nowrap transition-[background-color,transform,opacity] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 md:h-9 md:px-3.5";
export const adminBtn = {
  primary: `${BTN_BASE} bg-ink text-white hover:bg-ink-soft md:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_0_rgb(28_25_22/0.2)]`,
  secondary: `${BTN_BASE} border border-admin-line bg-white text-ink shadow-[inset_0_-1px_0_#e4e0da] hover:bg-admin-inset`,
  danger: `${BTN_BASE} bg-danger text-white hover:opacity-90`,
  wa: `${BTN_BASE} bg-wa text-white hover:bg-wa-hover`,
  ai: `${BTN_BASE} border border-ai-line bg-ai-bg text-ai-fg hover:bg-[#e6e4f7]`,
  ghost: `${BTN_BASE} text-ink hover:bg-admin-sidebar`,
} as const;

/** Page title in Fraunces 28px, optional muted subtitle and right-aligned actions. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 md:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-[1.1] font-[380] tracking-[-0.01em] text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] leading-5 text-muted md:text-[13px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White admin card: 1px admin-line, radius 8px, no shadow. */
export function Panel({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[8px] border border-admin-line bg-white ${className}`}>
      {title && (
        <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-admin-line px-4 py-3 md:px-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink md:text-[14px] md:leading-5">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return <Loader2 aria-hidden className={`animate-spin text-muted ${className}`} />;
}

/** A plinth skeleton block in the final shape of the content it stands in for. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-[6px] ${className}`} />;
}

/** Page-level loading: skeleton blocks instead of a spinner page. */
export function Loading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[8px] border border-admin-line bg-white p-4 md:p-5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-[8px] border border-admin-line bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-admin-line px-4 py-4 last:border-0 md:px-5">
            <Skeleton className="size-11 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** On/off switch. 44px hit area around a 44×24 track. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 after:absolute after:-inset-2.5 after:content-[''] ${checked ? "bg-success" : "bg-line-strong"}`}
    >
      <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform duration-200 ease-[var(--ease-out)] ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

/** White dialog: radius 8px on desktop, bottom sheet with a grabber on mobile. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<{ y: number; t: number } | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
      setDrag(0);
    };
  }, [open]);

  if (!open) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    if (window.matchMedia("(min-width: 640px)").matches) return;
    dragStart.current = { y: e.clientY, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setDrag(Math.max(0, e.clientY - dragStart.current.y));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    const v = dy / Math.max(1, performance.now() - dragStart.current.t);
    const h = panel.current?.offsetHeight ?? 400;
    dragStart.current = null;
    if (v > 0.5 || dy > h * 0.3) onClose();
    else setDrag(0);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink-deep/40" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
        className={`shadow-float relative flex max-h-[88dvh] w-full animate-sheet-up flex-col overflow-hidden rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)] transition-transform duration-200 outline-none sm:max-h-[90vh] sm:animate-fade-up sm:rounded-[8px] sm:pb-0 ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
      >
        <div className="touch-none sm:touch-auto" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
            <span className="h-1 w-9 rounded-full bg-line-strong" />
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-admin-line py-2 pr-2 pl-5 sm:py-3 sm:pl-6">
            <h3 id={titleId} className="font-display text-[22px] leading-tight font-[380] tracking-[-0.01em]">
              {title}
            </h3>
            <button type="button" onClick={onClose} className="icon-btn text-muted hover:text-ink" aria-label="Close">
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function confirmAction(msg: string) {
  return typeof window !== "undefined" && window.confirm(msg);
}

// ─── Status chips ────────────────────────────────────────────────────────────
/** 12px progress circle: empty / half / filled. Shape carries meaning, not colour alone. */
export function ProgressCircle({ fill, className = "size-3" }: { fill: "empty" | "half" | "full"; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={`shrink-0 ${className}`}>
      <circle cx="6" cy="6" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {fill === "half" && <path d="M6 2.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />}
      {fill === "full" && <circle cx="6" cy="6" r="3.5" fill="currentColor" />}
    </svg>
  );
}

const TONE = {
  warning: "bg-status-warning-bg text-status-warning-fg",
  info: "bg-status-info-bg text-status-info-fg",
  neutral: "bg-status-neutral-bg text-status-neutral-fg",
  danger: "bg-status-danger-bg text-status-danger-fg",
  success: "bg-status-success-bg text-status-success-fg",
} as const;

function Chip({ tone, fill, struck, children }: { tone: keyof typeof TONE; fill: "empty" | "half" | "full"; struck?: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11.5px] leading-none font-semibold whitespace-nowrap transition-colors duration-200 ${TONE[tone]}`}>
      <ProgressCircle fill={fill} />
      <span className={struck ? "line-through" : ""}>{children}</span>
    </span>
  );
}

const STATUS_CHIP: Record<OrderStatus, { label: string; tone: keyof typeof TONE; fill: "empty" | "half" | "full"; struck?: boolean }> = {
  PENDING: { label: "New", tone: "warning", fill: "empty" },
  CONFIRMED: { label: "Confirmed", tone: "info", fill: "empty" },
  IN_MAKING: { label: "Being made", tone: "neutral", fill: "half" },
  SHIPPED: { label: "Shipped", tone: "info", fill: "half" },
  DELIVERED: { label: "Delivered", tone: "neutral", fill: "full" },
  CANCELLED: { label: "Cancelled", tone: "neutral", fill: "empty", struck: true },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const c = STATUS_CHIP[status] ?? { label: String(status), tone: "neutral" as const, fill: "empty" as const };
  return (
    <Chip tone={c.tone} fill={c.fill} struck={c.struck}>
      {c.label}
    </Chip>
  );
}

export function PayPill({ status }: { status: string }) {
  if (status === "PAID")
    return (
      <Chip tone="neutral" fill="full">
        Paid
      </Chip>
    );
  if (status === "PARTIAL")
    return (
      <Chip tone="warning" fill="half">
        Part-paid
      </Chip>
    );
  if (status === "REFUNDED")
    return (
      <Chip tone="neutral" fill="empty">
        Refunded
      </Chip>
    );
  return (
    <Chip tone="danger" fill="empty">
      Unpaid
    </Chip>
  );
}

/** Small neel chip marking AI-filled content until it is edited. */
export function AiBadge({ label = "AI draft", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1 rounded-full border border-ai-line bg-ai-bg px-2 text-[11.5px] leading-none font-semibold whitespace-nowrap text-ai-fg ${className}`}>
      <Sparkles className="size-3" strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}

export function Empty({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      {icon && <div className="mb-2 grid size-14 place-items-center rounded-[12px] bg-plinth text-ink [&_svg]:size-6 [&_svg]:stroke-[1.75]">{icon}</div>}
      <p className="font-display text-[22px] leading-tight font-[380] tracking-[-0.01em] text-ink">{title}</p>
      {text && <p className="max-w-sm text-[14px] leading-5 text-muted">{text}</p>}
      {action && <div className="mt-3 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setDraft("");
  };
  return (
    <div className="input flex flex-wrap items-center gap-1.5 py-2">
      {value.map((t) => (
        <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full bg-admin-sidebar pr-1 pl-2.5 text-[13px] font-medium">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="grid size-5 place-items-center rounded-full text-muted hover:bg-admin-sidebar-hover hover:text-ink">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[120px] flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted md:text-sm"
      />
    </div>
  );
}
