import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://thetandoorcompany.nl/sitemap.xml",
    host: "https://thetandoorcompany.nl",
  };
}
