"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { useLang } from "../providers";
import type { Order } from "../lib/types";
import { adminMatches, listPage } from "../lib/adminList";
import { absoluteTime, money } from "./adminFormat";
import { AdminPagination, usePageSize } from "./AdminPagination";
import styles from "./admin.module.css";
export function AdminOrderHistory({ orders, id }: { orders: readonly Order[]; id: string }) {
  const { lang } = useLang(), nl = lang === "nl";
  const [open, setOpen] = useState(false), [query, setQuery] = useState(""), [payment, setPayment] = useState("all"), [page, setPage] = useState(1);
  const [size, setSize] = usePageSize("history", 10), deferred = useDeferredValue(query), target = `history-${encodeURIComponent(id)}`;
  const filtered = useMemo(() => orders.filter(order => (payment === "all" || (payment === "paid" ? order.paid : !order.paid)) && adminMatches(deferred, [order.orderNumber, ...order.items.map(item => item.name)])).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id)), [orders, payment, deferred]);
  const result = listPage(filtered, page, size);
  return <details className="mt-4" open={open} onToggle={event => setOpen(event.currentTarget.open)}><summary className={`${styles.button} cursor-pointer`}>{nl ? "Geladen bestelgeschiedenis" : "Loaded order history"} · {orders.length}</summary>{open && <div className="mt-3">
    <h3 id={target} tabIndex={-1} className={styles.resultHeading}>{nl ? "Bestellingen in deze browser geladen" : "Orders loaded in this browser"}</h3>
    <div className={styles.filters}><label className={styles.search}>{nl ? "Bestelnummer of gerecht" : "Order number or dish"}<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label><label>{nl ? "Betaling" : "Payment"}<select value={payment} onChange={event => { setPayment(event.target.value); setPage(1); }}><option value="all">{nl ? "Alles" : "All"}</option><option value="paid">{nl ? "Betaald" : "Paid"}</option><option value="unpaid">{nl ? "Onbetaald" : "Unpaid"}</option></select></label></div>
    <ul aria-busy={query !== deferred} className={styles.rows}>{result.items.map(order => <li key={order.id} className={`${styles.row} py-3 text-sm`}><div className={styles.panelHeader}><strong>#{order.orderNumber}</strong><strong>{money(order.total, lang)}</strong></div><p className={styles.muted}>{absoluteTime(order.createdAt, lang)} · {order.paid ? (nl ? "Betaald" : "Paid") : (nl ? "Onbetaald" : "Unpaid")} · {order.accountType === "company" ? (nl ? "Zakelijk" : "Company") : (nl ? "Particulier" : "Personal")}</p><p>{order.items.map(item => `${item.qty}× ${item.name}`).join(", ")}</p></li>)}</ul>
    {!result.total && <p role="status" className={styles.empty}>{nl ? "Geen bestellingen voor deze selectie." : "No orders match this selection."}</p>}
    <AdminPagination {...result} size={size} onPage={setPage} onSize={setSize} target={target} label={nl ? "Bestellingen" : "Orders"} />
  </div>}</details>;
}
