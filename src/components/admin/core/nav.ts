import {
  Camera,
  FolderTree,
  Home,
  Images,
  LayoutTemplate,
  Megaphone,
  MessageSquareQuote,
  Package,
  PenTool,
  Settings,
  ShoppingBag,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export type CountKey = "pendingOrders" | "newRequests" | "pendingReviews";

export type NavItem = {
  href: string;
  label: string;
  short?: string;
  icon: LucideIcon;
  count?: CountKey;
  ai?: boolean;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Sell",
    items: [
      { href: "/admin", label: "Home", icon: Home },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, count: "pendingOrders" },
      { href: "/admin/custom-requests", label: "Custom requests", short: "Custom", icon: PenTool, count: "newRequests" },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/products/new", label: "Snap & Sell", icon: Camera, ai: true },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, count: "pendingReviews" },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/admin/marketing", label: "Offers & marketing", short: "Offers", icon: Megaphone },
      { href: "/admin/ai-studio", label: "AI Studio", icon: Wand2, ai: true },
    ],
  },
  {
    label: "Store",
    items: [
      { href: "/admin/content", label: "Website content", short: "Content", icon: LayoutTemplate },
      { href: "/admin/photos", label: "Site photos", short: "Photos", icon: Images },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

/** Longest-prefix match so /admin/products/new lights up Snap & Sell, not Products. */
export function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const { href } of ALL_NAV) {
    const hit = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
    if (hit && (!best || href.length > best.length)) best = href;
  }
  return best;
}
