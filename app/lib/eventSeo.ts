import type { Metadata } from "next";
import { EVENT_PATHS, type EventPageKey, type SiteLocale } from "./locale";
import { SITE_URL, SOCIAL_IMAGE } from "./seo";

type Copy = { title: string; description: string };
const pages: Record<EventPageKey, { type: "website" | "article"; keywords: string[]; nl: Copy; en: Copy }> = {
  "events": {
    "type": "website",
    "keywords": [
      "events Amsterdam",
      "Indian catering Amsterdam",
      "private dining Amsterdam",
      "restaurant events Amsterdam",
      "Shah Restaurant events",
      "party venue Amsterdam Noord",
      "catering Amsterdam Noord"
    ],
    "nl": {
      "title": "Evenementen en catering | Shah Restaurant Amsterdam",
      "description": "Ontdek de evenementen en catering van Shah Restaurant in Amsterdam-Noord. Bekijk verjaardagen, bruiloften, bedrijfscatering en lunches en neem contact op."
    },
    "en": {
      "title": "Events and catering | Shah Restaurant Amsterdam-Noord",
      "description": "Explore events and catering at Shah Restaurant in Amsterdam-Noord. Discover birthdays, weddings, company dinners and lunches, then contact us to plan."
    }
  },
  "eventsAbout": {
    "type": "article",
    "keywords": [
      "about Shah Restaurant",
      "Indian restaurant Amsterdam Noord",
      "tandoori Klaprozenweg",
      "Indian chef Amsterdam",
      "restaurant story Amsterdam",
      "Shah Restaurant family",
      "authentic Indian restaurant Amsterdam"
    ],
    "nl": {
      "title": "Over Shah Restaurant | Indiaas eten in Amsterdam-Noord",
      "description": "Lees het verhaal van Shah Restaurant in Amsterdam-Noord. Ontdek de Indiase keuken, tandoori gerechten en gastvrijheid en bekijk de sfeer in onze galerij."
    },
    "en": {
      "title": "About Shah Restaurant | Indian dining Amsterdam-Noord",
      "description": "Meet Shah Restaurant in Amsterdam-Noord. Read about the Indian kitchen, tandoori dishes and hospitality, then explore the restaurant in our gallery."
    }
  },
  "eventsGallery": {
    "type": "website",
    "keywords": [
      "Shah Restaurant gallery",
      "Indian restaurant Amsterdam photos",
      "tandoori photos Amsterdam",
      "event venue Amsterdam pictures",
      "restaurant interior Amsterdam Noord",
      "wedding venue Amsterdam pictures"
    ],
    "nl": {
      "title": "Galerij Shah Restaurant | Sfeer en gerechten Amsterdam",
      "description": "Bekijk de galerij van Shah Restaurant in Amsterdam-Noord: het interieur, gedekte tafels en Indiase gerechten. Ontdek de sfeer en plan uw bezoek."
    },
    "en": {
      "title": "Shah Restaurant gallery | Food and atmosphere Amsterdam",
      "description": "Explore the Shah Restaurant gallery in Amsterdam-Noord: dining room, table settings and Indian dishes. Discover the atmosphere and plan your restaurant visit."
    }
  },
  "eventsBirthdays": {
    "type": "article",
    "keywords": [
      "birthday catering Amsterdam",
      "party catering Amsterdam",
      "Indian birthday party venue Amsterdam",
      "verjaardag catering Amsterdam",
      "private dining Amsterdam birthday",
      "anniversary dinner Amsterdam",
      "kinderfeestje restaurant Amsterdam",
      "milestone birthday Amsterdam",
      "graduation party Amsterdam"
    ],
    "nl": {
      "title": "Verjaardag vieren | Shah Restaurant Amsterdam-Noord",
      "description": "Vier uw verjaardag of jubileum bij Shah Restaurant in Amsterdam-Noord. Bekijk de mogelijkheden voor een Indiaas menu en neem contact op over uw wensen."
    },
    "en": {
      "title": "Birthday celebrations | Shah Restaurant Amsterdam-Noord",
      "description": "Celebrate a birthday or anniversary at Shah Restaurant in Amsterdam-Noord. Explore Indian menu options and contact our team to discuss your celebration."
    }
  },
  "eventsCelebrations": {
    "type": "article",
    "keywords": [
      "wedding catering Amsterdam",
      "Indian wedding catering Amsterdam",
      "wedding venue Amsterdam Noord",
      "bruiloft catering Amsterdam",
      "trouwlocatie Amsterdam",
      "engagement dinner Amsterdam",
      "gala evening Amsterdam",
      "reception venue Amsterdam",
      "anniversary Amsterdam restaurant",
      "verlovingsdiner Amsterdam",
      "rehearsal dinner Amsterdam"
    ],
    "nl": {
      "title": "Bruiloften en vieringen | Shah Restaurant Amsterdam",
      "description": "Ontdek bruiloften en vieringen bij Shah Restaurant in Amsterdam-Noord. Bekijk de mogelijkheden voor een Indiaas diner en bespreek uw wensen met ons."
    },
    "en": {
      "title": "Weddings and celebrations | Shah Restaurant Amsterdam",
      "description": "Explore weddings and celebrations at Shah Restaurant in Amsterdam-Noord. Discover Indian dining options and contact our team to discuss your plans."
    }
  },
  "eventsCompanyCatering": {
    "type": "article",
    "keywords": [
      "corporate catering Amsterdam",
      "company catering Amsterdam",
      "Indian catering Amsterdam",
      "bedrijfscatering Amsterdam",
      "zakelijk diner Amsterdam",
      "business dinner Amsterdam",
      "client dinner Amsterdam",
      "corporate event Amsterdam",
      "product launch catering Amsterdam",
      "bedrijfsevent Amsterdam",
      "board dinner Amsterdam",
      "executive catering Amsterdam"
    ],
    "nl": {
      "title": "Bedrijfscatering | Shah Restaurant in Amsterdam-Noord",
      "description": "Bekijk bedrijfscatering van Shah Restaurant in Amsterdam-Noord. Ontdek de mogelijkheden voor zakelijke diners en ontvangsten en bespreek uw wensen."
    },
    "en": {
      "title": "Company catering | Shah Restaurant Amsterdam-Noord",
      "description": "Explore company catering at Shah Restaurant in Amsterdam-Noord. Discover options for business dinners and receptions, then contact us about your plans."
    }
  },
  "eventsCompanyLunches": {
    "type": "article",
    "keywords": [
      "company lunches Amsterdam",
      "office catering Amsterdam",
      "Indian lunch Amsterdam",
      "bedrijfslunch Amsterdam",
      "lunch bezorgen Amsterdam kantoor",
      "office lunch delivery Amsterdam",
      "corporate lunch Amsterdam",
      "healthy lunch office Amsterdam",
      "weekly lunch catering Amsterdam",
      "meeting lunch Amsterdam",
      "lunch bezorging kantoor Amsterdam Noord"
    ],
    "nl": {
      "title": "Bedrijfslunches | Shah Restaurant in Amsterdam-Noord",
      "description": "Ontdek de bedrijfslunches van Shah Restaurant in Amsterdam-Noord. Bekijk de lunchvormen en menuopties voor uw team en neem contact op over uw wensen."
    },
    "en": {
      "title": "Company and office lunches | Shah Restaurant Amsterdam",
      "description": "Discover company lunches at Shah Restaurant in Amsterdam-Noord. Explore lunch formats and menu options for your team, then contact us to discuss your plans."
    }
  }
};

export function eventMetadata(key: EventPageKey, locale: SiteLocale): Metadata {
  const page = pages[key];
  const { title, description } = page[locale];
  const paths = EVENT_PATHS[key];
  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: title }, description, keywords: page.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: paths[locale], languages: { "nl-NL": paths.nl, en: paths.en, "x-default": paths.nl } },
    openGraph: { title, description, url: paths[locale], type: page.type, siteName: "Shah Restaurant",
      locale: locale === "nl" ? "nl_NL" : "en_GB", alternateLocale: [locale === "nl" ? "en_GB" : "nl_NL"],
      images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: "Shah Restaurant in Amsterdam-Noord" }] },
    twitter: { card: "summary_large_image", title, description, images: [SOCIAL_IMAGE] },
  };
}
