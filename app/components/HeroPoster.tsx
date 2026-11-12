import { getIntroMedia } from "../lib/introMedia";
import type { Lang } from "../lib/types";

type Props = { alt: string; className?: string; lang: Lang };

/** A visible title hold from the approved edit, with native responsive format fallbacks. */
export function HeroPoster({ alt, className, lang }: Props) {
  const { mobile, desktop } = getIntroMedia(lang).posters;
  return <picture style={{ display: "block", position: "relative", width: "100%", height: "100%" }}>
    <source media="(max-width: 767px)" type="image/avif" srcSet={mobile.avifSrcSet} sizes="100vw" />
    <source media="(max-width: 767px)" type="image/webp" srcSet={mobile.webpSrcSet} sizes="100vw" />
    <source media="(max-width: 767px)" type="image/jpeg" srcSet={mobile.jpegSrcSet} sizes="100vw" />
    <source type="image/avif" srcSet={desktop.avifSrcSet} sizes="100vw" />
    <source type="image/webp" srcSet={desktop.webpSrcSet} sizes="100vw" />
    <img src={desktop.jpegSrc} srcSet={desktop.jpegSrcSet} sizes="100vw" alt={alt}
      width={desktop.width} height={desktop.height} loading="eager" decoding="async" fetchPriority="high" className={className} />
  </picture>;
}
