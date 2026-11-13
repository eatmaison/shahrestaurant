"use client";
import Link from "next/link";
import { useLang, useStore } from "../providers";
import { makeRangeCheck } from "../lib/adminMetrics";
import { money, downloadCsv } from "./adminFormat";
import { AdminAttention } from "./AdminAttention";
import styles from "./admin.module.css";

export function AdminOverview() {
  const { lang } = useLang(), nl = lang === "nl";
  const { orders, reservations, users, vipRequests, dataUpdatedAt } = useStore();
  const today = makeRangeCheck({ preset: "today" }, dataUpdatedAt);
  const paidToday = orders.filter(order => order.paid && today(order.createdAt)).reduce((sum, order) => sum + Math.round(order.total * 100), 0) / 100;
  const inProgress = orders.filter(order => order.status !== "delivered" && (order.paid || order.accountType === "company" || order.paymentMethod === "pay_on_pickup")).length;
  const pendingReservations = reservations.filter(item => item.status === "pending").length;
  return <section id="workspace-overview" className={`${styles.stack} mb-6`}>
    <div className={styles.metrics}>{[
      [nl ? "Vandaag betaald" : "Paid today", money(paidToday, lang), "/admin/stats"],
      [nl ? "Lopende bestellingen" : "Orders in progress", inProgress, "#workspace-orders"],
      [nl ? "Reserveringen in afwachting" : "Pending reservations", pendingReservations, "#workspace-reservations"],
      [nl ? "Geregistreerde accounts" : "Registered accounts", users.length, "/admin/customers"],
    ].map(([label, value, href]) => <Link prefetch={false} key={label} href={String(href)} className={styles.metric} style={{ display: "block", textDecoration: "none" }}><span>{label}</span><strong>{value}</strong></Link>)}</div>
    <div className={styles.tools}><button type="button" className={styles.button} onClick={() => downloadCsv("orders.csv", [["Order", "Customer", "Created", "Status", "Total EUR", "Paid"], ...orders.map(order => [order.orderNumber, order.customerName, new Date(order.createdAt).toISOString(), order.status, order.total.toFixed(2), order.paid ? "yes" : "no"])])}>{nl ? "Bestellingen exporteren" : "Export orders"}</button><Link prefetch={false} href="/admin/customers" className={styles.button}>{users.filter(user => !user.emailVerified).length} {nl ? "onbevestigde e-mails" : "unverified emails"}</Link><a href="#workspace-vip" className={styles.button}>{vipRequests.filter(request => request.status === "pending").length} {nl ? "VIP-aanvragen" : "VIP requests"}</a></div>
    <AdminAttention />
  </section>;
}
