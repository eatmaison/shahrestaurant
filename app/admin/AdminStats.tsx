"use client";
import { useEffect, useMemo, useState } from "react";
import { useLang, useStore } from "../providers";
import { buildDailyMetrics, makeRangeCheck, type RangeFilter } from "../lib/adminMetrics";
import { summarizeOrders } from "../lib/adminCustomerMetrics";
import { money, downloadCsv } from "./adminFormat";
import { AdminDateRange } from "./AdminDateRange";
import { DailySalesChart } from "./DailySalesChart";
import { CustomerInsights } from "./CustomerInsights";
import styles from "./admin.module.css";

export default function AdminStats() {
  const { orders, products } = useStore(), { lang } = useLang(), nl = lang === "nl";
  const [now, setNow] = useState(() => Date.now());
  const [range, setRange] = useState<RangeFilter>({ preset: "30d" });
  const [dailyOpen, setDailyOpen] = useState(false), [dailyPage, setDailyPage] = useState(1);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const matches = useMemo(() => makeRangeCheck(range, now), [range, now]);
  const summary = useMemo(() => summarizeOrders(orders, products, matches), [orders, products, matches]);
  const daily = useMemo(() => buildDailyMetrics(orders, range, now), [orders, range, now]);
  const dailyPages = Math.max(1, Math.ceil(daily.length / 30)), activePage = Math.min(dailyPage, dailyPages);
  return <div className={styles.stack}>
    <section className={styles.panel} aria-label={nl ? "Periodefilter" : "Period filter"}><AdminDateRange value={range} onChange={value => { setRange(value); setDailyPage(1); }} now={now} lang={lang} /></section>
    <div className={styles.metrics}>{[
      [nl ? "Bestelwaarde" : "Order value", money(summary.bookedValue, lang), nl ? "Betaald + nog onbetaald zakelijk" : "Paid + unpaid company orders"],
      [nl ? "Betaalde waarde" : "Paid value", money(summary.paidValue, lang), nl ? "Bestellingen met betaald-status" : "Orders marked paid"],
      [nl ? "Zakelijk onbetaald" : "Company unpaid", money(summary.unpaidCompanyValue, lang), nl ? "Onderdeel van de bestelwaarde" : "Included in order value"],
      [nl ? "Bestellingen" : "Orders", summary.count, `${nl ? "Gemiddeld" : "Average"} ${money(summary.average, lang)}`],
    ].map(([label, value, note]) => <div className={styles.metric} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    <p className={styles.notice}>{nl ? "Bestelwaarde omvat betaalde bestellingen en alle zakelijke bestellingen, inclusief onbetaalde facturen. Dit is geen ontvangen omzet of boekhoudrapport. Kortingen en bezorgkosten zitten in de besteltotalen." : "Order value includes paid orders and all company orders, including unpaid invoices. It is not cash received or an accounting report. Order totals include discounts and delivery fees."} {summary.excluded > 0 && `${summary.excluded} ${nl ? "onbetaalde particuliere bestellingen zijn uitgesloten." : "unpaid personal orders are excluded."}`}</p>
    <div id="workspace-progress" tabIndex={-1}><DailySalesChart data={daily} title={nl ? "Dagverloop" : "Daily progress"} revenueLabel={nl ? "Bestelwaarde (€)" : "Order value (€)"} ordersLabel={nl ? "Bestellingen (eigen schaal)" : "Orders (separate scale)"} noData={nl ? "Geen gegevens voor deze periode." : "No data for this period."} /></div>
    <section className={styles.panel}><div className={styles.panelHeader}><button type="button" className={styles.button} aria-expanded={dailyOpen} onClick={() => setDailyOpen(!dailyOpen)}>{nl ? "Dagtabel" : "Daily table"} · {daily.length} {nl ? "dagen" : "days"}</button><button type="button" className={styles.button} onClick={() => downloadCsv("daily-progress.csv", [["Amsterdam date", "Order value EUR", "Orders"], ...daily.map(item => [item.date, item.revenue.toFixed(2), item.orders])])}>{nl ? "CSV exporteren" : "Export CSV"}</button></div>{dailyOpen && <><table className={styles.dataTable}><caption className={styles.muted}>Europe/Amsterdam · {nl ? "Gekozen periode" : "Selected period"}</caption><thead><tr><th>{nl ? "Datum" : "Date"}</th><th>{nl ? "Bestelwaarde" : "Order value"}</th><th>{nl ? "Bestellingen" : "Orders"}</th></tr></thead><tbody>{daily.slice((activePage - 1) * 30, activePage * 30).map(item => <tr key={item.date}><td>{item.date}</td><td>{money(item.revenue, lang)}</td><td>{item.orders}</td></tr>)}</tbody></table><div className={styles.pager}><span>{activePage}/{dailyPages}</span><div><button type="button" className={styles.button} disabled={activePage === 1} onClick={() => setDailyPage(activePage - 1)}>{nl ? "Vorige" : "Previous"}</button><button type="button" className={styles.button} disabled={activePage === dailyPages} onClick={() => setDailyPage(activePage + 1)}>{nl ? "Volgende" : "Next"}</button></div></div></>}</section>
    <div className={styles.twoColumns}><section className={styles.panel}><div className={styles.panelHeader}><h2>{nl ? "Verkoop per categorie" : "Sales by category"}</h2></div><p className={styles.muted}>{nl ? "Bruto artikelbedragen vóór bestelbrede korting, punten en bezorgkosten." : "Gross item amounts before order-wide discounts, points and delivery."}</p>{summary.categories.length ? <ul className={styles.rows}>{summary.categories.map(item => <li className={`${styles.row} py-3`} key={item.name}><div className="flex items-center justify-between gap-3 text-sm"><span>{item.name}</span><strong>{money(item.gross, lang)}</strong></div><div className={styles.bar}><span style={{ width: `${Math.max(0, item.gross / Math.max(1, summary.categories[0].gross) * 100)}%` }} /></div></li>)}</ul> : <p className={styles.empty}>—</p>}</section><section className={styles.panel}><div className={styles.panelHeader}><h2>{nl ? "Meest bestelde artikelen" : "Most ordered items"}</h2></div><p className={styles.muted}>{nl ? "Aantal en bruto artikelwaarde binnen de gekozen periode." : "Quantity and gross item value in the selected period."}</p><ol className={styles.rows}>{summary.products.slice(0, 10).map(item => <li key={item.id} className={`${styles.row} flex items-center justify-between gap-3 py-3 text-sm`}><span>{item.name}<small className="block">{item.quantity}×</small></span><strong>{money(item.gross, lang)}</strong></li>)}</ol></section></div>
    <CustomerInsights matches={matches} />
  </div>;
}
