"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Eye, Layers, Loader2, Package, Sparkles, Wand2 } from "lucide-react";
import { adminBtn, api, Loading, Modal, Panel, StatusPill, useLoad, useToast } from "@/components/admin/ui";
import { CopyLinkButton, KpiTile, NeedsYou, RevenueChart, Segmented, SetupGuide, type NeedRow, type SetupStep } from "@/components/admin/core/dashboard";
import { WhatsAppIcon } from "@/components/Motifs";
import { formatINR, formatINRCompact, imgUrl, timeAgo } from "@/lib/format";
import type { Order, StoreSettings } from "@/lib/types";

type Stats = {
  revenue: number;
  revenuePrev: number;
  orders: number;
  ordersPrev: number;
  aov: number;
  allTimeRevenue: number;
  allTimeOrders: number;
  statusCounts: Record<string, number>;
  daily: { date: string; revenue: number; orders: number }[];
  pendingOrders: Order[];
  toShip: number;
  unpaidAmount: number;
  unpaidCount: number;
  topProducts: { id: string; name: string; qty: number; revenue: number }[];
  mostViewed: { id: string; name: string; views: number; clicks: number; image: string | null }[];
  lowStock: { id: string; name: string; stock: number; image: string | null }[];
  productCount: number;
  activeProducts: number;
  demoProducts: number;
  newRequests: number;
  pendingReviews: number;
  customers: number;
  repeatCustomers: number;
};

type Insights = { headline: string; wins: string[]; watch: string[]; actions: { title: string; why: string }[]; festivalTip: string };

