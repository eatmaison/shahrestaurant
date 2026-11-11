import { heroPosterJpegFallbacks } from "../lib/heroPosterJpegFallbacks";

type Props = { alt: string; className?: string };

/** The existing responsive film still, with JPEG compatibility delivery after modern formats. */
export function HeroPoster({ alt, className }: Props) {
  const mobile = heroPosterJpegFallbacks.mobile;
  const desktop = heroPosterJpegFallbacks.desktop;
  return <picture style={{ display: "block", position: "relative", width: "100%", height: "100%" }}>
    <source media="(max-width: 767px)" type="image/avif" srcSet="/brand/shah-hero-poster-mobile-delivery-v1-360.avif 360w, /brand/shah-hero-poster-mobile-delivery-v1.avif 608w" sizes="100vw" />
    <source media="(max-width: 767px)" type="image/webp" srcSet="/brand/shah-hero-poster-mobile-delivery-v1-360.webp 360w, /brand/shah-hero-poster-mobile-delivery-v1.webp 608w" sizes="100vw" />
    <source media="(max-width: 767px)" type="image/jpeg" srcSet={mobile.srcSet} sizes="100vw" />
    <source type="image/avif" srcSet="/brand/shah-hero-poster-desktop-delivery-v1-960.avif 960w, /brand/shah-hero-poster-desktop-delivery-v1.avif 1600w" sizes="100vw" />
    <source type="image/webp" srcSet="/brand/shah-hero-poster-desktop-delivery-v1-960.webp 960w, /brand/shah-hero-poster-desktop-delivery-v1.webp 1600w" sizes="100vw" />
    {/* Native picture retains the same modern poster; the final image covers older decoders. */}
    <img src={desktop.src} srcSet={desktop.srcSet} sizes="100vw" alt={alt} width={1600} height={900}
      loading="eager" decoding="async" fetchPriority="high" className={className} />
  </picture>;
}
