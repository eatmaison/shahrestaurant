"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "../providers";

const STORAGE_KEY = "etg.cookieConsent";

/**
 * EU/NL cookie notice. The site only uses strictly necessary cookies/storage
 * (session, cart, language/theme), so no consent is legally required - this
 * banner informs the visitor and records their acknowledgement.
 */
export function CookieConsent() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage unavailable - stay hidden */
    }
  }, []);

  const choose = (value: "accepted" | "necessary") => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: Date.now() }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b1220] sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t.cookies.message}{" "}
          <Link href="/privacy" className="font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-500 dark:text-emerald-400">
            {t.cookies.learnMore}
          </Link>
        </p>
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={() => choose("necessary")}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30"
          >
            {t.cookies.decline}
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
          >
            {t.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
