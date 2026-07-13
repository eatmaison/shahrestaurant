"use client";

import Link from "next/link";
import { FaArrowRight, FaEnvelope, FaLocationDot, FaPhone } from "react-icons/fa6";
import { useLang } from "../providers";

/** Shared CTA block for all Events sub-pages - dark card with contact + reservation. */
export function EventsContactCta() {
  const { lang } = useLang();
  const nl = lang === "nl";
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-[#171208] via-[#221a0c] to-[#2c2110] p-8 text-center text-white sm:p-12">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          {nl ? "Klaar om te plannen?" : "Ready to plan your event?"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-200">
          {nl
            ? "Deel uw wensen en ons events-team komt binnen één werkdag terug met een voorstel op maat."
            : "Share your vision and our events team will reply within one working day with a tailored proposal."}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="mailto:events@themaison.nl"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500"
          >
            <FaEnvelope /> {nl ? "Neem contact op" : "Contact our events team"} <FaArrowRight />
          </a>
          <Link
            href="/reservations"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-300"
          >
            {nl ? "Reserveer een tafel" : "Reserve a table"}
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
          <p className="mt-1.5">
            <a href="mailto:events@themaison.nl" className="transition hover:text-emerald-300">
              events@themaison.nl
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
