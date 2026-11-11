"use client";

import Link from "./LocaleLink";
import { useEffect, useState } from "react";
import { useLang } from "../providers";
import { COOKIE_NOTICE_ACK_ATTRIBUTE, COOKIE_NOTICE_STORAGE_KEY, serializeCookieNoticeAcknowledgement } from "../lib/cookieNotice";

function acknowledgeNotice() {
  try {
    document.documentElement.setAttribute(COOKIE_NOTICE_ACK_ATTRIBUTE, "true");
    document.cookie = serializeCookieNoticeAcknowledgement(window.location.protocol === "https:");
  } catch { /* Browser storage restrictions do not prevent dismissing the notice. */ }
}

/**
 * EU/NL cookie notice. The site only uses strictly necessary cookies/storage
 * (session, cart, language/theme), so no consent is legally required - this
 * banner informs the visitor and records their acknowledgement.
 */
export function CookieConsent({ initialAcknowledged }: { initialAcknowledged: boolean }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(!initialAcknowledged);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      let acknowledged = initialAcknowledged;
      try {
        acknowledged ||= Boolean(localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY));
      } catch { /* The server acknowledgement remains valid when localStorage is blocked. */ }
      if (acknowledged && !initialAcknowledged) acknowledgeNotice();
      setVisible(!acknowledged);
    });
    return () => { mounted = false; };
  }, [initialAcknowledged]);

  const choose = (value: "accepted" | "necessary") => {
    try {
      localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, JSON.stringify({ value, at: Date.now() }));
    } catch {
      /* ignore */
    }
    acknowledgeNotice();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div data-cookie-notice role="region" aria-label="Cookies" className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="card-lux mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl p-5 shadow-2xl sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t.cookies.message}{" "}
          <Link href="/privacy" className="font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-500 dark:text-emerald-400">
            {t.footer.privacy}
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
