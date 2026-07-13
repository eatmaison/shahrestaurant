"use client";

import Link from "next/link";
import {
  FaArrowRight,
  FaBellConcierge,
  FaBriefcase,
  FaCakeCandles,
  FaChampagneGlasses,
  FaEnvelope,
  FaLocationDot,
  FaPhone,
  FaUsers,
  FaUtensils,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { useLang } from "../providers";

export default function EventsPage() {
  const { t } = useLang();

  const sections = [
    { Icon: FaUtensils, title: t.events.cateringTitle, text: t.events.cateringText },
    { Icon: FaBriefcase, title: t.events.companyCateringTitle, text: t.events.companyCateringText },
    { Icon: FaCakeCandles, title: t.events.birthdayTitle, text: t.events.birthdayText },
    { Icon: FaBellConcierge, title: t.events.meetingsTitle, text: t.events.meetingsText },
    { Icon: FaChampagneGlasses, title: t.events.otherTitle, text: t.events.otherText },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(195,144,61,0.14),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {t.events.overline} <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {t.events.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">{t.events.subtitle}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <FaUsers /> {t.events.capacity}
          </p>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-fade-up rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-[#171208] via-[#221a0c] to-[#2c2110] p-7 text-white sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-2xl text-emerald-300">
              <FaWandMagicSparkles />
            </span>
            <div>
              <span className="lux-overline text-emerald-300/90">{t.events.aboutTitle}</span>
              <p className="mt-4 text-sm leading-8 text-stone-200 sm:text-base">{t.events.aboutText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ Icon, title, text }) => (
            <article
              key={title}
              className="animate-fade-up group rounded-3xl border border-emerald-500/15 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                <Icon />
              </span>
              <h3 className="font-display mt-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-500/20 bg-white p-8 text-center shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#161006] sm:p-12">
          <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {t.events.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{t.events.ctaText}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:events@themaison.nl"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500"
            >
              <FaEnvelope /> {t.events.ctaContact} <FaArrowRight />
            </a>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-white/60 px-6 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-500 hover:text-emerald-700 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
            >
              {t.events.ctaReserve}
            </Link>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400">
            <p className="flex items-center justify-center gap-2">
              <FaLocationDot className="text-emerald-500" /> Klaprozenweg 36a, 1032 KL Amsterdam
            </p>
            <p className="mt-1.5 flex items-center justify-center gap-2">
              <FaPhone className="text-emerald-500" />
              <a href="tel:+31203412995" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">
                +31 20 341 2995
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
