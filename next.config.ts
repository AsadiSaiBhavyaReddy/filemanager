import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "affable-spoonbill-359.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
