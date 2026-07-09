"use client";

import Link from "next/link";
import { FaClock, FaEnvelope, FaLocationDot, FaPhone } from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { SOCIAL_PLATFORMS } from "./socialIcons";

export function Footer() {
  const { t } = useLang();
  const { socialLinks } = useStore();

  // Only platforms the admin enabled and gave a URL, in fixed display order.
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => {
    const link = socialLinks.find((l) => l.platform === p.id);
    return link?.enabled && link.url;
  }).map((p) => ({ ...p, url: socialLinks.find((l) => l.platform === p.id)!.url }));

  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white dark:border-white/10 dark:bg-[#080d15]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-lg font-black tracking-[0.18em] text-slate-900 dark:text-white">EAT TO GO</p>
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
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
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
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="text-emerald-600 dark:text-emerald-400" />
                  <a href="mailto:info@eattogo.nl" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">info@eattogo.nl</a>
                </li>
                <li className="flex items-center gap-2">
                  <FaPhone className="text-emerald-600 dark:text-emerald-400" />
                  <a href="tel:+31203412995" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">+31 20 341 2995</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.address}</p>
              <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <FaLocationDot className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Klaprozenweg 36a<br />1032 KL Amsterdam</span>
              </p>
              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.hours.title}</p>
              <div className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <FaClock className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t.hours.tueSun}: 14:00 – 20:00
                  <br />
                  {t.hours.monday}: {t.hours.closed}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.ourRestaurants}</p>
              <div className="mt-3 flex flex-col gap-2">
                <a href="https://themaison.nl" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.theMaison} ↗
                </a>
                <a href="https://thetandoorcompany.nl" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.theTandoor} ↗
                </a>
              </div>
              <p className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.legal}</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/privacy" className="text-sm text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.privacy}
                </Link>
                <Link href="/terms" className="text-sm text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.terms}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-500">
        © {new Date().getFullYear()} EAT TO GO - Amsterdam. {t.footer.rights}
      </div>
    </footer>
  );
}
