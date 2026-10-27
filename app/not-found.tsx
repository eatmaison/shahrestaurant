"use client";
import Link from "next/link";
import { useLang } from "./providers";
export default function NotFound() {
  const { lang } = useLang();
  const nl = lang === "nl";
  return <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
    <p className="text-sm font-bold tracking-widest text-emerald-600">SHAH RESTAURANT</p>
    <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{nl ? "Pagina niet gevonden" : "Page not found"}</h1>
    <p className="mt-3 text-slate-600 dark:text-slate-300">{nl ? "Deze pagina bestaat niet meer. Bekijk ons menu of ga naar de startpagina." : "This page is no longer available. Explore our menu or return to the home page."}</p>
    <div className="mt-7 flex flex-wrap justify-center gap-4"><Link href="/" className="rounded-full border px-6 py-3 font-semibold">{nl ? "Naar home" : "Home"}</Link><Link href="/order" className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white">{nl ? "Bekijk het menu" : "View the menu"}</Link></div>
  </section>;
}
