"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  FaBoxOpen,
  FaBuilding,
  FaChartLine,
  FaClock,
  FaCrown,
  FaEnvelope,
  FaEuroSign,
  FaFileInvoice,
  FaHeart,
  FaImage,
  FaLocationDot,
  FaLock,
  FaMagnifyingGlass,
  FaMoneyBillWave,
  FaNoteSticky,
  FaPen,
  FaPhone,
  FaPlus,
  FaReceipt,
  FaCircleCheck,
  FaShareNodes,
  FaTrash,
  FaTruck,
  FaUser,
  FaUserGroup,
  FaUsers,
  FaUtensils,
  FaXmark,
} from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { BRANDS, brandInfo, CATEGORY_ORDER, formatOrderNumber, getCategoryIcon, ORDER_STATUS_FLOW } from "../lib/data";
import { SOCIAL_PLATFORMS } from "../components/socialIcons";
import type { Brand, Category, Order, OrderStatus, Product } from "../lib/types";

const statusIcons: Record<OrderStatus, typeof FaClock> = {
  new: FaClock,
  preparing: FaBoxOpen,
  delivery: FaTruck,
  delivered: FaCircleCheck,
};

export default function AdminPage() {
  const { t, lang } = useLang();
  const { currentUser, products, orders, users, addProduct, removeProduct, updateProduct, updateOrderStatus, setOrderPaid, setInvoiceSent, vipRequests, approveVipRequest, rejectVipRequest, socialLinks, updateSocialLink, hydrated } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    price: "",
    brand: "eattogo" as Brand,
    category: "Wraps" as Category,
    image: "" as string | undefined,
    detail: "",
  });

  // Product currently being edited (null = editor closed).
  const [editing, setEditing] = useState<Product | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    description: "",
    price: "",
    brand: "eattogo" as Brand,
    category: "Wraps" as Category,
    image: undefined as string | undefined,
    detail: "",
  });

  // Order search filters (by customer/company name or order number).
  const [customerSearch, setCustomerSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");

  // Product pending deletion (shown in a confirmation dialog).
  const [deleting, setDeleting] = useState<Product | null>(null);

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const avg = orders.length ? revenue / orders.length : 0;
    const byCategory: Record<string, number> = {};
    const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      for (const item of o.items) {
        const product = products.find((p) => p.id === item.productId);
        const cat = product?.category ?? "Other";
        byCategory[cat] = (byCategory[cat] || 0) + item.price * item.qty;
        if (!byProduct[item.productId]) byProduct[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        byProduct[item.productId].qty += item.qty;
        byProduct[item.productId].revenue += item.price * item.qty;
      }
    }
    const top = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const maxCat = Math.max(1, ...Object.values(byCategory));
    return { revenue, avg, byCategory, top, maxCat };
  }, [orders, products]);

  /** Last 20 users seen on the site, most recent first. */
  const recentlyOnline = useMemo(
    () =>
      users
        .filter((u) => u.lastSeenAt)
        .sort((a, b) => (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0))
        .slice(0, 20),
    [users]
  );

  /** "just now" / "5 min ago" / "3 h ago" / "2 d ago" */
  const relativeTime = (ts: number): string => {
    const diffMin = Math.floor((Date.now() - ts) / 60_000);
    if (diffMin < 1) return t.admin.justNow;
    if (diffMin < 60) return t.admin.minutesAgo.replace("{n}", String(diffMin));
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return t.admin.hoursAgo.replace("{n}", String(diffH));
    return t.admin.daysAgo.replace("{n}", String(Math.floor(diffH / 24)));
  };

  /** Local drafts for the social link URL inputs (saved on blur / Enter). */
  const [socialDrafts, setSocialDrafts] = useState<Record<string, string>>({});
  const [socialSavedFor, setSocialSavedFor] = useState<string | null>(null);

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

  /** Per-customer analytics: favourites, spend and activity, sorted by total spent. */
  const customerStats = useMemo(() => {
    interface Agg {
      key: string;
      name: string;
      email?: string;
      isRegistered: boolean;
      orderCount: number;
      totalSpent: number;
      totalItems: number;
      lastOrder: number;
      productQty: Record<string, { name: string; qty: number }>;
      categoryQty: Record<string, number>;
    }
    const map = new Map<string, Agg>();

    for (const o of orders) {
      const registered = o.userId ? users.find((u) => u.id === o.userId) : undefined;
      const key = o.userId ?? `guest:${o.customerName.toLowerCase()}`;
      let agg = map.get(key);
      if (!agg) {
        agg = {
          key,
          name: registered?.name ?? o.customerName,
          email: registered?.email,
          isRegistered: !!registered,
          orderCount: 0,
          totalSpent: 0,
          totalItems: 0,
          lastOrder: 0,
          productQty: {},
          categoryQty: {},
        };
        map.set(key, agg);
      }
      agg.orderCount += 1;
      agg.totalSpent += o.total;
      agg.lastOrder = Math.max(agg.lastOrder, o.createdAt);
      for (const item of o.items) {
        agg.totalItems += item.qty;
        if (!agg.productQty[item.productId]) agg.productQty[item.productId] = { name: item.name, qty: 0 };
        agg.productQty[item.productId].qty += item.qty;
        const product = products.find((p) => p.id === item.productId);
        const cat = product?.category ?? "Other";
        agg.categoryQty[cat] = (agg.categoryQty[cat] || 0) + item.qty;
      }
    }

    return Array.from(map.values())
      .map((a) => {
        const favProduct = Object.values(a.productQty).sort((x, y) => y.qty - x.qty)[0];
        const favCategory = Object.entries(a.categoryQty).sort((x, y) => y[1] - x[1])[0];
        return {
          ...a,
          avgOrder: a.orderCount ? a.totalSpent / a.orderCount : 0,
          favProduct: favProduct ?? null,
          favCategory: favCategory ? { name: favCategory[0], qty: favCategory[1] } : null,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, users, products]);

  if (!hydrated) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-slate-500">…</div>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
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

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const saveProduct = () => {
    const price = parseFloat(draft.price);
    if (!draft.name.trim() || Number.isNaN(price)) return;
    const detail = draft.detail.trim();
    addProduct({
      name: draft.name.trim(),
      description: draft.description.trim(),
      price,
      brand: draft.brand,
      category: draft.category,
      image: draft.image,
      detailedDescription: detail ? { en: detail, nl: detail } : undefined,
    });
    setDraft({ name: "", description: "", price: "", brand: draft.brand, category: draft.category, image: undefined, detail: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const openEditor = (p: Product) => {
    setEditing(p);
    setEditDraft({
      name: p.name,
      description: p.description,
      price: String(p.price),
      brand: p.brand,
      category: p.category,
      image: p.image,
      detail: p.detailedDescription?.[lang] ?? p.detailedDescription?.en ?? "",
    });
  };

  const onEditFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditDraft((d) => ({ ...d, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const saveEdit = () => {
    if (!editing) return;
    const price = parseFloat(editDraft.price);
    if (!editDraft.name.trim() || Number.isNaN(price)) return;
    const detail = editDraft.detail.trim();
    updateProduct(editing.id, {
      name: editDraft.name.trim(),
      description: editDraft.description.trim(),
      price,
      brand: editDraft.brand,
      category: editDraft.category,
      image: editDraft.image,
      detailedDescription: detail ? { en: detail, nl: detail } : undefined,
    });
    setEditing(null);
    if (editFileRef.current) editFileRef.current.value = "";
  };

  const cards = [
    { icon: FaEuroSign, label: t.admin.totalRevenue, value: `€${stats.revenue.toFixed(2)}` },
    { icon: FaReceipt, label: t.admin.totalOrders, value: orders.length },
    { icon: FaUsers, label: t.admin.totalUsers, value: users.length },
    { icon: FaChartLine, label: t.admin.avgOrder, value: `€${stats.avg.toFixed(2)}` },
  ];

  const statusLabel = (s: OrderStatus): string =>
    s === "new"
      ? t.fulfillment.statusNew
      : s === "preparing"
        ? t.fulfillment.statusPreparing
        : s === "delivery"
          ? t.fulfillment.statusDelivery
          : t.fulfillment.statusDelivered;

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

  const filteredCustomerOrders = customerOrders.filter((o) => matchesOrder(o, customerSearch));
  const filteredCompanyOrders = companyOrders.filter((o) => matchesOrder(o, companySearch));

  const renderOrderCard = (o: Order) => {
    const action = nextAction(o.status);
    const currentStep = ORDER_STATUS_FLOW.indexOf(o.status);
    const account = o.userId ? users.find((u) => u.id === o.userId) : undefined;
    const isCompany = o.accountType === "company";
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
              {o.customerName}
              <span className="shrink-0 rounded-full bg-slate-900/90 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white/15">
                {formatOrderNumber(o.orderNumber)}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {new Date(o.createdAt).toLocaleString(lang === "nl" ? "nl-NL" : "en-GB")} ·{" "}
              {o.items.reduce((s, i) => s + i.qty, 0)} {t.common.items}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 dark:text-white">€{o.total.toFixed(2)}</span>
            {o.paid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <FaCircleCheck /> {t.fulfillment.paid}
              </span>
            ) : (
              <button
                onClick={() => setOrderPaid(o.id, true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-400/30 dark:text-amber-300"
                title={t.fulfillment.markPaid}
              >
                <FaMoneyBillWave /> {t.fulfillment.unpaid} · {t.fulfillment.markPaid}
              </button>
            )}
          </div>
        </div>

        {/* Contact & delivery details */}
        <div className="mt-3 grid gap-1.5 rounded-xl bg-white p-3 text-xs dark:bg-white/5 sm:grid-cols-2">
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FaLocationDot className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-900 dark:text-white">{o.address || "—"}</span>, {o.postcode || "—"}
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FaPhone className="shrink-0 text-emerald-600 dark:text-emerald-400" /> {o.phone || "—"}
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
              <span>{t.company.btw}: <span className="font-semibold text-slate-900 dark:text-white">{account?.btw || "—"}</span></span>
              <span>{t.company.kvk}: <span className="font-semibold text-slate-900 dark:text-white">{account?.kvk || "—"}</span></span>
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

        {/* Items to prepare — grouped by restaurant/brand */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <FaUtensils /> {t.admin.itemsToPrepare}
          </p>
          <div className="mt-2 space-y-3">
            {BRANDS.map((b) => {
              const brandItems = o.items.filter((it) => it.brand === b.id);
              if (brandItems.length === 0) return null;
              return (
                <div key={b.id}>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                    <span className="relative grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200 dark:ring-white/10">
                      <Image src={b.logo} alt={b.name} fill sizes="20px" className="object-contain p-0.5" />
                    </span>
                    {b.name}
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                      {brandItems.reduce((s, i) => s + i.qty, 0)}
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {brandItems.map((it) => (
                      <li
                        key={it.productId}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-white/5"
                      >
                        <span className="grid h-5 min-w-5 place-items-center rounded-md bg-emerald-600 px-1 text-[11px] font-black text-white">
                          {it.qty}×
                        </span>
                        <span className="flex-1 truncate font-semibold text-slate-900 dark:text-white">{it.name}</span>
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
                    {statusLabel(s)}
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
            {statusLabel(o.status)}
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
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.admin.title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.admin.subtitle}</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icon />
              </span>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{c.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Sales by category */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.ordersByCategory}</h2>
          <div className="mt-4 space-y-3">
            {CATEGORY_ORDER.map((cat) => {
              const val = stats.byCategory[cat] || 0;
              const Icon = getCategoryIcon(cat);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                      <Icon className="text-emerald-600 dark:text-emerald-400" /> {cat}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">€{val.toFixed(2)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all" style={{ width: `${(val / stats.maxCat) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.topProducts}</h2>
          {stats.top.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.admin.noOrders}</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {stats.top.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-white/5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-xs font-black text-emerald-700 dark:text-emerald-300">{i + 1}</span>
                  <span className="flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{p.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">×{p.qty}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">€{p.revenue.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Customer insights */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FaUserGroup />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.customerInsights}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.customerInsightsSub}</p>
          </div>
        </div>

        {customerStats.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t.admin.noCustomers}</p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customerStats.map((c, i) => {
              const FavIcon = c.favCategory ? getCategoryIcon(c.favCategory.name) : getCategoryIcon("");
              return (
                <div
                  key={c.key}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-sm font-black text-white">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-black text-slate-900 dark:text-white">
                        {i === 0 && <FaCrown className="shrink-0 text-amber-500" title="Top spender" />}
                        {c.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {c.email ?? t.admin.guest}
                      </p>
                    </div>
                  </div>

                  {/* Key numbers */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white px-2 py-2.5 dark:bg-white/5">
                      <p className="text-base font-black text-slate-900 dark:text-white">{c.orderCount}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">{t.admin.ordersLabel}</p>
                    </div>
                    <div className="rounded-xl bg-white px-2 py-2.5 dark:bg-white/5">
                      <p className="text-base font-black text-slate-900 dark:text-white">€{c.totalSpent.toFixed(0)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">{t.admin.totalSpent}</p>
                    </div>
                    <div className="rounded-xl bg-white px-2 py-2.5 dark:bg-white/5">
                      <p className="text-base font-black text-slate-900 dark:text-white">€{c.avgOrder.toFixed(0)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">{t.admin.avgSpent}</p>
                    </div>
                  </div>

                  {/* Favourites */}
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FaHeart className="shrink-0 text-rose-500" />
                      <span className="text-slate-500 dark:text-slate-400">{t.admin.favoriteProduct}:</span>
                      <span className="ml-auto truncate font-bold text-slate-900 dark:text-white">
                        {c.favProduct ? `${c.favProduct.name} ×${c.favProduct.qty}` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FavIcon className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-slate-500 dark:text-slate-400">{t.admin.favoriteCategory}:</span>
                      <span className="ml-auto truncate font-bold text-slate-900 dark:text-white">
                        {c.favCategory ? `${c.favCategory.name} ×${c.favCategory.qty}` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <span>{t.admin.itemsOrdered}: <span className="font-bold text-slate-700 dark:text-slate-200">{c.totalItems}</span></span>
                    <span>{t.admin.lastOrder}: <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(c.lastOrder).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB")}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently online — last 20 signed-in visitors */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <FaUsers />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.recentlyOnline}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.recentlyOnlineSub}</p>
          </div>
        </div>

        {recentlyOnline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t.admin.noCustomers}</p>
        ) : (
          <ul className="mt-5 divide-y divide-slate-100 dark:divide-white/5">
            {recentlyOnline.map((u) => {
              const online = Date.now() - (u.lastSeenAt ?? 0) < 5 * 60_000;
              return (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-black text-white">
                    {u.name.charAt(0).toUpperCase()}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#0b1220] ${
                        online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                      {u.name}
                      {u.role === "admin" && <FaLock className="shrink-0 text-[10px] text-slate-400" title="Admin" />}
                      {u.isVip && <FaCrown className="shrink-0 text-xs text-amber-500" title="VIP" />}
                      {u.accountType === "company" && <FaBuilding className="shrink-0 text-xs text-sky-500" title="B2B" />}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      online
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                    }`}
                  >
                    {relativeTime(u.lastSeenAt!)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Social media links */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <FaShareNodes />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.socialTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.socialSub}</p>
          </div>
        </div>

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
                    <Icon className={p.id === "snapchat" ? "text-slate-900" : undefined} />
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
                <input
                  value={socialUrl(p.id)}
                  onChange={(e) => setSocialDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  onBlur={() => saveSocialUrl(p.id)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  placeholder={t.admin.socialUrlPlaceholder}
                  type="url"
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            );
          })}
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
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.vipRequests}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.vipRequestsSub}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vipRequests
              .filter((r) => r.status === "pending")
              .map((r) => (
                <div key={r.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt={r.userName} className="h-40 w-full bg-slate-100 object-contain dark:bg-black/20" />
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

      {/* Product management */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Add product */}
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <FaPlus className="text-emerald-600 dark:text-emerald-400" /> {t.admin.addProduct}
          </h2>
          <div className="mt-4 space-y-3">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t.admin.productName}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder={t.admin.productDesc}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <div>
              <textarea
                value={draft.detail}
                onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
                placeholder={t.admin.productDetail}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.productDetailHint}</p>
            </div>
            <select
              value={draft.brand}
              onChange={(e) => {
                const brand = e.target.value as Brand;
                setDraft({ ...draft, brand, category: brandInfo(brand).categories[0] });
              }}
              aria-label={t.admin.restaurant}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              {BRANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder={t.admin.productPrice}
                inputMode="decimal"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                {brandInfo(draft.brand).categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:text-slate-300"
              >
                <FaImage /> {t.admin.productImage}
              </button>
              {draft.image && (
                <span className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                  <Image src={draft.image} alt="preview" fill sizes="48px" className="object-cover" />
                </span>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            <button
              onClick={saveProduct}
              className="w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              {t.admin.save}
            </button>
          </div>
        </div>

        {/* Product list */}
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.manageProducts}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {products.length}
            </span>
          </div>
          <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {products.map((p) => {
              const Icon = getCategoryIcon(p.category);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-white/5">
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {p.image ? <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" /> : <Icon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                      {p.name}
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          p.brand === "tandoor"
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {p.brand === "tandoor" ? "TDC" : "ETG"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.category} · €{p.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => openEditor(p)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-600"
                    aria-label={t.common.edit}
                    title={t.common.edit}
                  >
                    <FaPen className="text-sm" />
                  </button>
                  <button
                    onClick={() => setDeleting(p)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-600"
                    aria-label={t.common.remove}
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit product modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white shadow-2xl dark:bg-[#0c1420] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                <FaPen className="text-emerald-600 dark:text-emerald-400" /> {t.admin.editProduct}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
                aria-label={t.common.cancel}
              >
                <FaXmark />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <input
                value={editDraft.name}
                onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                placeholder={t.admin.productName}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <textarea
                value={editDraft.description}
                onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                placeholder={t.admin.productDesc}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <div>
                <textarea
                  value={editDraft.detail}
                  onChange={(e) => setEditDraft({ ...editDraft, detail: e.target.value })}
                  placeholder={t.admin.productDetail}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.productDetailHint}</p>
              </div>
              <select
                value={editDraft.brand}
                onChange={(e) => {
                  const brand = e.target.value as Brand;
                  const cats = brandInfo(brand).categories;
                  setEditDraft({ ...editDraft, brand, category: cats.includes(editDraft.category) ? editDraft.category : cats[0] });
                }}
                aria-label={t.admin.restaurant}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                {BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={editDraft.price}
                  onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                  placeholder={t.admin.productPrice}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <select
                  value={editDraft.category}
                  onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as Category })}
                  aria-label={t.admin.changeCategory}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {brandInfo(editDraft.brand).categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => editFileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:text-slate-300"
                >
                  <FaImage /> {t.admin.productImage}
                </button>
                {editDraft.image && (
                  <span className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                    <Image src={editDraft.image} alt="preview" fill sizes="48px" className="object-cover" />
                  </span>
                )}
                <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onEditFile(e.target.files?.[0])} />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  {t.common.saveChanges}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete product confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleting(null)} />
          <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-[#0c1420] sm:rounded-3xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
              <FaTrash />
            </div>
            <h2 className="mt-4 text-center text-lg font-black text-slate-900 dark:text-white">{t.admin.deleteConfirmTitle}</h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{t.admin.deleteConfirmText}</p>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{deleting.name}</span>
              <span className="text-xs text-slate-400">· {deleting.category}</span>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => {
                  removeProduct(deleting.id);
                  setDeleting(null);
                }}
                className="flex-1 rounded-full bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500"
              >
                {t.common.remove}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order management */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FaReceipt />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.fulfillment.orderManagement}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.fulfillment.orderManagementSub}</p>
          </div>
        </div>

        {/* Customer orders */}
        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <FaUser className="text-emerald-600 dark:text-emerald-400" /> {t.fulfillment.customerOrders}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {customerOrders.length}
            </span>
          </h3>
          {customerOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noCustomerOrders}</p>
          ) : (
            <>
              <div className="relative mt-3">
                <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t.fulfillment.searchCustomers}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              {filteredCustomerOrders.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noMatches}</p>
              ) : (
                <div className="mt-3 space-y-3">{filteredCustomerOrders.slice(0, 20).map(renderOrderCard)}</div>
              )}
            </>
          )}
        </div>

        {/* Company orders */}
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-sky-600 dark:text-sky-400">
            <FaBuilding /> {t.fulfillment.companyOrders}
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              {companyOrders.length}
            </span>
          </h3>
          {companyOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noCompanyOrders}</p>
          ) : (
            <>
              <div className="relative mt-3">
                <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder={t.fulfillment.searchCompanies}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              {filteredCompanyOrders.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.fulfillment.noMatches}</p>
              ) : (
                <div className="mt-3 space-y-3">{filteredCompanyOrders.slice(0, 20).map(renderOrderCard)}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
