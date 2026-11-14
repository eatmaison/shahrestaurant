"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang, useStore } from "../providers";
import { adminDataView } from "../lib/adminView";
import { absoluteTime, relativeTime } from "./adminFormat";
import { AdminDraftProvider } from "./AdminDrafts";
import workspace from "../components/Workspace.module.css";
import styles from "./admin.module.css";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { lang } = useLang(), nl = lang === "nl";
  const { currentUser, hydrated, refresh, catalogStatus, dataUpdatedAt, adminView } = useStore();
  const path = usePathname(), view = adminDataView(path);
  const [auto, setAuto] = useState(true), [online, setOnline] = useState(true), [now, setNow] = useState(0);
  const pending = useRef<string | null>(null), failures = useRef(0), retryAfter = useRef(0), previousPath = useRef(path), heading = useRef<HTMLHeadingElement>(null), nav = useRef<HTMLElement>(null);
  const tabs = [
    { href: "/admin", title: nl ? "Dagelijks beheer" : "Daily operations", description: nl ? "Bestellingen, reserveringen en restaurantbeheer." : "Orders, reservations and restaurant tools." },
    { href: "/admin/products", title: nl ? "Productbeheer" : "Manage products", description: nl ? "Producten, restaurants en de volgorde van menucategorieën." : "Products, restaurants and menu category order." },
    { href: "/admin/customers", title: nl ? "Klanten & bezoekers" : "Customers & visitors", description: nl ? "Accounts, contactgegevens en waargenomen bezoekersactiviteit." : "Accounts, contact details and observed visitor activity." },
    { href: "/admin/stats", title: nl ? "Statistieken" : "Statistics", description: nl ? "Bestelwaarden, dagverloop en klantgroepen." : "Order values, daily progress and customer groups." },
    { href: "/admin/events", title: nl ? "Evenementen & foto's" : "Events & photos", description: nl ? "Evenementen, boekingen en de openbare fotogalerij." : "Events, bookings and the public photo gallery." },
  ];
  const active = tabs.find(tab => tab.href === path) || tabs[0];
  useEffect(() => { const update = () => { setOnline(navigator.onLine); setNow(Date.now()); }; queueMicrotask(update); const timer = setInterval(update, 15_000); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { clearInterval(timer); window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  useEffect(() => {
    if (!hydrated || currentUser?.role !== "admin") return;
    const routeChanged = previousPath.current !== path;
    const update = async (force = false) => {
      if (pending.current === path || document.hidden || !navigator.onLine || !force && (!auto || Date.now() < retryAfter.current)) return;
      pending.current = path;
      try { const success = await refresh(); if (success === undefined || pending.current !== path) return; failures.current = success ? 0 : Math.min(4, failures.current + 1); retryAfter.current = success ? 0 : Date.now() + Math.min(300_000, 30_000 * 2 ** failures.current); }
      finally { if (pending.current === path) pending.current = null; }
    };
    if (routeChanged || adminView !== view) { retryAfter.current = 0; void update(true); }
    previousPath.current = path;
    if (routeChanged) heading.current?.focus({ preventScroll: true });
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    const interval = setInterval(() => void update(), 30_000), visible = () => { if (!document.hidden) void update(); }, connected = () => void update(true);
    document.addEventListener("visibilitychange", visible); window.addEventListener("online", connected);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", connected); };
  }, [adminView, auto, currentUser?.role, hydrated, path, refresh, view]);
  if (!hydrated) return <AdminSkeleton />;
  if (currentUser?.role !== "admin") return <section className={`${workspace.page} ${workspace.denied} p-8`}><h1>{nl ? "Beheerder vereist" : "Administrator access required"}</h1><p>{nl ? "Uw sessie heeft geen toegang tot deze gegevens." : "Your session does not have access to this information."}</p><Link prefetch={false} href="/account">{nl ? "Inloggen of account openen" : "Sign in or open account"}</Link></section>;
  const stale = dataUpdatedAt > 0 && now - dataUpdatedAt > 90_000;
  return <AdminDraftProvider key={currentUser.id} userId={currentUser.id}><div data-workspace="admin" className={`${workspace.page} ${styles.shell} mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`}>
    <header className={styles.header}><div><div className={styles.eyebrow}>SHAH / {nl ? "BEHEER" : "WORKSPACE"}</div><h1 ref={heading} tabIndex={-1}>{active.title}</h1><p className={styles.muted}>{currentUser.name} · {currentUser.email}</p><p>{active.description}</p></div><div className={styles.tools}><button type="button" className={styles.button} disabled={!online || catalogStatus === "loading"} onClick={async () => { retryAfter.current = 0; failures.current = 0; await refresh(); }}>{catalogStatus === "loading" ? (nl ? "Verversen…" : "Refreshing…") : (nl ? "Verversen" : "Refresh")}</button><Link prefetch={false} href="/terminal" className={styles.button}>{nl ? "Keukenscherm" : "Kitchen terminal"}</Link></div></header>
    <nav ref={nav} className={styles.nav} aria-label={nl ? "Beheerpagina's" : "Workspace pages"}>{tabs.map(tab => <Link prefetch={false} key={tab.href} href={tab.href} aria-current={path === tab.href ? "page" : undefined}>{tab.title}</Link>)}</nav>
    <div className={styles.workspaceState}><div role="status" aria-live="polite"><p>{!online ? (nl ? "Offline — gegevens kunnen verouderd zijn." : "Offline — data may be out of date.") : catalogStatus === "error" ? (nl ? "Verversen mislukt. Laatst geladen gegevens blijven zichtbaar; automatische pogingen worden vertraagd." : "Refresh failed. Last loaded data remains visible; automatic retries are slowed down.") : catalogStatus === "loading" ? (nl ? "Gegevens ophalen…" : "Loading data…") : <>{nl ? "Laatst geladen" : "Last loaded"}: {absoluteTime(dataUpdatedAt, lang)} · {relativeTime(dataUpdatedAt, now, lang)}</>}</p>{stale && <p className={styles.gold}>{nl ? "Momentopname ouder dan 90 seconden. Controleer nieuwe acties met actuele gegevens." : "Snapshot older than 90 seconds. Check fresh data before taking action."}</p>}</div><label className={styles.button}><input type="checkbox" checked={auto} onChange={event => setAuto(event.target.checked)} />{nl ? "Automatisch verversen" : "Auto refresh"}</label></div>
    <a className={styles.workspaceSkip} href="#admin-page-content" onClick={() => document.getElementById("admin-page-content")?.focus()}>{nl ? "Naar de werkruimte" : "Skip to workspace content"} ↓</a>
    <div id="admin-page-content" tabIndex={-1} aria-busy={catalogStatus === "loading"}>{adminView !== view ? <AdminSkeleton /> : children}</div>
  </div></AdminDraftProvider>;
}
export function AdminSkeleton() { const { lang } = useLang(); return <div role="status" aria-live="polite" className={styles.skeleton}><strong>{lang === "nl" ? "Beheer laden…" : "Loading workspace…"}</strong><p>{lang === "nl" ? "Gegevens worden veilig opgehaald." : "Loading your authorized information."}</p><div className={styles.skeletonBar} /><div className={styles.skeletonBar} /><noscript>JavaScript is required.</noscript></div>; }
