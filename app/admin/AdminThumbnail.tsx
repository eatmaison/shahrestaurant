"use client";
import Image from "next/image";
import { useState } from "react";
import { useLang } from "../providers";
import { safeImageUrl } from "../lib/adminList";
import styles from "./admin.module.css";
export function AdminThumbnail({ src, alt, sizes = "200px" }: { src: string; alt: string; sizes?: string }) {
  const [failed, setFailed] = useState(false), { lang } = useLang();
  let optimized = src.startsWith("/");
  try { optimized ||= new URL(src).hostname.endsWith(".digitaloceanspaces.com"); } catch { /* Local and invalid URLs are handled separately. */ }
  return failed || !safeImageUrl(src) ? <span role="img" aria-label={`${alt} — ${lang === "nl" ? "afbeelding niet beschikbaar" : "image unavailable"}`} className={styles.imageFallback}>{lang === "nl" ? "Foto niet beschikbaar" : "Photo unavailable"}</span> : <Image src={src} alt={alt} fill sizes={sizes} loading="lazy" referrerPolicy="no-referrer" unoptimized={!optimized} onError={() => setFailed(true)} className="object-cover" />;
}
