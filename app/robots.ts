import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://eattogo.nl/sitemap.xml",
    host: "https://eattogo.nl",
  };
}
