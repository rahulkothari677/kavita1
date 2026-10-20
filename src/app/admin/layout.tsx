import type { Metadata, Viewport } from "next";

/**
 * Everything under /admin is its own installable app ("Studio Admin"): its own manifest
 * (scope /admin, start /admin), name and icon, so installing from an admin page never
 * installs the shop instead.
 */
export const metadata: Metadata = {
  manifest: "/admin.webmanifest",
  icons: { icon: "/admin-icon-192.png", apple: "/admin-apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Studio Admin", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f4f2ee" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
