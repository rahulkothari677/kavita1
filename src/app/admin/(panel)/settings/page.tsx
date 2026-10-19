"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, KeyRound, Store, Truck, Sparkles, MessageCircle, Server } from "lucide-react";
import { api, confirmAction, Loading, PageHeader, Panel, Switch, useToast } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettings";
import { SaveBar } from "@/components/admin/SaveBar";
import { WhatsAppIcon } from "@/components/Motifs";
import { waLink } from "@/lib/whatsapp";

export default function SettingsPage() {
  const { s, set, save, saving, dirty, system } = useSettingsForm();
  const toast = useToast();
  const [pw, setPw] = useState({ current: "", next: "" });
  if (!s) return <Loading />;
  const num = (k: "shippingFee" | "freeShippingAbove" | "giftWrapFee") => ({
    value: String(s[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value.replace(/\D/g, "")) || 0),
    inputMode: "numeric" as const,
    className: "input",
  });
  const text = (k: "storeName" | "tagline" | "whatsappNumber" | "phone" | "email" | "instagram" | "facebook" | "youtube" | "address" | "upiId" | "orderNote" | "vacationMessage" | "aiAssistantName" | "seoDescription") => ({
    value: s[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
    className: "input",
  });

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Settings" subtitle="Your shop details, ordering and integrations." />

      <Panel title={<span className="flex items-center gap-2"><WhatsAppIcon className="size-4 text-wa" /> WhatsApp ordering</span>}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">WhatsApp number that receives orders *</label>
            <input {...text("whatsappNumber")} placeholder="919876543210" />
            <p className="mt-1 text-xs text-muted">Country code + number, no spaces (India = 91…).</p>
            <a href={waLink(s.whatsappNumber, "Test message from my website ✅")} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-wa underline">
              Send a test message
            </a>
          </div>
          <div>
            <label className="label">UPI ID (sent to customers for payment)</label>
            <input {...text("upiId")} placeholder="kavita@okaxis" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-cream/50 p-3 md:col-span-2">
            <div>
              <p className="text-sm font-medium">Accepting orders</p>
              <p className="text-xs text-muted">Turn off when on holiday — a message shows on the website.</p>
            </div>
            <Switch checked={s.acceptingOrders} onChange={(v) => set("acceptingOrders", v)} />
          </div>
          {!s.acceptingOrders && (
            <div className="md:col-span-2">
              <label className="label">Holiday message</label>
              <input {...text("vacationMessage")} />
            </div>
          )}
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><Truck className="size-4" /> Shipping & gifting</span>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Shipping charge (₹)</label>
            <input {...num("shippingFee")} />
          </div>
          <div>
            <label className="label">Free shipping above (₹, 0 = never)</label>
            <input {...num("freeShippingAbove")} />
          </div>
          <div>
            <label className="label">Gift wrap charge (₹, 0 = free)</label>
            <input {...num("giftWrapFee")} />
          </div>
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><Store className="size-4" /> Shop details</span>}>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="label">Shop name</label><input {...text("storeName")} /></div>
          <div><label className="label">Tagline</label><input {...text("tagline")} /></div>
          <div><label className="label">Phone (shown in footer)</label><input {...text("phone")} /></div>
          <div><label className="label">Email</label><input {...text("email")} /></div>
          <div><label className="label">City / address</label><input {...text("address")} /></div>
          <div><label className="label">Instagram URL</label><input {...text("instagram")} placeholder="https://instagram.com/…" /></div>
          <div><label className="label">Facebook URL</label><input {...text("facebook")} /></div>
          <div><label className="label">YouTube URL</label><input {...text("youtube")} /></div>
          <div className="md:col-span-2">
            <label className="label">Google description (SEO)</label>
            <textarea {...text("seoDescription")} rows={2} />
          </div>
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-gold" /> AI shopping assistant</span>}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Show AI assistant on website</p>
            <p className="text-xs text-muted">Helps visitors find products and gifts, 24×7.</p>
          </div>
          <Switch checked={s.aiAssistantEnabled} onChange={(v) => set("aiAssistantEnabled", v)} />
        </div>
        <div className="mt-4 max-w-xs">
          <label className="label">Assistant name</label>
          <input {...text("aiAssistantName")} />
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><Server className="size-4" /> System status</span>}>
        {system && (
          <ul className="space-y-3 text-sm">
            <Status ok={system.database === "turso" || !system.onVercel} label="Database" value={system.database === "turso" ? "Turso cloud database ✓" : system.onVercel ? "NOT CONFIGURED — data will be lost. Add DATABASE_URL & DATABASE_AUTH_TOKEN (Turso)." : "Local file (development)"} />
            <Status ok label="Image storage" value={system.storage === "cloudinary" ? "Cloudinary CDN ✓" : system.storage === "blob" ? "Vercel Blob ✓" : "Database (works; Cloudinary or Vercel Blob is faster for many photos)"} />
            <Status ok={!!system.ai} label="AI" value={system.ai === "claude" ? "Claude (Anthropic) ✓" : system.ai === "gemini" ? "Google Gemini ✓" : "Off — add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables"} />
          </ul>
        )}
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><KeyRound className="size-4" /> Change admin password</span>}>
        <div className="grid max-w-lg gap-3 sm:grid-cols-2">
          <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="Current password" className="input" autoComplete="current-password" />
          <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="New password (8+ chars)" className="input" autoComplete="new-password" />
        </div>
        <button
          onClick={async () => {
            try {
              await api("/api/admin/password", { body: pw });
              toast("Password changed");
              setPw({ current: "", next: "" });
            } catch (e) {
              toast(e instanceof Error ? e.message : "Failed", "err");
            }
          }}
          className="btn btn-outline btn-sm mt-3"
        >
          Update password
        </button>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><MessageCircle className="size-4" /> Demo data</span>}>
        <p className="text-sm text-muted">The shop started with sample products so it doesn&apos;t look empty. Remove them once you&apos;ve added your own.</p>
        <button
          onClick={async () => {
            if (!confirmAction("Remove all demo products?")) return;
            await api("/api/admin/demo", { method: "DELETE" });
            toast("Demo products removed");
          }}
          className="btn btn-outline btn-sm mt-3"
        >
          Remove demo products
        </button>
      </Panel>

      <SaveBar dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function Status({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-wa" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />}
      <span>
        <b>{label}:</b> <span className="text-muted">{value}</span>
      </span>
    </li>
  );
}
