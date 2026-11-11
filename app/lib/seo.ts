import type { Metadata } from "next";
import { PUBLIC_PATHS, type PublicPageKey, type SiteLocale } from "./locale";

export const SITE_URL = "https://shahrestaurant.nl";
export const SOCIAL_IMAGE = "/brand/shah-social-v1.png";

const pages: Record<PublicPageKey, Record<SiteLocale, { title: string; description: string; label: string }>> = {
  home: {
    nl: { title: "Indiaas restaurant | Shah Restaurant | Amsterdam-Noord", description: "Ontdek Shah Restaurant aan de Klaprozenweg 36a in Amsterdam-Noord. Bekijk Indiase gerechten, openingstijden en de menukaart. Reserveer uw tafel online.", label: "Home" },
    en: { title: "Indian restaurant | Shah Restaurant | Amsterdam-Noord", description: "Discover Shah Restaurant at Klaprozenweg 36a in Amsterdam-Noord. Explore Indian dishes, the menu and opening hours, then book your table online.", label: "Home" },
  },
  menu: {
    nl: { title: "Indiase menukaart | Shah Restaurant | Amsterdam-Noord", description: "Bekijk de Indiase menukaart van Shah Restaurant in Amsterdam-Noord: curry, tandoori en naan met actuele prijzen. Kies uw gerechten en bestel online.", label: "Menukaart" },
    en: { title: "Indian food menu | Shah Restaurant | Amsterdam-Noord", description: "Explore the Indian menu at Shah Restaurant in Amsterdam-Noord: curry, tandoori and naan with current prices. Choose your dishes and order online.", label: "Menu" },
  },
  reservations: {
    nl: { title: "Tafel reserveren | Shah Restaurant | Amsterdam-Noord", description: "Reserveer uw tafel bij Shah Restaurant aan de Klaprozenweg 36a in Amsterdam-Noord. Dinsdag t/m zondag 15:00–22:00. Bekijk de tijden en boek online.", label: "Reserveren" },
    en: { title: "Table reservations | Shah Restaurant | Amsterdam-Noord", description: "Book a table at Shah Restaurant, Klaprozenweg 36a in Amsterdam-Noord. Open Tuesday to Sunday, 15:00–22:00. View available times and reserve online.", label: "Reservations" },
  },
  privacy: {
    nl: { title: "Ons privacybeleid | Shah Restaurant | Amsterdam-Noord", description: "Lees het privacybeleid van Shah Restaurant in Amsterdam-Noord: hoe wij persoonsgegevens bij bestellingen en reserveringen verwerken en beschermen.", label: "Privacybeleid" },
    en: { title: "Privacy policy | Shah Restaurant | Amsterdam-Noord", description: "Read the privacy policy of Shah Restaurant in Amsterdam-Noord and learn how personal data for orders and table reservations is handled and protected.", label: "Privacy policy" },
  },
  terms: {
    nl: { title: "Algemene voorwaarden | Shah Restaurant | Amsterdam-Noord", description: "Lees de algemene voorwaarden van Shah Restaurant in Amsterdam-Noord voor bestellingen en tafelreserveringen. Bekijk de informatie voor uw bezoek.", label: "Voorwaarden" },
    en: { title: "Terms and conditions | Shah Restaurant | Amsterdam", description: "Read Shah Restaurant's terms and conditions for orders and table reservations in Amsterdam-Noord. Review the practical information before your visit.", label: "Terms and conditions" },
  },
};

export function publicMetadata(key: PublicPageKey, locale: SiteLocale): Metadata {
  const { title, description } = pages[key][locale];
  const path = PUBLIC_PATHS[key][locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: title },
    description,
    alternates: {
      canonical: path,
      languages: { "nl-NL": PUBLIC_PATHS[key].nl, en: PUBLIC_PATHS[key].en, "x-default": PUBLIC_PATHS[key].nl },
    },
    openGraph: {
      type: "website", siteName: "Shah Restaurant", title, description, url: path,
      locale: locale === "nl" ? "nl_NL" : "en_GB",
      alternateLocale: [locale === "nl" ? "en_GB" : "nl_NL"],
      images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: locale === "nl" ? "Shah Restaurant in Amsterdam-Noord" : "Shah Restaurant in Amsterdam-Noord" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [SOCIAL_IMAGE] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

export function pageLabel(key: PublicPageKey, locale: SiteLocale): string { return pages[key][locale].label; }

export function siteSchema(locale: SiteLocale) {
  const home = `${SITE_URL}${PUBLIC_PATHS.home[locale] === "/" ? "/" : PUBLIC_PATHS.home[locale]}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Restaurant", "@id": `${SITE_URL}/#restaurant`, name: "Shah Restaurant",
        url: `${SITE_URL}/`, image: `${SITE_URL}/brand/shah-room-v1.webp`,
        logo: `${SITE_URL}/brand/shah-landscape-teal-v1.svg`,
        telephone: "+31 20 341 2995", email: "info@shahrestaurant.nl",
        address: { "@type": "PostalAddress", streetAddress: "Klaprozenweg 36a", postalCode: "1032 KL", addressLocality: "Amsterdam", addressCountry: "NL" },
        // BAG address point, verified through PDOK Locatieserver on 11 November 2026.
        geo: { "@type": "GeoCoordinates", latitude: 52.39763814, longitude: 4.91025655 },
        servesCuisine: ["Indian", "Tandoori", "Curry", "Biryani"], acceptsReservations: true,
        priceRange: locale === "nl" ? "Circa €35 per persoon" : "About €35 per person",
        menu: `${SITE_URL}${PUBLIC_PATHS.menu[locale]}`,
        hasMap: "https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a+1032+KL+Amsterdam",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "15:00", closes: "22:00",
        },
      },
      { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Shah Restaurant", url: `${SITE_URL}/`, logo: `${SITE_URL}/brand/shah-landscape-teal-v1.svg` },
      { "@type": "WebSite", "@id": `${home}#website`, name: "Shah Restaurant", url: home, inLanguage: locale === "nl" ? "nl-NL" : "en", publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}${PUBLIC_PATHS.menu[locale]}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      { "@type": "ImageObject", "@id": `${SITE_URL}/#restaurant-image`, contentUrl: `${SITE_URL}/brand/shah-room-v1.webp`, caption: locale === "nl" ? "De eetzaal van Shah Restaurant in Amsterdam-Noord" : "The dining room at Shah Restaurant in Amsterdam-Noord" },
    ],
  };
}
