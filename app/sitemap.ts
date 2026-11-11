import type { MetadataRoute } from "next";
import { PUBLIC_PATHS } from "./lib/locale";
import { SITE_URL } from "./lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Date of the public-route/metadata revision; avoid a false change on each request.
  const lastModified = "2026-11-11";
  return Object.entries(PUBLIC_PATHS).flatMap(([key, paths]) =>
    (["nl", "en"] as const).map(locale => ({
      url: `${SITE_URL}${paths[locale]}`,
      lastModified,
      changeFrequency: key === "privacy" || key === "terms" ? "yearly" as const : "weekly" as const,
      priority: key === "home" ? 1 : key === "menu" || key === "reservations" ? 0.9 : 0.3,
      alternates: { languages: { "nl-NL": `${SITE_URL}${paths.nl}`, en: `${SITE_URL}${paths.en}`, "x-default": `${SITE_URL}${paths.nl}` } },
    })));
}