const SW = 1.75;
const PLACEHOLDER_WA = "919999999999";
const DEFAULT_STORY_START = "What started as a weekend hobby on our dining table";
const LS_SHARED = "ka-admin-shared-link";
const LS_SETUP_HIDDEN = "ka-admin-setup-hidden";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function lsGet(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function lsSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

function plural(n: number, one: string, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const { data: s, error, reload } = useLoad<Stats>(`/api/admin/stats?days=${days}`, [days]);
  const toast = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [shared, setShared] = useState(false);
  const [setupHidden, setSetupHidden] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setShared(lsGet(LS_SHARED) === "1");
    setSetupHidden(lsGet(LS_SETUP_HIDDEN) === "1");
    setOrigin(window.location.origin);
    api<{ settings: StoreSettings }>("/api/admin/settings")
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  const markShared = useCallback(() => {
    lsSet(LS_SHARED, "1");
    setShared(true);
  }, []);

  const runInsights = async () => {
    setAiBusy(true);
    try {
      setInsights(await api<Insights>("/api/admin/ai/write", { body: { task: "insights" } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI is unavailable right now", "err");
    } finally {
      setAiBusy(false);
    }
  };

  const removeDemo = async () => {
    setRemoving(true);
    try {
      await api("/api/admin/demo", { method: "DELETE" });
      toast("Demo products removed");
      setConfirmDemo(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove demo products", "err");
    } finally {
      setRemoving(false);
    }
  };

  if (!s) {
    if (error)
      return (
        <div className="rounded-[8px] border border-admin-line bg-white p-6 text-center">
          <p className="font-display text-[22px] font-[380]">We couldn’t load your studio</p>
          <p className="mt-1 text-[14px] text-muted">{error}</p>
          <button onClick={reload} className={`${adminBtn.primary} mt-4`}>
            Try again
          </button>
        </div>
      );
    return <Loading />;
  }

  const name = settings?.artistName?.trim() || "Kavita";
  const period = `${days} days`;
  const newOrders = s.statusCounts.PENDING ?? 0;

  // Plain-language summary
  const bits: string[] = [];
  if (newOrders) bits.push(`${plural(newOrders, "new order")} to confirm`);
  if (s.toShip) bits.push(`${s.toShip} to make and ship`);
  if (s.newRequests) bits.push(plural(s.newRequests, "custom request"));
  const summary = bits.length
    ? `You have ${bits.length > 1 ? bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1] : bits[0]}.`
    : s.allTimeOrders
      ? "Nothing is waiting on you right now."
      : "Your shop is open. Share your link to welcome your first order.";

  // Setup guide
  const shopUrl = origin || "";
  const steps: SetupStep[] = [
    {
      key: "piece",
      title: "Add your first real piece",
      text: "Take a photo and let Snap & Sell draft the title, story and price. You can edit everything before it goes live.",
      done: s.productCount > s.demoProducts,
      action: (
        <>
          <Link href="/admin/products/new" className={adminBtn.primary}>
            <Sparkles className="size-4" strokeWidth={SW} aria-hidden /> Snap & Sell
          </Link>
          <Link href="/admin/products/new?manual=1" className={adminBtn.secondary}>
            Add manually
          </Link>
        </>
      ),
    },
    {
      key: "demo",
      title: "Remove demo products",
      text: s.demoProducts ? `Your shop has ${plural(s.demoProducts, "demo product")} so it doesn’t look empty. Remove them once your own pieces are in.` : "Demo products are gone. Your shop shows only your work.",
      done: s.demoProducts === 0,
      action: s.demoProducts ? (
        <button onClick={() => setConfirmDemo(true)} className={adminBtn.secondary}>
          Remove demo products
        </button>
      ) : undefined,
    },
    {
      key: "wa",
      title: "Set your WhatsApp number",
      text: "Orders arrive as WhatsApp messages, so this has to be your real number.",
      done: !!settings && !!settings.whatsappNumber && settings.whatsappNumber.replace(/\D/g, "") !== PLACEHOLDER_WA,
      action: (
        <Link href="/admin/settings" className={adminBtn.secondary}>
          Open settings
        </Link>
      ),
    },
    {
      key: "upi",
      title: "Add your UPI ID",
      text: "We include it in payment messages so customers can pay you directly.",
      done: !!settings?.upiId?.trim(),
      action: (
        <Link href="/admin/settings" className={adminBtn.secondary}>
          Add UPI ID
        </Link>
      ),
    },
    {
      key: "story",
      title: "Write your story",
      text: "Add your photo and a few lines in your own words. People buy handmade from people.",
      done: !!settings && (!!settings.artistImage || !settings.aboutStory.startsWith(DEFAULT_STORY_START)),
      action: (
        <Link href="/admin/content" className={adminBtn.secondary}>
          Edit your story
        </Link>
      ),
    },
    {
      key: "share",
      title: "Share your shop link",
      text: shopUrl ? `Send ${shopUrl.replace(/^https?:\/\//, "")} to friends, family and your WhatsApp status.` : "Send your shop link to friends, family and your WhatsApp status.",
      done: shared,
      action: (
        <>
          <CopyLinkButton url={shopUrl} onCopied={markShared} />
          <a href={`https://wa.me/?text=${encodeURIComponent(`Take a look at my handmade pieces: ${shopUrl}`)}`} target="_blank" rel="noreferrer" onClick={markShared} className={adminBtn.wa}>
            <WhatsAppIcon className="size-4" /> Share on WhatsApp
          </a>
        </>
      ),
    },
  ];
  const allDone = steps.every((x) => x.done);
  const showSetup = settings && !(allDone && setupHidden);

  const needs: NeedRow[] = [
    { href: "/admin/orders?status=PENDING", label: "New orders to confirm", n: newOrders, tone: "warning", fill: "empty" },
    { href: "/admin/orders?status=CONFIRMED", label: "To make & ship", n: s.toShip, tone: "info", fill: "half" },
    { href: "/admin/orders", label: `Unpaid · ${formatINR(s.unpaidAmount)}`, n: s.unpaidCount, tone: "danger", fill: "empty" },
    { href: "/admin/custom-requests", label: "Custom requests", n: s.newRequests, tone: "warning", fill: "empty" },
    { href: "/admin/reviews", label: "Reviews to approve", n: s.pendingReviews, tone: "neutral", fill: "half" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 1. Greeting */}
      <header>
        <p className="text-[14px] text-muted md:text-[13px]">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="font-display mt-1 text-[28px] leading-[1.1] font-[380] tracking-[-0.01em] md:text-[32px]">
          {greeting()}, <em>{name}</em>
        </h1>
        <p className="mt-2 max-w-[60ch] text-[16px] leading-6 text-ink-2 md:text-[14px] md:leading-5">{summary}</p>
      </header>

      {/* 2–3. Setup guide + Needs you */}
      <div className={`grid gap-3 md:gap-4 ${showSetup ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>
        {showSetup && (
          <SetupGuide
            steps={steps}
            onDismiss={() => {
              lsSet(LS_SETUP_HIDDEN, "1");
              setSetupHidden(true);
            }}
          />
        )}
        <div className="self-start">
          <NeedsYou rows={needs} />
        </div>
      </div>

      {/* 4. Period */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="text-[16px] font-semibold md:text-[14px]">Performance</h2>
        <Segmented
          label="Time period"
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: "7D" },
            { value: 30, label: "30D" },
            { value: 90, label: "90D" },
          ]}
        />
      </div>

      {/* 5. KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiTile
          className="col-span-2 lg:col-span-1"
          label="Sales"
          value={s.revenue}
          format={formatINR}
          compact={formatINRCompact}
          delta={{ cur: s.revenue, prev: s.revenuePrev }}
          periodLabel={period}
          spark={s.daily.map((d) => d.revenue)}
        />
        <KpiTile label="Orders" value={s.orders} delta={{ cur: s.orders, prev: s.ordersPrev }} periodLabel={period} spark={s.daily.map((d) => d.orders)} />
        <KpiTile label="Avg order" value={s.aov} format={formatINR} compact={formatINRCompact} sub={`${plural(s.customers, "customer")} · ${s.repeatCustomers} repeat`} />
        <KpiTile className="col-span-2 sm:col-span-1" label="Pieces live" value={s.activeProducts} sub={`of ${s.productCount} in your catalogue`} />
      </div>

      {/* 6 + 8. Chart and AI coach */}
      <div className="grid gap-3 md:gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={`Sales · last ${period}`} action={<span className="tabular text-[13px] text-muted">All time {formatINR(s.allTimeRevenue)}</span>}>
          <RevenueChart daily={s.daily} />
        </Panel>

        <section className="rounded-[8px] border border-ai-line bg-ai-bg" aria-labelledby="ai-coach">
          <div className="flex items-center gap-2 border-b border-ai-line px-4 py-3 md:px-5">
            <Sparkles className="size-4 text-ai-fg" strokeWidth={SW} aria-hidden />
            <h2 id="ai-coach" className="text-[16px] font-semibold text-ai-fg md:text-[14px]">
              AI business coach
            </h2>
          </div>
          <div className="p-4 md:p-5" aria-live="polite">
            {!insights ? (
              <div>
                <p className="text-[15px] leading-6 text-ink-2 md:text-[14px] md:leading-5">A quick read on how your shop is doing, plus three things worth doing this week.</p>
                <button onClick={runInsights} disabled={aiBusy} className={`${adminBtn.ai} mt-4`}>
                  {aiBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Wand2 className="size-4" strokeWidth={SW} aria-hidden />}
                  {aiBusy ? "Reading your numbers…" : "Analyse my shop"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-[14px] leading-5">
                <p className="font-display text-[22px] leading-snug font-[380] tracking-[-0.01em] text-ink">{insights.headline}</p>
                {insights.wins.length > 0 && (
                  <ul className="space-y-1.5">
                    {insights.wins.map((w) => (
                      <li key={w} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} aria-hidden /> {w}
                      </li>
                    ))}
                  </ul>
                )}
                <ol className="space-y-2">
                  {insights.actions.map((a, i) => (
                    <li key={i} className="rounded-[6px] border border-ai-line bg-white p-3">
                      <p className="font-semibold">
                        <span className="tabular text-ai-fg">{i + 1}.</span> {a.title}
                      </p>
                      <p className="mt-0.5 text-muted">{a.why}</p>
                    </li>
                  ))}
                </ol>
                {insights.watch.map((w) => (
                  <p key={w} className="flex gap-2 text-warning">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={SW} aria-hidden /> {w}
                  </p>
                ))}
                {insights.festivalTip && <p className="rounded-[6px] border border-ai-line bg-white p-3">{insights.festivalTip}</p>}
                <button onClick={runInsights} disabled={aiBusy} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-ai-fg underline-offset-4 hover:underline md:min-h-0">
                  {aiBusy && <Loader2 className="size-3.5 animate-spin" aria-hidden />} Refresh
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 7. Waiting orders + Top pieces */}
      <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
        <Panel
          title="Orders waiting for you"
          action={
            <Link href="/admin/orders" className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-ink hover:underline md:min-h-0">
              View all <ArrowRight className="size-3.5" strokeWidth={SW} aria-hidden />
            </Link>
          }
        >
          {s.pendingOrders.length === 0 ? (
            <p className="py-4 text-[14px] text-muted">No new orders waiting. New ones appear here first.</p>
          ) : (
            <ul className="-mx-4 -my-4 md:-mx-5 md:-my-5">
              {s.pendingOrders.map((o) => (
                <li key={o.id} className="border-b border-admin-line last:border-0">
                  <Link href={`/admin/orders/${o.id}`} className="flex min-h-[68px] items-center gap-3 px-4 py-3 hover:bg-admin-inset md:px-5">
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-plinth text-[15px] font-semibold">
                      {o.customerName.trim()[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold md:text-[14px]">{o.customerName}</span>
                      <span className="tabular block text-[14px] text-muted md:text-[12px]">
                        {o.orderNumber} · {timeAgo(o.createdAt)}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="tabular text-[16px] font-semibold md:text-[14px]">{formatINR(o.total)}</span>
                      <StatusPill status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top pieces">
          {s.topProducts.length === 0 ? (
            <p className="py-4 text-[14px] text-muted">Your best sellers will show here after your first orders.</p>
          ) : (
            <ol className="space-y-1">
              {s.topProducts.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="-mx-2 flex min-h-11 items-center gap-3 rounded-[6px] px-2 hover:bg-admin-inset">
                    <span className="tabular w-5 text-[13px] font-semibold text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] md:text-[14px]">{p.name}</span>
                    <span className="tabular text-[13px] text-muted">{p.qty} sold</span>
                    <span className="tabular w-20 text-right text-[15px] font-semibold md:text-[14px]">{formatINR(p.revenue)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        {/* 9. Most viewed + Low stock */}
        <Panel
          title={
            <span className="flex items-center gap-2">
              <Eye className="size-4 text-muted" strokeWidth={SW} aria-hidden /> Most viewed
            </span>
          }
        >
          {s.mostViewed.length === 0 ? (
            <p className="py-4 text-[14px] text-muted">Views and WhatsApp taps appear once people browse your shop.</p>
          ) : (
            <ul className="space-y-1">
              {s.mostViewed.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="-mx-2 flex min-h-12 items-center gap-3 rounded-[6px] px-2 py-1 hover:bg-admin-inset">
                    <img src={imgUrl(p.image, 80)} alt="" loading="lazy" decoding="async" className="size-10 shrink-0 rounded-[6px] bg-plinth object-cover" />
                    <span className="min-w-0 flex-1 truncate text-[15px] md:text-[14px]">{p.name}</span>
                    <span className="tabular text-right text-[13px] leading-tight text-muted">
                      {p.views.toLocaleString("en-IN")} views
                      <span className="block text-wa">{plural(p.clicks, "WhatsApp tap")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <Package className="size-4 text-muted" strokeWidth={SW} aria-hidden /> Low stock
            </span>
          }
        >
          {s.lowStock.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-[14px] text-muted">
              <Check className="size-4 text-success" strokeWidth={2} aria-hidden /> Stock looks healthy.
            </p>
          ) : (
            <ul className="space-y-1">
              {s.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="-mx-2 flex min-h-12 items-center gap-3 rounded-[6px] px-2 py-1 hover:bg-admin-inset">
                    <img src={imgUrl(p.image, 80)} alt="" loading="lazy" decoding="async" className="size-10 shrink-0 rounded-[6px] bg-plinth object-cover" />
                    <span className="min-w-0 flex-1 truncate text-[15px] md:text-[14px]">{p.name}</span>
                    <span className={`tabular text-[13px] font-semibold ${p.stock === 0 ? "text-danger" : "text-warning"}`}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Shortcuts */}
      <div className="grid gap-3 sm:grid-cols-3 md:gap-4">
        <Shortcut href="/admin/products/bulk" ai icon={<Layers className="size-5" strokeWidth={SW} />} title="Bulk upload" text="Drop many photos, AI drafts each listing" />
        <Shortcut href="/admin/ai-studio" ai icon={<Wand2 className="size-5" strokeWidth={SW} />} title="AI Studio" text="Captions, replies and campaigns" />
        <Shortcut href="/admin/orders/new" icon={<WhatsAppIcon className="size-5" />} title="Record a WhatsApp order" text="Log an order you got in chat" />
      </div>

      <Modal open={confirmDemo} onClose={() => setConfirmDemo(false)} title="Remove demo products?">
        <p className="text-[15px] leading-6 text-ink-2 md:text-[14px] md:leading-5">
          This deletes all {plural(s.demoProducts, "demo product")} from your shop. Pieces you added yourself are not affected. This can’t be undone.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={() => setConfirmDemo(false)} className={adminBtn.secondary}>
            Keep them
          </button>
          <button onClick={removeDemo} disabled={removing} className={adminBtn.danger}>
            {removing && <Loader2 className="size-4 animate-spin" aria-hidden />} Remove demo products
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Shortcut({ href, icon, title, text, ai }: { href: string; icon: React.ReactNode; title: string; text: string; ai?: boolean }) {
  return (
    <Link href={href} className="flex min-h-16 items-center gap-3 rounded-[8px] border border-admin-line bg-white p-4 transition-colors hover:bg-admin-inset">
      <span className={`grid size-10 shrink-0 place-items-center rounded-[8px] border ${ai ? "border-ai-line bg-ai-bg text-ai-fg" : "border-admin-line bg-admin-inset text-wa"}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold md:text-[14px]">{title}</span>
        <span className="block text-[14px] text-muted md:text-[12px]">{text}</span>
      </span>
    </Link>
  );
}
