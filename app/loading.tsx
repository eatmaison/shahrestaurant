"use client";
import { useLang } from "./providers";
import { BrandLogo } from "./components/BrandLogo";
export default function Loading() {
  const { lang } = useLang();
  return <div role="status" aria-busy="true" style={{ minHeight: "calc(100svh - var(--site-header-height, 102px))" }} className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-6">
    <BrandLogo variant="wordmark" alt="" eager />
    <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />{lang === "nl" ? "Laden…" : "Loading…"}</div>
  </div>;
}
