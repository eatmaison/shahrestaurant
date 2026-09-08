import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://shahrestaurant.nl";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/reservations`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/order`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/events`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/events/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/events/gallery`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/events/birthdays`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events/celebrations`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events/company-catering`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events/company-lunches`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
