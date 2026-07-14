import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://thetandoorcompany.nl";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/reservations`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/order`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/events`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/events/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/events/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/events/birthdays`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events/celebrations`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events/company-catering`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events/company-lunches`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/account`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
