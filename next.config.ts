/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "affable-spoonbill-359.convex.cloud",
        port: "",
        pathname: "/api/storage/**",
      },
    ],
  },
};

module.exports = nextConfig;