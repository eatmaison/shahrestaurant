"use client";

import Image from "next/image";
import { FaCamera, FaImage } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";

/**
 * Gallery lives on its own URL so images get indexed for image search
 * (Google Images is a strong SEO channel for "restaurant Amsterdam" queries).
 * Real photography lives in /public/photos/. Descriptive alt text is
 * critical for SEO and accessibility.
 */
type GalleryItem = { src: string; alt: string; category: string; portrait?: boolean };

export default function GalleryPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  const cat = {
    dishes: nl ? "Gerechten" : "Dishes",
    interior: nl ? "Interieur" : "Interior",
    bar: nl ? "Bar & Drankjes" : "Bar & Drinks",
    ambiance: nl ? "Sfeer" : "Ambiance",
  };

  const items: GalleryItem[] = [
    { src: "/photos/687A0402.jpeg", alt: nl ? "Curry in koperen pan met bijgerechten en kruiden bij The Tandoor Company Amsterdam" : "Curry in a copper pot with sides and spices at The Tandoor Company Amsterdam", category: cat.ambiance },
    { src: "/photos/687A0341.jpeg", alt: nl ? "Interieur met fluwelen zitjes en messing details in Amsterdam-Noord" : "Interior with velvet seating and brass details in Amsterdam-Noord", category: cat.interior, portrait: true },
    { src: "/photos/687A0210.jpeg", alt: nl ? "Verse tandoori kip met limoen, net uit de tandoor" : "Fresh tandoori chicken with lime, straight from the tandoor", category: cat.dishes },
    { src: "/photos/687A0387.jpeg", alt: nl ? "Signatuurcocktail met verse naan op de achtergrond" : "Signature cocktail with fresh naan in the background", category: cat.bar, portrait: true },
    { src: "/photos/687A0211.jpeg", alt: nl ? "Seekh kebab van lamsvlees met yoghurtsaus en verse kruiden" : "Lamb seekh kebab with yogurt sauce and fresh herbs", category: cat.dishes },
    { src: "/photos/687A0410.jpeg", alt: nl ? "Gedekte tafel met naan, gouden bestek en dipsauzen" : "Table setting with naan, golden cutlery and dipping sauces", category: cat.ambiance },
    { src: "/photos/687A0260.jpeg", alt: nl ? "Gelaagde signatuurcocktail met granaatappel" : "Layered signature cocktail with pomegranate", category: cat.bar, portrait: true },
    { src: "/photos/687A0216.jpeg", alt: nl ? "Goudgeroosterde paneer tikka met limoen" : "Golden-charred paneer tikka with lime", category: cat.dishes },
    { src: "/photos/687A0345.jpeg", alt: nl ? "Raampartij met fluwelen stoelen en uitzicht op Amsterdam-Noord" : "Floor-to-ceiling windows with velvet chairs overlooking Amsterdam-Noord", category: cat.interior, portrait: true },
    { src: "/photos/687A0218.jpeg", alt: nl ? "Tandoori vis, elegant geserveerd met garnering" : "Tandoori fish, elegantly plated with garnish", category: cat.dishes },
    { src: "/photos/687A0310.jpeg", alt: nl ? "Eetzaal met warme verlichting en gedekte tafels" : "Dining room with warm lighting and set tables", category: cat.interior },
    { src: "/photos/687A0321.jpeg", alt: nl ? "Verfijnd geplateerd tandoori gerecht" : "Refined plated tandoori dish", category: cat.dishes },
    { src: "/photos/687A0090.jpeg", alt: nl ? "Zwevende wijnfles aan de bar van The Tandoor Company" : "Floating wine bottle at the bar of The Tandoor Company", category: cat.bar },
    { src: "/photos/687A0336.jpeg", alt: nl ? "Tandoori hoofdgerecht, vers bereid door onze chefs" : "Tandoori main course, freshly prepared by our chefs", category: cat.dishes },
    { src: "/photos/687A0316.jpeg", alt: nl ? "Sfeervolle eetzaal van The Tandoor Company Amsterdam-Noord" : "Atmospheric dining room of The Tandoor Company Amsterdam-Noord", category: cat.interior },
    { src: "/photos/687A0225.jpeg", alt: nl ? "Gegrilde tandoori specialiteit met saus en garnering" : "Charred tandoori specialty with sauce and garnish", category: cat.dishes },
    { src: "/photos/687A0343.jpeg", alt: nl ? "Modern restaurantinterieur met warme sfeer" : "Modern restaurant interior with a warm atmosphere", category: cat.interior },
    { src: "/photos/687A0412.jpeg", alt: nl ? "Samen genieten van curry, rijst en tandoori gerechten" : "Sharing curry, rice and tandoori dishes together", category: cat.ambiance },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "The Tandoor Company Amsterdam - Gallery",
    description: nl
      ? "Foto's van The Tandoor Company Amsterdam: interieur, gerechten en evenementen."
      : "Photos of The Tandoor Company Amsterdam: interior, dishes and events.",
    url: "https://thetandoorcompany.nl/events/gallery",
    image: items.map((i) => `https://thetandoorcompany.nl${i.src}`),
  };

  return (
    <div className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(217,126,38,0.16),transparent_65%)]" />
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
              ? "Een blik binnen The Tandoor Company Amsterdam - onze eetzaal, gedekte tafels, verse tandoori gerechten en eerdere evenementen."
              : "A look inside The Tandoor Company Amsterdam - our dining room, table settings, fresh tandoori dishes and past events."}
          </p>
        </div>
      </section>

      {/* Masonry grid - portrait photos keep their tall ratio */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <figure
              key={item.src}
              className="animate-fade-up group relative mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-emerald-500/15 bg-white shadow-lg shadow-emerald-900/5 transition hover:-translate-y-1 hover:shadow-2xl dark:border-emerald-400/10 dark:bg-white/5"
              style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}
            >
              <div
                className={`relative w-full overflow-hidden bg-gradient-to-br from-emerald-500/10 to-amber-500/10 ${
                  item.portrait ? "aspect-[3/4]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
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
            ? "Meer beelden en portfolio op aanvraag - neem contact op voor een uitgebreide selectie."
            : "More imagery and full portfolio on request - contact us for an extended selection."}
        </p>
      </section>

      <EventsContactCta />
    </div>
  );
}
