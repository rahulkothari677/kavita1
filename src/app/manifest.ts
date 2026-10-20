import type { MetadataRoute } from "next";

/**
 * The shop app. The admin is a separate installable app with its own manifest
 * (public/admin.webmanifest, linked from app/admin/layout.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kavita's Artistry",
    short_name: "Kavita's",
    description: "Handmade art & craft — order on WhatsApp",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone"],
    orientation: "portrait",
    background_color: "#f6ede3",
    theme_color: "#f6ede3",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
