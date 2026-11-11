"use client";

import type { CSSProperties, ImgHTMLAttributes } from "react";
import { getRestaurantPhoto } from "../lib/restaurantPhotos";
import { getRestaurantPhotoJpegFallback } from "../lib/restaurantPhotoJpegFallbacks";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "alt" | "width" | "height"> & {
  src: string;
  alt: string;
  sizes: string;
  fill?: boolean;
  width?: number;
  height?: number;
  placeholderFit?: "cover" | "contain";
};

/** Versioned local photography with native format selection and a tiny static LQIP. */
export function RestaurantPhoto({
  src, alt, sizes, fill = false, width, height, placeholderFit = "cover",
  loading = "lazy", decoding = "async", style, onLoad, ...attributes
}: Props) {
  const photo = getRestaurantPhoto(src);
  const jpegFallback = getRestaurantPhotoJpegFallback(src);
  const imageStyle: CSSProperties = {
    ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}),
    ...(photo ? { backgroundImage: `url("${photo.blurDataURL}")`, backgroundSize: placeholderFit, backgroundPosition: "center", backgroundRepeat: "no-repeat" } : {}),
    ...style,
  };
  return <picture style={{ display: "contents" }}>
    {photo && <source type="image/avif" srcSet={photo.avifSrcSet} sizes={sizes} />}
    {photo && <source type="image/webp" srcSet={photo.webpSrcSet} sizes={sizes} />}
    {/* Native picture selects prebuilt variants; no runtime optimizer or external URL is used. */}
    <img {...attributes} src={jpegFallback?.src ?? photo?.src ?? src} srcSet={jpegFallback?.srcSet ?? photo?.webpSrcSet} sizes={sizes} alt={alt}
      onLoad={event => {
        const image = event.currentTarget;
        const clearPlaceholder = () => { if (image.complete && image.naturalWidth > 0) image.style.backgroundImage = "none"; };
        // Clear only after decode; contained lightbox photos retain their plain letterbox.
        if (typeof image.decode === "function") void image.decode().then(clearPlaceholder).catch(() => {});
        else clearPlaceholder();
        onLoad?.(event);
      }}
      width={width ?? photo?.width} height={height ?? photo?.height} loading={loading} decoding={decoding} style={imageStyle} />
  </picture>;
}
