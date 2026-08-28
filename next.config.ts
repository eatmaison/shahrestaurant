import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: { optimizePackageImports: ["react-icons"] },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Admin-uploaded images (products, brand logos, gallery) live in
    // DigitalOcean Spaces; allow both the direct and the CDN endpoints.
    remotePatterns: [{ protocol: "https", hostname: "**.digitaloceanspaces.com" }],
  },
};

export default nextConfig;
