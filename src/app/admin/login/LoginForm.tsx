"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm({ setup }: { setup: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (setup && password !== confirm) return setErr("Passwords don't match");
    setBusy(true);
    const r = await fetch(setup ? "/api/admin/setup" : "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    const d = await r.json();
    if (!r.ok) {
      setBusy(false);
      return setErr(d.error || "Something went wrong");
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div className="relative">
        <label className="label">{setup ? "New password (min 8 characters)" : "Password"}</label>
        <input type={show ? "text" : "password"} autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-11" autoComplete={setup ? "new-password" : "current-password"} />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute bottom-2.5 right-3 text-muted" aria-label="Show password">
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {setup && (
        <div>
          <label className="label">Confirm password</label>
          <input type={show ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" autoComplete="new-password" />
        </div>
      )}
      {err && <p className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{err}</p>}
      <button disabled={busy} className="btn btn-primary w-full py-3">
        {busy && <Loader2 className="size-4 animate-spin" />} {setup ? "Create password & enter" : "Log in"}
      </button>
    </form>
  );
}
