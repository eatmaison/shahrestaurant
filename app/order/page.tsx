"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCalendarDays,
  FaCartShopping,
  FaCircleCheck,
  FaCircleExclamation,
  FaClock,
  FaLocationDot,
  FaMinus,
  FaPlus,
  FaTrash,
} from "react-icons/fa6";
import { MdMenuBook } from "react-icons/md";
import { useLang, useStore } from "../providers";
import ProductDetailsModal from "../components/ProductDetailsModal";
import {
  BRANDS,
  brandInfo,
  COMPANY_DISCOUNT_PCT,
  COMPANY_MIN_ORDER,
  DELIVERY_FEE,
  FREE_DELIVERY_FROM,
  formatOrderNumber,
  getCategoryIcon,
  isDrinkCategory,
  isPostcodeInDeliveryArea,
  isValidDutchPostcode,
  MIN_ORDER,
  VIP_DISCOUNT_PCT,
} from "../lib/data";
import { nextOpening } from "../lib/openingHours";
import type { Brand, Category, Product } from "../lib/types";

export default function OrderPage() {
  const { t, lang } = useLang();
  const { products, cart, addToCart, removeFromCart, currentUser, placeOrder } = useStore();

  const [activeBrand, setActiveBrand] = useState<Brand>("eattogo");
  const [activeCategory, setActiveCategory] = useState<Category>("Wraps");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    phone: currentUser?.phone ?? "",
    address: "",
    postcode: "",
    note: "",
  });
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [scheduleType, setScheduleType] = useState<"asap" | "once" | "workdays">("asap");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // Live open/closed status (Amsterdam time), refreshed every minute.
  // Set in an effect (not initial state) to avoid SSR hydration mismatches.
  const [nextOpen, setNextOpen] = useState<{ daysAhead: number; weekday: number } | null>(null);
  useEffect(() => {
    const update = () => setNextOpen(nextOpening());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // "We will start preparing your order today / on Tuesday from 14:00."
  const preOrderNote = useMemo(() => {
    if (!nextOpen) return null;
    if (nextOpen.daysAhead === 0) return t.hours.preOrderToday;
    const date = new Date(Date.now() + nextOpen.daysAhead * 86_400_000);
    const dayName = new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
      weekday: "long",
      timeZone: "Europe/Amsterdam",
    }).format(date);
    return t.hours.preOrderDay.replace("{day}", dayName);
  }, [nextOpen, t, lang]);

  // Auto-fill the delivery form from the customer's saved profile (name, phone,
  // last address & postcode). Only fills empty fields, so the customer can still
  // edit or clear them to deliver somewhere else.
  useEffect(() => {
    if (!currentUser) return;
    setForm((f) => ({
      ...f,
      name: f.name || currentUser.name || "",
      phone: f.phone || currentUser.phone || "",
      address: f.address || currentUser.address || "",
      postcode: f.postcode || currentUser.postcode || "",
    }));
  }, [currentUser]);

  const visible = products.filter((p) => p.brand === activeBrand && p.category === activeCategory);

  // Switch restaurant/brand and jump to that brand's first category.
  const selectBrand = (brand: Brand) => {
    if (brand === activeBrand) return;
    setActiveBrand(brand);
    setActiveCategory(brandInfo(brand).categories[0]);
  };

  const cartLines = useMemo(
    () =>
      products
        .filter((p) => (cart[p.id] || 0) > 0)
        .map((p) => ({ product: p, qty: cart[p.id] })),
    [products, cart]
  );

  const subtotal = cartLines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const foodSubtotal = cartLines.reduce(
    (sum, l) => (isDrinkCategory(l.product.category) ? sum : sum + l.product.price * l.qty),
    0
  );
  const isCompany = currentUser?.accountType === "company";
  const isVip = !isCompany && !!currentUser?.isVip;
  const discountPct = isCompany ? COMPANY_DISCOUNT_PCT : isVip ? VIP_DISCOUNT_PCT : 0;
  const discountLabel = isCompany ? t.company.priceLabel : t.order.vipPriceLabel;
  const minOrder = isCompany ? COMPANY_MIN_ORDER : MIN_ORDER;
  const minOrderNote = isCompany ? t.order.minOrderCompanyNote : t.order.minOrderNote;
  const discount = +(foodSubtotal * (discountPct / 100)).toFixed(2);
  const payableBeforePoints = +(subtotal - discount).toFixed(2);
  const maxPoints = Math.min(currentUser?.points ?? 0, Math.floor(payableBeforePoints));
  const pointsUsed = Math.min(pointsToUse, maxPoints);
  // Companies always get free delivery; regular clients only above €30
  const freeDelivery = isCompany ? true : payableBeforePoints >= FREE_DELIVERY_FROM;
  const delivery = cartLines.length > 0 ? (freeDelivery ? 0 : DELIVERY_FEE) : 0;
  const total = cartLines.length > 0 ? +(payableBeforePoints - pointsUsed + delivery).toFixed(2) : 0;
  const itemCount = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const belowMinOrder = cartLines.length > 0 && subtotal < minOrder;

  // Live delivery-area status for the postcode field.
  // "empty" while the user hasn't entered enough, "ok" when inside our area,
  // "outside" when a valid postcode falls outside Amsterdam-Noord.
  const postcodeStatus: "empty" | "ok" | "outside" = (() => {
    const raw = form.postcode.trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 4) return "empty";
    return isPostcodeInDeliveryArea(raw) ? "ok" : "outside";
  })();

  const handleProceedToCheckout = () => {
    if (cartLines.length === 0) {
      setMessage({ type: "error", text: t.order.selectItem });
      return;
    }
    if (belowMinOrder) {
      setMessage({ type: "error", text: minOrderNote });
      return;
    }
    setShowCartModal(false);
    setShowCheckoutModal(true);
  };

  const handleCheckout = async () => {
    const isScheduled = isCompany && scheduleType !== "asap";
    if (belowMinOrder) {
      setMessage({ type: "error", text: minOrderNote });
      return;
    }
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim() || !form.postcode.trim()) {
      setMessage({ type: "error", text: t.auth.fillFields });
      return;
    }
    if (!isValidDutchPostcode(form.postcode)) {
      setMessage({ type: "error", text: t.order.invalidPostcode });
      return;
    }
    if (!isPostcodeInDeliveryArea(form.postcode)) {
      setMessage({ type: "error", text: t.order.outsideArea });
      return;
    }
    if (isCompany && scheduleType === "once" && (!scheduleDate || !scheduleTime)) {
      setMessage({ type: "error", text: t.schedule.pickDateTime });
      return;
    }
    if (isCompany && scheduleType === "workdays" && !scheduleTime) {
      setMessage({ type: "error", text: t.schedule.pickDateTime });
      return;
    }
    const res = await placeOrder({
      customerName: form.name,
      address: form.address,
      postcode: form.postcode,
      phone: form.phone,
      note: form.note,
      pointsToUse: pointsUsed,
      schedule:
        isCompany && scheduleType !== "asap"
          ? {
              type: scheduleType,
              date: scheduleType === "once" ? scheduleDate : undefined,
              time: scheduleTime,
            }
          : undefined,
    });
    if (res.ok && res.checkoutUrl) {
      // Personal customers are redirected to the secure Mollie payment page.
      setMessage({ type: "success", text: t.pay.redirecting });
      window.location.href = res.checkoutUrl;
      return;
    }
    if (res.ok) {
      setMessage({ type: "success", text: `${t.order.orderPlaced} ${t.order.orderNumber} ${formatOrderNumber(res.order!.orderNumber)}` });
      setForm((f) => ({ ...f, address: "", postcode: "", note: "" }));
      setPointsToUse(0);
      setScheduleType("asap");
      setScheduleDate("");
      setScheduleTime("");
      setShowCheckoutModal(false);
    } else if (res.error === "minOrder") {
      setMessage({ type: "error", text: minOrderNote });
    } else if (res.error === "outsideArea") {
      setMessage({ type: "error", text: t.order.outsideArea });
    } else if (res.error === "closed") {
      setMessage({ type: "error", text: t.hours.scheduleClosedNote });
    } else {
      setMessage({ type: "error", text: t.order.selectItem });
    }
  };

  const ProductsGrid = () => (
    <div className="grid gap-3 sm:grid-cols-2">
      {visible.map((p) => {
        const qty = cart[p.id] || 0;
        const Icon = getCategoryIcon(p.category);
        return (
          <article
            key={p.id}
            className="animate-fade-up flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-emerald-500/10 to-sky-500/10">
              {p.image ? (
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-4xl text-emerald-500/50">
                  <Icon />
                </span>
              )}
              {/* Read More Button (top-right on image) */}
              {p.detailedDescription && (
                <button
                  onClick={() => setSelectedProduct(p)}
                  aria-label={t.order.readMore}
                  title={t.order.readMore}
                  className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-white hover:text-emerald-600 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-emerald-400"
                >
                  <MdMenuBook className="text-lg" />
                </button>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">{p.name}</h3>
                {discountPct > 0 && !isDrinkCategory(p.category) ? (
                  <span className="flex shrink-0 flex-col items-end">
                    <span className="text-xs text-slate-400 line-through dark:text-slate-500">€{p.price.toFixed(2)}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                        isCompany
                          ? "bg-sky-400/20 text-sky-700 dark:text-sky-300"
                          : "bg-amber-400/20 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {discountLabel} €{(p.price * (1 - discountPct / 100)).toFixed(2)}
                    </span>
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    €{p.price.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{p.description}</p>
              <div className="mt-3 flex flex-col gap-2">
                {/* Add/Remove Buttons */}
                {qty === 0 ? (
                  <button
                    onClick={() => addToCart(p.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <FaPlus className="text-xs" /> {t.common.add}
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-full bg-emerald-500/10 p-1">
                    <button
                      onClick={() => removeFromCart(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 transition hover:text-red-600 dark:bg-white/10 dark:text-slate-200"
                      aria-label={t.common.remove}
                    >
                      <FaMinus className="text-xs" />
                    </button>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{qty}</span>
                    <button
                      onClick={() => addToCart(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500"
                      aria-label={t.common.add}
                    >
                      <FaPlus className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Closed notice — ordering stays possible, preparation starts at the next opening */}
      {preOrderNote && (
        <div className="mx-auto max-w-7xl px-4 pb-3 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
            <FaClock className="mt-0.5 flex-shrink-0" />
            <p>
              <span className="font-bold">{t.hours.closedNow}.</span> {preOrderNote}
            </p>
          </div>
        </div>
      )}

      {/* Header - Desktop only */}
      <div className="hidden px-4 py-8 sm:px-6 lg:block lg:mx-auto lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.order.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.order.subtitle}</p>
      </div>

      {/* Mobile & Tablet: Brand switch + Categories Bar (Sticky) */}
      <div className="sticky top-[64px] z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#060b12]/90 lg:hidden">
        {/* Restaurant switcher */}
        <div className="flex gap-2 overflow-x-auto px-3 pt-2">
          {BRANDS.map((b) => {
            const active = b.id === activeBrand;
            return (
              <button
                key={b.id}
                onClick={() => selectBrand(b.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                }`}
              >
                <span className="relative h-5 w-5 overflow-hidden rounded-full bg-white">
                  <Image src={b.logo} alt={b.name} fill sizes="20px" className="object-contain" />
                </span>
                {b.name}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
          {brandInfo(activeBrand).categories.map((cat) => {
            const Icon = getCategoryIcon(cat);
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                    : "border border-slate-100 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/5 dark:bg-white/5 dark:text-slate-300"
                }`}
              >
                <Icon className="text-xs" /> <span className="whitespace-nowrap">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout (Hidden on mobile) */}
      <div className="mx-auto hidden max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[210px_1fr_300px] lg:px-8">
        {/* Desktop: Restaurant + Categories Sidebar */}
        <aside className="sticky top-[76px] self-start">
          <div className="space-y-3">
            {BRANDS.map((b) => {
              const active = b.id === activeBrand;
              return (
                <div
                  key={b.id}
                  className={`overflow-hidden rounded-2xl border transition ${
                    active
                      ? "border-emerald-400 bg-white shadow-lg shadow-emerald-600/5 dark:border-emerald-500/40 dark:bg-[#0c1420]"
                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#0c1420]"
                  }`}
                >
                  {/* Brand header (logo) — click to switch restaurant */}
                  <button
                    onClick={() => selectBrand(b.id)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${
                      active ? "" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 dark:ring-white/10">
                      <Image src={b.logo} alt={b.name} fill sizes="44px" className="object-contain p-1" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-900 dark:text-white">{b.name}</span>
                      <span className={`text-[11px] font-semibold ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        {b.categories.length} {t.order.menuCategories}
                      </span>
                    </span>
                  </button>

                  {/* Category list for the active brand */}
                  {active && (
                    <div className="space-y-1 border-t border-slate-100 p-2 dark:border-white/5">
                      {b.categories.map((cat) => {
                        const Icon = getCategoryIcon(cat);
                        const isActive = cat === activeCategory;
                        return (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-white/10"
                            }`}
                          >
                            <Icon className="shrink-0 text-base" /> <span className="truncate">{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Desktop: Products Section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 dark:ring-white/10">
              <Image src={brandInfo(activeBrand).logo} alt={brandInfo(activeBrand).name} fill sizes="36px" className="object-contain p-1" />
            </span>
            <div>
              <h2 className="text-lg font-black leading-tight text-slate-900 dark:text-white">{brandInfo(activeBrand).name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeCategory}</p>
            </div>
          </div>
          <ProductsGrid />
        </section>

        {/* Desktop: Cart + Checkout - Right sidebar */}
        <aside className="sticky top-[76px] self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#0c1420]">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                <FaCartShopping className="text-emerald-600 dark:text-emerald-400" /> {t.common.yourOrder}
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {itemCount} {t.common.items}
              </span>
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {cartLines.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  {t.common.emptyCart}
                </p>
              ) : (
                cartLines.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-white/5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">€{product.price.toFixed(2)} {t.common.each}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => removeFromCart(product.id)} className="grid h-7 w-7 place-items-center rounded-full bg-white text-slate-600 transition hover:text-red-600 dark:bg-white/10 dark:text-slate-300" aria-label={t.common.remove}>
                        {qty <= 1 ? <FaTrash className="text-[0.65rem]" /> : <FaMinus className="text-[0.65rem]" />}
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-slate-900 dark:text-white">{qty}</span>
                      <button onClick={() => addToCart(product.id)} className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500" aria-label={t.common.add}>
                        <FaPlus className="text-[0.65rem]" />
                      </button>
                    </div>
                    <span className="w-14 text-right text-sm font-bold text-slate-900 dark:text-white">
                      €{(product.price * qty).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Delivery details */}
            <div className="mt-5 space-y-3">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{t.order.deliveryDetails}</p>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t.order.name}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.order.phone}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={t.order.address}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <div>
                <input
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                  placeholder={`${t.order.postcode} (${t.order.postcodeHint})`}
                  className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition dark:bg-white/5 dark:text-white ${
                    postcodeStatus === "outside"
                      ? "border-red-400 focus:border-red-500 dark:border-red-500/50"
                      : postcodeStatus === "ok"
                        ? "border-emerald-400 focus:border-emerald-500 dark:border-emerald-500/50"
                        : "border-slate-200 focus:border-emerald-500 dark:border-white/10"
                  }`}
                />
                {postcodeStatus === "ok" ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <FaCircleCheck className="shrink-0" /> {t.order.inDeliveryArea}
                  </p>
                ) : postcodeStatus === "outside" ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                    <FaCircleExclamation className="shrink-0" /> {t.order.outsideArea}
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <FaLocationDot className="shrink-0" /> {t.order.deliveryAreaNote}
                  </p>
                )}
              </div>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={`${t.order.note} — ${t.order.notePlaceholder}`}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />

              {/* Company delivery planning */}
              {isCompany && (
                <div className="space-y-2 rounded-2xl border border-sky-300/60 bg-sky-500/5 p-3 dark:border-sky-400/30">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                    <FaCalendarDays /> {t.schedule.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["asap", "once", "workdays"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setScheduleType(opt)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          scheduleType === opt
                            ? "bg-sky-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-sky-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        }`}
                      >
                        {opt === "asap" ? t.schedule.asap : opt === "once" ? t.schedule.once : t.schedule.workdays}
                      </button>
                    ))}
                  </div>
                  {scheduleType === "once" && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        min={today}
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        aria-label={t.schedule.date}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        aria-label={t.schedule.time}
                        className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
                      />
                    </div>
                  )}
                  {scheduleType === "workdays" && (
                    <>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        aria-label={t.schedule.time}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
                      />
                      <p className="text-[11px] leading-4 text-sky-700/80 dark:text-sky-300/80">{t.schedule.workdaysNote}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Loyalty points */}
            {currentUser && maxPoints > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-300/50 bg-amber-400/10 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <span>{t.order.usePoints}</span>
                  <span>{currentUser.points} {t.order.pointsAvailable}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxPoints}
                  value={pointsUsed}
                  onChange={(e) => setPointsToUse(Number(e.target.value))}
                  className="mt-2 w-full accent-amber-500"
                />
                <div className="flex justify-between text-xs text-amber-700/80 dark:text-amber-300/80">
                  <span>{t.order.pointsHint}</span>
                  <span className="font-bold">−€{pointsUsed.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-white/5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{t.common.subtotal}</span>
                <span className="font-semibold text-slate-900 dark:text-white">€{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>{discountLabel} {t.common.discount} ({discountPct}%)</span>
                  <span className="font-semibold">−€{discount.toFixed(2)}</span>
                </div>
              )}
              {pointsUsed > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>{t.order.usePoints}</span>
                  <span className="font-semibold">−€{pointsUsed.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{t.common.delivery}</span>
                {freeDelivery && cartLines.length > 0 ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">€0.00</span>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">€{DELIVERY_FEE.toFixed(2)}</span>
                )}
              </div>
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900 dark:border-white/10 dark:text-white">
                <span>{t.common.total}</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>

            {belowMinOrder && (
              <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400">
                {minOrderNote}
              </p>
            )}
            <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
              {t.order.freeDeliveryNote} {t.order.foodOnlyNote}
            </p>

            {!currentUser && (
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                <Link href="/account" className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {t.common.signIn}
                </Link>{" "}
                - {t.order.signInForDiscount}
              </p>
            )}

            <button
              onClick={handleCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-500"
            >
              {t.common.placeOrder} <FaArrowRight />
            </button>

            {message && (
              <p
                className={`mt-3 rounded-xl px-3 py-2 text-center text-sm font-medium ${
                  message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Layout: Products + Cart Footer (Hidden on desktop) */}
      <div className="flex h-[calc(100vh-136px)] flex-col lg:hidden">
        {/* Products - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          <ProductsGrid />
        </div>

        {/* Mobile: Cart Footer - Sticky Bottom */}
        {cartLines.length > 0 && (
          <div className="border-t border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#060b12]/95 px-4 py-3 sm:px-6">
            <button
              onClick={() => setShowCartModal(true)}
              className="flex w-full items-center justify-between rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              <span className="flex items-center gap-2">
                <FaCartShopping /> {itemCount} {t.common.items}
              </span>
              <span>€{total.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Cart Modal - Mobile */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCartModal(false)} />
          <div className="relative w-full rounded-t-3xl bg-white shadow-2xl dark:bg-[#0c1420] sm:max-w-md sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.common.yourOrder}</h2>
              <button onClick={() => setShowCartModal(false)} className="text-2xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                ✕
              </button>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto px-5 py-4 pr-3">
              {cartLines.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">€{product.price.toFixed(2)} {t.common.each}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="grid h-6 w-6 place-items-center rounded-full bg-white text-slate-600 transition hover:text-red-600 dark:bg-white/10 dark:text-slate-300"
                      aria-label={t.common.remove}
                    >
                      {qty <= 1 ? <FaTrash className="text-[0.6rem]" /> : <FaMinus className="text-[0.6rem]" />}
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-slate-900 dark:text-white">{qty}</span>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500"
                      aria-label={t.common.add}
                    >
                      <FaPlus className="text-[0.6rem]" />
                    </button>
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-slate-900 dark:text-white">€{(product.price * qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 px-5 py-3 dark:border-white/10">
              {currentUser && maxPoints > 0 && (
                <div className="mb-3 rounded-lg border border-amber-300/50 bg-amber-400/10 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <span>{t.order.usePoints}</span>
                    <span>{currentUser.points} {t.order.pointsAvailable}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxPoints}
                    value={pointsUsed}
                    onChange={(e) => setPointsToUse(Number(e.target.value))}
                    className="mt-2 w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-amber-700/80 dark:text-amber-300/80">
                    <span>{t.order.pointsHint}</span>
                    <span className="font-bold">−€{pointsUsed.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-white/5">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{t.common.subtotal}</span>
                  <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-amber-700 dark:text-amber-400">
                    <span>{discountLabel} {t.common.discount} ({discountPct}%)</span>
                    <span className="font-semibold">−€{discount.toFixed(2)}</span>
                  </div>
                )}
                {pointsUsed > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>{t.order.usePoints}</span>
                    <span className="font-semibold">−€{pointsUsed.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{t.common.delivery}</span>
                  {freeDelivery ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">€0.00</span>
                  ) : (
                    <span className="font-semibold">€{DELIVERY_FEE.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900 dark:border-white/10 dark:text-white">
                  <span>{t.common.total}</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              {belowMinOrder && (
                <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400">
                  {minOrderNote}
                </p>
              )}
              <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                {t.order.freeDeliveryNote}
              </p>

              {!currentUser && (
                <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  <Link href="/account" className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {t.common.signIn}
                  </Link>{" "}
                  - {t.order.signInForDiscount}
                </p>
              )}

              <button
                onClick={handleProceedToCheckout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                {t.common.placeOrder} <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal - Mobile */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCheckoutModal(false)} />
          <div className="relative w-full rounded-t-3xl bg-white shadow-2xl dark:bg-[#0c1420] sm:max-w-md sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.order.deliveryDetails}</h2>
              <button onClick={() => setShowCheckoutModal(false)} className="text-2xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                ✕
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t.order.name}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.order.phone}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={t.order.address}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <div>
                <input
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                  placeholder={`${t.order.postcode} (${t.order.postcodeHint})`}
                  className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition dark:bg-white/5 dark:text-white ${
                    postcodeStatus === "outside"
                      ? "border-red-400 focus:border-red-500 dark:border-red-500/50"
                      : postcodeStatus === "ok"
                        ? "border-emerald-400 focus:border-emerald-500 dark:border-emerald-500/50"
                        : "border-slate-200 focus:border-emerald-500 dark:border-white/10"
                  }`}
                />
                {postcodeStatus === "ok" ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <FaCircleCheck className="shrink-0" /> {t.order.inDeliveryArea}
                  </p>
                ) : postcodeStatus === "outside" ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                    <FaCircleExclamation className="shrink-0" /> {t.order.outsideArea}
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <FaLocationDot className="shrink-0" /> {t.order.deliveryAreaNote}
                  </p>
                )}
              </div>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={`${t.order.note} — ${t.order.notePlaceholder}`}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />

              {/* Company delivery planning */}
              {isCompany && (
                <div className="space-y-2 rounded-lg border border-sky-300/60 bg-sky-500/5 p-3 dark:border-sky-400/30">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                    <FaCalendarDays /> {t.schedule.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["asap", "once", "workdays"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setScheduleType(opt)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          scheduleType === opt
                            ? "bg-sky-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-sky-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        }`}
                      >
                        {opt === "asap" ? t.schedule.asap : opt === "once" ? t.schedule.once : t.schedule.workdays}
                      </button>
                    ))}
                  </div>
                  {scheduleType === "once" && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        min={today}
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        aria-label={t.schedule.date}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        aria-label={t.schedule.time}
                        className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
                      />
                    </div>
                  )}
                  {scheduleType === "workdays" && (
                    <>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        aria-label={t.schedule.time}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
                      />
                      <p className="text-[11px] leading-4 text-sky-700/80 dark:text-sky-300/80">{t.schedule.workdaysNote}</p>
                    </>
                  )}
                </div>
              )}

              {preOrderNote && scheduleType === "asap" && (
                <p className="flex items-start gap-2 rounded-lg bg-sky-500/10 px-3 py-2 text-xs leading-5 text-sky-700 dark:text-sky-300">
                  <FaClock className="mt-0.5 flex-shrink-0" /> {preOrderNote}
                </p>
              )}

              {message && (
                <p
                  className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                    message.type === "success"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <button
                onClick={handleCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                {t.common.placeOrder} <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
