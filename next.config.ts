import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static HTML for GitHub Pages (`out/`). `next start` is unused.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),

  // Lets phones and tablets on the LAN load dev chunks and connect to HMR.
  allowedDevOrigins: ["192.168.1.169", "*.local"],
};

export default nextConfig;
