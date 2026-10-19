"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

// ─── Toasts ──────────────────────────────────────────────────────────────────
type Toast = { id: number; msg: string; kind: "ok" | "err" };
const ToastCtx = createContext<(msg: string, kind?: "ok" | "err") => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {list.map((t) => (
          <div key={t.id} className={`flex animate-fade-up items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white shadow-xl ${t.kind === "ok" ? "bg-ink" : "bg-danger"}`}>
            {t.kind === "ok" ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
            {t.msg}
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
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[34px] leading-none font-semibold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-ink/[0.07] bg-white shadow-[0_1px_2px_color-mix(in_srgb,var(--color-ink)_4%,transparent)] ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-ink/[0.06] px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin text-ink/40 ${className}`} />;
}

export function Loading() {
  return (
    <div className="grid place-items-center py-24">
      <Spinner className="size-7" />
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-wa" : "bg-ink/15"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative max-h-[92vh] w-full animate-fade-up overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/[0.06] bg-white px-6 py-4">
          <h3 className="font-display text-2xl font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-ink/5" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function confirmAction(msg: string) {
  return typeof window !== "undefined" && window.confirm(msg);
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  IN_MAKING: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-700",
};
const STATUS_TEXT: Record<OrderStatus, string> = {
  PENDING: "New",
  CONFIRMED: "Confirmed",
  IN_MAKING: "Being made",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_TEXT[status]}</span>;
}

export function PayPill({ status }: { status: string }) {
  const s = status === "PAID" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status === "PARTIAL" ? "bg-amber-50 text-amber-700 ring-amber-200" : status === "REFUNDED" ? "bg-ink/5 text-muted ring-ink/10" : "bg-rose-50 text-rose-700 ring-rose-200";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${s}`}>{status === "PAID" ? "Paid" : status === "PARTIAL" ? "Part-paid" : status === "REFUNDED" ? "Refunded" : "Unpaid"}</span>;
}

export function Empty({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      {icon && <div className="mb-2 grid size-14 place-items-center rounded-2xl bg-tint text-ink/60">{icon}</div>}
      <p className="font-display text-2xl">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setDraft("");
  };
  return (
    <div className="input flex flex-wrap items-center gap-1.5 py-2">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-tint px-2.5 py-0.5 text-sm">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
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
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  );
}
