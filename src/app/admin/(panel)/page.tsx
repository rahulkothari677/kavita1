"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Eye, IndianRupee, Loader2, Package, Palette, ShoppingBag, Sparkles, Trash2, Users } from "lucide-react";
import { api, Loading, Panel, StatusPill, useLoad, useToast } from "@/components/admin/ui";
import { formatINR, imgUrl, timeAgo } from "@/lib/format";
import type { Order } from "@/lib/types";

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

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const { data: s, reload } = useLoad<Stats>(`/api/admin/stats?days=${days}`, [days]);
  const toast = useToast();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const runInsights = async () => {
    setAiBusy(true);
    try {
      setInsights(await api<Insights>("/api/admin/ai/write", { body: { task: "insights" } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "AI failed", "err");
    } finally {
      setAiBusy(false);
    }
  };

  const removeDemo = async () => {
    if (!confirm("Remove all demo products? Your own products are not affected.")) return;
    await api("/api/admin/demo", { method: "DELETE" });
    toast("Demo products removed");
    reload();
  };

  if (!s) return <Loading />;
  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  const delta = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : cur ? 100 : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="font-display text-4xl font-semibold">{greeting()}, Kavita ✨</h1>
        </div>
        <div className="flex rounded-full bg-white p-1 text-sm shadow-sm">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`rounded-full px-3.5 py-1.5 ${days === d ? "bg-ink text-on-ink" : "text-muted"}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {s.demoProducts > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft/15 p-4 text-sm">
          <Sparkles className="size-5 text-accent" />
          <p className="flex-1">
            Your shop has <b>{s.demoProducts} demo products</b> so it doesn&apos;t look empty. Add your own pieces, then remove the demos.
          </p>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            Add my first product
          </Link>
          <button onClick={removeDemo} className="btn btn-outline btn-sm">
            <Trash2 className="size-3.5" /> Remove demos
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={IndianRupee} label="Revenue" value={formatINR(s.revenue)} delta={delta(s.revenue, s.revenuePrev)} />
        <Kpi icon={ShoppingBag} label="Orders" value={String(s.orders)} delta={delta(s.orders, s.ordersPrev)} />
        <Kpi icon={Users} label="Avg. order" value={formatINR(s.aov)} sub={`${s.customers} customers · ${s.repeatCustomers} repeat`} />
        <Kpi icon={Package} label="Products live" value={`${s.activeProducts}`} sub={`of ${s.productCount} total`} />
      </div>

      {/* Action needed */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard href="/admin/orders?status=PENDING" n={s.statusCounts.PENDING ?? 0} label="New orders to confirm" tone="amber" />
        <ActionCard href="/admin/orders?status=CONFIRMED" n={s.toShip} label="To make & ship" tone="sky" />
        <ActionCard href="/admin/orders" n={s.unpaidCount} label={`Unpaid · ${formatINR(s.unpaidAmount)}`} tone="rose" />
        <ActionCard href="/admin/custom-requests" n={s.newRequests} label="Custom requests" tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={`Revenue · last ${days} days`} action={<span className="text-sm text-muted">All time {formatINR(s.allTimeRevenue)}</span>}>
          <div className="flex h-48 items-end gap-[3px]">
            {s.daily.map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t-md bg-ink/80 transition group-hover:bg-accent" style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%`, opacity: d.revenue ? 1 : 0.15 }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-on-ink group-hover:block">
                  {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {formatINR(d.revenue)} · {d.orders} orders
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>{new Date(s.daily[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" /> AI business coach
            </span>
          }
        >
          {!insights ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted">Get a quick read on how your shop is doing and 3 things to do this week.</p>
              <button onClick={runInsights} disabled={aiBusy} className="btn btn-primary btn-sm mt-4">
                {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {aiBusy ? "Analysing…" : "Analyse my shop"}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <p className="font-display text-xl leading-snug">{insights.headline}</p>
              {insights.wins.length > 0 && (
                <ul className="space-y-1">
                  {insights.wins.map((w) => (
                    <li key={w}>🌟 {w}</li>
                  ))}
                </ul>
              )}
              <div className="space-y-2">
                {insights.actions.map((a, i) => (
                  <div key={i} className="rounded-xl bg-tint/60 p-3">
                    <p className="font-medium">
                      {i + 1}. {a.title}
                    </p>
                    <p className="text-muted">{a.why}</p>
                  </div>
                ))}
              </div>
              {insights.watch.map((w) => (
                <p key={w} className="flex gap-2 text-amber-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {w}
                </p>
              ))}
              <p className="rounded-xl border border-accent/30 p-3">🪔 {insights.festivalTip}</p>
              <button onClick={runInsights} disabled={aiBusy} className="text-xs text-muted underline">
                Refresh
              </button>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Orders waiting for you" action={<Link href="/admin/orders" className="text-sm text-ink-soft">View all</Link>}>
          {s.pendingOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">All caught up! 🎉</p>
          ) : (
            <ul className="-my-2 divide-y divide-ink/[0.06]">
              {s.pendingOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3">
                    <div className="grid size-10 place-items-center rounded-full bg-tint font-display text-lg">{o.customerName[0]}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted">
                        {o.orderNumber} · {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatINR(o.total)}</p>
                      <StatusPill status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Best sellers">
          {s.topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Your best sellers will appear here after your first orders.</p>
          ) : (
            <ul className="space-y-3">
              {s.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 font-display text-lg text-accent">{i + 1}</span>
                  <Link href={`/admin/products/${p.id}`} className="flex-1 truncate hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-muted">{p.qty} sold</span>
                  <span className="w-20 text-right font-medium">{formatINR(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <Eye className="size-4" /> Most viewed
            </span>
          }
        >
          <ul className="space-y-3">
            {s.mostViewed.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <img src={imgUrl(p.image, 80)} alt="" className="size-9 rounded-lg object-cover" />
                <Link href={`/admin/products/${p.id}`} className="flex-1 truncate hover:underline">
                  {p.name}
                </Link>
                <span className="text-muted">{p.views} views</span>
                <span className="text-wa">{p.clicks} chats</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" /> Low stock
            </span>
          }
        >
          {s.lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Stock looks healthy.</p>
          ) : (
            <ul className="space-y-3">
              {s.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <img src={imgUrl(p.image, 80)} alt="" className="size-9 rounded-lg object-cover" />
                  <Link href={`/admin/products/${p.id}`} className="flex-1 truncate hover:underline">
                    {p.name}
                  </Link>
                  <span className={p.stock === 0 ? "font-medium text-danger" : "text-amber-700"}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/admin/products/bulk" icon={Package} title="Bulk upload" text="Drop many photos — AI creates listings" />
        <QuickLink href="/admin/ai-studio" icon={Sparkles} title="AI Studio" text="Captions, replies, campaigns" />
        <QuickLink href="/admin/orders/new" icon={Palette} title="Add WhatsApp order" text="Record an order you got directly" />
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, delta, sub }: { icon: React.ElementType; label: string; value: string; delta?: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-ink/[0.07] bg-white p-4 md:p-5">
      <div className="flex items-center justify-between text-muted">
        <span className="text-[13px]">{label}</span>
        <Icon className="size-4" />
      </div>
      <p className="mt-2 font-display text-[28px] leading-none font-semibold md:text-[32px]">{value}</p>
      {delta !== undefined ? (
        <p className={`mt-2 flex items-center gap-0.5 text-xs ${delta >= 0 ? "text-emerald-600" : "text-danger"}`}>
          {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />} {Math.abs(delta)}% vs previous
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">{sub}</p>
      )}
    </div>
  );
}

const TONES = {
  amber: "from-amber-50 border-amber-200/70 text-amber-900",
  sky: "from-sky-50 border-sky-200/70 text-sky-900",
  rose: "from-rose-50 border-rose-200/70 text-rose-900",
  violet: "from-violet-50 border-violet-200/70 text-violet-900",
};

function ActionCard({ href, n, label, tone }: { href: string; n: number; label: string; tone: keyof typeof TONES }) {
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-br to-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${TONES[tone]}`}>
      <span className="font-display text-3xl font-semibold">{n}</span>
      <span className="text-sm leading-tight">{label}</span>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, title, text }: { href: string; icon: React.ElementType; title: string; text: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white p-4 transition hover:shadow-md">
      <span className="grid size-10 place-items-center rounded-xl bg-tint">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </Link>
  );
}
