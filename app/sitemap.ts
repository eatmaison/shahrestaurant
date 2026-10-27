import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://shahrestaurant.nl";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/reservations`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/order`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
