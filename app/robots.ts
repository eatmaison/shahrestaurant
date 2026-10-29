import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/terminal", "/events", "/parties"] },
    sitemap: "https://shahrestaurant.nl/sitemap.xml",
    host: "https://shahrestaurant.nl",
  };
}
