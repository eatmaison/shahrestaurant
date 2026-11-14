"use client";

import Link from "./LocaleLink";
import { BrandLogo } from "./BrandLogo";
import { useEffect, useRef, useState } from "react";
import { FaArrowUp, FaClock, FaEnvelope, FaLocationDot, FaPhone } from "./icons/fa6";
import { useLang, useStore } from "../providers";
import { SOCIAL_PLATFORMS } from "./socialIcons";
import styles from "./footer.module.css";

export function Footer() {
  const { t, lang } = useLang();
  const { socialLinks } = useStore();
  const [showTop, setShowTop] = useState(false);
  const [topDocked, setTopDocked] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  // Floating "back to top" appears after scrolling past the first screen.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const measure = () => {
      const bounds = footer.getBoundingClientRect();
      setTopDocked(bounds.top < window.innerHeight && bounds.bottom > 0);
    };
    measure();
    if (typeof window.IntersectionObserver === "function") {
      const observer = new IntersectionObserver(([entry]) => setTopDocked(entry.isIntersecting));
      observer.observe(footer);
      return () => observer.disconnect();
    }
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Only platforms the admin enabled and gave a URL, in fixed display order.
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => {
    const link = socialLinks.find((l) => l.platform === p.id);
    return link?.enabled && link.url;
  }).map((p) => ({ ...p, url: socialLinks.find((l) => l.platform === p.id)!.url }));

  return (
    <footer ref={footerRef} data-site-footer className="relative overflow-hidden border-t border-slate-200/70 bg-white dark:border-emerald-400/15 dark:bg-[#0a0602]">
      <div className="gold-rule absolute inset-x-0 top-0" />
      <div className={`${styles.content} relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8`}>
        <div>
          <p className={`${styles.brandEyebrow} text-[0.6rem] font-semibold uppercase tracking-[0.3em]`}>Fine Indian Dining · Amsterdam-Noord</p>
          <div className={styles.brandRow}>
            <Link href="/" aria-label="Shah Restaurant" className="inline-block"><BrandLogo tone="adaptive" className="shah-footer-brand" alt="" /></Link>
            <button
              type="button"
              onClick={() => {
                document.getElementById("main-content")?.focus({ preventScroll: true });
                window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
              }}
              aria-label={lang === "nl" ? "Terug naar boven" : "Back to top"}
              title={lang === "nl" ? "Terug naar boven" : "Back to top"}
              tabIndex={showTop ? 0 : -1}
              aria-hidden={!showTop}
              data-back-top
              data-footer-docked={topDocked}
              className={`${styles.backTop} fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full border border-emerald-500/40 bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/40 ${
                showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              <FaArrowUp className="text-sm" />
            </button>
          </div>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">{t.footer.tagline}</p>
          <nav className="footer-quick-links" aria-label={lang === "nl" ? "Snelle links" : "Quick links"}>
            <Link href="/order">{lang === "nl" ? "Menukaart" : "Menu"}</Link>
            <Link href="/reservations">{t.nav.reservations}</Link>
            <Link href="/events/gallery">{t.nav.eventsGallery}</Link>
          </nav>
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
          <div className={styles.details}>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.contact}</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="text-emerald-600 dark:text-emerald-400" />
                  <a href="mailto:info@shahrestaurant.nl" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">info@shahrestaurant.nl</a>
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
                <a href="https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a+1032+KL+Amsterdam" target="_blank" rel="noopener noreferrer">Klaprozenweg 36a<br />1032 KL Amsterdam</a>
              </p>
              <p className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.hours.title}</p>
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <FaClock className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t.hours.tueSun}: 15:00 – 22:00
                  <br />
                  {t.hours.monday}: {t.hours.closed}
                </span>
              </div>
            </div>
            <div className={styles.secondaryGroups}>
              <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.ourRestaurants}</p>
              <nav aria-label={t.footer.ourRestaurants} className="mt-3 flex min-w-0 flex-col gap-3 break-words">
                <a href="https://eattogo.nl" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  <span className="font-semibold">Eat to Go ↗</span>
                  <span className="mt-1 block text-xs leading-5">{lang === "nl" ? "Wraps, burgers en pizza om mee te nemen" : "Wraps, burgers and pizza to go"}</span>
                </a>
                <a href="https://thetandoorcompany.nl" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  <span className="font-semibold">The Tandoor Company ↗</span>
                  <span className="mt-1 block text-xs leading-5">{lang === "nl" ? "Indiase curry's en tandoori" : "Indian curries and tandoori"}</span>
                </a>
              </nav>
              </div>
              <div className={styles.legal}>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t.footer.legal}</p>
              <div className={styles.legalLinks}>
                <Link href="/privacy" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.privacy}
                </Link>
                <button type="button" onClick={() => window.dispatchEvent(new Event("shah:privacy-preferences"))} className="min-h-12 text-left text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">{lang === "nl" ? "Cookievoorkeuren" : "Cookie preferences"}</button>
                <Link href="/terms" className="text-xs text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  {t.footer.terms}
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-500 dark:border-emerald-400/15 dark:text-slate-500">
        © {new Date().getFullYear()} SHAH RESTAURANT - Amsterdam. {t.footer.rights}
      </div>

    </footer>
  );
}
