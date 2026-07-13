"use client";

import Link from "next/link";
import { FaArrowRight, FaAward, FaHeart, FaLeaf, FaStar, FaUtensils } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";

export default function AboutPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": "https://themaison.nl/#restaurant",
    name: "The Maison",
    description: nl
      ? "The Maison is een intiem fine-dining restaurant in Amsterdam-Noord met Europese keuken en zorgvuldig geselecteerde wijnen."
      : "The Maison is an intimate fine-dining restaurant in Amsterdam-Noord serving refined European cuisine with a carefully curated wine list.",
    url: "https://themaison.nl/events/about",
    image: "https://themaison.nl/themaison.png",
    telephone: "+31 20 341 2995",
    priceRange: "€€€",
    servesCuisine: ["European", "Fine Dining", "Grill"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Klaprozenweg 36a",
      postalCode: "1032 KL",
      addressLocality: "Amsterdam",
      addressCountry: "NL",
    },
    hasMenu: "https://themaison.nl/order",
    acceptsReservations: "True",
    openingHours: "Tu-Su 17:00-22:30",
  };

  const pillars = [
    {
      Icon: FaLeaf,
      title: nl ? "Verse, seizoensgebonden ingrediënten" : "Fresh, seasonal ingredients",
      text: nl
        ? "Onze menukaart verandert mee met de seizoenen. Groenten, vis en vlees worden dagelijks geselecteerd bij vertrouwde leveranciers uit Nederland en Europa."
        : "Our menu evolves with the seasons. Vegetables, fish and meats are hand-selected daily from trusted Dutch and European producers.",
    },
    {
      Icon: FaUtensils,
      title: nl ? "Klassieke techniek, moderne uitvoering" : "Classical technique, modern plating",
      text: nl
        ? "Onze chefs zijn opgeleid in de klassieke Europese keuken en brengen die technieken samen met eigentijdse presentatie."
        : "Our chefs are trained in classical European cuisine and pair those techniques with contemporary plating and presentation.",
    },
    {
      Icon: FaHeart,
      title: nl ? "Gastvrijheid als kunstvorm" : "Hospitality as an art form",
      text: nl
        ? "Van een warm welkom tot het laatste glaasje digestief - elk contactmoment is bedoeld om onze gasten thuis te laten voelen."
        : "From a warm welcome to the last digestif, every touchpoint is designed to make our guests feel at home.",
    },
    {
      Icon: FaAward,
      title: nl ? "Detail dat verschil maakt" : "Detail that makes the difference",
      text: nl
        ? "Gepolijste glazen, versgestreken linnen, bloemen op elke tafel - omdat het detail bepaalt wat de avond onvergetelijk maakt."
        : "Polished glassware, freshly pressed linen, flowers on every table - because it is the detail that makes an evening unforgettable.",
    },
  ];

  return (
    <div className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(195,144,61,0.14),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {nl ? "Ons verhaal" : "Our story"}{" "}
            <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {nl ? "Over The Maison Amsterdam" : "About The Maison Amsterdam"}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            {nl
              ? "Een intiem fine-dining restaurant in Amsterdam-Noord waar klassieke Europese keuken en verfijnde seizoensgerechten samenkomen - met impeccabele service en avondambiance."
              : "An intimate fine-dining restaurant in Amsterdam-Noord where classical European cuisine and refined seasonal cooking come together - with impeccable service and evening ambiance."}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <article className="prose prose-slate mx-auto max-w-none dark:prose-invert">
          <div className="rounded-[2rem] border border-emerald-500/20 bg-white p-8 shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#161006] sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              {nl ? "De filosofie" : "The philosophy"}
            </h2>
            <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              {nl
                ? "The Maison is opgericht met één missie: elke gast het gevoel geven dat de avond speciaal voor hen is ontworpen. In onze intieme eetzaal, verlicht door kaarsen en gedimd goud, komen klassieke Europese technieken samen met seizoensgebonden ingrediënten die dagelijks door onze chefs worden geselecteerd."
                : "The Maison was founded with a single mission: to make every guest feel that the evening was designed just for them. In our intimate dining room - lit by candles and dimmed gold - classical European technique meets seasonal ingredients hand-selected by our chefs each day."}
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              {nl
                ? "Onze sommelier begeleidt elke gang met een zorgvuldig samengestelde wijnkeuze - van Bourgogne tot Rioja, van champagne tot Nederlandse mousserende wijn. Het menu verandert mee met de seizoenen, maar de aandacht voor detail blijft altijd hetzelfde."
                : "Our sommelier pairs each course with a carefully considered wine - from Burgundy to Rioja, from champagne to Dutch sparkling. The menu shifts with the seasons, but the attention to detail never wavers."}
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              {nl
                ? "Naast onze dagelijkse gasten organiseren wij privé-evenementen, bruiloftsrecepties, zakelijke diners en bedrijfscatering - omdat gastvrijheid volgens ons overal thuishoort waar mensen iets bijzonders willen vieren."
                : "Beyond nightly diners, we host private events, wedding receptions, corporate dinners and daily company catering - because hospitality, we believe, belongs wherever people want to celebrate something meaningful."}
            </p>
          </div>
        </article>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {pillars.map(({ Icon, title, text }) => (
            <article
              key={title}
              className="animate-fade-up group flex gap-5 rounded-3xl border border-emerald-500/15 bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                <Icon />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <figure className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-[#171208] via-[#221a0c] to-[#2c2110] p-8 text-center text-white sm:p-12">
          <span className="mx-auto flex justify-center text-amber-300">
            {[1, 2, 3, 4, 5].map((s) => (
              <FaStar key={s} className="text-sm" />
            ))}
          </span>
          <blockquote className="font-display mt-4 text-lg italic leading-8 text-stone-100 sm:text-xl">
            {nl
              ? "“Elke gast is een uitgenodigde vriend. Onze taak is niet alleen om ze te voeden, maar om ze het gevoel te geven dat de avond helemaal om hen draait.”"
              : "“Every guest is an invited friend. Our job isn't just to feed them - it's to make them feel the whole evening was built around them.”"}
          </blockquote>
          <figcaption className="mt-5 text-xs uppercase tracking-[0.3em] text-emerald-300/90">
            - The Maison
          </figcaption>
        </figure>
      </section>

      {/* Quick links */}
      <section className="mx-auto max-w-4xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/events/gallery"
            className="group flex items-center justify-between rounded-2xl border border-emerald-500/15 bg-white p-4 transition hover:border-emerald-500/40 dark:border-emerald-400/10 dark:bg-white/5"
          >
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {nl ? "Galerij" : "Gallery"}
            </span>
            <FaArrowRight className="text-emerald-600 transition group-hover:translate-x-1 dark:text-emerald-400" />
          </Link>
          <Link
            href="/reservations"
            className="group flex items-center justify-between rounded-2xl border border-emerald-500/15 bg-white p-4 transition hover:border-emerald-500/40 dark:border-emerald-400/10 dark:bg-white/5"
          >
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {nl ? "Reserveren" : "Reservations"}
            </span>
            <FaArrowRight className="text-emerald-600 transition group-hover:translate-x-1 dark:text-emerald-400" />
          </Link>
          <Link
            href="/order"
            className="group flex items-center justify-between rounded-2xl border border-emerald-500/15 bg-white p-4 transition hover:border-emerald-500/40 dark:border-emerald-400/10 dark:bg-white/5"
          >
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {nl ? "Bekijk menu" : "View menu"}
            </span>
            <FaArrowRight className="text-emerald-600 transition group-hover:translate-x-1 dark:text-emerald-400" />
          </Link>
        </div>
      </section>

      <EventsContactCta />
    </div>
  );
}
