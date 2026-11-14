export const relatedSites = {
  restaurant: { name: "Shah Restaurant", origin: "https://shahrestaurant.nl", en: "/en" },
  takeaway: { name: "Shah To Go", origin: "https://shahtogo.nl", en: "/en" },
  tandoor: { name: "The Tandoor Company", origin: "https://thetandoorcompany.nl", en: "/" },
  eat: { name: "Eat To Go", origin: "https://eattogo.nl", en: "/" },
  maison: { name: "The Maison", origin: "https://themaison.nl", en: "/" },
} as const;

export type SiteId = keyof typeof relatedSites;

export function relatedSiteUrl(id: SiteId, language: "nl" | "en" = "nl") {
  const site = relatedSites[id];
  return site.origin + (language === "en" ? site.en : "/");
}
