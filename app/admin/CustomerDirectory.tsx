"use client";
import { useMemo, useState } from "react";
import { useLang, useStore } from "../providers";
import type { AccountType, User } from "../lib/types";
import { WorkspaceDialog } from "../components/WorkspaceDialog";
import { absoluteTime, relativeTime, downloadCsv, money } from "./adminFormat";
import styles from "./admin.module.css";

type Change = { user: User; kind: "verification" } | { user: User; kind: "type"; next: AccountType };

export function CustomerDirectory({ now }: { now: number }) {
  const { users, orders, recentVisitors, vipPurchases, vipRequests, setUserEmailVerified, setUserAccountType } = useStore();
  const { lang } = useLang(), nl = lang === "nl";
  const [query, setQuery] = useState(""), [filter, setFilter] = useState("all"), [sort, setSort] = useState("newest"), [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string>(), [change, setChange] = useState<Change>();
  const [saving, setSaving] = useState(false), [feedback, setFeedback] = useState<{ error: boolean; text: string }>();
  const [copied, setCopied] = useState("");
  const visitors = useMemo(() => new Map(recentVisitors.filter(item => item.kind === "user").map(item => [item.id, item])), [recentVisitors]);
  const online = (user: User) => !!user.lastSeenAt && now >= user.lastSeenAt && now - user.lastSeenAt < 300_000;
  const counts = { all: users.length, online: users.filter(online).length, unverified: users.filter(user => !user.emailVerified).length, vip: users.filter(user => user.isVip).length, company: users.filter(user => user.accountType === "company").length };
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return users.filter(user => (filter !== "online" || (!!user.lastSeenAt && now >= user.lastSeenAt && now - user.lastSeenAt < 300_000)) && (filter !== "unverified" || !user.emailVerified) && (filter !== "vip" || user.isVip) && (filter !== "company" || user.accountType === "company") && (!text || [user.name, user.email, user.phone, user.address, user.postcode, user.btw, user.kvk].join(" ").toLowerCase().includes(text))).sort((a, b) => {
      if (sort === "activity") return (b.lastSeenAt || 0) - (a.lastSeenAt || 0) || a.id.localeCompare(b.id);
      if (sort === "orders") return b.orderCount - a.orderCount || a.id.localeCompare(b.id);
      if (sort === "points") return b.points - a.points || a.id.localeCompare(b.id);
      return b.createdAt - a.createdAt || a.id.localeCompare(b.id);
    });
  }, [users, query, filter, sort, now]);
  const pages = Math.max(1, Math.ceil(filtered.length / 25)), activePage = Math.min(page, pages), rows = filtered.slice((activePage - 1) * 25, activePage * 25);
  const orderMap = useMemo(() => {
    const map = new Map<string, typeof orders>();
    for (const order of orders) if (order.userId) { const list = map.get(order.userId) || []; list.push(order); map.set(order.userId, list); }
    for (const list of map.values()) list.sort((a, b) => b.createdAt - a.createdAt);
    return map;
  }, [orders]);
  async function copy(value: string) { try { await navigator.clipboard.writeText(value); setCopied(value); } catch { setFeedback({ error: true, text: nl ? "Kopiëren is niet beschikbaar in deze browser." : "Copy is unavailable in this browser." }); } }
  async function save() {
    if (!change || saving) return;
    setSaving(true); setFeedback(undefined);
    try {
      const result = change.kind === "verification" ? await setUserEmailVerified(change.user.id, !change.user.emailVerified) : await setUserAccountType(change.user.id, change.user.accountType, change.next);
      if (result.ok) { setFeedback({ error: false, text: nl ? "Account bijgewerkt." : "Account updated." }); setChange(undefined); }
      else setFeedback({ error: true, text: "error" in result && result.error === "stale" ? (nl ? "Het account is ondertussen gewijzigd. Ververs en probeer opnieuw." : "The account changed meanwhile. Refresh and try again.") : (nl ? "Niet opgeslagen. Controleer de gegevens en probeer opnieuw." : "Not saved. Check the details and try again.") });
    } catch { setFeedback({ error: true, text: nl ? "Niet opgeslagen. Probeer opnieuw." : "Not saved. Try again." }); }
    finally { setSaving(false); }
  }

  return <section className={styles.panel} id="workspace-users" aria-labelledby="directory-title">
    <div className={styles.panelHeader}><div><h2 id="directory-title">{nl ? "Geregistreerde accounts" : "Registered accounts"}</h2><p className={styles.muted}>{nl ? "Alle accounts blijven bereikbaar. Uitgebreide gegevens en acties staan achter Details." : "Every account remains reachable. Details opens the full information and actions."}</p></div><button className={styles.button} type="button" onClick={() => downloadCsv("registered-accounts.csv", [["Name", "Email", "Phone", "Account type", "Email verified", "Joined"], ...filtered.map(user => [user.name, user.email, user.phone, user.accountType, user.emailVerified ? "yes" : "no", new Date(user.createdAt).toISOString()])])}>{nl ? "CSV exporteren" : "Export CSV"}</button></div>
    <div className={styles.filterTabs}>{([
      ["all", nl ? "Alle" : "All"], ["online", "Online"], ["unverified", nl ? "E-mail onbevestigd" : "Email unverified"], ["vip", "VIP"], ["company", nl ? "Zakelijk" : "Company"],
    ] as const).map(([value, label]) => <button key={value} className={styles.button} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1); }}>{label} <span className={styles.badge}>{counts[value]}</span></button>)}</div>
    <div className={`${styles.filters} mt-4`}><label className={styles.search}>{nl ? "Naam, e-mail, telefoon of adres" : "Name, email, phone or address"}<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label><label>{nl ? "Sorteren" : "Sort"}<select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="newest">{nl ? "Nieuwste accounts" : "Newest accounts"}</option><option value="activity">{nl ? "Laatste activiteit" : "Latest activity"}</option><option value="orders">{nl ? "Voltooide bestellingen" : "Completed orders"}</option><option value="points">{nl ? "Punten" : "Points"}</option></select></label>{(query || filter !== "all" || sort !== "newest") && <button type="button" className={styles.button} onClick={() => { setQuery(""); setFilter("all"); setSort("newest"); setPage(1); }}>{nl ? "Filters wissen" : "Clear filters"}</button>}</div>
    {feedback && <p role={feedback.error ? "alert" : "status"} className={`${styles.notice} ${feedback.error ? styles.error : ""} mt-4`}>{feedback.text}</p>}
    <ul className={styles.rows} aria-label={nl ? "Accountregister" : "Account directory"}>{rows.map(user => {
      const open = expanded === user.id, visitor = visitors.get(user.id), history = orderMap.get(user.id) || [];
      return <li key={user.id} className={styles.row} data-account-row>
        <div className={styles.rowSummary}><div><strong>{user.name}</strong><p className={styles.break}>{user.email}</p></div><div className={styles.badges}><span className={styles.badge}>{user.role === "admin" ? "Admin" : user.accountType === "company" ? (nl ? "Zakelijk" : "Company") : (nl ? "Particulier" : "Personal")}</span>{user.isVip && <span className={`${styles.badge} ${styles.gold}`}>VIP</span>}<span className={styles.badge}>{user.emailVerified ? (nl ? "E-mail bevestigd" : "Email verified") : (nl ? "E-mail onbevestigd" : "Email unverified")}</span></div><div><strong>{user.orderCount}</strong><p>{nl ? "voltooid" : "completed"} · {user.points} {nl ? "punten" : "points"}</p></div><div><span className={online(user) ? styles.online : styles.muted}>{online(user) ? "Online" : relativeTime(user.lastSeenAt, now, lang)}</span></div><button className={styles.button} type="button" aria-expanded={open} aria-controls={`account-detail-${user.id}`} onClick={() => { setExpanded(open ? undefined : user.id); setCopied(""); }}>{open ? (nl ? "Sluiten" : "Close") : "Details"}</button></div>
        <div id={`account-detail-${user.id}`} hidden={!open}>{open && <div className={styles.details}>
          <dl className={styles.detailGrid}><div><dt>{nl ? "Contact" : "Contact"}</dt><dd><a href={`mailto:${user.email}`}>{user.email}</a>{user.phone && <><br /><a href={`tel:${user.phone.replace(/[^\d+]/g, "")}`}>{user.phone}</a></>}</dd></div><div><dt>{nl ? "Bezorgadres" : "Delivery address"}</dt><dd>{[user.address, user.postcode].filter(Boolean).join(", ") || "—"}</dd></div><div><dt>{nl ? "Aangemeld" : "Joined"}</dt><dd>{absoluteTime(user.createdAt, lang)}</dd></div><div><dt>{nl ? "Laatst waargenomen" : "Last observed"}</dt><dd>{absoluteTime(user.lastSeenAt, lang)}{user.lastSeenSite && ` · ${user.lastSeenSite}`}</dd></div><div><dt>{nl ? "BTW / KvK" : "VAT / KVK"}</dt><dd>{user.btw || "—"} / {user.kvk || "—"}</dd></div><div><dt>VIP</dt><dd>{!user.isVip ? "—" : vipPurchases.some(item => item.userId === user.id && item.status === "paid") ? (nl ? "Aangekocht" : "Purchased") : vipRequests.some(item => item.userId === user.id && item.status === "approved") ? (nl ? "Kaart goedgekeurd" : "Card approved") : (nl ? "Handmatig toegekend" : "Manually assigned")}</dd></div><div><dt>{nl ? "Reserveringen / aangekomen" : "Reservations / arrived"}</dt><dd>Shah: {visitor?.tandoorReservationCount || 0} / {visitor?.tandoorArrivedCount || 0}<br />Maison: {visitor?.maisonReservationCount || 0} / {visitor?.maisonArrivedCount || 0}</dd></div><div><dt>{nl ? "Geschatte activiteit (bestaand)" : "Estimated activity (legacy)"}</dt><dd>{Math.round((user.activeSeconds || 0) / 60)} {nl ? "minuten" : "minutes"}<p className={styles.muted}>{nl ? "Schatting uit verzoekintervallen, geen gemeten aandacht." : "Estimated from request intervals, not measured attention."}</p></dd></div></dl>
          <div className={styles.actions}><button className={styles.button} type="button" onClick={() => void copy(user.email)}>{copied === user.email ? (nl ? "Gekopieerd" : "Copied") : (nl ? "E-mail kopiëren" : "Copy email")}</button>{user.phone && <button className={styles.button} type="button" onClick={() => void copy(user.phone!)}>{copied === user.phone ? (nl ? "Gekopieerd" : "Copied") : (nl ? "Telefoon kopiëren" : "Copy phone")}</button>}<button className={styles.button} type="button" onClick={() => { setFeedback(undefined); setChange({ user, kind: "verification" }); }}>{user.emailVerified ? (nl ? "E-mailbevestiging intrekken" : "Revoke email verification") : (nl ? "E-mail bevestigen" : "Verify email")}</button>{user.role === "user" && <label className={styles.muted}>{nl ? "Accounttype" : "Account type"}<select className={`${styles.button} ml-2`} value={user.accountType} onChange={event => { const next = event.target.value as AccountType; if (next !== user.accountType) { setFeedback(undefined); setChange({ user, kind: "type", next }); } }}><option value="personal">{nl ? "Particulier" : "Personal"}</option><option value="company" disabled={!user.btw?.trim() || !user.kvk?.trim()}>{nl ? "Zakelijk" : "Company"}</option></select></label>}</div>
          <details className="mt-4"><summary className={`${styles.button} cursor-pointer`}>{nl ? "Geladen bestelgeschiedenis" : "Loaded order history"} · {history.length}</summary><ul className="mt-3 space-y-2">{history.map(order => <li key={order.id} className="border-b py-2 text-xs"><strong>#{order.orderNumber}</strong> · {absoluteTime(order.createdAt, lang)} · {money(order.total, lang)} · {order.paid ? (nl ? "Betaald" : "Paid") : (nl ? "Onbetaald" : "Unpaid")}<p className={styles.muted}>{order.items.map(item => `${item.qty}× ${item.name}`).join(", ")}</p></li>)}</ul></details>
          <p className={`${styles.muted} mt-3`}>{nl ? "De rijteller toont het opgeslagen aantal voltooide bestellingen. De geschiedenis bevat ook lopende en onbetaalde bestellingen." : "The row counter is the stored completed-order count. History also includes open and unpaid orders."}</p>
        </div>}</div>
      </li>;
    })}</ul>
    {!rows.length && <p className={styles.empty}>{nl ? "Geen accounts voor deze selectie." : "No accounts for this selection."}</p>}
    <div className={styles.pager}><span>{filtered.length} / {users.length} {nl ? "accounts" : "accounts"} · {activePage}/{pages}</span><div><button className={styles.button} type="button" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>{nl ? "Vorige" : "Previous"}</button><button className={styles.button} type="button" disabled={activePage === pages} onClick={() => setPage(activePage + 1)}>{nl ? "Volgende" : "Next"}</button></div></div>
    {change && <WorkspaceDialog titleId="account-change-title" onClose={() => { if (!saving) setChange(undefined); }}><div className={styles.dialogBody}><h2 id="account-change-title">{nl ? "Accountwijziging bevestigen" : "Confirm account change"}</h2><p><strong>{change.user.name}</strong> · {change.user.email}</p><p className="mt-3">{change.kind === "verification" ? (nl ? "Dit wijzigt de e-mailbevestiging administratief; er wordt geen e-mail verzonden." : "This changes email verification administratively; it does not send an email.") : (nl ? `Accounttype wijzigen naar ${change.next === "company" ? "zakelijk" : "particulier"}. Dit geldt alleen voor nieuwe bestellingen; bestaande bestellingen blijven intact.` : `Change account type to ${change.next}. This applies to new orders; existing orders remain intact.`)}</p>{feedback?.error && <p role="alert" className={styles.error}>{feedback.text}</p>}<div className={styles.actions}><button type="button" className={styles.button} disabled={saving} onClick={() => setChange(undefined)}>{nl ? "Annuleren" : "Cancel"}</button><button type="button" className={`${styles.button} ${styles.primary}`} disabled={saving} onClick={() => void save()}>{saving ? (nl ? "Opslaan…" : "Saving…") : (nl ? "Bevestigen" : "Confirm")}</button></div></div></WorkspaceDialog>}
  </section>;
}
