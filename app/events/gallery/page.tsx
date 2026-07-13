"use client";

import Image from "next/image";
import { FaCamera, FaImage } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";

/**
 * Gallery lives on its own URL so images get indexed for image search
 * (Google Images is a strong SEO channel for "restaurant Amsterdam" queries).
 * Add real photography to /public/gallery/ and swap the placeholder items below.
 */
type GalleryItem = { src: string; alt: string; category: string };

export default function GalleryPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  // Placeholder items — replace src with real photos in /public/gallery/*.
  // Descriptive alt text is critical for SEO and accessibility.
  const items: GalleryItem[] = [
    { src: "/food/burger.png", alt: nl ? "Signatuur gerecht bij The Maison Amsterdam" : "Signature dish at The Maison Amsterdam", category: nl ? "Gerechten" : "Dishes" },
    { src: "/food/pizza.png", alt: nl ? "Chef presenteert gerecht in Amsterdam-Noord" : "Chef presenting a dish in Amsterdam-Noord", category: nl ? "Gerechten" : "Dishes" },
    { src: "/food/wrap.png", alt: nl ? "Verfijnde lunch catering Amsterdam" : "Refined lunch catering Amsterdam", category: nl ? "Lunch" : "Lunch" },
    { src: "/food/coffee.png", alt: nl ? "Espresso en dessert bij The Maison" : "Espresso and dessert at The Maison", category: nl ? "Sfeer" : "Ambiance" },
    { src: "/themaison.png", alt: nl ? "The Maison Amsterdam logo en interieur" : "The Maison Amsterdam logo and interior", category: nl ? "Interieur" : "Interior" },
    { src: "/food/burger.png", alt: nl ? "Verjaardagsdiner opstelling met kaarslicht" : "Birthday dinner setup with candlelight", category: nl ? "Feesten" : "Parties" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "The Maison Amsterdam — Gallery",
    description: nl
      ? "Foto's van The Maison Amsterdam: interieur, gerechten en evenementen."
      : "Photos of The Maison Amsterdam: interior, dishes and events.",
    url: "https://themaison.nl/events/gallery",
    image: items.map((i) => `https://themaison.nl${i.src}`),
  };

  return (
    <div className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(195,144,61,0.14),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {nl ? "Galerij" : "Gallery"}{" "}
            <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {nl ? "Sfeer, gerechten en momenten" : "Ambiance, dishes and moments"}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            {nl
              ? "Een blik binnen The Maison Amsterdam — onze eetzaal, gedekte tafels, verse gerechten en eerdere evenementen."
              : "A look inside The Maison Amsterdam — our dining room, table settings, plated dishes and past events."}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <figure
              key={i}
              className="animate-fade-up group relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-white shadow-lg shadow-emerald-900/5 transition hover:-translate-y-1 hover:shadow-2xl dark:border-emerald-400/10 dark:bg-white/5"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-emerald-500/10 to-amber-500/10">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-contain p-6 transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white backdrop-blur">
                  <FaImage className="text-xs" /> {item.category}
                </span>
              </div>
              <figcaption className="px-5 py-4 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {item.alt}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400 dark:text-slate-500">
          <FaCamera />{" "}
          {nl
            ? "Meer beelden en portfolio op aanvraag — neem contact op voor een uitgebreide selectie."
            : "More imagery and full portfolio on request — contact us for an extended selection."}
        </p>
      </section>

      <EventsContactCta />
    </div>
  );
}
