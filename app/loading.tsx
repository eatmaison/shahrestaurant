"use client";
import { useLang } from "./providers";
export default function Loading() {
  const { lang } = useLang();
  return <div role="status" aria-busy="true" className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6">
    <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />{lang === "nl" ? "Laden…" : "Loading…"}</div>
  </div>;
}
