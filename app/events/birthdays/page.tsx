"use client";

import { FaCakeCandles, FaCheck, FaGift, FaGuitar, FaHeart, FaMusic, FaStar, FaUsers, FaUtensils } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";

export default function BirthdaysPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: nl ? "Verjaardagscatering en privéfeesten" : "Birthday & private party catering",
    provider: {
      "@type": "Restaurant",
      name: "The Maison",
      "@id": "https://themaison.nl/#restaurant",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Klaprozenweg 36a",
        postalCode: "1032 KL",
        addressLocality: "Amsterdam",
        addressCountry: "NL",
      },
      telephone: "+31 20 341 2995",
    },
    areaServed: { "@type": "City", name: "Amsterdam" },
    audience: { "@type": "PeopleAudience", audienceType: "Private groups up to 100 guests" },
    url: "https://themaison.nl/events/birthdays",
    description: nl
      ? "Verjaardagen, jubilea en privéfeesten bij The Maison Amsterdam — gepersonaliseerd menu, kaarslicht en toegewijde service."
      : "Birthdays, anniversaries and private parties at The Maison Amsterdam — personalised menus, candlelight and dedicated service.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "45",
      highPrice: "150",
      offerCount: 4,
      availability: "https://schema.org/InStock",
    },
  };

  const packages = [
    {
      Icon: FaCakeCandles,
      title: nl ? "Intieme verjaardag (2–12)" : "Intimate birthday (2–12)",
      price: nl ? "vanaf €55 p.p." : "from €55 p.p.",
      features: [
        nl ? "Driegangenmenu met keuze" : "Three-course tasting menu with choice",
        nl ? "Wijnarrangement optioneel" : "Optional wine pairing",
        nl ? "Persoonlijke welkomstkaart" : "Personal welcome card",
        nl ? "Kaarslicht en bloemstuk" : "Candlelight and floral centrepiece",
      ],
    },
    {
      Icon: FaGift,
      title: nl ? "Middelgroot feest (12–40)" : "Mid-size party (12–40)",
      price: nl ? "vanaf €75 p.p." : "from €75 p.p.",
      features: [
        nl ? "Half-privé sectie in de zaal" : "Semi-private section of the dining room",
        nl ? "Meergangen chef's menu" : "Multi-course chef's menu",
        nl ? "Optionele DJ of live muziek" : "Optional DJ or live music",
        nl ? "Gepersonaliseerd menu met naam" : "Custom menu card with the guest's name",
      ],
    },
    {
      Icon: FaUsers,
      title: nl ? "Groot privéfeest (40–100)" : "Large private event (40–100)",
      price: nl ? "vanaf €95 p.p." : "from €95 p.p.",
      features: [
        nl ? "Volledige zaal exclusief voor u" : "Full venue buyout",
        nl ? "Vijfgangen tastingmenu" : "Five-course tasting menu",
        nl ? "Sommelier ter plaatse" : "Sommelier on site",
        nl ? "Toespraakregeling en podium" : "Speech coordination and stage setup",
      ],
    },
    {
      Icon: FaGuitar,
      title: nl ? "Full production feest" : "Full production party",
      price: nl ? "op maat" : "custom quote",
      features: [
        nl ? "Themasetting en decor" : "Themed styling and decor",
        nl ? "Live band of DJ met licht" : "Live band or DJ with lighting rig",
        nl ? "Cocktailbar en signature drink" : "Cocktail bar with signature drink",
        nl ? "Fotograaf op aanvraag" : "Photographer on request",
      ],
    },
  ];

  const whyChoose = [
    {
      Icon: FaUtensils,
      title: nl ? "Menu op maat" : "Bespoke menu",
      text: nl
        ? "We stemmen elk gerecht af op de gastenlijst — allergieën, diëten en favorieten worden persoonlijk uitgewerkt."
        : "We tailor every dish to your guest list — allergies, diets and favourite flavours worked into the menu personally.",
    },
    {
      Icon: FaMusic,
      title: nl ? "Sfeer die past" : "Atmosphere that fits",
      text: nl
        ? "Van rustige achtergrondmuziek tot een volledige band — de sfeer wordt afgestemd op de leeftijd, cultuur en stijl van uw groep."
        : "From soft background music to a full band — the atmosphere is calibrated to the age, culture and style of your group.",
    },
    {
      Icon: FaHeart,
      title: nl ? "Toegewijde host" : "Dedicated host",
      text: nl
        ? "Vanaf het moment dat u boekt tot de laatste gast vertrekt, is er één contactpersoon die u door alle details begeleidt."
        : "From the moment you book to the last guest leaving, one dedicated host guides you through every detail.",
    },
    {
      Icon: FaStar,
      title: nl ? "Details die worden onthouden" : "Details that get remembered",
      text: nl
        ? "Persoonlijke naamkaartjes, favoriete bloemen, een gesigneerd menu als aandenken — dat maakt het verschil."
        : "Personal place cards, favourite flowers, a signed menu as a keepsake — that is what makes the difference.",
    },
  ];

  const faq = [
    {
      q: nl ? "Kunt u dieetwensen en allergieën aan?" : "Can you accommodate dietary requirements and allergies?",
      a: nl
        ? "Ja. Elke gast kan zijn voorkeuren en allergieën vooraf doorgeven; onze chefs bereiden afzonderlijke gerechten die naadloos passen in het menu."
        : "Yes. Every guest can submit preferences and allergies in advance; our chefs prepare separate dishes that fit seamlessly into the menu.",
    },
    {
      q: nl ? "Mag ik een taart of decoratie meebrengen?" : "May I bring a cake or my own decoration?",
      a: nl
        ? "Uiteraard. Wij regelen taartkosten, bergingsruimte, kaarsen en het bezorgen aan tafel. Decoratie kan vooraf worden aangeleverd."
        : "Absolutely. We handle cakeage, storage, candles and table service. Decorations can be dropped off in advance.",
    },
    {
      q: nl ? "Is het restaurant afsluitbaar voor privégebruik?" : "Can the restaurant be booked exclusively?",
      a: nl
        ? "Ja, wij bieden volledige exclusiviteit voor groepen vanaf 40 personen. Neem contact op voor beschikbaarheid en tarieven."
        : "Yes — full venue exclusivity is available for groups of 40 or more. Contact us for availability and pricing.",
    },
    {
      q: nl ? "Hoe ver van tevoren moet ik boeken?" : "How far in advance should I book?",
      a: nl
        ? "Voor privéfeesten adviseren wij minimaal 4 weken vooruit; voor drukke periodes (december, juni) 8–12 weken."
        : "For private parties we recommend at least 4 weeks ahead; for busy seasons (December, June) 8–12 weeks.",
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
            <span className="h-px w-10 bg-emerald-500/60" /> {nl ? "Verjaardagen & feesten" : "Birthdays & parties"}{" "}
            <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {nl
              ? "Vier uw verjaardag bij The Maison Amsterdam"
              : "Celebrate your birthday at The Maison Amsterdam"}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            {nl
              ? "Mijlpaal-verjaardagen, jubilea, diploma-uitreikingen en privéfeesten — met een gepersonaliseerd menu, kaarslicht en service die uw gasten nog jaren zullen onthouden. Groepen van 2 tot 100 personen."
              : "Milestone birthdays, anniversaries, graduations and private parties — with personalised menus, candlelight and service your guests will remember for years. Groups from 2 to 100."}
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">
            {nl ? "Pakketten" : "Packages"}
          </span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Kies wat past bij uw feest" : "Choose the format that fits your party"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {packages.map(({ Icon, title, price, features }) => (
            <article
              key={title}
              className="animate-fade-up group flex flex-col rounded-3xl border border-emerald-500/15 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                  <Icon />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{price}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    <FaCheck className="mt-1 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">
            {nl ? "Waarom The Maison" : "Why The Maison"}
          </span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Uw feest, tot in de kleinste details" : "Your celebration, down to the smallest detail"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map(({ Icon, title, text }) => (
            <article
              key={title}
              className="animate-fade-up rounded-3xl border border-emerald-500/15 bg-white p-6 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icon />
              </span>
              <h3 className="font-display mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">FAQ</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Veelgestelde vragen" : "Frequently asked questions"}
          </h2>
        </div>
        <div className="mt-8 space-y-3">
          {faq.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-2xl border border-emerald-500/15 bg-white p-5 open:shadow-md dark:border-emerald-400/10 dark:bg-white/5"
            >
              <summary className="cursor-pointer list-none font-display text-base font-bold text-slate-900 dark:text-white">
                {q}
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <EventsContactCta />
    </div>
  );
}
