"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  FaBars,
  FaCalendarCheck,
  FaCartShopping,
  FaChevronDown,
  FaMoon,
  FaSun,
  FaUser,
  FaXmark,
} from "react-icons/fa6";
import { useLang, useStore, useTheme } from "../providers";
import styles from "./header.module.css";

type SubLink = { href: string; label: string };
type NavLink = { href: string; label: string; children?: SubLink[] };

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const { cart, currentUser } = useStore();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false); // mobile submenu
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const resizeObserver = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--site-header-height", `${bar.getBoundingClientRect().height}px`);
    });
    resizeObserver.observe(bar);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    headerRef.current?.querySelector<HTMLElement>("#mobile-navigation a")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  // Elevate the header with a warm shadow once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const eventsChildren: SubLink[] = [
    { href: "/events", label: t.nav.eventsOverview },
    { href: "/events/about", label: t.nav.eventsAbout },
    { href: "/events/gallery", label: t.nav.eventsGallery },
    { href: "/events/birthdays", label: t.nav.eventsBirthdays },
    { href: "/events/celebrations", label: t.nav.eventsCelebrations },
    { href: "/events/company-catering", label: t.nav.eventsCompanyCatering },
    { href: "/events/company-lunches", label: t.nav.eventsCompanyLunches },
  ];

  const links: NavLink[] = [
    { href: "/", label: t.nav.home },
    { href: "/reservations", label: t.nav.reservations },
    { href: "/order", label: lang === "nl" ? "Menukaart" : "Menu" },
    { href: "/events", label: t.nav.events, children: eventsChildren },
    { href: "/account", label: t.nav.account },
  ];
  if (currentUser?.role === "admin") links.push({ href: "/admin", label: t.nav.admin });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleCartClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (cartCount <= 0) return;

    window.sessionStorage.setItem("openCartModal", "1");
    if (pathname === "/order") {
      event.preventDefault();
      window.dispatchEvent(new Event("open-cart-modal"));
    }
  };

  return (
    <header
      ref={headerRef}
      data-site-header
      className={`${styles.header} sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-shadow duration-300 dark:border-emerald-400/15 dark:bg-[#0c0703]/85 ${
        scrolled ? "shadow-lg shadow-emerald-900/10 dark:shadow-black/40" : ""
      }`}
    >
      <a href="#main-content" className={styles.skipLink}>{lang === "nl" ? "Ga naar inhoud" : "Skip to content"}</a>
      <div ref={barRef} className={`${styles.bar} mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8`}>
        <Link href="/" aria-label="Shah Restaurant" className={`${styles.brand} group flex items-center gap-3`} onClick={() => setOpen(false)}>
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-emerald-500/50 bg-white font-display text-xl font-semibold text-emerald-700 shadow-[0_0_16px_rgba(196,154,58,0.3)] transition duration-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(196,154,58,0.55)] dark:bg-emerald-950/60 dark:text-emerald-300">
            S
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              Fine Indian Dining · Amsterdam
            </span>
            <span className="font-display whitespace-nowrap text-base font-semibold tracking-[0.18em] text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300 sm:text-lg sm:tracking-[0.22em]">
              SHAH RESTAURANT
            </span>
          </span>
        </Link>

        <nav aria-label={lang === "nl" ? "Hoofdnavigatie" : "Primary navigation"} className={`${styles.desktopNav} hidden items-center gap-1 xl:flex`}>
          {links.map((link) =>
            link.children ? (
              <details key={link.href} className={`${styles.dropdown} group relative`} onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false; }}>
                <summary
                  className={`underline-grow flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActive(link.href)
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
                  }`}
                  data-active={isActive(link.href)}
                >
                  {link.label} <FaChevronDown className="text-[0.6rem] transition group-hover:rotate-180" />
                </summary>
                <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
                  <div className="min-w-[260px] rounded-2xl border border-emerald-500/20 bg-white p-2 shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#170d04]">
                    {link.children.map((c) => {
                      const active = pathname === c.href;
                      return (
                        <Link
                          key={c.href}
                          href={c.href}
                          aria-current={active ? "page" : undefined}
                          onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
                          className={`block rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "text-slate-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300"
                          }`}
                        >
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </details>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`underline-grow rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  isActive(link.href)
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
                }`}
                data-active={isActive(link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-bold dark:border-white/10 dark:bg-white/5 sm:flex">
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "en" ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400"
              }`}
              aria-label="English"
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("nl")}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "nl" ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400"
              }`}
              aria-label="Nederlands"
              aria-pressed={lang === "nl"}
            >
              NL
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:rotate-12 hover:border-emerald-400/60 hover:text-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
            aria-label={theme === "light" ? t.common.darkMode : t.common.lightMode}
            aria-pressed={theme === "dark"}
            title={theme === "light" ? t.common.darkMode : t.common.lightMode}
            suppressHydrationWarning
          >
            <span className="grid place-items-center" suppressHydrationWarning>
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </span>
          </button>

          <Link
            href="/order"
            onClick={handleCartClick}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:text-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
            aria-label={t.common.yourOrder}
            title={t.common.yourOrder}
          >
            <FaCartShopping />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="animate-pop absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-emerald-500 px-1 text-[0.6rem] font-bold text-white shadow-[0_0_10px_rgba(196,154,58,0.6)]"
              >
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href={currentUser ? "/account" : "/reservations"}
            className="btn-shine hidden h-9 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500 sm:flex"
          >
            {currentUser ? <FaUser className="text-xs" /> : <FaCalendarCheck className="text-xs" />}
            {currentUser ? currentUser.name.split(" ")[0] : (lang === "nl" ? "Reserveer" : "Reserve")}
          </Link>

          <button
            ref={menuToggleRef}
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 xl:hidden"
            aria-label={open ? (lang === "nl" ? "Menu sluiten" : "Close menu") : (lang === "nl" ? "Menu openen" : "Open menu")}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <FaXmark /> : <FaBars />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`${styles.mobilePanel} animate-fade-up border-t border-slate-200/70 bg-white px-4 py-3 [animation-duration:0.25s] dark:border-emerald-400/15 dark:bg-[#0c0703] xl:hidden`}>
          <nav id="mobile-navigation" aria-label={lang === "nl" ? "Mobiele navigatie" : "Mobile navigation"} className="flex flex-col gap-1">
            {links.map((link) =>
              link.children ? (
                <div key={link.href} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setEventsOpen((o) => !o)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      isActive(link.href)
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                    aria-expanded={eventsOpen}
                    aria-controls="mobile-events"
                  >
                    {link.label}
                    <FaChevronDown className={`text-xs transition ${eventsOpen ? "rotate-180" : ""}`} />
                  </button>
                  {eventsOpen && (
                    <div id="mobile-events" className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-emerald-500/20 pl-3">
                      {link.children.map((c) => {
                        const active = pathname === c.href;
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                              active
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {c.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive(link.href)
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setLang("en")}
                aria-label="English"
                aria-pressed={lang === "en"}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${
                  lang === "en" ? "bg-emerald-500 text-white" : "border border-slate-200 dark:border-white/10"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("nl")}
                aria-label="Nederlands"
                aria-pressed={lang === "nl"}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${
                  lang === "nl" ? "bg-emerald-500 text-white" : "border border-slate-200 dark:border-white/10"
                }`}
              >
                NL
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
