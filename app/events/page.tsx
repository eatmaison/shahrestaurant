"use client";

import Link from "next/link";
import {
  FaArrowRight,
  FaBriefcase,
  FaCakeCandles,
  FaChampagneGlasses,
  FaEnvelope,
  FaImages,
  FaLocationDot,
  FaMugSaucer,
  FaPhone,
  FaUsers,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { useLang } from "../providers";

export default function EventsHubPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  const overline = nl ? "Evenementen & Catering" : "Events & Catering";
  const title = nl ? "Momenten die het vieren waard zijn" : "Occasions worth celebrating";
  const subtitle = nl
    ? "Van intieme verjaardagen en zakelijke lunches tot volledige bruiloftsrecepties - Shah Restaurant verzorgt onvergetelijke Indiase feesten bij ons of op uw locatie in Amsterdam."
    : "From intimate birthdays and executive lunches to full wedding receptions - Shah Restaurant creates memorable Indian feasts at our venue or yours in Amsterdam.";
  const capacity = nl ? "Tot 100 gasten" : "Up to 100 guests";
  const ctaTitle = nl ? "Klaar om te plannen?" : "Ready to plan your event?";
  const ctaText = nl
    ? "Deel uw wensen en ons events-team komt binnen één werkdag terug met een voorstel op maat."
    : "Share your vision and our events team will reply within one working day with a tailored proposal.";
  const ctaContact = nl ? "Neem contact op" : "Contact our events team";
  const ctaReserve = nl ? "Reserveer een tafel" : "Reserve a table";

  const cards = [
    {
      href: "/events/about",
      Icon: FaWandMagicSparkles,
      title: nl ? "Over Shah Restaurant" : "About Shah Restaurant",
      text: nl
        ? "Ontdek ons familieverhaal, onze keuken en waarom Amsterdam ons kiest voor bijzondere avonden."
        : "Discover our family story, our kitchen and why Amsterdam chooses us for special occasions.",
    },
    {
      href: "/events/gallery",
      Icon: FaImages,
      title: nl ? "Galerij" : "Gallery",
      text: nl
        ? "Sfeerbeelden van onze zaal, gedekte tafels, tandoori gerechten en eerdere evenementen."
        : "Atmospheric images of our dining room, table settings, tandoori dishes and past events.",
    },
    {
      href: "/events/birthdays",
      Icon: FaCakeCandles,
      title: nl ? "Verjaardagen & feesten" : "Birthdays & parties",
      text: nl
        ? "Mijlpaal-verjaardagen, jubilea en privéfeesten met gepersonaliseerd menu en service."
        : "Milestone birthdays, anniversaries and private parties with personalised menus and dedicated service.",
    },
    {
      href: "/events/celebrations",
      Icon: FaChampagneGlasses,
      title: nl ? "Vieringen & bruiloften" : "Celebrations & weddings",
      text: nl
        ? "Bruiloftsdiners, recepties, gala-avonden en verlovingen - plechtig, elegant, onvergetelijk."
        : "Wedding dinners, receptions, gala evenings and engagements - poised, elegant, unforgettable.",
    },
    {
      href: "/events/company-catering",
      Icon: FaBriefcase,
      title: nl ? "Bedrijfscatering" : "Company catering",
      text: nl
        ? "Zakelijke diners, klantrecepties, productlanceringen en kwartaalvieringen op locatie of bij ons."
        : "Corporate dinners, client receptions, product launches and quarterly celebrations - on-site or at our venue.",
    },
    {
      href: "/events/company-lunches",
      Icon: FaMugSaucer,
      title: nl ? "Bedrijfslunches" : "Company lunches",
      text: nl
        ? "Wekelijkse bezorgde lunches voor kantoren in Amsterdam. Vers, aromatisch en maatwerk."
        : "Weekly delivered lunches for Amsterdam offices. Fresh, aromatic and tailored to your team.",
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(217,126,38,0.16),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {overline} <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">{subtitle}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <FaUsers /> {capacity}
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ href, Icon, title: cardTitle, text }) => (
            <Link
              key={href}
              href={href}
              className="animate-fade-up group flex flex-col rounded-3xl border border-emerald-500/15 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                <Icon />
              </span>
              <h2 className="font-display mt-5 text-lg font-bold text-slate-900 dark:text-white">{cardTitle}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition group-hover:gap-3.5 dark:text-emerald-400">
                {nl ? "Meer" : "Learn more"} <FaArrowRight />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-[#1a160e] to-[#12100c] p-8 text-center text-white shadow-2xl shadow-emerald-900/30 sm:p-12">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-200">{ctaText}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:info@shahrestaurant.nl"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500"
            >
              <FaEnvelope /> {ctaContact} <FaArrowRight />
            </a>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-300"
            >
              {ctaReserve}
            </Link>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-xs leading-6 text-stone-300">
            <p className="flex items-center justify-center gap-2">
              <FaLocationDot className="text-emerald-300" /> Klaprozenweg 36a, 1032 KL Amsterdam
            </p>
            <p className="mt-1.5 flex items-center justify-center gap-2">
              <FaPhone className="text-emerald-300" />
              <a href="tel:+31203412995" className="transition hover:text-emerald-300">
                +31 20 341 2995
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
