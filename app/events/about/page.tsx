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
    "@id": "https://thetandoorcompany.nl/#restaurant",
    name: "The Tandoor Company",
    description: nl
      ? "The Tandoor Company is een authentiek Indiaas familierestaurant in Amsterdam-Noord met tandoori grills, rijke curry's en verse naan."
      : "The Tandoor Company is an authentic family-run Indian restaurant in Amsterdam-Noord serving tandoori grills, rich curries and fresh naan.",
    url: "https://thetandoorcompany.nl/events/about",
    image: "https://thetandoorcompany.nl/tandoorcompany.png",
    telephone: "+31 20 341 2995",
    priceRange: "€€",
    servesCuisine: ["Indian", "Tandoori", "Curry", "Biryani"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Klaprozenweg 36a",
      postalCode: "1032 KL",
      addressLocality: "Amsterdam",
      addressCountry: "NL",
    },
    hasMenu: "https://thetandoorcompany.nl/order",
    acceptsReservations: "True",
    openingHours: "Tu-Su 17:00-22:30",
  };

  const pillars = [
    {
      Icon: FaLeaf,
      title: nl ? "Verse, aromatische ingrediënten" : "Fresh, aromatic ingredients",
      text: nl
        ? "Onze kruiden worden dagelijks vers gemalen en onze groenten, vlees en vis zorgvuldig geselecteerd bij vertrouwde leveranciers - de basis van elke authentieke curry."
        : "Our spices are ground fresh daily and our vegetables, meat and fish hand-selected from trusted suppliers - the foundation of every authentic curry.",
    },
    {
      Icon: FaUtensils,
      title: nl ? "Traditionele tandoor, eerlijke techniek" : "Traditional tandoor, honest technique",
      text: nl
        ? "Onze chefs zijn opgeleid in de klassieke Indiase keuken - van vijfsterrenhotels in India tot meer dan 32 jaar horeca-ervaring in Nederland."
        : "Our chefs are trained in classical Indian cooking - from five-star hotel kitchens in India to more than 32 years of hospitality experience in the Netherlands.",
    },
    {
      Icon: FaHeart,
      title: nl ? "Gastvrijheid als familietraditie" : "Hospitality as a family tradition",
      text: nl
        ? "Van een warm welkom tot de laatste chai - elk contactmoment is bedoeld om onze gasten als familie te laten voelen."
        : "From a warm welcome to the last chai, every touchpoint is designed to make our guests feel like family.",
    },
    {
      Icon: FaAward,
      title: nl ? "Bewezen vakmanschap" : "Proven craftsmanship",
      text: nl
        ? "Meer dan 28 restaurants opgezet, 40+ koks opgeleid en gerechten geserveerd aan Bollywoodsterren - dat vakmanschap proeft u op uw bord."
        : "More than 28 restaurants opened, 40+ chefs trained and dishes served to Bollywood stars - craftsmanship you can taste on every plate.",
    },
  ];

  return (
    <div className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(217,126,38,0.16),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {nl ? "Ons verhaal" : "Our story"}{" "}
            <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {nl ? "Over The Tandoor Company Amsterdam" : "About The Tandoor Company Amsterdam"}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            {nl
              ? "Een authentiek Indiaas familierestaurant in Amsterdam-Noord waar traditionele tandoori-technieken en aromatische kruiden samenkomen - met warme gastvrijheid en een bijzonder familieverhaal."
              : "An authentic family-run Indian restaurant in Amsterdam-Noord where traditional tandoori techniques and aromatic spices come together - with warm hospitality and a remarkable family story."}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <article className="prose prose-slate mx-auto max-w-none dark:prose-invert">
          <div className="rounded-[2rem] border border-emerald-500/20 bg-white p-8 shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#170d04] sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              {nl ? "Een familieverhaal van passie voor smaak" : "A family story of passion for flavour"}
            </h2>
            <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              {nl
                ? "Achter onze keuken schuilt een bijzonder verhaal. Onze vader heeft meer dan 32 jaar ervaring in de horeca in Nederland en werkte daarvoor 8 jaar in de keukens van vijfsterrenhotels in India. Gedurende zijn carrière heeft hij meer dan 28 restaurants voor anderen opgezet en meer dan 40 koks opgeleid in de kunst van de Indiase keuken."
                : "Behind our kitchen lies a remarkable story. Our father has more than 32 years of hospitality experience in the Netherlands, and before that spent 8 years in the kitchens of five-star hotels in India. Throughout his career he opened more than 28 restaurants for others and trained over 40 chefs in the art of Indian cooking."}
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              {nl
                ? "Zijn gerechten brachten hem zelfs in de keukens van Bollywoodsterren zoals Amitabh Bachchan. Vandaag zetten wij zijn passie voort - samen met zijn zonen is het eindelijk tijd voor iets van onszelf: The Tandoor Company."
                : "His dishes even carried him into the kitchens of Bollywood stars such as Amitabh Bachchan. Today we continue his passion - together with his sons, it is finally time for something of our own: The Tandoor Company."}
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              {nl
                ? "Naast onze dagelijkse gasten organiseren wij privé-evenementen, bruiloftsrecepties, zakelijke diners en bedrijfscatering - omdat de rijke smaken van India volgens ons overal thuishoren waar mensen iets bijzonders willen vieren."
                : "Beyond nightly diners, we host private events, wedding receptions, corporate dinners and daily company catering - because the rich flavours of India, we believe, belong wherever people want to celebrate something meaningful."}
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
        <figure className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-[#241204] to-[#170d04] p-8 text-center text-white shadow-2xl shadow-emerald-900/30 sm:p-12">
          <div className="spice-dots pointer-events-none absolute inset-0 opacity-25" />
          <span className="mx-auto flex justify-center text-amber-300">
            {[1, 2, 3, 4, 5].map((s) => (
              <FaStar key={s} className="text-sm" />
            ))}
          </span>
          <blockquote className="font-display mt-4 text-lg italic leading-8 text-stone-100 sm:text-xl">
            {nl
              ? "“Goed eten begint met passie, traditie en aandacht voor detail. Elke gast is een uitgenodigde vriend aan onze familietafel.”"
              : "“Good food begins with passion, tradition and attention to detail. Every guest is an invited friend at our family table.”"}
          </blockquote>
          <figcaption className="mt-5 text-xs uppercase tracking-[0.3em] text-emerald-300/90">
            - The Tandoor Company
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
