"use client";

import Link from "./LocaleLink";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLang } from "../providers";
import { COOKIE_NOTICE_ACK_ATTRIBUTE, COOKIE_NOTICE_STORAGE_KEY, serializeCookieNoticeAcknowledgement } from "../lib/cookieNotice";
import { ANALYTICS_MAX_AGE, PRIVACY_PREFERENCES_EVENT, readVisitAnalyticsChoice, VISIT_ANALYTICS_CHANGE, VISIT_ANALYTICS_COOKIE } from "../lib/visitorSignals";
const VisitObserver = dynamic(() => import("./VisitObserver"), { ssr: false });

function acknowledgeNotice() {
  try {
    document.documentElement.setAttribute(COOKIE_NOTICE_ACK_ATTRIBUTE, "true");
    document.cookie = serializeCookieNoticeAcknowledgement(window.location.protocol === "https:");
  } catch { /* Browser storage restrictions do not prevent dismissing the notice. */ }
}

/** Existing notice acknowledgements never grant the new optional analytics permission. */
export function CookieConsent({ initialAcknowledged }: { initialAcknowledged: boolean }) {
  const { t, lang } = useLang();
  const [visible, setVisible] = useState(!initialAcknowledged);
  const [allowed, setAllowed] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const firstChoice = useRef<HTMLButtonElement>(null);

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
      setAllowed(readVisitAnalyticsChoice() === "allowed");
    });
    return () => { mounted = false; };
  }, [initialAcknowledged]);

  useEffect(() => {
    const open = () => {
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.documentElement.removeAttribute(COOKIE_NOTICE_ACK_ATTRIBUTE);
      setPreferences(true); setVisible(true); setAllowed(readVisitAnalyticsChoice() === "allowed");
      requestAnimationFrame(() => firstChoice.current?.focus({ preventScroll: true }));
    };
    const changed = () => setAllowed(readVisitAnalyticsChoice() === "allowed");
    window.addEventListener(PRIVACY_PREFERENCES_EVENT, open);
    window.addEventListener("storage", changed);
    return () => { window.removeEventListener(PRIVACY_PREFERENCES_EVENT, open); window.removeEventListener("storage", changed); };
  }, []);

  const choose = (value: "accepted" | "necessary") => {
    const wasAllowed = readVisitAnalyticsChoice() === "allowed";
    try {
      localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, JSON.stringify({ value, at: Date.now() }));
    } catch {
      /* ignore */
    }
    acknowledgeNotice();
    try { document.cookie = `${VISIT_ANALYTICS_COOKIE}=${value === "accepted" ? "allowed" : "denied"}; Path=/; Max-Age=${ANALYTICS_MAX_AGE}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`; } catch { /* An unreadable grant never enables tracking. */ }
    setAllowed(readVisitAnalyticsChoice() === "allowed");
    window.dispatchEvent(new Event(VISIT_ANALYTICS_CHANGE));
    if (wasAllowed && value === "necessary") void fetch("/api/visits", { method: "DELETE", credentials: "same-origin", cache: "no-store" }).catch(() => {});
    setVisible(false);
    setPreferences(false);
    trigger.current?.focus({ preventScroll: true });
  };

  return <>{allowed && <VisitObserver />}{visible && (
    <div data-cookie-notice role="region" aria-label="Cookies" className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="card-lux mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl p-5 shadow-2xl sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {lang === "nl" ? "We gebruiken noodzakelijke opslag voor inloggen, uw winkelmand en voorkeuren. Alleen met uw toestemming bewaren we beperkte bezoekbronnen en activiteitssignalen gedurende maximaal 30 dagen voor analyse. Geen advertentietrackers." : "We use required storage for login, your cart and preferences. Only with your permission do we record limited visit sources and activity signals for up to 30 days for analysis. No advertising trackers."}{" "}
          <Link href="/privacy" className="font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-500 dark:text-emerald-400">
            {t.footer.privacy}
          </Link>
        </p>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <button
            ref={firstChoice}
            type="button"
            onClick={() => choose("necessary")}
            className="min-h-12 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30"
          >
            {lang === "nl" ? "Alleen noodzakelijk" : "Necessary only"}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="min-h-12 rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
          >
            {lang === "nl" ? "Bezoekanalyse toestaan" : "Allow visit analytics"}
          </button>
          {preferences && <button type="button" onClick={() => { acknowledgeNotice(); setVisible(false); setPreferences(false); trigger.current?.focus({ preventScroll: true }); }} className="min-h-12 rounded-full border px-4 py-2 text-sm">{lang === "nl" ? "Sluiten" : "Close"}</button>}
        </div>
      </div>
    </div>
  )}</>;
}
