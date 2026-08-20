import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Admin-uploaded images (products, brand logos, gallery) live in
    // DigitalOcean Spaces; allow both the direct and the CDN endpoints.
    remotePatterns: [{ protocol: "https", hostname: "**.digitaloceanspaces.com" }],
  },
};

export default nextConfig;
