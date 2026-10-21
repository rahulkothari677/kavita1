import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Must match LOCAL_WIDTHS in src/lib/format.ts.
  images: {
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [256, 384],
    qualities: [75],
    localPatterns: [{ pathname: "/home/**" }, { pathname: "/stock/**" }, { pathname: "/demo/**" }, { pathname: "/brand/**" }],
    minimumCacheTTL: 2678400,
  },
  serverExternalPackages: ["@libsql/client", "cloudinary"],
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [
      // The service worker must always be re-checked so app updates reach installed phones.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/admin.webmanifest", headers: [{ key: "Content-Type", value: "application/manifest+json" }] },
    ];
  },
};

export default nextConfig;
