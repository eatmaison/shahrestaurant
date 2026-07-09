"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FaBars,
  FaCartShopping,
  FaMoon,
  FaSun,
  FaUser,
  FaXmark,
} from "react-icons/fa6";
import { useLang, useStore, useTheme } from "../providers";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const { cart, currentUser } = useStore();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/order", label: t.nav.order },
    { href: "/account", label: t.nav.account },
  ];
  if (currentUser?.role === "admin") links.push({ href: "/admin", label: t.nav.admin });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#060b12]/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative h-10 w-10 overflow-hidden rounded-full border border-emerald-500/40 bg-white">
            <Image src="/eattogo.png" alt="Eat to go logo" fill sizes="40px" className="object-contain p-1" priority />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              Amsterdam
            </span>
            <span className="text-base font-black tracking-[0.18em] text-slate-900 dark:text-white">
              EAT TO GO
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
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
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:text-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
            aria-label={theme === "light" ? t.common.darkMode : t.common.lightMode}
            title={theme === "light" ? t.common.darkMode : t.common.lightMode}
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>

          <Link
            href="/order"
            className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:text-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
            aria-label={t.common.yourOrder}
          >
            <FaCartShopping />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-emerald-500 px-1 text-[0.6rem] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/account"
            className="hidden h-9 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:flex"
          >
            <FaUser className="text-xs" />
            {currentUser ? currentUser.name.split(" ")[0] : t.common.signIn}
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 md:hidden"
            aria-label="Menu"
          >
            {open ? <FaXmark /> : <FaBars />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#060b12] md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
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
            ))}
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
