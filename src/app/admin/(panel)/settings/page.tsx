"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, Database, KeyRound, Loader2, Server, Sparkles, Store, Truck } from "lucide-react";
import { adminBtn, api, Loading, Modal, PageHeader, useToast } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettings";
import { SaveBar } from "@/components/admin/SaveBar";
import { Field, LoadError, Section, SwitchRow } from "@/components/admin/core/form";
import { WhatsAppIcon } from "@/components/Motifs";
import { ThemePicker } from "@/components/admin/core/ThemePicker";
import { FontPicker } from "@/components/admin/core/FontPicker";
import { Palette } from "lucide-react";
import { waLink } from "@/lib/whatsapp";

type TextKey = "storeName" | "tagline" | "whatsappNumber" | "phone" | "email" | "instagram" | "facebook" | "youtube" | "address" | "upiId" | "orderNote" | "vacationMessage" | "aiAssistantName" | "seoDescription";

export default function SettingsPage() {
  const { s, set, save, saving, dirty, system, discard, error, reload } = useSettingsForm();
  const toast = useToast();
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  if (!s) return error ? <LoadError message={error} onRetry={reload} /> : <Loading />;

  const num = (k: "shippingFee" | "freeShippingAbove" | "giftWrapFee") => ({
    value: String(s[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value.replace(/\D/g, "")) || 0),
    inputMode: "numeric" as const,
    className: "input tabular",
  });
  const text = (k: TextKey) => ({
    value: s[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
    className: "input",
  });

  const changePassword = async () => {
    if (pw.next.length < 8) return toast("New password needs at least 8 characters", "err");
    setPwBusy(true);
    try {
      await api("/api/admin/password", { body: pw });
      toast("Password changed");
      setPw({ current: "", next: "" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not change password", "err");
    } finally {
      setPwBusy(false);
    }
  };

  const removeDemo = async () => {
    setDemoBusy(true);
    try {
      await api("/api/admin/demo", { method: "DELETE" });
      toast("Demo products removed");
      setDemoOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove demo products", "err");
    } finally {
      setDemoBusy(false);
    }
  };

  const placeholderWa = s.whatsappNumber.replace(/\D/g, "") === "919999999999";

  return (
    <div className="pb-24 md:pb-8">
      <PageHeader title="Settings" subtitle="Your shop details, ordering and integrations." />

      <div className="space-y-6">
        <Section id="appearance" title="Appearance" text="Choose your website's theme and fonts. Preview any theme on your live site first; customers see the change after you save." icon={<Palette />}>
          <ThemePicker value={s.theme} onChange={(id) => set("theme", id)} pattern={s.backgroundPattern} />
          <div className="mt-6 border-t border-admin-line pt-5">
            <FontPicker theme={s.theme} title={s.titleFont} body={s.bodyFont} onTitle={(v) => set("titleFont", v)} onBody={(v) => set("bodyFont", v)} />
          </div>
          <SwitchRow
            className="mt-5"
            title="Background print"
            text="A faint pattern from the theme (mandala dots, mirrors, leaves…) and a soft glow behind your pages. Off = a plain background."
            checked={s.backgroundPattern}
            onChange={(v) => set("backgroundPattern", v)}
          />
        </Section>

        <Section title="WhatsApp ordering" text="Where orders arrive and how customers pay you." icon={<WhatsAppIcon className="size-4" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="WhatsApp number for orders"
              helper={
                <>
                  Country code and number, no spaces. India starts with 91.{" "}
                  <a href={waLink(s.whatsappNumber, "Test message from my website")} target="_blank" rel="noreferrer" className="font-semibold text-wa underline underline-offset-2">
                    Send a test message
                  </a>
                </>
              }
            >
              <input {...text("whatsappNumber")} inputMode="tel" autoComplete="tel" placeholder="919876543210" aria-invalid={placeholderWa || undefined} />
            </Field>
            <Field label="UPI ID" helper="Included in payment messages to customers.">
              <input {...text("upiId")} placeholder="kavita@okaxis" autoCapitalize="none" spellCheck={false} />
            </Field>
            <Field label="Note shown with every order" helper="For example, how long making and dispatch usually take." className="md:col-span-2">
              <input {...text("orderNote")} />
            </Field>
            <SwitchRow className="md:col-span-2" title="Accepting orders" text="Turn off when you’re on a break. A message shows on the website." checked={s.acceptingOrders} onChange={(v) => set("acceptingOrders", v)} />
            {!s.acceptingOrders && (
              <Field label="Break message" className="md:col-span-2">
                <input {...text("vacationMessage")} />
              </Field>
            )}
          </div>
        </Section>

        <Section title="Shipping & payment" text="Fees customers see before they send their order." icon={<Truck />}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Shipping charge (₹)">
              <input {...num("shippingFee")} />
            </Field>
            <Field label="Free shipping above (₹)" helper="0 means never free.">
              <input {...num("freeShippingAbove")} />
            </Field>
            <Field label="Gift wrap charge (₹)" helper="0 means free.">
              <input {...num("giftWrapFee")} />
            </Field>
            <SwitchRow className="sm:col-span-3" title="Cash on delivery" text="Only turn on if you accept COD. The website mentions it only when this is on." checked={s.codAvailable} onChange={(v) => set("codAvailable", v)} />
          </div>
        </Section>

        <Section title="Shop details" text="Shown in the footer, invoices and search results." icon={<Store />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Shop name">
              <input {...text("storeName")} />
            </Field>
            <Field label="Tagline">
              <input {...text("tagline")} />
            </Field>
            <Field label="Phone (shown in footer)">
              <input {...text("phone")} type="tel" inputMode="tel" autoComplete="tel" />
            </Field>
            <Field label="Email">
              <input {...text("email")} type="email" inputMode="email" autoComplete="email" />
            </Field>
            <Field label="City or address" className="md:col-span-2">
              <input {...text("address")} />
            </Field>
            <Field label="Instagram link">
              <input {...text("instagram")} type="url" inputMode="url" placeholder="https://instagram.com/…" />
            </Field>
            <Field label="Facebook link">
              <input {...text("facebook")} type="url" inputMode="url" />
            </Field>
            <Field label="YouTube link">
              <input {...text("youtube")} type="url" inputMode="url" />
            </Field>
            <Field label="Google description" helper="One or two sentences shown under your shop in Google results." className="md:col-span-2">
              <textarea {...text("seoDescription")} rows={2} />
            </Field>
          </div>
        </Section>

        <Section title="AI shopping assistant" text="Helps visitors find pieces and gifts, any time of day." icon={<Sparkles className="text-ai-fg" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <SwitchRow className="md:col-span-2" title="Show the assistant on the website" checked={s.aiAssistantEnabled} onChange={(v) => set("aiAssistantEnabled", v)} />
            <Field label="Assistant name">
              <input {...text("aiAssistantName")} />
            </Field>
          </div>
        </Section>

        <Section title="System status" text="What your shop is connected to." icon={<Server />}>
          {system ? (
            <ul className="divide-y divide-admin-line">
              <Status
                ok={system.database === "turso" || !system.onVercel}
                label="Database"
                value={system.database === "turso" ? "Turso cloud database" : system.onVercel ? "Not configured. Data will be lost. Add DATABASE_URL and DATABASE_AUTH_TOKEN (Turso)." : "Local file (development)"}
              />
              <Status ok label="Image storage" value={system.storage === "cloudinary" ? "Cloudinary CDN" : system.storage === "blob" ? "Vercel Blob" : "Database. Works, but Cloudinary or Vercel Blob is faster for many photos."} />
              <Status ok={!!system.ai} label="AI" value={system.ai === "claude" ? "Claude (Anthropic)" : system.ai === "gemini" ? "Google Gemini" : "Off. Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables."} />
            </ul>
          ) : (
            <p className="text-[14px] text-muted">Checking…</p>
          )}
        </Section>

        <Section title="Admin password" text="Use at least 8 characters." icon={<KeyRound />}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePassword();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Current password">
                <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="input" autoComplete="current-password" />
              </Field>
              <Field label="New password">
                <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="input" autoComplete="new-password" minLength={8} />
              </Field>
            </div>
            <button type="submit" disabled={pwBusy || !pw.current || !pw.next} className={`${adminBtn.secondary} mt-4`}>
              {pwBusy && <Loader2 className="size-4 animate-spin" aria-hidden />} Update password
            </button>
          </form>
        </Section>

        <Section title="Demo data" text="Sample pieces so the shop doesn’t look empty on day one." icon={<Database />}>
          <p className="text-[14px] leading-5 text-ink-2">Remove them once you’ve added your own pieces. Your own products are not affected.</p>
          <button type="button" onClick={() => setDemoOpen(true)} className={`${adminBtn.secondary} mt-4`}>
            Remove demo products
          </button>
        </Section>
      </div>

      <Modal open={demoOpen} onClose={() => setDemoOpen(false)} title="Remove demo products?">
        <p className="text-[15px] leading-6 text-ink-2 md:text-[14px] md:leading-5">All demo products will be deleted. Pieces you added yourself stay. This can’t be undone.</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setDemoOpen(false)} className={adminBtn.secondary}>
            Keep them
          </button>
          <button type="button" onClick={removeDemo} disabled={demoBusy} className={adminBtn.danger}>
            {demoBusy && <Loader2 className="size-4 animate-spin" aria-hidden />} Remove demo products
          </button>
        </div>
      </Modal>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}

function Status({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={1.75} aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={1.75} aria-hidden />}
      <span className="text-[14px] leading-5">
        <span className="font-semibold">{label}</span>
        <span className="sr-only">{ok ? " (ok)" : " (needs attention)"}</span>
        <span className="block text-muted">{value}</span>
      </span>
    </li>
  );
}
