"use client";

import { useEffect, useState } from "react";
import { api, useToast } from "./ui";
import type { StoreSettings } from "@/lib/types";

export type SystemInfo = { ai: string | null; storage: string; database: string; onVercel: boolean };

export function useSettingsForm() {
  const [s, setS] = useState<StoreSettings | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();
  useEffect(() => {
    api<{ settings: StoreSettings; system: SystemInfo }>("/api/admin/settings").then((d) => {
      setS(d.settings);
      setSystem(d.system);
    });
  }, []);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => {
    setS((x) => (x ? { ...x, [k]: v } : x));
    setDirty(true);
  };
  const save = async () => {
    if (!s) return;
    setSaving(true);
    try {
      const d = await api<{ settings: StoreSettings }>("/api/admin/settings", { method: "PUT", body: s });
      setS(d.settings);
      setDirty(false);
      toast("Saved — your website is updated");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setSaving(false);
    }
  };
  return { s, set, save, saving, dirty, system };
}
