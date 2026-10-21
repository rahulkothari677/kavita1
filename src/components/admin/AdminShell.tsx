"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, Camera, ChevronRight, Home, LogOut, Megaphone, MoreHorizontal, Package, PenLine, Plus, ShoppingBag } from "lucide-react";
import { WhatsAppIcon } from "@/components/Motifs";
import { Modal, ToastProvider } from "./ui";
import { AdminChromeContext } from "./core/chrome";
import { ALL_NAV, NAV_GROUPS, activeHref, type CountKey, type NavItem } from "./core/nav";

type Counts = { pendingOrders: number; newRequests: number; pendingReviews: number };

const SW = 1.75; // admin icon stroke

function Medallion({ size = 24 }: { size?: number }) {
  return <img src="/brand/medallion.webp" alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-full" />;
}

function StudioMark() {
  return (
    <span className="font-display text-[18px] leading-none font-normal tracking-[-0.01em] text-ink">
      Studio
      <span aria-hidden className="bindi" />
    </span>
  );
}

export function AdminShell({ children, counts, tempDb = false }: { children: React.ReactNode; counts: Counts; tempDb?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState<null | "create" | "more">(null);
  const [saveBarActive, setSaveBarActive] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const active = activeHref(pathname);
  const countOf = (k?: CountKey) => (k ? counts[k] : 0);

  // Close sheets on navigation.
  useEffect(() => {
    setSheet(null);
    setNavHidden(false);
  }, [pathname]);

  // Mobile floating bar hides on scroll down, returns on scroll up.
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (Math.abs(dy) < 6) return;
      setNavHidden(dy > 0 && y > 80);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // ── Mobile bar ───────────────────────────────────────────────────────
  const slot = pathname === "/admin" ? 0 : pathname.startsWith("/admin/orders") ? 1 : pathname.startsWith("/admin/products") ? 3 : 4;
  const activeSlot = sheet === "create" ? 2 : sheet === "more" ? 4 : slot;
  const tab = (on: boolean) => `relative flex h-full flex-col items-center justify-center gap-1 text-[11px] leading-none ${on ? "font-semibold text-ink" : "font-medium text-muted"}`;
  const moreItems = ALL_NAV.filter((i) => !["/admin", "/admin/orders", "/admin/products"].includes(i.href));
  const moreHasCount = moreItems.some((i) => countOf(i.count) > 0);

  return (
    <AdminChromeContext.Provider value={{ saveBarActive, setSaveBarActive }}>
      <ToastProvider>
        <div className="min-h-screen bg-admin text-[16px] leading-6 text-ink md:text-[14px] md:leading-5">
          <a href="#admin-main" className="sr-only z-[300] rounded-[6px] bg-ink px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
            Skip to content
          </a>

          {/* Desktop sidebar ≥1024 */}
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-admin-line bg-admin-sidebar lg:flex" aria-label="Studio navigation">
            <Link href="/admin" className="flex h-16 shrink-0 items-center gap-2.5 px-5">
              <Medallion />
              <StudioMark />
              <span className="sr-only">: Kavita’s Artistry admin home</span>
            </Link>
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {NAV_GROUPS.map((g) => (
                <div key={g.label} className="mt-4 first:mt-1">
                  <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">{g.label}</p>
                  <ul className="space-y-0.5">
                    {g.items.map((item) => (
                      <li key={item.href}>
                        <Row item={item} on={active === item.href} n={countOf(item.count)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="space-y-0.5 border-t border-admin-line p-3">
              <a href="/?shop" target="_blank" rel="noreferrer" className="flex h-[34px] items-center gap-2.5 rounded-[6px] px-2.5 text-[14px] font-medium text-ink hover:bg-admin-sidebar-hover">
                <ArrowUpRight className="size-[18px] text-muted" strokeWidth={SW} aria-hidden />
                View website
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <button onClick={logout} className="flex h-[34px] w-full items-center gap-2.5 rounded-[6px] px-2.5 text-[14px] font-medium text-ink hover:bg-admin-sidebar-hover">
                <LogOut className="size-[18px] text-muted" strokeWidth={SW} aria-hidden />
                Log out
              </button>
            </div>
          </aside>

          {/* Tablet icon rail 768–1023 */}
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-admin-line bg-admin-sidebar md:flex lg:hidden" aria-label="Studio navigation">
            <Link href="/admin" className="grid h-16 shrink-0 place-items-center" aria-label="Studio home">
              <Medallion size={28} />
            </Link>
            <nav className="flex flex-1 flex-col items-center gap-1 pb-3">
              {NAV_GROUPS.map((g, gi) => (
                <div key={g.label} className={`flex flex-col items-center gap-1 ${gi ? "mt-1 border-t border-admin-line pt-2" : ""}`}>
                  {g.items.map((item) => (
                    <RailItem key={item.href} item={item} on={active === item.href} n={countOf(item.count)} />
                  ))}
                </div>
              ))}
            </nav>
            <div className="flex flex-col items-center gap-1 border-t border-admin-line py-3">
              <a href="/?shop" target="_blank" rel="noreferrer" className="group relative grid size-11 place-items-center rounded-[6px] text-muted hover:bg-admin-sidebar-hover hover:text-ink" aria-label="View website (opens in a new tab)">
                <ArrowUpRight className="size-5" strokeWidth={SW} aria-hidden />
              </a>
              <button onClick={logout} className="grid size-11 place-items-center rounded-[6px] text-muted hover:bg-admin-sidebar-hover hover:text-ink" aria-label="Log out">
                <LogOut className="size-5" strokeWidth={SW} aria-hidden />
              </button>
            </div>
          </aside>

          {/* Mobile top strip */}
          <header className="flex h-14 items-center justify-between px-4 md:hidden">
            <Link href="/admin" className="flex items-center gap-2" aria-label="Studio home">
              <Medallion />
              <StudioMark />
            </Link>
            <a href="/?shop" target="_blank" rel="noreferrer" className="icon-btn -mr-2 text-ink" aria-label="View website (opens in a new tab)">
              <ArrowUpRight className="size-5" strokeWidth={SW} />
            </a>
          </header>

          <main id="admin-main" className="pb-24 md:ml-16 md:pb-12 lg:ml-[240px]">
            {tempDb && (
              <div role="alert" className="flex items-start gap-2.5 bg-danger px-4 py-3 text-[14px] leading-5 text-white md:px-8">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={SW} aria-hidden />
                <p>
                  <b className="font-semibold">Database not connected.</b> Changes may be lost. In Vercel open your project → <b className="font-semibold">Storage</b> → <b className="font-semibold">Create Database</b> → <b className="font-semibold">Turso</b> → connect, then redeploy.
                </p>
              </div>
            )}
            <div className="mx-auto max-w-[1200px] px-4 pt-2 pb-6 md:px-8 md:py-8 lg:px-10">{children}</div>
          </main>

          {/* Mobile floating bar <768 */}
          <nav
            aria-label="Studio navigation"
            className={`fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 h-16 rounded-[20px] border border-[rgb(28_25_22/0.06)] bg-white/86 shadow-[0_8px_24px_-8px_rgb(28_25_22/0.18)] backdrop-blur-[20px] backdrop-saturate-[1.8] transition-transform duration-[280ms] ease-[var(--ease-out)] md:hidden ${
              navHidden || saveBarActive ? "translate-y-[calc(100%+24px)]" : ""
            }`}
          >
            {/* the gliding bindi */}
            {activeSlot !== 2 && (
              <span aria-hidden className="pointer-events-none absolute top-1.5 left-0 flex w-1/5 justify-center transition-transform duration-[260ms] ease-[var(--ease-out)]" style={{ transform: `translateX(${activeSlot * 100}%)` }}>
                <span className="size-1 rounded-full bg-accent" />
              </span>
            )}
            <div className="grid h-full grid-cols-5">
              <Link href="/admin" className={tab(activeSlot === 0)} aria-current={slot === 0 ? "page" : undefined}>
                <Home className="size-[22px]" strokeWidth={SW} aria-hidden />
                Home
              </Link>
              <Link href="/admin/orders" className={tab(activeSlot === 1)} aria-current={slot === 1 ? "page" : undefined} aria-label={counts.pendingOrders ? `Orders, ${counts.pendingOrders} new` : undefined}>
                <span className="relative">
                  <ShoppingBag className="size-[22px]" strokeWidth={SW} aria-hidden />
                  {counts.pendingOrders > 0 && (
                    <span aria-hidden className="tabular absolute -top-1.5 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white ring-2 ring-white">
                      {counts.pendingOrders > 99 ? "99+" : counts.pendingOrders}
                    </span>
                  )}
                </span>
                Orders
              </Link>
              <div className="grid place-items-center">
                <button
                  type="button"
                  onClick={() => setSheet("create")}
                  aria-haspopup="dialog"
                  aria-expanded={sheet === "create"}
                  aria-label="Create"
                  className="grid size-12 place-items-center rounded-full bg-ink text-white transition-transform duration-[120ms] active:scale-[0.92]"
                >
                  <Plus className="size-6" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <Link href="/admin/products" className={tab(activeSlot === 3)} aria-current={slot === 3 ? "page" : undefined}>
                <Package className="size-[22px]" strokeWidth={SW} aria-hidden />
                Products
              </Link>
              <button type="button" onClick={() => setSheet("more")} className={tab(activeSlot === 4)} aria-haspopup="dialog" aria-expanded={sheet === "more"}>
                <span className="relative">
                  <MoreHorizontal className="size-[22px]" strokeWidth={SW} aria-hidden />
                  {moreHasCount && <span aria-hidden className="absolute -top-0.5 -right-1 size-2 rounded-full bg-ink ring-2 ring-white" />}
                </span>
                More
              </button>
            </div>
          </nav>

          {/* Create sheet */}
          <Modal open={sheet === "create"} onClose={() => setSheet(null)} title="Create">
            <ul className="-mx-2 -my-2">
              <CreateRow href="/admin/products/new?camera=1" title="Snap & Sell: add with camera" text="Take a photo, AI drafts the listing" ai icon={<Camera className="size-5" strokeWidth={SW} />} />
              <CreateRow href="/admin/products/new?manual=1" title="Add product manually" text="Fill in the details yourself" icon={<PenLine className="size-5" strokeWidth={SW} />} />
              <CreateRow href="/admin/orders/new" title="Record a WhatsApp order" text="Log an order you got in chat" icon={<WhatsAppIcon className="size-5" />} />
              <CreateRow href="/admin/marketing" title="New offer" text="Coupon or festive campaign" icon={<Megaphone className="size-5" strokeWidth={SW} />} />
            </ul>
          </Modal>

          {/* More sheet */}
          <Modal open={sheet === "more"} onClose={() => setSheet(null)} title="All sections">
            <ul className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const n = countOf(item.count);
                const on = active === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex h-16 items-center gap-3 rounded-[8px] border px-3 text-[15px] leading-tight ${on ? "border-ink bg-white font-semibold" : "border-admin-line bg-white font-medium hover:bg-admin-inset"}`}
                    >
                      <Icon className={`size-5 shrink-0 ${item.ai ? "text-ai-fg" : "text-muted"}`} strokeWidth={SW} aria-hidden />
                      <span className="min-w-0 flex-1">{item.short ?? item.label}</span>
                      {n > 0 && <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-admin-sidebar-hover px-1.5 text-[11px] font-semibold">{n}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-admin-line pt-4">
              <a href="/?shop" target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-[6px] border border-admin-line text-[15px] font-medium">
                <ArrowUpRight className="size-4" strokeWidth={SW} aria-hidden /> View website
              </a>
              <button onClick={logout} className="flex h-12 items-center justify-center gap-2 rounded-[6px] border border-admin-line text-[15px] font-medium">
                <LogOut className="size-4" strokeWidth={SW} aria-hidden /> Log out
              </button>
            </div>
          </Modal>
        </div>
      </ToastProvider>
    </AdminChromeContext.Provider>
  );
}

// ── Desktop sidebar row ──────────────────────────────────────────────
function Row({ item, on, n }: { item: NavItem; on: boolean; n: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={on ? "page" : undefined}
      className={`relative flex h-[34px] items-center gap-2.5 rounded-[6px] border px-2.5 text-[14px] transition-colors duration-150 ${
        on ? "border-admin-line bg-white font-semibold text-ink" : "border-transparent font-medium text-ink hover:bg-admin-sidebar-hover"
      }`}
    >
      {on && <span aria-hidden className="absolute top-1/2 -left-[13px] h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
      <Icon className={`size-[18px] shrink-0 ${item.ai ? "text-ai-fg" : on ? "text-ink" : "text-muted"}`} strokeWidth={SW} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {n > 0 && (
        <span className="tabular grid h-[18px] min-w-[18px] place-items-center rounded-full bg-admin-sidebar-hover px-1.5 text-[11px] font-semibold text-ink">
          {n}
          <span className="sr-only"> waiting</span>
        </span>
      )}
    </Link>
  );
}

// ── Tablet rail item ─────────────────────────────────────────────────
function RailItem({ item, on, n }: { item: NavItem; on: boolean; n: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-label={n ? `${item.label}, ${n} waiting` : item.label}
      aria-current={on ? "page" : undefined}
      className={`group relative grid size-11 place-items-center rounded-[6px] border transition-colors duration-150 ${on ? "border-admin-line bg-white text-ink" : "border-transparent text-muted hover:bg-admin-sidebar-hover hover:text-ink"}`}
    >
      {on && <span aria-hidden className="absolute top-1/2 -left-[11px] h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
      <Icon className={`size-5 ${item.ai ? "text-ai-fg" : ""}`} strokeWidth={SW} aria-hidden />
      {n > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-ink ring-2 ring-admin-sidebar" />}
      <span
        role="tooltip"
        className="shadow-float pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-[6px] bg-ink px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap text-canvas opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {item.label}
        {n > 0 && <span className="tabular"> · {n}</span>}
      </span>
    </Link>
  );
}

function CreateRow({ href, title, text, icon, ai }: { href: string; title: string; text: string; icon: React.ReactNode; ai?: boolean }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-admin-inset">
        <span className={`grid size-11 shrink-0 place-items-center rounded-[8px] border ${ai ? "border-ai-line bg-ai-bg text-ai-fg" : "border-admin-line bg-admin-inset text-ink"}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] leading-6 font-semibold">{title}</span>
          <span className="block text-[14px] leading-5 text-muted">{text}</span>
        </span>
        <ChevronRight className="size-4 text-muted" strokeWidth={SW} aria-hidden />
      </Link>
    </li>
  );
}
