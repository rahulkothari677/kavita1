"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useAdminChrome } from "./core/chrome";

/**
 * Contextual save bar. Appears only while the form is dirty:
 * desktop: a sticky 56px ink bar across the top of the content area;
 * mobile: a 64px ink bar at the bottom that replaces the floating nav.
 * Also guards against leaving with unsaved work and saves on Ctrl/⌘+S.
 */
export function SaveBar({ dirty, saving, onSave, onDiscard, label = "Unsaved changes" }: { dirty: boolean; saving: boolean; onSave: () => void; onDiscard?: () => void; label?: string }) {
  const { setSaveBarActive } = useAdminChrome();
  const show = dirty || saving;
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    setSaveBarActive(show);
    return () => setSaveBarActive(false);
  }, [show, setSaveBarActive]);

  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("beforeunload", guard);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("beforeunload", guard);
      window.removeEventListener("keydown", key);
    };
  }, [dirty]);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className="on-dark shadow-float fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 flex h-16 animate-fade-up items-center gap-2 rounded-[20px] bg-ink pr-2 pl-4 text-white md:inset-x-auto md:top-0 md:right-0 md:bottom-auto md:left-16 md:h-14 md:rounded-none md:px-8 md:shadow-none lg:left-[240px] lg:px-10"
    >
      <p className="min-w-0 flex-1 truncate text-[15px] font-semibold md:text-[14px]" aria-live="polite">
        {saving ? "Saving…" : label}
      </p>
      {onDiscard && (
        <button type="button" onClick={onDiscard} disabled={saving} className="h-11 rounded-[6px] border border-white/40 px-4 text-[14px] font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50 md:h-9">
          Discard
        </button>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-11 min-w-[96px] items-center justify-center gap-2 rounded-[6px] bg-white px-5 text-[14px] font-semibold text-ink transition-[background-color,transform] duration-150 hover:bg-admin-sidebar active:scale-[0.98] disabled:opacity-70 md:h-9"
      >
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Save
      </button>
    </div>
  );
}
