import type { NextConfig } from "next";

const reviewDistDir = process.env.SHAH_REVIEW_DIST_DIR;
if (reviewDistDir && !/^\.next-review-[a-z0-9-]+$/.test(reviewDistDir)) {
  throw new Error("SHAH_REVIEW_DIST_DIR must be a task-local .next-review-<name> directory.");
}

const nextConfig: NextConfig = {
  ...(reviewDistDir ? { distDir: reviewDistDir, typescript: { tsconfigPath: `${reviewDistDir}.tsconfig.json` } } : {}),
  compress: true,
  // Proxy combines known public aliases/case/slashes/host into a single redirect.
  skipTrailingSlashRedirect: true,
  experimental: { optimizePackageImports: ["react-icons"], cssChunking: false },
  async headers() {
    return [{ source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }, { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }, ...["coca-cola", "heineken", "de-kuyper", "chaudfontaine"].map(brand => ({
      source: `/partners/${brand}-v1.webp`,
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    })), {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    }, {
      source: "/api/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }, ...["day", "night"].map(theme => ({
      source: `/photos/shah-hero-${theme}-scroll-v1.mp4`, headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    })), {
      source: "/photos/shah-interior-bg-v1.webp", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }, ...["account", "admin", "terminal", "forgot-password", "reset-password", "verify-email", "pay"].map(path => ({
      source: `/${path}/:path*`, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Referrer-Policy", value: "no-referrer" }],
    }))];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Admin-uploaded images (products, brand logos, gallery) live in
    // DigitalOcean Spaces; allow both the direct and the CDN endpoints.
    remotePatterns: [{ protocol: "https", hostname: "**.digitaloceanspaces.com" }],
  },
};

export default nextConfig;
