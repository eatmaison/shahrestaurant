"use client";
import Image from "next/image";
import { useState } from "react";

type Props = { src: string; alt: string; sizes?: string; loading?: "eager" | "lazy"; fetchPriority?: "high" | "low" | "auto" };
// Match the current full-width mobile 4:3 image frame, including its borders.
export const ORDER_DISH_IMAGE_SIZES = "(min-width: 1400px) 266px, (min-width: 1024px) calc(32vw - 182px), (min-width: 701px) calc(50vw - 34px), calc(100vw - 34px)";
export function ProductImage(props: Props) { return <ProductPicture key={props.src} {...props} />; }
function ProductPicture({ src, alt, sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 360px", loading = "lazy", fetchPriority }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span role="img" aria-label={alt} className="grid h-full w-full place-items-center text-3xl text-emerald-600/50">✦</span>;
  let optimized = src.startsWith("/") && !src.startsWith("//");
  try { const url = new URL(src); optimized ||= url.protocol === "https:" && url.hostname.endsWith(".digitaloceanspaces.com"); } catch { /* Local asset or data URI. */ }
  if (optimized) return <Image src={src} alt={alt} fill sizes={sizes} loading={loading} fetchPriority={fetchPriority} className="object-cover" onError={() => setFailed(true)} />;
  // Unknown external sources remain compatible with existing administrator uploads.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={480} height={360} loading={loading} fetchPriority={fetchPriority} decoding="async" className="h-full w-full object-cover" onError={() => setFailed(true)} />;
}
