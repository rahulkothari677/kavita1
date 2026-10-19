"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareQuote,
  Package,
  Palette,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { ToastProvider } from "./ui";

type Counts = { pendingOrders: number; newRequests: number; pendingReviews: number };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, count: "pendingOrders" as const },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/custom-requests", label: "Custom requests", icon: Palette, count: "newRequests" as const },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, count: "pendingReviews" as const },
  { href: "/admin/marketing", label: "Offers & marketing", icon: Megaphone },
  { href: "/admin/ai-studio", label: "AI Studio", icon: Wand2 },
  { href: "/admin/content", label: "Website content", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children, counts }: { children: React.ReactNode; counts: Counts }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
        <img src="/brand/medallion.webp" alt="" className="size-10 rounded-full ring-2 ring-cream/20" />
        <div className="leading-tight">
          <p className="font-display text-xl font-semibold text-cream">Kavita&apos;s</p>
          <p className="text-[10px] tracking-[0.3em] text-cream/60">STUDIO ADMIN</p>
        </div>
      </Link>
      <div className="px-3">
        <Link href="/admin/products/new" onClick={() => setOpen(false)} className="btn btn-gold w-full justify-start rounded-xl">
          <Sparkles className="size-4" /> Add product with AI
        </Link>
      </div>
      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map(({ href, label, icon: Icon, count }) => {
          const n = count ? counts[count] : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] transition ${isActive(href) ? "bg-cream/12 text-cream" : "text-cream/65 hover:bg-cream/6 hover:text-cream"}`}
            >
              <Icon className="size-[18px]" strokeWidth={1.7} />
              <span className="flex-1">{label}</span>
              {n > 0 && <span className="rounded-full bg-gold-2 px-2 py-px text-[11px] font-semibold text-ink">{n}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-cream/10 p-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-cream/65 hover:text-cream">
          <ExternalLink className="size-4" /> View website
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-cream/65 hover:text-cream">
          <LogOut className="size-4" /> Log out
        </button>
      </div>
    </div>
  );

  const tabs = [
    { href: "/admin", label: "Home", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag, count: counts.pendingOrders },
    { href: "/admin/products/new", label: "Add", icon: Plus, primary: true },
    { href: "/admin/products", label: "Products", icon: Package },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f6f3ec]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink lg:block">{sidebar}</aside>
        {open && (
          <div className="fixed inset-0 z-[120] lg:hidden">
            <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 animate-fade-up bg-ink">
              <button onClick={() => setOpen(false)} className="absolute right-3 top-5 p-2 text-cream" aria-label="Close menu">
                <X className="size-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink/[0.06] bg-[#f6f3ec]/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-1 p-1.5">
            <Menu className="size-5" />
          </button>
          <img src="/brand/medallion.webp" alt="" className="size-8 rounded-full" />
          <span className="font-display text-lg font-semibold">Studio Admin</span>
        </header>
        <main className="pb-28 lg:ml-64 lg:pb-12">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-9">{children}</div>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {tabs.map(({ href, label, icon: Icon, primary, count }) =>
            primary ? (
              <Link key={href} href={href} className="flex flex-col items-center justify-center" aria-label="Add product">
                <span className="-mt-6 grid size-14 place-items-center rounded-full bg-ink text-cream shadow-lg ring-4 ring-[#f6f3ec]">
                  <Icon className="size-6" />
                </span>
              </Link>
            ) : (
              <Link key={href} href={href} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${isActive(href) && !(href === "/admin/products" && pathname === "/admin/products/new") ? "text-ink" : "text-muted"}`}>
                <Icon className="size-5" strokeWidth={1.8} />
                {label}
                {count ? <span className="absolute right-[22%] top-1.5 size-2 rounded-full bg-rose" /> : null}
              </Link>
            ),
          )}
          <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted">
            <Menu className="size-5" strokeWidth={1.8} />
            More
          </button>
        </nav>
      </div>
    </ToastProvider>
  );
}
