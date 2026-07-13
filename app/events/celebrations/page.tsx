"use client";

import Link from "next/link";
import { FaArrowRight, FaChampagneGlasses, FaCheck, FaGem, FaHandshake, FaHeart, FaMusic, FaRing, FaStar } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";

export default function CelebrationsPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: nl ? "Bruiloftscatering en vieringen" : "Wedding and celebration catering",
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
    audience: { "@type": "PeopleAudience", audienceType: "Wedding parties and celebrations up to 100 guests" },
    url: "https://themaison.nl/events/celebrations",
    description: nl
      ? "Bruiloftsrecepties, gala-avonden, jubilea en verlovingsdiners bij The Maison Amsterdam."
      : "Wedding receptions, gala evenings, anniversaries and engagement dinners at The Maison Amsterdam.",
  };

  const services = [
    {
      Icon: FaRing,
      title: nl ? "Bruiloftsrecepties" : "Wedding receptions",
      text: nl
        ? "Volledig verzorgde bruiloftsrecepties met chef's menu, sommelier, dansvloer en gepersonaliseerd decor - een avond die uw dag onvergetelijk maakt."
        : "Fully coordinated wedding receptions with chef's menu, sommelier, dance floor and personalised decor - an evening that seals the day.",
    },
    {
      Icon: FaHeart,
      title: nl ? "Verlovingsdiners" : "Engagement dinners",
      text: nl
        ? "Intieme verlovingsdiners voor 20 tot 200 gasten - kaarslicht, gepersonaliseerd menu en de perfecte plek voor de belangrijkste 'ja' van uw leven."
        : "Intimate engagement dinners for 20 to 200 guests - candlelight, custom menu and the perfect setting for the most important 'yes' of your life."
    },
    {
      Icon: FaChampagneGlasses,
      title: nl ? "Jubilea" : "Anniversaries",
      text: nl
        ? "Van 25e trouwdag tot bedrijfsjubileum - wij creëren een avond die de mijlpaal met stijl viert."
        : "From silver wedding anniversaries to milestone corporate jubilees - we build an evening that honours the milestone in style.",
    },
    {
      Icon: FaGem,
      title: nl ? "Gala-avonden" : "Gala evenings",
      text: nl
        ? "Formele gala-avonden met welkomstcocktail, meergangenmenu, live entertainment en volledige technische ondersteuning."
        : "Formal gala evenings with welcome cocktail, multi-course menu, live entertainment and full technical support.",
    },
    {
      Icon: FaHandshake,
      title: nl ? "Repetitiediners" : "Rehearsal dinners",
      text: nl
        ? "Rustige repetitiediners in halfprivé setting - ideaal om familie en getuigen samen te brengen de avond vóór de grote dag."
        : "Relaxed rehearsal dinners in a semi-private setting - perfect for bringing family and witnesses together the night before the big day.",
    },
    {
      Icon: FaMusic,
      title: nl ? "Themafeesten & seizoensvieringen" : "Themed parties & seasonal celebrations",
      text: nl
        ? "Kerstmis, oudejaarsavond, valentijn, midzomer - themafeesten met bijpassend menu, styling en muziek."
        : "Christmas, New Year's Eve, Valentine's, midsummer - themed parties with matching menu, styling and music.",
    },
  ];

  const process = [
    {
      step: "01",
      title: nl ? "Kennismakingsgesprek" : "Discovery call",
      text: nl
        ? "Een gratis gesprek van 30 minuten om uw visie, gastenaantal, budget en datum te bespreken."
        : "A free 30-minute call to discuss your vision, guest count, budget and date.",
    },
    {
      step: "02",
      title: nl ? "Voorstel op maat" : "Tailored proposal",
      text: nl
        ? "Binnen één werkdag ontvangt u een menuvoorstel, wijnadvies en volledige kostenberekening."
        : "Within one working day you receive a menu proposal, wine recommendations and a full costing.",
    },
    {
      step: "03",
      title: nl ? "Proefdiner" : "Tasting session",
      text: nl
        ? "Wij organiseren een privéproeverij voor u en (indien gewenst) uw partner of ouders - zodat elk detail vaststaat."
        : "We arrange a private tasting for you and (if you wish) your partner or parents - so every detail is confirmed.",
    },
    {
      step: "04",
      title: nl ? "Uitvoering" : "Execution",
      text: nl
        ? "Op de avond zelf zorgt ons event-team voor alles: opbouw, service, muziek, timing en afbouw - u geniet."
        : "On the night itself, our event team handles everything: setup, service, music, timing and breakdown - you enjoy.",
    },
  ];

  const testimonials = [
    {
      quote: nl
        ? "De perfecte bruiloftsreceptie - elk detail was verzorgd en het menu was ongelooflijk. Onze gasten praten er nog steeds over."
        : "The perfect wedding reception - every detail was taken care of and the menu was extraordinary. Our guests still talk about it.",
      name: "Marc & Julie",
      event: nl ? "Bruiloft, 82 gasten" : "Wedding, 82 guests",
    },
    {
      quote: nl
        ? "Ons 25-jarig jubileum werd magisch. De sommelier stelde een wijnkaart samen die ons huwelijksjaar weerspiegelde."
        : "Our 25-year anniversary was made magical. The sommelier created a wine list that reflected our marriage year.",
      name: "Sophie & Robert",
      event: nl ? "Zilveren jubileum, 40 gasten" : "Silver anniversary, 40 guests",
    },
    {
      quote: nl
        ? "Verloving in stijl - kaarsen, bloemen, een gepersonaliseerd menu. Ze zei ja."
        : "Engagement in style - candles, flowers, a personalised menu. She said yes.",
      name: "Alexander",
      event: nl ? "Verloving, 2 gasten" : "Engagement, 2 guests",
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
            <span className="h-px w-10 bg-emerald-500/60" /> {nl ? "Vieringen & bruiloften" : "Celebrations & weddings"}{" "}
            <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {nl
              ? "Bruiloften & vieringen bij The Maison Amsterdam"
              : "Weddings & celebrations at The Maison Amsterdam"}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            {nl
              ? "Bruiloftsrecepties, verlovingsdiners, gala-avonden en jubilea - elegant, plechtig en persoonlijk. Voor 60 tot 200 gasten in Amsterdam-Noord of op uw locatie."
              : "Wedding receptions, engagement dinners, gala evenings and anniversaries - elegant, poised and personal. For 60 to 200 guests in Amsterdam-Noord or at your venue."}
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ Icon, title, text }) => (
            <article
              key={title}
              className="animate-fade-up group flex flex-col rounded-3xl border border-emerald-500/15 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                <Icon />
              </span>
              <h2 className="font-display mt-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p>
              <Link
                href="/reservations"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                {nl ? "Reserveer nu" : "Book now"} <FaArrowRight className="text-[0.6rem]" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{nl ? "Hoe wij werken" : "How we work"}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Van visie tot vlekkeloze uitvoering" : "From vision to flawless execution"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {process.map(({ step, title, text }) => (
            <article
              key={step}
              className="animate-fade-up rounded-3xl border border-emerald-500/15 bg-white p-6 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="font-display text-3xl font-bold text-emerald-600/40 dark:text-emerald-400/40">
                {step}
              </span>
              <h3 className="font-display mt-3 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-[#171208] via-[#221a0c] to-[#2c2110] p-8 text-white sm:p-10">
          <span className="lux-overline text-emerald-300/90">{nl ? "Standaard inbegrepen" : "Standard inclusions"}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
            {nl ? "Alles wat u nodig heeft, in één handdruk" : "Everything you need, in one handshake"}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              nl ? "Dedicated event manager" : "Dedicated event manager",
              nl ? "Menu-ontwerp op maat" : "Custom-designed menu card",
              nl ? "Bloemstukken op elke tafel" : "Fresh flowers on every table",
              nl ? "Toespraken & timing coördinatie" : "Speech and timing coordination",
              nl ? "Muziek/DJ setup indien gewenst" : "Music/DJ setup if requested",
              nl ? "Parkeer- en garderobe-assistentie" : "Parking and cloakroom assistance",
            ].map((item) => (
              <p key={item} className="flex items-start gap-2 text-sm leading-7 text-stone-200">
                <FaCheck className="mt-1 shrink-0 text-emerald-300" /> {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">
            {nl ? "Ervaringen" : "Testimonials"}
          </span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Wat onze gasten zeggen" : "What our guests say"}
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-3xl border border-emerald-500/15 bg-white p-6 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar key={s} className="text-xs" />
                ))}
              </span>
              <blockquote className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">“{t.quote}”</blockquote>
              <figcaption className="mt-4 border-t border-slate-200 pt-3 text-xs dark:border-white/10">
                <span className="block font-bold text-slate-900 dark:text-white">{t.name}</span>
                <span className="text-slate-500 dark:text-slate-400">{t.event}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <EventsContactCta />
    </div>
  );
}
