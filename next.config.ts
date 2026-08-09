import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones and tablets on the LAN load dev chunks and connect to HMR.
  allowedDevOrigins: ["192.168.1.169", "*.local"],

  async headers() {
    const cache = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];
    return [
      // Layer cutouts + plates (and frame sequences) are rewritten, not mutated.
      { source: "/frames/:path*", headers: cache },
      { source: "/layers/:path*", headers: cache },
    ];
  },
};

export default nextConfig;
