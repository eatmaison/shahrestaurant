"use client";
import workspace from "../components/Workspace.module.css";
import { WorkspaceDialog } from "../components/WorkspaceDialog";

import { OrderTotals } from "../components/OrderTotals";


import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaBagShopping, FaBoxOpen, FaBuilding, FaCalendarCheck, FaChevronDown, FaClock, FaCrown, FaEnvelope, FaFileInvoice, FaLocationDot, FaLock, FaMagnifyingGlass, FaMoneyBillWave, FaNoteSticky, FaPhone, FaReceipt, FaCircleCheck, FaCircleExclamation, FaShareNodes, FaSpinner, FaStore, FaTrash, FaTruck, FaUser, FaUserGroup, FaUtensils, FaXmark } from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { formatOrderNumber, ORDER_STATUS_FLOW } from "../lib/data";
import { SOCIAL_PLATFORMS } from "../components/socialIcons";
import dynamic from "next/dynamic";
import { AdminOverview } from "./AdminOverview";
import adminStyles from "./admin.module.css";
const PhoneAgentPanel = dynamic(() => import("./PhoneAgentPanel"));
import type { Order, OrderStatus } from "../lib/types";
import type { RestaurantOpenOverride } from "../lib/openingHours";
import { amsterdamDateKey, makeRangeCheck, rangeFilterError, type RangeFilter } from "../lib/adminMetrics";

const statusIcons: Record<OrderStatus, typeof FaClock> = {
  new: FaClock,
  preparing: FaBoxOpen,
  delivery: FaTruck,
  delivered: FaCircleCheck,
};

