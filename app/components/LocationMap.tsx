"use client";
import { useState } from "react";
import { useLang } from "../providers";

export function LocationMap() {
  const { lang } = useLang(); const [opened, setOpened] = useState(false);
  const nl = lang === "nl";
  if (opened) return <iframe src="https://www.google.com/maps?q=Klaprozenweg%2036a%2C%201032%20KL%20Amsterdam&output=embed" width="100%" height="520" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer" className="block h-full min-h-[380px] w-full" title={nl ? "Locatie van Shah Restaurant op Google Maps" : "Shah Restaurant location on Google Maps"} />;
  return <div className="flex min-h-[380px] flex-col items-center justify-center gap-5 bg-emerald-950/5 px-6 pb-28 pt-16 text-center dark:bg-emerald-950/20">
    <p className="text-xl font-semibold">Klaprozenweg 36a<br /><span className="text-sm font-normal">1032 KL Amsterdam-Noord</span></p>
    <button type="button" onClick={() => setOpened(true)} className="min-h-11 rounded-full border border-emerald-600 px-6 py-3 font-semibold">{nl ? "Google Maps-kaart tonen" : "Show Google Maps"}</button>
    <a href="https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a+1032+KL+Amsterdam" target="_blank" rel="noopener noreferrer" className="underline">{nl ? "Routebeschrijving openen" : "Open directions"}</a>
  </div>;
}
