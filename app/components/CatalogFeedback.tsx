"use client";
import { useLang, useStore } from "../providers";

export function CatalogFeedback() {
  const { lang } = useLang();
  const { catalogStatus, products, refresh } = useStore();
  if (catalogStatus === "ready") return null;
  const nl = lang === "nl";
  return <div role="status" className="my-3 flex min-h-12 flex-wrap items-center gap-3 rounded-xl border border-emerald-500/20 px-4 py-3 text-sm">
    <p>{catalogStatus === "loading" ? (nl ? "Menukaart laden…" : "Loading the menu…") : products.length ? (nl ? "De menukaart kon niet worden ververst." : "The menu could not be refreshed.") : (nl ? "De menukaart kon niet worden geladen. Probeer opnieuw of bel ons." : "The menu could not be loaded. Try again or call us.")}</p>
    {catalogStatus === "error" && <><button type="button" onClick={() => void refresh()} className="min-h-11 rounded-full border px-4 font-semibold">{nl ? "Opnieuw proberen" : "Try again"}</button><a href="tel:+31203412995" className="underline">+31 20 341 2995</a></>}
  </div>;
}
