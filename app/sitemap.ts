import type { MetadataRoute } from "next";
import { EVENT_PATHS, PUBLIC_PATHS } from "./lib/locale";
import { SITE_URL } from "./lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Date of the public-route/metadata revision; avoid a false change on each request.
  const lastModified = "2026-11-11";
  return Object.entries({ ...PUBLIC_PATHS, ...EVENT_PATHS }).flatMap(([key, paths]) =>
    (["nl", "en"] as const).map(locale => ({
      url: `${SITE_URL}${paths[locale]}`,
      lastModified,
      changeFrequency: key === "privacy" || key === "terms" ? "yearly" as const : key.startsWith("events") ? "monthly" as const : "weekly" as const,
      priority: key === "home" ? 1 : key === "menu" || key === "reservations" ? 0.9 : key === "events" ? 0.8 : key.startsWith("events") ? 0.7 : 0.3,
      alternates: { languages: { "nl-NL": `${SITE_URL}${paths.nl}`, en: `${SITE_URL}${paths.en}`, "x-default": `${SITE_URL}${paths.nl}` } },
    })));
}
