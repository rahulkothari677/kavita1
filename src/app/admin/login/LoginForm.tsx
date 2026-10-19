"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm({ setup }: { setup: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const id = useId();
  const errId = `${id}-err`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (setup && password.length < 8) return setErr("Use at least 8 characters");
    if (setup && password !== confirm) return setErr("Passwords don’t match");
    setBusy(true);
    try {
      const r = await fetch(setup ? "/api/admin/setup" : "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setBusy(false);
        return setErr(d.error || "Something went wrong. Please try again.");
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setBusy(false);
      setErr("Can’t reach the server. Check your connection and try again.");
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor={`${id}-pw`} className="label">
          {setup ? "New password" : "Password"}
        </label>
        <div className="relative">
          <input
            id={`${id}-pw`}
            type={show ? "text" : "password"}
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pr-12!"
            autoComplete={setup ? "new-password" : "current-password"}
            aria-invalid={err ? true : undefined}
            aria-describedby={err ? errId : setup ? `${id}-help` : undefined}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-0.5 right-0.5 grid size-11 place-items-center rounded-[4px] text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
            {show ? <EyeOff className="size-5" strokeWidth={1.5} /> : <Eye className="size-5" strokeWidth={1.5} />}
          </button>
        </div>
        {setup && (
          <p id={`${id}-help`} className="helper">
            At least 8 characters.
          </p>
        )}
      </div>
      {setup && (
        <div>
          <label htmlFor={`${id}-confirm`} className="label">
            Confirm password
          </label>
          <input
            id={`${id}-confirm`}
            type={show ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            autoComplete="new-password"
            aria-invalid={err ? true : undefined}
            aria-describedby={err ? errId : undefined}
          />
        </div>
      )}
      {err && (
        <p id={errId} role="alert" className="flex items-start gap-2 text-[13px] leading-5 text-danger">
          <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden /> {err}
        </p>
      )}
      <button disabled={busy} className="btn btn-primary w-full">
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} {setup ? "Create password and enter" : "Log in"}
      </button>
    </form>
  );
}
