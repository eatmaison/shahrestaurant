"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang, useStore } from "../providers";
import { adminDataView } from "../lib/adminView";
import { absoluteTime } from "./adminFormat";
import workspace from "../components/Workspace.module.css";
import styles from "./admin.module.css";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const { currentUser, hydrated, refresh, catalogStatus, dataUpdatedAt, adminView } = useStore();
  const path = usePathname(), nl = lang === "nl";
  const view = adminDataView(path);
  const pending = useRef<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const previousPath = useRef(path);
  const tabs = [
    { href: "/admin", title: nl ? "Dagelijks beheer" : "Daily operations", description: nl ? "Bestellingen, reserveringen en restaurantbeheer." : "Orders, reservations and restaurant tools." },
    { href: "/admin/customers", title: nl ? "Klanten & bezoekers" : "Customers & visitors", description: nl ? "Een compact klantenregister en waargenomen bezoekersactiviteit." : "A compact account directory and observed visitor activity." },
    { href: "/admin/stats", title: nl ? "Statistieken" : "Statistics", description: nl ? "Bestelwaarden, dagverloop en inzicht per klantgroep." : "Order values, daily progress and customer-group insights." },
    { href: "/admin/events", title: nl ? "Evenementen & foto's" : "Events & photos", description: nl ? "Beheer evenementen, boekingen en de openbare fotogalerij." : "Manage events, bookings and the public photo gallery." },
  ];
  const active = tabs.find(tab => tab.href === path) || tabs[0];

  useEffect(() => {
    if (!hydrated || currentUser?.role !== "admin") return;
    const update = async () => {
      if (pending.current === path || document.hidden || !navigator.onLine) return;
      pending.current = path;
      try { await refresh(); } finally { if (pending.current === path) pending.current = null; }
    };
    if (previousPath.current !== path || adminView !== view) void update();
    previousPath.current = path;
    const timer = window.setInterval(update, 30_000);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [adminView, currentUser?.role, hydrated, path, refresh, view]);

  if (!hydrated) return <div role="status" className={`${workspace.page} ${workspace.loading}`}>{nl ? "Beheer laden…" : "Loading workspace…"}<noscript>{nl ? "JavaScript is vereist voor het beheer." : "JavaScript is required for admin tools."}</noscript></div>;
  if (currentUser?.role !== "admin") return <section className={`${workspace.page} ${workspace.denied} p-8`}><h1>{nl ? "Beheerder vereist" : "Administrator access required"}</h1><Link href="/account">{nl ? "Naar mijn account" : "Go to my account"}</Link></section>;

  return <div data-workspace="admin" className={`${workspace.page} ${styles.shell} mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`}>
    <header className={styles.header}>
      <div><div className={styles.eyebrow}>SHAH / {nl ? "BEHEER" : "WORKSPACE"}</div><h1>{active.title}</h1><p className={styles.muted}>{currentUser.name} · {currentUser.email}</p><p>{active.description}</p></div>
      <div className={styles.tools}><button type="button" className={styles.button} disabled={refreshing || catalogStatus === "loading"} onClick={async () => { setRefreshing(true); try { await refresh(); } finally { setRefreshing(false); } }}>{refreshing ? (nl ? "Verversen…" : "Refreshing…") : (nl ? "Verversen" : "Refresh")}</button><Link prefetch={false} href="/terminal" className={styles.button}>{nl ? "Keukenscherm" : "Kitchen terminal"}</Link></div>
    </header>
    <nav className={styles.nav} aria-label={nl ? "Beheerpagina's" : "Workspace pages"}>{tabs.map(tab => <Link prefetch={false} key={tab.href} href={tab.href} aria-current={path === tab.href ? "page" : undefined}>{tab.title}</Link>)}</nav>
    <p className={styles.status} aria-live="polite">{catalogStatus === "error" ? <span className={styles.error}>{nl ? "Verversen mislukt. De laatst geladen gegevens worden getoond." : "Refresh failed. Showing the last loaded data."}</span> : catalogStatus === "loading" ? (nl ? "Gegevens ophalen…" : "Loading data…") : <>{nl ? "Laatst geladen" : "Last loaded"}: {absoluteTime(dataUpdatedAt, lang)} · Europe/Amsterdam</>}</p>
    {adminView !== view ? <div role="status" className={styles.notice}>{catalogStatus === "error" ? (nl ? "Probeer deze pagina opnieuw te verversen." : "Refresh this page to try again.") : (nl ? "Pagina laden…" : "Loading page…")}</div> : children}
  </div>;
}
