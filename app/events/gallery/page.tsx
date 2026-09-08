"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaCamera, FaImage } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";
import type { GalleryImage } from "../../lib/types";

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

  // Admin-uploaded photos (stored in DigitalOcean Spaces, managed in /admin).
  const [uploaded, setUploaded] = useState<GalleryImage[]>([]);
  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.images)) setUploaded(d.images);
      })
      .catch(() => {});
  }, []);

  const cat = {
    dishes: nl ? "Gerechten" : "Dishes",
    interior: nl ? "Interieur" : "Interior",
    bar: nl ? "Bar & Drankjes" : "Bar & Drinks",
    ambiance: nl ? "Sfeer" : "Ambiance",
  };

  const items: GalleryItem[] = [
    // Newest admin uploads first, then the built-in photography.
    ...uploaded.map((g): GalleryItem => {
      const label =
        ({ dishes: cat.dishes, interior: cat.interior, bar: cat.bar, ambiance: cat.ambiance } as Record<string, string>)[
          g.category
        ] ?? (g.category || cat.ambiance);
      return {
        src: g.url,
        alt: (nl ? g.altNl || g.alt : g.alt) || (nl ? "Foto van Shah Restaurant Amsterdam" : "Photo of Shah Restaurant Amsterdam"),
        category: label,
        portrait: g.portrait,
      };
    }),
    { src: "/photos/687A0402.jpeg", alt: nl ? "Gedekte tafel met naan, gouden bestek en dipsauzen" : "Table setting with naan, golden cutlery and dipping sauces", category: cat.dishes },
    { src: "/photos/687A0210.jpeg", alt: nl ? "Modern restaurantinterieur met een warme sfeer" : "Modern restaurant interior with a warm atmosphere", category: cat.interior },
    { src: "/photos/687A0211.jpeg", alt: nl ? "Seekh kebab van lamsvlees met yoghurtsaus en verse kruiden" : "Lamb seekh kebab with yogurt sauce and fresh herbs", category: cat.dishes },
    { src: "/photos/687A0260.jpeg", alt: nl ? "Gelaagde signatuurcocktail met granaatappel" : "Layered signature cocktail with pomegranate", category: cat.bar, portrait: true },
    { src: "/photos/687A0216.jpeg", alt: nl ? "Goudgeroosterde paneer tikka met limoen" : "Golden-charred paneer tikka with lime", category: cat.dishes },
    { src: "/photos/687A0321.jpeg", alt: nl ? "Verfijnd geplateerd tandoori gerecht" : "Refined plated tandoori dish", category: cat.dishes },
    { src: "/photos/687A0090.jpeg", alt: nl ? "Zwevende wijnfles aan de bar van Shah Restaurant" : "Floating wine bottle at the bar of Shah Restaurant", category: cat.bar },
    { src: "/photos/687A0336.jpeg", alt: nl ? "Een stijlvolle en gastvrije sfeer om samen te genieten" : "A stylish and welcoming atmosphere to enjoy together", category: cat.dishes },
    { src: "/photos/687A0343.jpeg", alt: nl ? "Stijlvolle bar waar cocktails en gastvrijheid samenkomen" : "Stylish bar where cocktails and hospitality come together", category: cat.bar },
    { src: "/photos/687A0412.jpeg", alt: nl ? "Samen genieten van curry, rijst en tandoori gerechten" : "Sharing curry, rice and tandoori dishes together", category: cat.ambiance },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Shah Restaurant Amsterdam - Gallery",
    description: nl
      ? "Foto's van Shah Restaurant Amsterdam: interieur, gerechten en evenementen."
      : "Photos of Shah Restaurant Amsterdam: interior, dishes and events.",
    url: "https://shahrestaurant.nl/events/gallery",
    image: items.map((i) => (i.src.startsWith("http") ? i.src : `https://shahrestaurant.nl${i.src}`)),
  };

  return (
    <div className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(196,154,58,0.12),transparent_65%)]" />
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
              ? "Een blik binnen Shah Restaurant Amsterdam - onze eetzaal, gedekte tafels, verse tandoori gerechten en eerdere evenementen."
              : "A look inside Shah Restaurant Amsterdam - our dining room, table settings, fresh tandoori dishes and past events."}
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
