import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
