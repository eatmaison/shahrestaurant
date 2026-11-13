"use client";
import { useMemo, useState } from "react";
import { useLang, useStore } from "../providers";
import { buildCustomerMetrics } from "../lib/adminCustomerMetrics";
import { absoluteTime, downloadCsv, money } from "./adminFormat";
import styles from "./admin.module.css";

export function CustomerInsights({ matches }: { matches: (time: number) => boolean }) {
  const { orders, users } = useStore(), { lang } = useLang(), nl = lang === "nl";
  const [search, setSearch] = useState(""), [sort, setSort] = useState("value"), [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string>();
  const metrics = useMemo(() => buildCustomerMetrics(orders, users, matches), [orders, users, matches]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return metrics.filter(item => !query || [item.name, item.email].join(" ").toLowerCase().includes(query)).sort((a, b) => sort === "orders" ? b.orderCount - a.orderCount || b.lastOrder - a.lastOrder : sort === "recent" ? b.lastOrder - a.lastOrder : b.bookedValue - a.bookedValue || b.lastOrder - a.lastOrder);
  }, [metrics, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / 20)), activePage = Math.min(page, pages), visible = filtered.slice((activePage - 1) * 20, activePage * 20);
  const basis = (value: string) => value === "account" ? (nl ? "Account" : "Account") : value === "session" ? (nl ? "Gastsessie" : "Guest session") : (nl ? "Losse bestelling" : "Unlinked order");
  const displayName = (item: (typeof metrics)[number]) => item.name || (nl ? "Gastsessie met meerdere namen" : "Guest session with multiple names");
  return <section className={styles.panel} aria-labelledby="customer-insights-title">
    <div className={styles.panelHeader}><div><h2 id="customer-insights-title">{nl ? "Klantinzichten" : "Customer insights"}</h2><p className={styles.muted}>{nl ? "Gekozen periode · betaalde en zakelijke bestellingen. Groepen zijn geen unieke personen." : "Selected period · paid and company orders. Groups are not unique people."}</p></div><button type="button" className={styles.button} onClick={() => downloadCsv("customer-insights.csv", [["Group", "Identity basis", "Orders", "Paid EUR", "Unpaid company EUR", "Order value EUR", "Last order"], ...filtered.map(item => [displayName(item), item.basis, item.orderCount, item.paidValue.toFixed(2), item.unpaidCompanyValue.toFixed(2), item.bookedValue.toFixed(2), new Date(item.lastOrder).toISOString()])])}>{nl ? "CSV exporteren" : "Export CSV"}</button></div>
    <p className={styles.notice}>{nl ? "Accounts worden op account-ID gegroepeerd. Gasten alleen op hun gekoppelde browsersessie; zonder sessiekoppeling blijft iedere bestelling apart. Dezelfde naam is nooit voldoende om personen samen te voegen." : "Accounts are grouped by account ID. Guests are grouped only by a linked browser session; orders without a session link stay separate. A matching name never merges people."}</p>
    <div className={`${styles.filters} mt-4`}><label className={styles.search}>{nl ? "Zoeken op naam of e-mail" : "Search name or email"}<input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><label>{nl ? "Sorteren" : "Sort"}<select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="value">{nl ? "Bestelwaarde" : "Order value"}</option><option value="orders">{nl ? "Aantal bestellingen" : "Order count"}</option><option value="recent">{nl ? "Meest recent" : "Most recent"}</option></select></label></div>
    <ul className={styles.rows}>{visible.map(item => <li key={item.key} className={styles.row}>
      <div className={styles.rowSummary}><div><strong>{displayName(item)}</strong><p>{item.email || basis(item.basis)}</p></div><div><span className={styles.badge}>{basis(item.basis)}</span></div><div><strong>{money(item.bookedValue, lang)}</strong><p>{item.orderCount} {nl ? "bestellingen" : "orders"}</p></div><div><p>{absoluteTime(item.lastOrder, lang)}</p></div><button type="button" className={styles.button} aria-expanded={expanded === item.key} aria-controls={`insight-${encodeURIComponent(item.key)}`} onClick={() => setExpanded(expanded === item.key ? undefined : item.key)}>{expanded === item.key ? (nl ? "Sluiten" : "Close") : (nl ? "Details" : "Details")}</button></div>
      <div hidden={expanded !== item.key} id={`insight-${encodeURIComponent(item.key)}`}>{expanded === item.key && <div className={styles.details}><dl className={styles.detailGrid}>
        <div><dt>{nl ? "Betaald" : "Paid"}</dt><dd>{money(item.paidValue, lang)} · {item.paidOrders} {nl ? "bestellingen" : "orders"}</dd></div><div><dt>{nl ? "Zakelijk, nog onbetaald" : "Company, not yet paid"}</dt><dd>{money(item.unpaidCompanyValue, lang)}</dd></div><div><dt>{nl ? "Gemiddelde bestelwaarde" : "Average order value"}</dt><dd>{money(item.averageValue, lang)}</dd></div><div><dt>{nl ? "Eerste bestelling in periode" : "First order in period"}</dt><dd>{absoluteTime(item.firstOrder, lang)}</dd></div><div><dt>{nl ? "Laatste bestelling in periode" : "Last order in period"}</dt><dd>{absoluteTime(item.lastOrder, lang)}</dd></div><div><dt>{nl ? "Meest besteld" : "Most ordered item"}</dt><dd>{item.favourite ? `${item.favourite.name} · ${item.favourite.quantity}×` : "—"}</dd></div>
      </dl></div>}</div>
    </li>)}</ul>
    {!visible.length && <p className={styles.empty}>{nl ? "Geen klantgroepen voor deze selectie." : "No customer groups for this selection."}</p>}
    <div className={styles.pager}><span>{filtered.length} {nl ? "groepen" : "groups"} · {activePage}/{pages}</span><div><button className={styles.button} type="button" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>{nl ? "Vorige" : "Previous"}</button><button className={styles.button} type="button" disabled={activePage === pages} onClick={() => setPage(activePage + 1)}>{nl ? "Volgende" : "Next"}</button></div></div>
  </section>;
}
