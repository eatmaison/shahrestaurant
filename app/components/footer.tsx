"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowUp, FaClock, FaEnvelope, FaLocationDot, FaPhone } from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { SOCIAL_PLATFORMS } from "./socialIcons";

export function Footer() {
  const { t } = useLang();
  const { socialLinks } = useStore();
  const [showTop, setShowTop] = useState(false);

  // Floating "back to top" appears after scrolling past the first screen.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only platforms the admin enabled and gave a URL, in fixed display order.
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => {
    const link = socialLinks.find((l) => l.platform === p.id);
    return link?.enabled && link.url;
  }).map((p) => ({ ...p, url: socialLinks.find((l) => l.platform === p.id)!.url }));

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-slate-200/70 bg-white dark:border-emerald-400/15 dark:bg-[#0a0602]">
      <div className="gold-rule absolute inset-x-0 top-0" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Authentiek Indiaas · Amsterdam-Noord</p>
          <p className="font-display mt-1 text-xl font-bold tracking-[0.14em] text-slate-900 dark:text-white">THE TANDOOR COMPANY</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">{t.footer.tagline}</p>
          {activeSocials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {activeSocials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-600 hover:shadow-[0_0_14px_rgba(217,126,38,0.35)] dark:border-white/10 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
                >
                  <s.icon />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.contact}</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="text-emerald-600 dark:text-emerald-400" />
                  <a href="mailto:info@thetandoorcompany.nl" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">info@thetandoorcompany.nl</a>
                </li>
                <li className="flex items-center gap-2">
                  <FaPhone className="text-emerald-600 dark:text-emerald-400" />
                  <a href="tel:+31203412995" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">+31 20 341 2995</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.address}</p>
              <p className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <FaLocationDot className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Klaprozenweg 36a<br />1032 KL Amsterdam</span>
              </p>
              <p className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.hours.title}</p>
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <FaClock className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t.hours.tueSun}: 17:00 – 22:30
                  <br />
                  {t.hours.monday}: {t.hours.closed}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.ourRestaurants}</p>
              <div className="mt-3 flex flex-col gap-2">
                <a href="https://eattogo.nl" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.eatToGo} ↗
                </a>
                <a href="https://themaison.nl" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.theTandoor} ↗
                </a>
              </div>
              <p className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.legal}</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/privacy" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.privacy}
                </Link>
                <Link href="/terms" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.terms}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-500 dark:border-emerald-400/15 dark:text-slate-500">
        © {new Date().getFullYear()} THE TANDOOR COMPANY - Amsterdam. {t.footer.rights}
      </div>

      {/* Floating back-to-top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full border border-emerald-500/40 bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/40 ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <FaArrowUp className="text-sm" />
      </button>
    </footer>
  );
}
