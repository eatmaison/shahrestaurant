"use client";

import Image from "next/image";
import type { CSSProperties, ImgHTMLAttributes } from "react";
import { getEventGalleryPhoto } from "../lib/eventGalleryPhotos";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "alt" | "width" | "height"> & {
  src: string;
  alt: string;
  sizes: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  preload?: boolean;
  placeholderFit?: "cover" | "contain";
};

/** Controlled local gallery delivery; uploaded URLs retain the existing Next Image path. */
export function EventGalleryPhoto({
  src, alt, sizes, fill = false, width, height, priority = false, preload = false,
  placeholderFit = "cover", loading = "lazy", decoding = "async", style, onLoad,
  fetchPriority, ...attributes
}: Props) {
  const photo = getEventGalleryPhoto(src);
  const eager = priority || preload || loading === "eager";
  if (!photo) {
    return <Image {...attributes} src={src} alt={alt} sizes={sizes} fill={fill}
      width={fill ? undefined : width} height={fill ? undefined : height}
      priority={priority} preload={preload} loading={eager ? "eager" : loading}
      decoding={decoding} fetchPriority={fetchPriority} style={style} onLoad={onLoad} />;
  }
  const imageStyle: CSSProperties = {
    ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}),
    backgroundImage: 'url("' + photo.blurDataURL + '")',
    backgroundSize: placeholderFit,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    ...style,
  };
  return <picture style={{ display: "contents" }}>
    <source type="image/avif" srcSet={photo.avifSrcSet} sizes={sizes} />
    <source type="image/webp" srcSet={photo.webpSrcSet} sizes={sizes} />
    {/* Native format/width selection is bounded by the generated 1280px delivery set. */}
    <img {...attributes} src={photo.src} srcSet={photo.webpSrcSet} sizes={sizes} alt={alt}
      width={width ?? photo.width} height={height ?? photo.height}
      loading={eager ? "eager" : loading} decoding={decoding}
      fetchPriority={fetchPriority ?? (eager ? "high" : undefined)} style={imageStyle}
      onLoad={event => {
        const image = event.currentTarget;
        const clearPlaceholder = () => { if (image.complete && image.naturalWidth > 0) image.style.backgroundImage = "none"; };
        if (typeof image.decode === "function") void image.decode().then(clearPlaceholder).catch(() => {});
        else clearPlaceholder();
        onLoad?.(event);
      }} />
  </picture>;
}
