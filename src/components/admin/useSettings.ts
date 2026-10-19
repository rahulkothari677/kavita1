"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, useToast } from "./ui";
import type { StoreSettings } from "@/lib/types";

export type SystemInfo = { ai: string | null; storage: string; database: string; onVercel: boolean };

export function useSettingsForm() {
  const [s, setS] = useState<StoreSettings | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saved = useRef<StoreSettings | null>(null);
  const toast = useToast();

  const load = useCallback(() => {
    setError(null);
    api<{ settings: StoreSettings; system: SystemInfo }>("/api/admin/settings")
      .then((d) => {
        saved.current = d.settings;
        setS(d.settings);
        setSystem(d.system);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load settings"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => {
    setS((x) => (x ? { ...x, [k]: v } : x));
    setDirty(true);
  };

  const save = async () => {
    if (!s) return;
    setSaving(true);
    try {
      const d = await api<{ settings: StoreSettings }>("/api/admin/settings", { method: "PUT", body: s });
      saved.current = d.settings;
      setS(d.settings);
      setDirty(false);
      setSavedAt(Date.now());
      toast("Saved. Your website is updated");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  };

  /** Throw away unsaved edits and return to the last saved state. */
  const discard = () => {
    if (saved.current) setS(saved.current);
    setDirty(false);
  };

  return { s, set, save, saving, dirty, system, discard, savedAt, error, reload: load };
}
