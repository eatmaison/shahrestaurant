import type { Lang } from "./types";

const welcomeDirectory = "/brand/shah-welcome-v2";

function welcomeVariant(lang: Lang, variant: "desktop" | "mobile", width: number, height: number) {
  const posterBase = `${welcomeDirectory}/${lang}-${variant}`;
  return {
    video: `${welcomeDirectory}/shah-welcome-${lang}-${variant}-v2.mp4`,
    poster: {
      width,
      height,
      avifSrc: `${posterBase}.avif`,
      avifSrcSet: `${posterBase}.avif ${width}w`,
      webpSrcSet: `${posterBase}.webp ${width}w`,
      jpegSrc: `${posterBase}.jpg`,
      jpegSrcSet: `${posterBase}.jpg ${width}w`,
    },
  };
}

function welcomeMedia(lang: Lang) {
  const desktop = welcomeVariant(lang, "desktop", 1280, 720);
  const mobile = welcomeVariant(lang, "mobile", 540, 960);
  return {
    desktopVideo: desktop.video,
    mobileVideo: mobile.video,
    posters: { desktop: desktop.poster, mobile: mobile.poster },
  };
}

// Both languages share the existing once-per-session playback gate.
const media = { en: welcomeMedia("en"), nl: welcomeMedia("nl") };

export function getIntroMedia(lang: Lang) {
  return lang === "nl" ? media.nl : media.en;
}

/** Keep the active file/clock on rotation, fitting its complete frame if mismatched. */
export function introVariantNeedsContain(compact: boolean, width: number, height: number): boolean {
  return compact ? width > 767 || width >= height : width <= 767 || height >= width;
}