const normalizeCustomerAddress = (address: string, postcode: string): string =>
  `${address} ${postcode}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();


const ADMIN_INITIAL_NOW = Date.now();

export default function AdminPage() {
  const { t, lang } = useLang();
  const { currentUser, orders, users, brands, updateOrderStatus, setOrderPaid, setInvoiceSent, deleteOrder, vipRequests, vipPurchases, approveVipRequest, rejectVipRequest, socialLinks, updateSocialLink, reservations, restaurantStatus, updateRestaurantOpenOverride, setReservationStatus, cancelReservation, deleteReservation, recentVisitors, hydrated } = useStore();
  const [now, setNow] = useState(ADMIN_INITIAL_NOW);
  useEffect(() => { if (window.location.hash === "#workspace-products") window.location.replace("/admin/products"); }, []);
  const [restaurantStatusSaving, setRestaurantStatusSaving] = useState<RestaurantOpenOverride | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);


  // Order search filters (by customer/company name or order number).
  const [customerSearch, setCustomerSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(() => new Set());
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [customerOrdersLimit, setCustomerOrdersLimit] = useState(20);
  const [companyOrdersLimit, setCompanyOrdersLimit] = useState(20);
  const [selectedCustomer, setSelectedCustomer] = useState<{ key: string; name: string; address: string; userId?: string } | null>(null);


  const [ordersRange, setOrdersRange] = useState<RangeFilter>({ preset: "all" });
  const ordersCheck = useMemo(() => makeRangeCheck(ordersRange, now), [ordersRange, now]);


  const changeRestaurantStatus = async (override: RestaurantOpenOverride) => {
    setRestaurantStatusSaving(override);
    try {
      await updateRestaurantOpenOverride(override);
    } finally {
      setRestaurantStatusSaving(null);
    }
  };

  /** Reservation list filter: upcoming (pending/confirmed, today onwards) or all. */
  const [resFilter, setResFilter] = useState<"upcoming" | "all">("upcoming");
  const [resView, setResView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const visibleReservations = useMemo(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const list =
      resFilter === "upcoming"
        ? reservations.filter((r) => r.date >= today && (r.status === "pending" || r.status === "confirmed"))
        : [...reservations].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    return list;
  }, [reservations, resFilter]);
  const calendarReservations = useMemo(() => reservations.filter((reservation) => reservation.date.startsWith(calendarMonth)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [calendarMonth, reservations]);
  const calendarDays = useMemo(() => Array.from({ length: new Date(Number(calendarMonth.slice(0, 4)), Number(calendarMonth.slice(5, 7)), 0).getDate() }, (_, index) => {
    const date = `${calendarMonth}-${String(index + 1).padStart(2, "0")}`;
    return { date, reservations: calendarReservations.filter((reservation) => reservation.date === date) };
  }), [calendarMonth, calendarReservations]);

  // Social links panel is collapsed by default to save space in the admin panel.
  const [socialDrafts, setSocialDrafts] = useState<Record<string, string>>({});
  const [socialSavedFor, setSocialSavedFor] = useState<string | null>(null);
  const lastSeenSiteLabel = (site?: string): string | null => site ? ({ eattogo: "Eat to go", themaison: "The Maison", tandoor: "Shah Restaurant" }[site] ?? site) : null;
  const [socialOpen, setSocialOpen] = useState(false);
  const socialUrl = (platform: string): string =>
    socialDrafts[platform] ?? socialLinks.find((l) => l.platform === platform)?.url ?? "";

  const saveSocialUrl = async (platform: (typeof SOCIAL_PLATFORMS)[number]["id"]) => {
    const stored = socialLinks.find((l) => l.platform === platform);
    const url = socialUrl(platform).trim();
    if (url === (stored?.url ?? "")) return;
    const res = await updateSocialLink(platform, url, stored?.enabled ?? false);
    if (res.ok) {
      setSocialSavedFor(platform);
      setTimeout(() => setSocialSavedFor((p) => (p === platform ? null : p)), 2000);
    }
  };

  const toggleSocial = async (platform: (typeof SOCIAL_PLATFORMS)[number]["id"]) => {
    const stored = socialLinks.find((l) => l.platform === platform);
    await updateSocialLink(platform, socialUrl(platform).trim(), !(stored?.enabled ?? false));
  };

  const customerOrdersForSelection = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter((order) => selectedCustomer.userId
      ? order.userId === selectedCustomer.userId
      : !order.userId && normalizeCustomerAddress(order.address, order.postcode) === selectedCustomer.key.slice(8));
  }, [orders, selectedCustomer]);

  const selectedCustomerVisitor = useMemo(
    () => selectedCustomer?.userId ? recentVisitors.find((visitor) => visitor.kind === "user" && visitor.id === selectedCustomer.userId) : undefined,
    [recentVisitors, selectedCustomer]
  );

  if (!hydrated) {
    return <div role="status" className={`${workspace.page} ${workspace.loading} mx-auto max-w-md px-4 py-20 text-center`}>{lang === "nl" ? "Dashboard laden…" : "Loading dashboard…"}<noscript><p>{lang === "nl" ? "JavaScript is vereist voor het beheer." : "JavaScript is required for admin tools."}</p></noscript></div>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div data-workspace="denied" className={`${workspace.page} ${workspace.denied} mx-auto max-w-md px-4 py-20 text-center`}>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
          <FaLock />
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">{t.admin.accessDenied}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.admin.accessDeniedText}</p>
        <Link href="/account" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
          {t.common.signIn}
        </Link>
      </div>
    );
  }


  /** Shared, inclusive calendar-day range for statistics and order management. */
  const renderRangeFilter = (value: RangeFilter, onChange: (f: RangeFilter) => void) => {
    const error = rangeFilterError(value);
    const errorText = error === "incomplete" ? t.admin.filterIncompleteRange : error === "invalid" ? t.admin.filterInvalidRange : "";
    const today = amsterdamDateKey(now);
    return (
      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", t.admin.filterAll], ["today", t.admin.filterToday],
          ["7d", t.admin.filterWeek], ["30d", t.admin.filterMonth],
        ] as const).map(([preset, label]) => (
          <button key={preset} onClick={() => onChange({ preset })}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${value.preset === preset
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
              : "bg-slate-100 text-slate-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-white/10 dark:text-slate-300"}`}>
            {label}
          </button>
        ))}
        {([ ["startDate", t.admin.filterStartDate], ["endDate", t.admin.filterEndDate] ] as const).map(([field, label]) => (
          <label key={field} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {label}
            <input type="date" value={value.preset === "date" ? value[field] ?? "" : ""} max={today}
              min={field === "endDate" && value.preset === "date" ? value.startDate : undefined}
              onChange={(event) => onChange({
                ...(value.preset === "date" ? value : {}), preset: "date", [field]: event.target.value,
              })}
              aria-label={label} aria-invalid={Boolean(error)} title={label}
              className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none transition focus:border-emerald-500 dark:bg-white/10 dark:text-white ${value.preset === "date"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:text-slate-300"}`} />
          </label>
        ))}
        <span className="text-xs text-slate-500 dark:text-slate-400">{t.admin.filterTimeZone}</span>
        {errorText && <p role="status" className="w-full text-xs font-semibold text-amber-700 dark:text-amber-300">{errorText}</p>}
      </div>
    );
  };

  const statusLabel = (s: OrderStatus): string =>
    s === "new"
      ? t.fulfillment.statusNew
      : s === "preparing"
        ? t.fulfillment.statusPreparing
        : s === "delivery"
          ? t.fulfillment.statusDelivery
          : t.fulfillment.statusDelivered;

  const paymentLabel = (o: Order): string => {
    if (o.paid) return t.fulfillment.paid;
    if (o.paymentMethod === "pay_on_pickup") return lang === "nl" ? "Betalen bij afhalen" : "Pay on pickup";
    if (o.accountType === "company") return t.fulfillment.invoiced;
    if (o.paymentStatus === "failed") return t.fulfillment.paymentFailed;
    if (o.paymentStatus === "canceled") return t.fulfillment.paymentCanceled;
    if (o.paymentStatus === "expired") return t.fulfillment.paymentExpired;
    if (o.paymentStatus === "pending" || o.paymentStatus === "authorized") return t.fulfillment.paymentPending;
    return t.fulfillment.paymentOpen;
  };

  const paymentClass = (o: Order): string => {
    if (o.paid) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    if (o.accountType === "company") return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    if (o.paymentStatus === "failed" || o.paymentStatus === "canceled" || o.paymentStatus === "expired") {
      return "bg-red-500/10 text-red-700 dark:text-red-300";
    }
    return "bg-amber-400/15 text-amber-700 dark:text-amber-300";
  };

  // The button that advances an order to its next status, or null when delivered.
  const nextAction = (s: OrderStatus): { next: OrderStatus; label: string } | null => {
    if (s === "new") return { next: "preparing", label: t.fulfillment.startPreparing };
    if (s === "preparing") return { next: "delivery", label: t.fulfillment.sendToCourier };
    if (s === "delivery") return { next: "delivered", label: t.fulfillment.markDelivered };
    return null;
  };

  const customerOrders = orders.filter((o) => o.accountType !== "company");
  const companyOrders = orders.filter((o) => o.accountType === "company");

  // Match an order against a search query (name/company or order number).
  const matchesOrder = (o: Order, query: string): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.customerName.toLowerCase().includes(q) ||
      formatOrderNumber(o.orderNumber).toLowerCase().includes(q) ||
      String(o.orderNumber).includes(q)
    );
  };

  const filteredCustomerOrders = customerOrders.filter((o) => ordersCheck(o.createdAt) && matchesOrder(o, customerSearch));
  const filteredCompanyOrders = companyOrders.filter((o) => ordersCheck(o.createdAt) && matchesOrder(o, companySearch));

  const openCustomerProfile = (order: Order) => {
    const user = order.userId ? users.find((item) => item.id === order.userId) : undefined;
    const key = order.userId ? `user:${order.userId}` : `address:${normalizeCustomerAddress(order.address, order.postcode)}`;
    setSelectedCustomer({ key, name: user?.name ?? order.customerName, address: `${order.address}, ${order.postcode}`.replace(/^, |, $/g, ""), userId: order.userId });
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const copyOrderNumber = async (o: Order) => {
    try {
      await navigator.clipboard.writeText(formatOrderNumber(o.orderNumber));
      setCopiedOrderId(o.id);
      window.setTimeout(() => setCopiedOrderId((cur) => (cur === o.id ? null : cur)), 1500);
    } catch {
      /* clipboard unavailable - ignore */
    }
  };

  const confirmDeleteOrder = (o: Order) => {
    if (window.confirm(t.admin.deleteOrderConfirm)) deleteOrder(o.id);
  };

  const renderOrderCard = (o: Order) => {
    const action = nextAction(o.status);
    if (action && o.paymentMethod === "pay_on_pickup" && o.status === "preparing") action.label = lang === "nl" ? "Klaar voor afhalen" : "Ready for pickup";
    if (action && o.paymentMethod === "pay_on_pickup" && o.status === "delivery") action.label = lang === "nl" ? "Afgehaald" : "Collected";
    const currentStep = ORDER_STATUS_FLOW.indexOf(o.status);
    const account = o.userId ? users.find((u) => u.id === o.userId) : undefined;
    const isCompany = o.accountType === "company";
    const isExpanded = expandedOrders.has(o.id);
    const canDeleteExpiredOrder = !o.paid && (o.paymentStatus === "expired" || o.paymentStatus === "canceled" || o.paymentStatus === "failed");
    return (
      <div
        key={o.id}
        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5"
      >
        {/* Top row: customer + payment */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-sm font-black text-slate-900 dark:text-white">
              {isCompany && <FaBuilding className="shrink-0 text-sky-500" />}
              <button type="button" onClick={() => openCustomerProfile(o)} className="truncate text-left hover:text-emerald-600 hover:underline dark:hover:text-emerald-400">{o.customerName}</button>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${o.userId ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                {o.userId ? t.admin.registeredCustomer : t.admin.guestCustomer}
              </span>
              <span className="shrink-0 rounded-full bg-slate-900/90 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white/15">
                {formatOrderNumber(o.orderNumber)}
              </span>
              <button
                type="button"
                onClick={() => copyOrderNumber(o)}
                title={t.admin.copyOrderNumber}
                className="shrink-0 text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {copiedOrderId === o.id ? <FaCircleCheck className="text-emerald-500" /> : <FaReceipt />}
              </button>
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {new Date(o.createdAt).toLocaleString(lang === "nl" ? "nl-NL" : "en-GB")} ·{" "}
              {o.items.reduce((s, i) => s + i.qty, 0)} {t.common.items}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-sm font-black text-slate-900 dark:text-white">€{o.total.toFixed(2)}</span>
            {o.paid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <FaCircleCheck /> {t.fulfillment.paid}
              </span>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${paymentClass(o)}`}>
                  <FaMoneyBillWave /> {paymentLabel(o)}
                </span>
                <button
                  onClick={() => setOrderPaid(o.id, true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white/15 dark:hover:bg-white/25"
                  title={t.fulfillment.markPaid}
                >
                  {t.fulfillment.markPaid}
                </button>
                {canDeleteExpiredOrder && (
                  <button
                    onClick={() => confirmDeleteOrder(o)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-red-500"
                    title={t.fulfillment.deleteExpiredOrder}
                  >
                    <FaTrash /> {t.fulfillment.deleteExpiredOrder}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => toggleOrderExpanded(o.id)}
              aria-expanded={isExpanded}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
            >
              {isExpanded ? t.fulfillment.hideOrderDetails : t.fulfillment.showOrderDetails}
              <FaChevronDown className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
        <div className={isExpanded ? "" : "hidden"}>
        {(!o.paid && (o.paymentFailureReason || o.molliePaymentId)) && (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {o.paymentFailureReason && <span>{t.fulfillment.paymentReason}: {o.paymentFailureReason}</span>}
            {o.molliePaymentId && <span>{t.fulfillment.molliePaymentId}: {o.molliePaymentId}</span>}
          </div>
        )}

        {/* Contact & delivery details */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
              o.fulfillment === "pickup"
                ? "bg-amber-400/20 text-amber-700 dark:text-amber-300"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {o.fulfillment === "pickup" ? <FaBagShopping /> : <FaTruck />}
            {o.fulfillment === "pickup" ? t.order.methodPickup : t.order.methodDelivery}
          </span>
        </div>

        {/* Contact & delivery details */}
        <div className="mt-3 grid gap-1.5 rounded-xl bg-white p-3 text-xs dark:bg-white/5 sm:grid-cols-2">
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FaLocationDot className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            {o.address ? (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${o.address} ${o.postcode}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 underline decoration-dotted hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
              >
                {o.address}
              </a>
            ) : (
              <span className="font-semibold text-slate-900 dark:text-white">-</span>
            )}
            , {o.postcode || "-"}
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FaPhone className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            {o.phone ? <a href={`tel:${o.phone}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">{o.phone}</a> : "-"}
          </p>
          {account?.email && (
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <FaEnvelope className="shrink-0 text-emerald-600 dark:text-emerald-400" /> {account.email}
            </p>
          )}
        </div>

        {/* Company details */}
        {isCompany && (
          <div className="mt-2 rounded-xl border border-sky-300/40 bg-sky-500/5 p-3 dark:border-sky-400/30">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
              <FaBuilding /> {t.fulfillment.companyDetails}
            </p>
            <div className="mt-1.5 grid gap-1 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <span>{t.company.btw}: <span className="font-semibold text-slate-900 dark:text-white">{account?.btw || "-"}</span></span>
              <span>{t.company.kvk}: <span className="font-semibold text-slate-900 dark:text-white">{account?.kvk || "-"}</span></span>
            </div>
            <button
              onClick={() => setInvoiceSent(o.id, !o.invoiceSent)}
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                o.invoiceSent
                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                  : "bg-amber-400/15 text-amber-700 hover:bg-amber-400/30 dark:text-amber-300"
              }`}
            >
              <FaFileInvoice /> {o.invoiceSent ? t.fulfillment.invoiceSent : t.fulfillment.markInvoiceSent}
            </button>
          </div>
        )}

        {/* Items to prepare - grouped by restaurant/brand */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <FaUtensils /> {t.admin.itemsToPrepare}
          </p>
          <div className="mt-2 space-y-3">
            {[...new Set(o.items.map((it) => it.brand))].map((bid) => {
              const cfg = brands.find((b) => b.id === bid);
              const brandItems = o.items.filter((it) => it.brand === bid);
              if (brandItems.length === 0) return null;
              return (
                <div key={bid}>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                    <span className="relative grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200 dark:ring-white/10">
                      {cfg?.logo ? (
                        <Image src={cfg.logo} alt={cfg.name} fill sizes="20px" className="object-contain p-0.5" />
                      ) : (
                        <FaStore className="text-[10px] text-slate-400" />
                      )}
                    </span>
                    {cfg?.name ?? bid}
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                      {brandItems.reduce((s, i) => s + i.qty, 0)}
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {brandItems.map((it) => (
                      <li
                        key={`${it.productId}:${it.sideChoice ?? ""}`}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-white/5"
                      >
                        <span className="grid h-5 min-w-5 place-items-center rounded-md bg-emerald-600 px-1 text-[11px] font-black text-white">
                          {it.qty}×
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-900 dark:text-white">{it.name}</span>
                          {it.sideChoice && (
                            <span className="mt-0.5 block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                              Side: {it.sideLabel ?? it.sideChoice}
                            </span>
                          )}
                        </span>
                        <span className="text-slate-400">{it.category}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">€{(it.price * it.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <OrderTotals order={o} />

        {/* Customer note */}
        {o.note && (
          <div className="mt-2 flex gap-2 rounded-xl border border-amber-300/50 bg-amber-400/10 p-3 text-xs dark:border-amber-400/30">
            <FaNoteSticky className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-300">{t.fulfillment.customerNote}</p>
              <p className="mt-0.5 leading-5 text-slate-700 dark:text-slate-200">{o.note}</p>
            </div>
          </div>
        )}

        {/* Status stepper */}
        <div className="mt-4 flex items-center">
          {ORDER_STATUS_FLOW.map((s, i) => {
            const StepIcon = statusIcons[s];
            const reached = i <= currentStep;
            return (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs transition ${
                      reached
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500"
                    }`}
                  >
                    <StepIcon />
                  </span>
                  <span
                    className={`mt-1 hidden text-[10px] font-semibold sm:block ${
                      reached ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"
                    }`}
                  >
                    {o.paymentMethod === "pay_on_pickup" && s === "delivery" ? (lang === "nl" ? "Klaar voor afhalen" : "Ready for pickup") : o.paymentMethod === "pay_on_pickup" && s === "delivered" ? (lang === "nl" ? "Afgehaald" : "Collected") : statusLabel(s)}
                  </span>
                </div>
                {i < ORDER_STATUS_FLOW.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 rounded-full transition ${
                      i < currentStep ? "bg-emerald-600" : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Action */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/70 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {o.paymentMethod === "pay_on_pickup" && o.status === "delivery" ? (lang === "nl" ? "Klaar voor afhalen" : "Ready for pickup") : o.paymentMethod === "pay_on_pickup" && o.status === "delivered" ? (lang === "nl" ? "Afgehaald" : "Collected") : statusLabel(o.status)}
          </span>
          {action ? (
            <button
              onClick={() => updateOrderStatus(o.id, action.next)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              {action.label}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <FaCircleCheck /> {t.fulfillment.completed}
            </span>
          )}
        </div>
        </div>
      </div>
    );
  };

  return (
    <div data-workspace="admin" className="admin-operations">
      <nav className={adminStyles.sectionLinks} aria-label={lang === "nl" ? "Dagelijkse onderdelen" : "Daily operation sections"}>{[ ["workspace-orders", t.fulfillment.orderManagement], ["workspace-reservations", t.admin.reservationsTitle], ["workspace-vip", t.admin.vipRequests], ["workspace-social", t.admin.socialTitle], ["workspace-phone", lang === "nl" ? "Telefoon" : "Phone"] ].map(([id,label]) => <a key={id} href={"#"+id} onClick={() => { if(id === "workspace-social")setSocialOpen(true); const node=document.getElementById(id); const details=node?.closest("details"); if(details)details.open=true; requestAnimationFrame(()=>node?.focus({preventScroll:true})); }}>{label}</a>)}</nav>

      <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t.admin.restaurantStatusTitle}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`grid h-9 w-9 place-items-center rounded-full ${restaurantStatus.isOpen ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                {restaurantStatus.isOpen ? <FaCircleCheck /> : <FaCircleExclamation />}
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{restaurantStatus.isOpen ? t.admin.restaurantStatusOpen : t.admin.restaurantStatusClosed}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.restaurantStatusSub}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["auto", "open", "closed"] as RestaurantOpenOverride[]).map((override) => {
              const active = restaurantStatus.activeOverride === override;
              const disabled = restaurantStatusSaving !== null;
              return (
                <button
                  key={override}
                  type="button"
                  disabled={disabled}
                  onClick={() => void changeRestaurantStatus(override)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  }`}
                >
                  {restaurantStatusSaving === override ? <FaSpinner className="animate-spin" /> : override === "open" ? <FaCircleCheck /> : override === "closed" ? <FaCircleExclamation /> : <FaClock />}
                  {override === "open" ? t.admin.restaurantStatusSetOpen : override === "closed" ? t.admin.restaurantStatusSetClosed : t.admin.restaurantStatusAuto}
                </button>
              );
            })}
          </div>
        </div>
      </section>



      <AdminOverview />
<div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FaReceipt />
          </span>
          <div>
            <h2 id="workspace-orders" tabIndex={-1} className="text-lg font-black text-slate-900 dark:text-white">{t.fulfillment.orderManagement}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.fulfillment.orderManagementSub}</p>
          </div>
        </div>

        <div className="mt-4">{renderRangeFilter(ordersRange, setOrdersRange)}</div>

        {/* Customer orders */}
        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <FaUser className="text-emerald-600 dark:text-emerald-400" /> {t.fulfillment.customerOrders}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {filteredCustomerOrders.length}
            </span>
          </h3>
          {customerOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noCustomerOrders}</p>
          ) : (
            <>
              <div className="relative mt-3">
                <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="search"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t.fulfillment.searchCustomers}
                  aria-label={t.fulfillment.searchCustomers}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                {customerSearch && <button type="button" onClick={() => setCustomerSearch("")} aria-label="Clear customer search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600"><FaXmark /></button>}
              </div>
              {filteredCustomerOrders.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noMatches}</p>
              ) : (
                <>
                  <div className="mt-3 max-h-[42rem] space-y-3 overflow-y-auto pr-1">{filteredCustomerOrders.slice(0, customerOrdersLimit).map(renderOrderCard)}</div>
                  {filteredCustomerOrders.length > customerOrdersLimit && (
                    <button
                      type="button"
                      onClick={() => setCustomerOrdersLimit((n) => n + 20)}
                      className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300"
                    >
                      {t.admin.showMore}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Company orders */}
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-sky-600 dark:text-sky-400">
            <FaBuilding /> {t.fulfillment.companyOrders}
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              {filteredCompanyOrders.length}
            </span>
          </h3>
          {companyOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noCompanyOrders}</p>
          ) : (
            <>
              <div className="relative mt-3">
                <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="search"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder={t.fulfillment.searchCompanies}
                  aria-label={t.fulfillment.searchCompanies}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                {companySearch && <button type="button" onClick={() => setCompanySearch("")} aria-label="Clear company search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-600"><FaXmark /></button>}
              </div>
              {filteredCompanyOrders.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noMatches}</p>
              ) : (
                <>
                  <div className="mt-3 max-h-[42rem] space-y-3 overflow-y-auto pr-1">{filteredCompanyOrders.slice(0, companyOrdersLimit).map(renderOrderCard)}</div>
                  {filteredCompanyOrders.length > companyOrdersLimit && (
                    <button
                      type="button"
                      onClick={() => setCompanyOrdersLimit((n) => n + 20)}
                      className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300"
                    >
                      {t.admin.showMore}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

<div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FaCalendarCheck />
          </span>
          <div className="flex-1">
            <h2 id="workspace-reservations" tabIndex={-1} className="text-lg font-black text-slate-900 dark:text-white">{t.admin.reservationsTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.reservationsSub}</p>
          </div>
          <div className="flex rounded-full border border-slate-200 p-0.5 text-xs font-bold dark:border-white/10">
            <button
              onClick={() => setResFilter("upcoming")}
              className={`rounded-full px-3 py-1.5 transition ${resFilter === "upcoming" ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400"}`}
            >
              {t.admin.resUpcoming}
            </button>
            <button
              onClick={() => setResFilter("all")}
              className={`rounded-full px-3 py-1.5 transition ${resFilter === "all" ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400"}`}
            >
              {t.admin.resAll}
            </button>
          </div>
          <div className="flex rounded-full border border-slate-200 p-0.5 text-xs font-bold dark:border-white/10">
            <button type="button" onClick={() => setResView("list")} className={`rounded-full px-3 py-1.5 ${resView === "list" ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400"}`}>List</button>
            <button type="button" onClick={() => setResView("calendar")} className={`rounded-full px-3 py-1.5 ${resView === "calendar" ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400"}`}>Calendar</button>
          </div>
        </div>

        {resView === "calendar" ? (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button type="button" onClick={() => setCalendarMonth((month) => { const date = new Date(`${month}-01T00:00:00`); date.setMonth(date.getMonth() - 1); return date.toISOString().slice(0, 7); })} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">←</button>
              <p className="text-sm font-black text-slate-900 dark:text-white">{new Date(`${calendarMonth}-01T00:00:00`).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { month: "long", year: "numeric" })}</p>
              <button type="button" onClick={() => setCalendarMonth((month) => { const date = new Date(`${month}-01T00:00:00`); date.setMonth(date.getMonth() + 1); return date.toISOString().slice(0, 7); })} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">→</button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {calendarDays.map((day) => <div key={day.date} className={`min-h-24 rounded-xl border p-2 ${day.reservations.length ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-500/5" : "border-slate-100 bg-slate-50/50 dark:border-white/5 dark:bg-white/5"}`}><p className="text-xs font-black text-slate-500">{Number(day.date.slice(-2))}</p><div className="mt-1 space-y-1">{day.reservations.slice(0, 3).map((reservation) => <p key={reservation.id} className="truncate rounded bg-white px-1.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{reservation.time} · {reservation.guestName}</p>)}{day.reservations.length > 3 && <p className="text-[10px] font-bold text-emerald-600">+{day.reservations.length - 3} more</p>}</div></div>)}
            </div>
          </div>
        ) : visibleReservations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t.admin.noReservationsAdmin}</p>
        ) : (
          <ul className="mt-5 grid max-h-[34rem] gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
            {visibleReservations.map((r) => {
              const badge =
                r.status === "confirmed"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : r.status === "arrived"
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    : r.status === "no_show"
                      ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                  : r.status === "pending"
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-600 dark:text-amber-300"
                    : "border-slate-300/60 bg-slate-400/10 text-slate-500 dark:text-slate-400";
              const statusLabel =
                r.status === "pending"
                  ? t.reservations.statusPending
                  : r.status === "confirmed"
                    ? t.reservations.statusConfirmed
                    : r.status === "arrived"
                      ? t.admin.resArrivedStatus
                      : r.status === "no_show"
                        ? t.admin.resNoShowStatus
                    : r.status === "declined"
                      ? t.reservations.statusDeclined
                      : t.reservations.statusCancelled;
              const reservationSite = lastSeenSiteLabel(r.site) ?? r.site;
              return (
                <li key={r.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      RSV-{r.reservationNumber} ·{" "}
                      {new Date(`${r.date}T00:00:00`).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {r.time}
                    </p>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${badge}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><FaStore className="text-emerald-500" /> {reservationSite}</span>
                    <span className="inline-flex items-center gap-1.5"><FaUser className="text-emerald-500" /> {r.guestName}</span>
                    <span className="inline-flex items-center gap-1.5"><FaUserGroup className="text-emerald-500" /> {r.guests}</span>
                    <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 hover:text-emerald-600"><FaPhone className="text-emerald-500" /> {r.phone}</a>
                    {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 hover:text-emerald-600"><FaEnvelope className="text-emerald-500" /> {r.email}</a>}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] text-slate-400 dark:text-slate-500">
                    <FaClock className="text-slate-400 dark:text-slate-500" />
                    {t.admin.bookedOn}:{" "}
                    {new Date(r.createdAt).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {new Date(r.createdAt).toLocaleTimeString(lang === "nl" ? "nl-NL" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {(r.occasion || r.note) && (
                    <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      {r.occasion && <span className="font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{r.occasion}</span>}
                      {r.occasion && r.note && " · "}
                      {r.note}
                    </p>
                  )}
                  {(r.status === "pending" || r.status === "confirmed" || r.status === "arrived" || r.status === "no_show") && (
                    <div className="mt-3 flex gap-2">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => setReservationStatus(r.id, "confirm")}
                            className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                          >
                            {t.admin.resConfirm}
                          </button>
                          <button
                            onClick={() => setReservationStatus(r.id, "decline")}
                            className="flex-1 rounded-full border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            {t.admin.resDecline}
                          </button>
                        </>
                      )}
                      {r.status === "confirmed" && (
                        <>
                          <button onClick={() => setReservationStatus(r.id, "arrived")} className="flex-1 rounded-full bg-sky-600 py-2 text-xs font-bold text-white transition hover:bg-sky-500">{t.admin.resArrived}</button>
                          <button onClick={() => setReservationStatus(r.id, "no_show")} className="flex-1 rounded-full border border-red-300/60 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/10 dark:border-red-400/30">{t.admin.resNoShow}</button>
                          <button onClick={() => cancelReservation(r.id)} className="flex-1 rounded-full border border-slate-300 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:border-white/20">{t.admin.resCancelAdmin}</button>
                        </>
                      )}
                      {r.status === "no_show" && <button onClick={() => setReservationStatus(r.id, "confirm")} className="flex-1 rounded-full border border-emerald-300 py-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-400/30">{t.admin.resConfirm}</button>}
                    </div>
                  )}
                  <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-white/10">
                    <button
                      onClick={() => {
                        if (window.confirm(t.admin.resDeleteConfirm)) deleteReservation(r.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-500/10"
                    >
                      <FaTrash className="text-[0.7rem]" /> {t.admin.resDelete}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>


      {/* Social media links (collapsible) */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setSocialOpen((o) => !o)}
          aria-expanded={socialOpen}
          className="flex w-full items-center gap-2 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <FaShareNodes />
          </span>
          <div className="flex-1">
            <h2 id="workspace-social" className="text-lg font-black text-slate-900 dark:text-white">{t.admin.socialTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.socialSub}</p>
          </div>
          <FaChevronDown
            className={`shrink-0 text-slate-400 transition-transform duration-300 ${socialOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            socialOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SOCIAL_PLATFORMS.map((p) => {
            const stored = socialLinks.find((l) => l.platform === p.id);
            const enabled = stored?.enabled ?? false;
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-4 transition ${
                  enabled
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-400/5"
                    : "border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-md"
                    style={{ backgroundColor: p.color }}
                  >
                    <Icon aria-hidden="true" className={p.id === "snapchat" ? "text-slate-900" : undefined} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{p.label}</p>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                      {socialSavedFor === p.id ? t.admin.socialSaved : enabled ? t.admin.socialVisible : t.admin.socialHidden}
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleSocial(p.id)}
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${p.label}: ${enabled ? t.admin.socialVisible : t.admin.socialHidden}`}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={socialUrl(p.id)}
                    onChange={(e) => setSocialDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    onBlur={() => saveSocialUrl(p.id)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    placeholder={t.admin.socialUrlPlaceholder}
                    type="url"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  {socialUrl(p.id) && (
                    <a
                      href={socialUrl(p.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t.admin.testLink}
                      className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-slate-400"
                    >
                      <FaShareNodes className="text-xs" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>

      {/* VIP card requests */}
      {vipRequests.some((r) => r.status === "pending") && (
        <div className="mt-6 rounded-3xl border border-amber-300/60 bg-amber-50/60 p-5 dark:border-amber-400/30 dark:bg-amber-500/5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
              <FaCrown />
            </span>
            <div>
              <h2 id="workspace-vip" tabIndex={-1} className="text-lg font-black text-slate-900 dark:text-white">{t.admin.vipRequests}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.vipRequestsSub}</p>
            </div>
            <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              {vipRequests.filter((r) => r.status === "pending").length}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vipRequests
              .filter((r) => r.status === "pending")
              .map((r) => (
                <div key={r.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                  <a href={r.image} target="_blank" rel="noopener noreferrer" title={t.admin.vipEnlargeImage} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt={r.userName} loading="lazy" decoding="async" className="h-40 w-full bg-slate-100 object-contain transition hover:opacity-80 dark:bg-black/20" />
                  </a>
                  <div className="p-3">
                    <p className="flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white">
                      <FaUser className="text-amber-500" /> {r.userName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString(lang === "nl" ? "nl-NL" : "en-GB")}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => rejectVipRequest(r.id)}
                        className="flex-1 rounded-full border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                      >
                        {t.admin.reject}
                      </button>
                      <button
                        onClick={() => approveVipRequest(r.id)}
                        className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                      >
                        {t.admin.approve}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}



      <div id="workspace-phone" tabIndex={-1}><PhoneAgentPanel /></div>

      {/* Reservations management */}


      {/* VIP purchase and activation audit */}
      <div className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/60 p-5 dark:border-violet-400/20 dark:bg-violet-500/5">
        <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><FaCrown /></span><div className="flex-1"><h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.vipPurchases}</h2><p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.vipPurchasesSub}</p></div><span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-bold text-violet-700 dark:text-violet-300">{vipPurchases.filter((p) => p.status === "paid").length}</span></div>
        {vipPurchases.filter((p) => p.status === "paid").length === 0 ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t.admin.vipNoPurchases}</p> : <ul className="mt-4 max-h-[30rem] space-y-2 overflow-y-auto pr-1">{vipPurchases.filter((p) => p.status === "paid").map((purchase) => { const user = users.find((u) => u.id === purchase.userId); const approvedCard = vipRequests.some((r) => r.userId === purchase.userId && r.status === "approved"); return <li key={purchase.id} className="flex flex-col gap-2 rounded-2xl border border-violet-100 bg-white p-3 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/10 text-amber-500"><FaCrown /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900 dark:text-white">{user?.name ?? purchase.userId}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email ?? ""}</p></div><div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-300">{approvedCard ? t.admin.vipCardApprovedSource : t.admin.vipPurchased}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">€{purchase.amount.toFixed(2)}</span><span className={`rounded-full px-2.5 py-1 font-bold ${user?.isVip ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}>{user?.isVip ? t.admin.vipActive : t.admin.vipInactive}</span><time className="text-slate-400" dateTime={new Date(purchase.createdAt).toISOString()}>{new Date(purchase.createdAt).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB")}</time></div></li>; })}</ul>}
      </div>

      {/* Order management */}


      {selectedCustomer && (
        <WorkspaceDialog titleId="workspace-customer-title" onClose={() => setSelectedCustomer(null)}>
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-[#0c1420] sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 id="workspace-customer-title" className="truncate text-xl font-black text-slate-900 dark:text-white">{selectedCustomer.name}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedCustomer.userId ? t.admin.registeredCustomer : `${t.admin.guestCustomer} · ${t.admin.addressMatch}`}</p><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{selectedCustomer.address || "-"}</p></div><button type="button" onClick={() => setSelectedCustomer(null)} aria-label={t.admin.closeCustomerHistory} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><FaXmark /></button></div>
            <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">{customerOrdersForSelection.length} {t.admin.ordersLabel} · {t.admin.reservationsSummary.replace("{maison}", String(selectedCustomerVisitor?.maisonReservationCount ?? 0)).replace("{tandoor}", String(selectedCustomerVisitor?.tandoorReservationCount ?? 0)).replace("{arrived}", String((selectedCustomerVisitor?.maisonArrivedCount ?? 0) + (selectedCustomerVisitor?.tandoorArrivedCount ?? 0)))}</p>
            <ul tabIndex={0} aria-labelledby="workspace-customer-title" className="mt-4 space-y-2 overflow-y-auto pr-1">{customerOrdersForSelection.map((order) => <li key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-black">{formatOrderNumber(order.orderNumber)}</span><span className="font-bold">€{order.total.toFixed(2)}</span><span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</span></div><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{order.items.map((item) => `${item.qty}x ${item.name}`).join(", ")}</p></li>)}</ul>
            <button type="button" onClick={() => setSelectedCustomer(null)} className="mt-4 rounded-full bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">{t.admin.closeCustomerHistory}</button>
          </div>
        </WorkspaceDialog>
      )}
    </div>
  );
}
