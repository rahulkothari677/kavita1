"use client";

import { Loader2 } from "lucide-react";

export function SaveBar({ dirty, saving, onSave }: { dirty: boolean; saving: boolean; onSave: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-3">
        {dirty && <span className="mr-auto text-xs text-muted">Unsaved changes</span>}
        <button onClick={onSave} disabled={saving || !dirty} className="btn btn-primary min-w-32">
          {saving && <Loader2 className="size-4 animate-spin" />} Save changes
        </button>
      </div>
    </div>
  );
}
