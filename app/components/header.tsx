"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import {
  FaBars,
  FaCartShopping,
  FaChevronDown,
  FaMoon,
  FaSun,
  FaUser,
  FaXmark,
} from "react-icons/fa6";
import { useLang, useStore, useTheme } from "../providers";

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

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
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
    { href: "/order", label: t.nav.order },
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
      data-site-header
      className={`sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-shadow duration-300 dark:border-emerald-400/15 dark:bg-[#0c0703]/85 ${
        scrolled ? "shadow-lg shadow-emerald-900/10 dark:shadow-black/40" : ""
      }`}
    >
      <div className="gold-rule absolute inset-x-0 top-0" aria-hidden />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative h-10 w-10 overflow-hidden rounded-full border border-emerald-500/50 bg-white shadow-[0_0_16px_rgba(217,126,38,0.35)] transition duration-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(217,126,38,0.6)]">
            <Image src="/tandoorcompany.png" alt="The Tandoor Company logo" fill sizes="40px" className="object-contain p-1" priority />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              Authentiek Indiaas · Amsterdam
            </span>
            <span className="font-display text-base font-bold tracking-[0.14em] text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300 sm:text-lg">
              THE TANDOOR COMPANY
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          {links.map((link) =>
            link.children ? (
              <div key={link.href} className="group relative">
                <Link
                  href={link.href}
                  className={`underline-grow flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActive(link.href)
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
                  }`}
                  data-active={isActive(link.href)}
                  aria-haspopup="true"
                >
                  {link.label} <FaChevronDown className="text-[0.6rem] transition group-hover:rotate-180" />
                </Link>
                <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="min-w-[260px] rounded-2xl border border-emerald-500/20 bg-white p-2 shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#170d04]">
                    {link.children.map((c) => {
                      const active = pathname === c.href;
                      return (
                        <Link
                          key={c.href}
                          href={c.href}
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
              </div>
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
            >
              EN
            </button>
            <button
              onClick={() => setLang("nl")}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "nl" ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400"
              }`}
              aria-label="Nederlands"
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
          >
            <FaCartShopping />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="animate-pop absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-emerald-500 px-1 text-[0.6rem] font-bold text-white shadow-[0_0_10px_rgba(217,126,38,0.6)]"
              >
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/account"
            className="btn-shine hidden h-9 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500 sm:flex"
          >
            <FaUser className="text-xs" />
            {currentUser ? currentUser.name.split(" ")[0] : t.common.signIn}
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <FaXmark /> : <FaBars />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-up border-t border-slate-200/70 bg-white px-4 py-3 [animation-duration:0.25s] dark:border-emerald-400/15 dark:bg-[#0c0703] md:hidden">
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="flex flex-col gap-1">
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
                  >
                    {link.label}
                    <FaChevronDown className={`text-xs transition ${eventsOpen ? "rotate-180" : ""}`} />
                  </button>
                  {eventsOpen && (
                    <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-emerald-500/20 pl-3">
                      {link.children.map((c) => {
                        const active = pathname === c.href;
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            onClick={() => setOpen(false)}
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
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${
                  lang === "en" ? "bg-emerald-500 text-white" : "border border-slate-200 dark:border-white/10"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("nl")}
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
