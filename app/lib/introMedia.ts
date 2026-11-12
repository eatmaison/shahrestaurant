import { capcutLuxuryPosters } from "./capcutLuxuryPosters";
import { capcutDutchPosters } from "./capcutDutchPosters";
import type { Lang } from "./types";

// Versioned, locale-specific files. The session gate intentionally remains shared.
const media = {
  en: {
    desktopVideo: "/brand/capcut-luxury-v3/shah-luxury-capcut-desktop-v3.mp4",
    mobileVideo: "/brand/capcut-luxury-v3/shah-luxury-capcut-mobile-v2.mp4",
    posters: capcutLuxuryPosters,
  },
  nl: {
    desktopVideo: "/brand/capcut-luxury-nl-v1/shah-luxury-capcut-desktop-nl-v1-web.mp4",
    mobileVideo: "/brand/capcut-luxury-nl-v1/shah-luxury-capcut-mobile-nl-v1-web.mp4",
    posters: capcutDutchPosters,
  },
} as const;

export function getIntroMedia(lang: Lang) {
  return lang === "nl" ? media.nl : media.en;
}

/** Keep the active file/clock on rotation, fitting its complete frame if mismatched. */
export function introVariantNeedsContain(compact: boolean, width: number, height: number): boolean {
  return compact ? width > 767 || width >= height : width <= 767 || height >= width;
}
