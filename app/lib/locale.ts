export type SiteLocale = "nl" | "en";
export type PublicPageKey = "home" | "menu" | "reservations" | "privacy" | "terms";

export const PUBLIC_PATHS: Record<PublicPageKey, Record<SiteLocale, string>> = {
  home: { nl: "/", en: "/en" },
  menu: { nl: "/menukaart", en: "/en/menu" },
  reservations: { nl: "/reserveren", en: "/en/reservations" },
  privacy: { nl: "/privacy", en: "/en/privacy" },
  terms: { nl: "/voorwaarden", en: "/en/terms" },
};

const legacyPaths: Record<string, PublicPageKey> = {
  "/order": "menu",
  "/reservations": "reservations",
  "/terms": "terms",
};

export function getPublicRoute(path: string): { key: PublicPageKey; locale: SiteLocale; canonical: string } | null {
  if (!path.startsWith("/")) return null;
  const pathname = path.split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
  for (const key of Object.keys(PUBLIC_PATHS) as PublicPageKey[]) {
    for (const locale of ["nl", "en"] as const) {
      if (PUBLIC_PATHS[key][locale] === pathname) return { key, locale, canonical: pathname };
    }
  }
  const key = legacyPaths[pathname];
  return key ? { key, locale: "nl", canonical: PUBLIC_PATHS[key].nl } : null;
}

/** Localize public destinations without changing transactional or private URLs. */
export function localePath(path: string, lang: SiteLocale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const boundary = path.search(/[?#]/);
  const pathname = boundary < 0 ? path : path.slice(0, boundary);
  const suffix = boundary < 0 ? "" : path.slice(boundary);
  const route = getPublicRoute(pathname);
  return route ? `${PUBLIC_PATHS[route.key][lang]}${suffix}` : path;
}
