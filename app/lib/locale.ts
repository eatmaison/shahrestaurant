export type SiteLocale = "nl" | "en";
export type PublicPageKey = "home" | "menu" | "reservations" | "privacy" | "terms";
export type EventPageKey = "events" | "eventsAbout" | "eventsGallery" | "eventsBirthdays" | "eventsCelebrations" | "eventsCompanyCatering" | "eventsCompanyLunches";

export const PUBLIC_PATHS: Record<PublicPageKey, Record<SiteLocale, string>> = {
  home: { nl: "/", en: "/en" },
  menu: { nl: "/menukaart", en: "/en/menu" },
  reservations: { nl: "/reserveren", en: "/en/reservations" },
  privacy: { nl: "/privacy", en: "/en/privacy" },
  terms: { nl: "/voorwaarden", en: "/en/terms" },
};

export const EVENT_PATHS: Record<EventPageKey, Record<SiteLocale, string>> = {
  events: { nl: "/events", en: "/en/events" },
  eventsAbout: { nl: "/events/about", en: "/en/events/about" },
  eventsGallery: { nl: "/events/gallery", en: "/en/events/gallery" },
  eventsBirthdays: { nl: "/events/birthdays", en: "/en/events/birthdays" },
  eventsCelebrations: { nl: "/events/celebrations", en: "/en/events/celebrations" },
  eventsCompanyCatering: { nl: "/events/company-catering", en: "/en/events/company-catering" },
  eventsCompanyLunches: { nl: "/events/company-lunches", en: "/en/events/company-lunches" },
};

const legacyPaths: Record<string, PublicPageKey> = {
  "/order": "menu",
  "/reservations": "reservations",
  "/terms": "terms",
};

export function isPublicEventRoute(path: string): boolean {
  return getEventRoute(path) !== null;
}

/** Every public URL chooses its language; preferences only apply to utility routes. */
export function resolveSiteLocale(path: string, preference: SiteLocale): SiteLocale {
  return getLocalizedRoute(path)?.locale ?? preference;
}

export function getEventRoute(path: string): { key: EventPageKey; locale: SiteLocale; canonical: string } | null {
  if (!path.startsWith("/")) return null;
  const pathname = path.split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
  for (const key of Object.keys(EVENT_PATHS) as EventPageKey[]) {
    for (const locale of ["nl", "en"] as const) {
      if (EVENT_PATHS[key][locale] === pathname) return { key, locale, canonical: pathname };
    }
  }
  return null;
}

/** Combined routing lookup; core-only layout/chapter checks keep using getPublicRoute. */
export function getLocalizedRoute(path: string) {
  return getPublicRoute(path) ?? getEventRoute(path);
}

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
  if (route) return `${PUBLIC_PATHS[route.key][lang]}${suffix}`;
  const event = getEventRoute(pathname);
  return event ? `${EVENT_PATHS[event.key][lang]}${suffix}` : path;
}
