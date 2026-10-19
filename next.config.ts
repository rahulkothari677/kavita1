import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "cloudinary"],
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
