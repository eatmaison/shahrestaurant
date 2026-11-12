"use client";
import { readSessionValue, removeSessionValue } from "../lib/clientStorage";

import Image from "next/image";
import Link from "../components/LocaleLink";
import { MenuSchema } from "../components/MenuSchema";
import { CatalogFeedback } from "../components/CatalogFeedback";
import { firstMenuQueryValue, matchesMenuSearch, MENU_SEARCH_MAX_LENGTH, menuSearchInput, normalizeMenuSearch, type MenuSearchParams } from "../lib/menuSearch";
import { localePath } from "../lib/locale";
import { useRestaurantClock } from "../lib/useRestaurantClock";
import { OrderConfirmation } from "../components/OrderConfirmation";
import type { Order } from "../lib/types";
import { use, useDeferredValue, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  FaArrowRight,
  FaBagShopping,
  FaCalendarDays,
  FaCartShopping,
  FaChevronLeft,
  FaChevronRight,
  FaCircleCheck,
  FaCircleExclamation,
  FaClock,
  FaLocationDot,
  FaLock,
  FaMagnifyingGlass,
  FaMinus,
  FaPlus,
  FaStar,
  FaStore,
  FaTrash,
  FaTruck,
  FaXmark,
} from "../components/icons/fa6";
import { MdMenuBook } from "../components/icons/md";
import { useLang, useStore } from "../providers";
import dynamic from "next/dynamic";
import { ORDER_DISH_IMAGE_SIZES, ProductImage } from "../components/ProductImage";
const ProductDetailsModal = dynamic(() => import("../components/ProductDetailsModal"), { ssr: false });
import {
  categoryIconFor,
  COMPANY_DISCOUNT_PCT,
  COMPANY_MIN_ORDER,
  DELIVERY_FEE,
  FREE_DELIVERY_FROM,
  formatOrderNumber,
  isDrinkCategory,
  isMenuEligibleCategory,
  isPostcodeInDeliveryArea,
  isValidDutchPostcode,
  MIN_ORDER,
  POINTS_EARN_EVERY,
  VIP_DISCOUNT_PCT,
} from "../lib/data";
import { cartKeyForProduct, grillSideLabel, GRILL_SIDE_OPTIONS, isGrillSideRequired, parseCartKey } from "../lib/cart";
import type { Brand, Category, GrillSideChoice, MenuUpgrades, Product } from "../lib/types";
import { cartMenuPriceTotals, normalizeMenuUpgrades, softDrinksForMenu } from "../lib/menuUpgrades";
import styles from "./order.module.css";
import { OrderSheet } from "./OrderSheet";
import { useCinematicPageReady } from "../lib/useCinematicPageReady";
import { catalogForDisplay, initialCatalogSelection } from "../lib/catalogDisplay";
import type { PublicCatalogSnapshot } from "../lib/publicCatalogTypes";
import "../cinematic.css";

type CartLine = { key: string; product: Product; qty: number; sideChoice?: GrillSideChoice };

function CartLinePhoto({ product }: { product: Product }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const src = product.image;
  let optimized = !!src && src.startsWith("/") && !src.startsWith("//");
  try {
    const url = new URL(src ?? "");
    optimized ||= url.protocol === "https:" && url.hostname.endsWith(".digitaloceanspaces.com");
  } catch { /* Unsupported image sources use the solid cart background. */ }

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || visible || !optimized) return;
    const hasVisibleBox = () => {
      const rect = frame.getBoundingClientRect();
      const style = getComputedStyle(frame);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    if (typeof IntersectionObserver === "undefined") {
      const reveal = () => { if (hasVisibleBox()) setVisible(true); };
      const initialFrame = requestAnimationFrame(reveal);
      window.addEventListener("resize", reveal);
      return () => {
        cancelAnimationFrame(initialFrame);
        window.removeEventListener("resize", reveal);
      };
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0) || !hasVisibleBox()) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "200px" });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [optimized, visible]);

  if (!src || !optimized) return null;
  return (
    <div ref={frameRef} className={styles.cartLinePhoto} aria-hidden="true">
      {visible && <ProductImage src={src} alt="" sizes="(min-width: 1024px) 240px, (min-width: 480px) 384px, calc(100vw - 42px)" loading="lazy" fetchPriority="low" />}
    </div>
  );
}

function MobileMenuScrollRow({ children, className = "", showScrollButtons = true }: { children: ReactNode; className?: string; showScrollButtons?: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);

  const scrollByAmount = (amount: number) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollLeft += amount;
  };

  useEffect(() => {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScrollLeft = 0;

    const startDrag = (event: MouseEvent) => {
      const row = rowRef.current;
      if (!row || !row.contains(event.target as Node)) return;
      if (event.button !== 0 || row.scrollWidth <= row.clientWidth) return;
      event.preventDefault();
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScrollLeft = row.scrollLeft;
      row.classList.add("is-dragging");
    };

    const drag = (event: MouseEvent) => {
      const row = rowRef.current;
      if (!dragging) return;
      if (!row) return;
      event.preventDefault();
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 4) moved = true;
      row.scrollLeft = startScrollLeft - distance;
    };

    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      suppressClickRef.current = moved;
      rowRef.current?.classList.remove("is-dragging");
    };

    document.addEventListener("mousedown", startDrag, true);
    window.addEventListener("mousemove", drag, { passive: false });
    window.addEventListener("mouseup", stopDrag);

    return () => {
      document.removeEventListener("mousedown", startDrag, true);
      window.removeEventListener("mousemove", drag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, []);

  return (
    <div className={showScrollButtons ? "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1" : "min-w-0"}>
      {showScrollButtons && <button
        type="button"
        aria-label="Scroll links"
        onClick={() => scrollByAmount(-260)}
        className="mobile-menu-scroll-button"
      >
        <FaChevronLeft />
      </button>}
      <div
        ref={rowRef}
        className={`mobile-menu-scroll flex gap-2 ${className}`}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          suppressClickRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {children}
      </div>
      {showScrollButtons && <button
        type="button"
        aria-label="Scroll rechts"
        onClick={() => scrollByAmount(260)}
        className="mobile-menu-scroll-button"
      >
        <FaChevronRight />
      </button>}
    </div>
  );
}

export default function OrderExperience({ searchParams, initialCatalog = null }: { searchParams: Promise<MenuSearchParams>; initialCatalog?: PublicCatalogSnapshot | null }) {
  const query = use(searchParams);
  const cinematicRootRef = useRef<HTMLDivElement>(null);
  useCinematicPageReady(cinematicRootRef, "menu");
  const { t, lang } = useLang();
  const { products, brands: liveBrands, cart, menuUpgrades, setMenuUpgrades, addToCart, removeFromCart, currentUser, placeOrder, restaurantStatus, hydrated, catalogStatus } = useStore();
  const [hasSeenReady, setHasSeenReady] = useState(catalogStatus === "ready");
  useEffect(() => {
    if (catalogStatus === "ready") queueMicrotask(() => setHasSeenReady(true));
  }, [catalogStatus]);
  const catalog = catalogForDisplay(initialCatalog, products, liveBrands, catalogStatus, hasSeenReady);
  const brands = catalog.brands;
  const menuReady = hydrated || catalog.usingInitial;
  const [initialSelection] = useState(() => initialCatalogSelection(initialCatalog));
  const [search, setSearch] = useState(() => menuSearchInput(query.q));
  const searchRef = useRef<HTMLInputElement>(null);
  const addressableQuery = useSearchParams().get("q");

  // Native history changes keep the checkout draft mounted, including Back/Forward.
  useEffect(() => {
    queueMicrotask(() => setSearch(menuSearchInput(addressableQuery ?? undefined)));
  }, [addressableQuery]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    const current = new URL(window.location.href);
    for (const name of ["dish", "cart"]) {
      const input = event.currentTarget.elements.namedItem(name);
      if (input instanceof HTMLInputElement) {
        input.disabled = !current.searchParams.has(name);
        input.value = current.searchParams.get(name) ?? "";
      }
    }
    const submitted = menuSearchInput(searchRef.current?.value ?? search);
    const next = new URL(current);
    next.searchParams.set("q", submitted);
    if (next.href !== current.href) window.history.pushState(null, "", next.pathname + next.search + next.hash);
    event.preventDefault();
    setSearch(submitted);
  };

  const [activeBrand, setActiveBrand] = useState<Brand>(initialSelection.brand);
  const [activeCategory, setActiveCategory] = useState<Category>(initialSelection.category);
  const [activeSubcategory, setActiveSubcategory] = useState<Category | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    address: "",
    postcode: "",
    note: "",
  });
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  // How the customer wants to receive the order: delivered, or picked up in person.
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [scheduleType, setScheduleType] = useState<"asap" | "once" | "workdays">("asap");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const localNow = useRestaurantClock();
  const today = localNow.slice(0, 10);
  const deferredSearch = useDeferredValue(search);
  const linkedDishHandled = useRef(false);

  const nextOpen = restaurantStatus.nextOpening;

  // "We will start preparing your order today / on Tuesday from 15:00."
  const preOrderNote = useMemo(() => {
    if (!nextOpen) return null;
    if (nextOpen.daysAhead === 0) return t.hours.preOrderToday;
    const dayNames =
      lang === "nl"
        ? ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"]
        : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[nextOpen.weekday] ?? "";
    return t.hours.preOrderDay.replace("{day}", dayName);
  }, [nextOpen, t, lang]);

  // Auto-fill the delivery form from the customer's saved profile (name, phone,
  // last address & postcode). Only fills empty fields, so the customer can still
  // edit or clear them to deliver somewhere else.
  useEffect(() => {
    if (!currentUser) return;
    queueMicrotask(() => {
      setForm((f) => ({
        ...f,
        name: f.name || currentUser.name || "",
        email: currentUser.email || f.email,
        phone: f.phone || currentUser.phone || "",
        address: f.address || currentUser.address || "",
        postcode: f.postcode || currentUser.postcode || "",
      }));
    });
  }, [currentUser]);

  useEffect(() => {
    if (!hydrated || !products.length || linkedDishHandled.current) return;
    linkedDishHandled.current = true;
    const url = new URL(window.location.href);
    // A submitted/addressable search is explicit, even when it requests an empty query.
    if (url.searchParams.has("q")) return;
    const product = products.find(product => product.id === url.searchParams.get("dish"));
    if (!product) return;
    queueMicrotask(() => setSearch(product.name));
    url.searchParams.delete("dish"); window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [products, hydrated]);

  const menuProducts = catalog.products;
  const subcategoriesOf = (brandId: string, categoryName: string) =>
    brands.find((b) => b.id === brandId)?.categories.find((c) => c.name === categoryName)?.subcategories ?? [];

  const categoryMatchesProduct = (product: Product, category: Category) => {
    if (category === "Drinks") {
      if (!isDrinkCategory(product.category)) return false;
    } else if (product.category !== category) {
      return false;
    }
    if (subcategoriesOf(activeBrand, category).length === 0) return true;
    return activeSubcategory === "all" || product.subcategory === activeSubcategory;
  };

  const searchTerms = normalizeMenuSearch(deferredSearch).split(/\s+/).filter(Boolean);
  const visible = menuProducts.filter((product) => {
    if (!searchTerms.length) return product.brand === activeBrand && categoryMatchesProduct(product, activeCategory);
    return matchesMenuSearch(product, deferredSearch);
  });

  /** The active restaurant's admin-managed config (safe fallback while loading). */
  const activeBrandCfg = brands.find((b) => b.id === activeBrand) ?? brands[0];

  /** House brand (this website's restaurant) always listed first in the switcher. */
  const sortedBrands = [...brands].sort((a, b) => (a.id === "tandoor" ? -1 : b.id === "tandoor" ? 1 : 0));

  // Keep the selected restaurant/category valid when the admin edits menus.
  useEffect(() => {
    if (brands.length === 0) return;
    const brand = brands.find((b) => b.id === activeBrand);
    const firstCategoryWithProducts = (targetBrand: Brand) => {
      const config = brands.find((b) => b.id === targetBrand);
      return config?.categories.find((category) => menuProducts.some((product) => product.brand === targetBrand && categoryMatchesProduct(product, category.name)))?.name;
    };
    if (!brand) {
      queueMicrotask(() => {
        setActiveBrand(brands[0].id);
        setActiveCategory(firstCategoryWithProducts(brands[0].id) ?? brands[0].categories[0]?.name ?? "");
        setActiveSubcategory("all");
      });
    } else if (!brand.categories.some((c) => c.name === activeCategory)) {
      queueMicrotask(() => {
        setActiveCategory(firstCategoryWithProducts(activeBrand) ?? brand.categories[0]?.name ?? "");
        setActiveSubcategory("all");
      });
    } else if (subcategoriesOf(activeBrand, activeCategory).length === 0 && activeSubcategory !== "all") {
      queueMicrotask(() => setActiveSubcategory("all"));
    } else if (activeSubcategory !== "all" && !subcategoriesOf(activeBrand, activeCategory).some((s) => s.name === activeSubcategory)) {
      queueMicrotask(() => setActiveSubcategory("all"));
    } else if (menuProducts.length > 0 && !menuProducts.some((product) => product.brand === activeBrand && categoryMatchesProduct(product, activeCategory))) {
      const nextCategory = firstCategoryWithProducts(activeBrand);
      if (nextCategory && nextCategory !== activeCategory) queueMicrotask(() => {
        setActiveCategory(nextCategory);
        setActiveSubcategory("all");
      });
    }
  }, [brands, menuProducts, activeBrand, activeCategory, activeSubcategory]);

  // Switch restaurant/brand and jump to that brand's first category.
  const selectBrand = (brand: Brand) => {
    setSearch("");
    if (brand === activeBrand) return;
    setActiveBrand(brand);
    setActiveCategory(brands.find((b) => b.id === brand)?.categories[0]?.name ?? "");
    setActiveSubcategory("all");
  };

  const selectCategory = (category: Category) => {
    setSearch("");
    setActiveCategory(category);
    setActiveSubcategory("all");
  };

  const cartLines = useMemo(
    () => {
      const availableProducts = products;
      const productById = new Map(availableProducts.map((product) => [product.id, product]));
      return Object.entries(cart).flatMap(([key, qty]): CartLine[] => {
        const { productId, sideChoice } = parseCartKey(key);
        const product = productById.get(productId);
        if (!product || qty <= 0) return [];
        if (isGrillSideRequired(product) && !sideChoice) return [];
        return [{ key, product, qty, sideChoice: isGrillSideRequired(product) ? sideChoice : undefined }];
      });
    },
    [products, cart]
  );

  const selectedMenuUpgrades = useMemo(() => {
    const normalized = normalizeMenuUpgrades(menuUpgrades, cart);
    const selected: MenuUpgrades = {};
    for (const line of cartLines) {
      if (isMenuEligibleCategory(line.product.category) && normalized[line.product.id]?.length) {
        selected[line.product.id] = normalized[line.product.id];
      }
    }
    return selected;
  }, [cartLines, menuUpgrades, cart]);
  const hasInvalidMenuUpgrades = Object.entries(selectedMenuUpgrades).some(([productId, choices]) => {
    const product = products.find((item) => item.id === productId);
    return !product || choices.some((choice) => !softDrinksForMenu(product, products).some((drink) => drink.id === choice));
  });
  const { subtotal, foodSubtotal } = cartMenuPriceTotals(cartLines, selectedMenuUpgrades);
  const bogoProducts = [...new Map(menuProducts.filter((product) => product.bogoEnabled).map((product) => [product.name, product])).values()];
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
  const isPickup = fulfillment === "pickup";
  // Pickup is always free; companies get free delivery; regular clients only above €30.
  const freeDelivery = isPickup ? true : isCompany ? true : payableBeforePoints >= FREE_DELIVERY_FROM;
  const delivery = cartLines.length > 0 ? (freeDelivery ? 0 : DELIVERY_FEE) : 0;
  const total = cartLines.length > 0 ? +(payableBeforePoints - pointsUsed + delivery).toFixed(2) : 0;
  const itemCount = cartLines.reduce((sum, l) => sum + l.qty * (l.product.bogoEnabled ? 2 : 1), 0);
  const belowMinOrder = cartLines.length > 0 && !isPickup && subtotal < minOrder;
  // Loyalty points this order will earn (1 point per €10 actually paid, matching the server).
  const pointsToEarn = Math.floor(Math.max(0, payableBeforePoints - pointsUsed) / POINTS_EARN_EVERY);

  useEffect(() => {
    const cartUrl = new URL(window.location.href);
    const requestedCart = cartUrl.searchParams.get("cart") === "1";
    const openCartModal = () => {
      if (cartLines.length === 0) return;
      removeSessionValue("openCartModal");
      if (requestedCart) { cartUrl.searchParams.delete("cart"); window.history.replaceState(null, "", cartUrl.toString()); }
      setShowCartModal(true);
    };

    window.addEventListener("open-cart-modal", openCartModal);
    if (readSessionValue("openCartModal") === "1" || requestedCart) openCartModal();
    return () => window.removeEventListener("open-cart-modal", openCartModal);
  }, [cartLines.length]);

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
    if (hasInvalidMenuUpgrades) {
      setMessage({ type: "error", text: lang === "nl" ? "Kies voor elk volledig menu een beschikbare gratis frisdrank." : "Choose an available free soft drink for each full menu." });
      return;
    }
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
    if (submitLock.current) return;
    if (hasInvalidMenuUpgrades) {
      setMessage({ type: "error", text: lang === "nl" ? "Kies voor elk volledig menu een beschikbare gratis frisdrank." : "Choose an available free soft drink for each full menu." });
      return;
    }
    const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-checkout-fields] input, [data-checkout-fields] textarea");
    for (const field of fields) { if (field.getClientRects().length && !field.disabled && !field.reportValidity()) return; }
    if (belowMinOrder) {
      setMessage({ type: "error", text: minOrderNote });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUser?.email || form.email.trim())) {
      setMessage({ type: "error", text: lang === "nl" ? "Vul een geldig e-mailadres in voor de bestelbevestiging." : "Enter a valid email address for your order confirmation." });
      return;
    }
    // Pickup needs contact details; delivery also needs a valid in-area address.
    if (isPickup) {
      if (!form.name.trim() || !form.phone.trim()) {
        setMessage({ type: "error", text: t.auth.fillFields });
        return;
      }
    } else {
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
    }
    if (isCompany && scheduleType === "once" && (!scheduleDate || !scheduleTime)) {
      setMessage({ type: "error", text: t.schedule.pickDateTime });
      return;
    }
    if (isCompany && scheduleType === "workdays" && !scheduleTime) {
      setMessage({ type: "error", text: t.schedule.pickDateTime });
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    try {
    const res = await placeOrder({
      customerName: form.name,
      email: currentUser?.email || form.email.trim(),
      address: isPickup ? "" : form.address,
      postcode: isPickup ? "" : form.postcode,
      phone: form.phone,
      note: form.note,
      pointsToUse: pointsUsed,
      menuUpgrades: selectedMenuUpgrades,
      fulfillment,
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
    if (res.ok && res.order) {
      setConfirmedOrder(res.order);
      setShowCartModal(false);
      setMessage({ type: "success", text: `${t.order.orderPlaced} ${t.order.orderNumber} ${formatOrderNumber(res.order!.orderNumber)}` });
      setForm((f) => ({ ...f, address: "", postcode: "", note: "" }));
      setPointsToUse(0);
      setScheduleType("asap");
      setScheduleDate("");
      setScheduleTime("");
      setMenuUpgrades({});
      setShowCheckoutModal(false);
    } else if (res.error === "minOrder") {
      setMessage({ type: "error", text: minOrderNote });
    } else if (res.error === "outsideArea") {
      setMessage({ type: "error", text: t.order.outsideArea });
    } else if (res.error === "closed") {
      setMessage({ type: "error", text: t.hours.scheduleClosedNote });
    } else if (res.error === "empty") {
      setMessage({ type: "error", text: t.order.selectItem });
    } else {
      setMessage({ type: "error", text: lang === "nl"
        ? "We konden de bevestiging nog niet ophalen. Controleer Mijn bestellingen of probeer opnieuw; dezelfde aanvraag wordt niet dubbel verwerkt."
        : "We could not retrieve the confirmation yet. Check My orders or retry; the same request will not be processed twice." });
    }
    } catch {
      setMessage({ type: "error", text: lang === "nl" ? "Controleer Mijn bestellingen en probeer opnieuw." : "Check My orders and try again." });
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const fulfillmentToggle = (
    <div className="space-y-2">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{t.order.fulfillmentTitle}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFulfillment("delivery")}
          aria-pressed={fulfillment === "delivery"}
          className={`flex min-w-0 flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
            fulfillment === "delivery"
              ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40"
              : "border-slate-200 bg-slate-50 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <span className={`flex items-center gap-1.5 text-sm font-bold ${fulfillment === "delivery" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
            <FaTruck /> {t.order.optionDelivery}
          </span>
          <span className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">{t.order.optionDeliverySub}</span>
        </button>
        <button
          type="button"
          onClick={() => setFulfillment("pickup")}
          aria-pressed={fulfillment === "pickup"}
          className={`flex min-w-0 flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
            fulfillment === "pickup"
              ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40"
              : "border-slate-200 bg-slate-50 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <span className={`flex items-center gap-1.5 text-sm font-bold ${fulfillment === "pickup" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
            <FaBagShopping /> {t.order.optionPickup}
          </span>
          <span className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">{t.order.optionPickupSub}</span>
        </button>
      </div>
      {isPickup && (
        <p className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-700 dark:text-emerald-300">
          <FaStore className="mt-0.5 shrink-0" /> {t.order.pickupInfo}
        </p>
      )}
    </div>
  );

  const ProductsGrid = () => (
    <div key={`${activeBrand}-${activeCategory}`} data-menu-products className={`${styles.products} grid grid-cols-2 gap-4 lg:grid-cols-2`}>
      {!menuReady && menuProducts.length === 0 && (
        [0, 1, 2, 3].map((index) => (
          <div key={index} className="premium-panel ember-border lux-sweep rounded-2xl p-3">
            <div className="skeleton aspect-[4/3] rounded-xl" />
            <div className="mt-3 space-y-2">
              <span className="skeleton block h-4 w-3/4 rounded-full" />
              <span className="skeleton block h-3 w-full rounded-full" />
              <span className="skeleton block h-9 w-full rounded-full" />
            </div>
          </div>
        ))
      )}
      {menuReady && visible.length === 0 && (
        <div className="premium-panel ember-border lux-sweep col-span-full rounded-3xl p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-2xl text-emerald-600 dark:text-emerald-400">
            <FaStore />
          </span>
          <p className="font-display mt-4 text-lg font-bold text-slate-900 dark:text-white">{searchTerms.length ? (lang === "nl" ? "Geen gerechten gevonden" : "No dishes found") : activeCategory}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {searchTerms.length ? (lang === "nl" ? "Probeer een andere naam of wis uw zoekopdracht." : "Try another name or clear your search.") : (lang === "nl" ? "Deze categorie wordt binnenkort aangevuld." : "This category is being refreshed soon.")}
          </p>
          {searchTerms.length > 0 && <button type="button" className={styles.resetSearch} onClick={() => { setSearch(""); searchRef.current?.focus(); }}><FaXmark aria-hidden="true" />{lang === "nl" ? "Zoekopdracht wissen" : "Clear search"}</button>}
        </div>
      )}
      {visible.map((p, imageIndex) => {
        const needsSideChoice = isGrillSideRequired(p);
        const qty = needsSideChoice
          ? GRILL_SIDE_OPTIONS.reduce((sum, option) => sum + (cart[cartKeyForProduct(p.id, option.id)] || 0), 0)
          : cart[p.id] || 0;
        const Icon = categoryIconFor(brands, p.subcategory ?? p.category);
        return (
          <article
            key={p.id}
            data-menu-dish
            className={`premium-panel magnetic-card lux-sweep group flex flex-col overflow-hidden rounded-2xl ${
              qty > 0
                ? "ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-600/10"
                : ""
            }`}
          >
            <div className="dish-img relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-emerald-600/10">
              {p.image ? (
                <ProductImage key={p.image} src={p.image} alt={p.name} sizes={ORDER_DISH_IMAGE_SIZES} loading={imageIndex === 0 ? "eager" : "lazy"} fetchPriority={imageIndex === 0 ? "high" : "auto"} />
              ) : (
                <span className="grid h-full w-full place-items-center text-4xl text-emerald-500/50">
                  <Icon />
                </span>
              )}
              {/* Steam wisps rising off the dish on hover - fresh from the tandoor */}
              <span className="pointer-events-none absolute left-1/2 top-[55%] z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden>
                <span className="steam" style={{ left: "-14px" }} />
                <span className="steam" style={{ animationDelay: "1.2s" }} />
                <span className="steam" style={{ left: "12px", animationDelay: "0.6s" }} />
              </span>
              {/* In-cart quantity badge */}
              {qty > 0 && (
                <span
                  key={qty}
                  className="animate-pop absolute left-2 top-2 z-10 grid h-7 min-w-7 place-items-center rounded-full bg-emerald-600 px-2 text-xs font-black text-white shadow-lg shadow-emerald-600/40"
                >
                  ×{qty}
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
            <div className="flex flex-1 flex-col py-2 px-1.5">
              {searchTerms.length > 0 && <p className={styles.productBrand}><FaStore aria-hidden="true" />{brands.find((brand) => brand.id === p.brand)?.name ?? p.brand}</p>}
              <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">{p.name}</h3>{p.isPopular && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">Popular</span>}{p.isNew && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">New</span>}</div>
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
              <p className="mt-1.5 flex-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {(lang === "nl" && p.descriptionNl) || p.description}
              </p>
              <fieldset disabled={catalog.usingInitial} className="mt-3 flex min-w-0 flex-col gap-2">
                {/* Add/Remove Buttons */}
                {needsSideChoice ? (
                  <div className="space-y-1.5 rounded-2xl bg-slate-50 p-2 dark:bg-white/5">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {lang === "nl" ? "Kies bijgerecht" : "Choose side"}
                    </p>
                    {GRILL_SIDE_OPTIONS.map((option) => {
                      const optionQty = cart[cartKeyForProduct(p.id, option.id)] || 0;
                      return optionQty === 0 ? (
                        <button
                          key={option.id}
                          onClick={() => addToCart(p.id, option.id)}
                          className="flex w-full items-center justify-between rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-emerald-500/15"
                        >
                          <span>{grillSideLabel(option.id, lang)}</span>
                          <FaPlus className="text-[0.65rem]" />
                        </button>
                      ) : (
                        <div key={option.id} className="flex items-center justify-between rounded-full bg-emerald-500/10 p-1">
                          <span className="ml-2 min-w-0 truncate text-xs font-bold text-emerald-800 dark:text-emerald-200">
                            {grillSideLabel(option.id, lang)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <button
                              onClick={() => removeFromCart(p.id, option.id)}
                              className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-700 transition hover:text-red-600 dark:bg-white/10 dark:text-slate-200"
                              type="button" aria-label={`${t.common.remove}: ${p.name}`}
                            >
                              {optionQty <= 1 ? <FaTrash className="text-[0.6rem]" /> : <FaMinus className="text-[0.6rem]" />}
                            </button>
                            <span className="w-4 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">{optionQty}</span>
                            <button
                              onClick={() => addToCart(p.id, option.id)}
                              className="grid h-11 w-11 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500"
                              type="button" aria-label={`${t.common.add}: ${p.name}`} disabled={qty >= 99}
                            >
                              <FaPlus className="text-[0.6rem]" />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : qty === 0 ? (
                  <button
                    onClick={() => addToCart(p.id)}
                    className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/30 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <FaPlus className="text-xs" /> {t.common.add}
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-full bg-emerald-500/10 p-1">
                    <button
                      onClick={() => removeFromCart(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 transition hover:text-red-600 dark:bg-white/10 dark:text-slate-200"
                      type="button" aria-label={`${t.common.remove}: ${p.name}`}
                    >
                      <FaMinus className="text-xs" />
                    </button>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{qty}</span>
                    <button
                      onClick={() => addToCart(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500"
                      type="button" aria-label={`${t.common.add}: ${p.name}`} disabled={qty >= 99}
                    >
                      <FaPlus className="text-xs" />
                    </button>
                  </div>
                )}
              </fieldset>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderMenuUpgradeControls = (product: Product, qty: number) => {
    if (!isMenuEligibleCategory(product.category)) return null;
    const drinks = softDrinksForMenu(product, products);
    const choices = selectedMenuUpgrades[product.id] ?? [];
    const updateChoices = (update: (current: string[]) => string[]) => setMenuUpgrades((current) => {
      const next = { ...current };
      const updated = update(normalizeMenuUpgrades(current, cart)[product.id] ?? []);
      if (updated.length) next[product.id] = updated;
      else delete next[product.id];
      return next;
    });
    return (
      <div className={styles.menuUpgrade} data-menu-upgrade>
        <p className={styles.menuUpgradeTitle}>{t.order.menuUpgradeTitle}</p>
        <p className={styles.menuUpgradeHint}>{t.order.menuUpgradeHint}</p>
        <label className={styles.menuUpgradeCount}>
          <span>{lang === "nl" ? "Volledige menu's" : "Full menus"}</span>
          <select
            aria-label={`${lang === "nl" ? "Aantal volledige menu's" : "Number of full menus"}: ${product.name}`}
            value={choices.length}
            disabled={drinks.length === 0 && choices.length === 0}
            onChange={(event) => {
              const count = Number(event.target.value);
              updateChoices((current) => Array.from({ length: count }, (_, index) => current[index] ?? drinks[0]?.id ?? ""));
            }}
            className={styles.menuUpgradeSelect}
            data-menu-upgrade-count
          >
            {Array.from({ length: qty + 1 }, (_, count) => <option key={count} value={count} disabled={drinks.length === 0 && count > choices.length}>{count} / {qty}</option>)}
          </select>
        </label>
        <p className={styles.menuUpgradeHint} aria-live="polite">
          {lang === "nl"
            ? `${choices.length} volledige menu's · ${qty - choices.length} zonder menu`
            : `${choices.length} full ${choices.length === 1 ? "menu" : "menus"} · ${qty - choices.length} without menu`}
        </p>
        {drinks.length === 0 && <p className={styles.menuUpgradeHint}>{t.order.menuUpgradeNoDrinks}</p>}
        {choices.map((drinkId, index) => {
          const valid = drinks.some((drink) => drink.id === drinkId);
          return (
            <div key={index} className={styles.menuUpgradeChoice}>
              <label className={styles.menuUpgradeLabel}>
                {t.order.menuUpgradeDrink} · Menu {index + 1}
                <select
                  aria-label={`${t.order.menuUpgradeDrink} ${index + 1}: ${product.name}`}
                  aria-invalid={!valid || undefined}
                  required
                  value={valid ? drinkId : ""}
                  onChange={(event) => updateChoices((current) => current.map((choice, choiceIndex) => choiceIndex === index ? event.target.value : choice))}
                  className={styles.menuUpgradeSelect}
                  data-menu-upgrade-drink={index}
                >
                  {!valid && <option value="" disabled>{lang === "nl" ? "Kies een beschikbare frisdrank" : "Choose an available soft drink"}</option>}
                  {drinks.map((drink) => <option key={drink.id} value={drink.id}>{drink.name}</option>)}
                </select>
              </label>
              <button
                type="button"
                onClick={() => updateChoices((current) => current.filter((_, choiceIndex) => choiceIndex !== index))}
                className={`${styles.cartQuantityButton} ${styles.menuUpgradeRemove}`}
                aria-label={`${lang === "nl" ? "Verwijder volledig menu" : "Remove full menu"} ${index + 1}: ${product.name}`}
              >
                <span aria-hidden="true" className={`${styles.cartQuantityDisc} ${styles.menuUpgradeRemoveDisc}`}><FaXmark /></span>
              </button>
              {!valid && <p className={styles.menuUpgradeError}>{lang === "nl" ? "Kies een beschikbare frisdrank om verder te gaan." : "Choose an available soft drink to continue."}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={cinematicRootRef} data-menu-page className={`${styles.page} page-stage min-h-screen`}>
      <MenuSchema products={visible} />
      {/* Closed notice - ordering stays possible, preparation starts at the next opening */}
      {preOrderNote && (
        <details data-menu-ordering-note className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <summary><FaClock aria-hidden="true" /><strong>{t.hours.closedNow}</strong><FaChevronRight aria-hidden="true" /></summary>
          <p>{preOrderNote}</p>
        </details>
      )}

      {/* Header - Desktop only */}
      <div className="order-hero-strip relative overflow-hidden px-4 py-6 sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_80%_at_30%_0%,rgba(217,126,38,0.14),transparent_65%)]" />
        <div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 animate-float rounded-full bg-emerald-500/10 blur-3xl" />
        <span className="lux-overline relative inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <span className="ornament-gem" aria-hidden /> {t.order.categoryHint}
        </span>
        <h1 className="font-display relative mt-2 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
          <span className="ember-text">{t.order.title}</span><span className="sr-only"> — {lang === "nl" ? "Indiase menukaart Amsterdam-Noord" : "Indian menu Amsterdam-Noord"}</span>
        </h1>
        <p className="relative mt-2 text-sm text-slate-600 dark:text-slate-400">{t.order.subtitle}</p>
        <div className="gold-rule relative mt-5" />
      </div>

      <div data-menu-search className={styles.searchArea}>
        <div className={styles.searchControls}>
        <form role="search" aria-label={lang === "nl" ? "Zoek gerechten" : "Search dishes"} action={localePath("/order", lang)} method="get" onSubmit={submitSearch} className={styles.searchBox}>
          {(["dish", "cart"] as const).map(name => <input key={name} type="hidden" name={name} defaultValue={firstMenuQueryValue(query[name]) ?? ""} disabled={firstMenuQueryValue(query[name]) === undefined} />)}
          <FaMagnifyingGlass aria-hidden="true" />
          <label htmlFor="order-search" className="sr-only">{lang === "nl" ? "Zoek gerechten" : "Search dishes"}</label>
          <input id="order-search" name="q" ref={searchRef} type="search" maxLength={MENU_SEARCH_MAX_LENGTH} autoComplete="off" spellCheck={false} enterKeyHint="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={lang === "nl" ? "Zoek in alle restaurants" : "Search all restaurants"} aria-describedby="order-search-results" />
          {search && <button type="button" onClick={() => { setSearch(""); searchRef.current?.focus(); }} aria-label={lang === "nl" ? "Zoekopdracht wissen" : "Clear search"} title={lang === "nl" ? "Zoekopdracht wissen" : "Clear search"}><FaXmark aria-hidden="true" /></button>}
          <button type="submit" aria-label={lang === "nl" ? "Zoek gerechten" : "Search dishes"} title={lang === "nl" ? "Zoek gerechten" : "Search dishes"}><FaArrowRight aria-hidden="true" /></button>
        </form>
        <p id="order-search-results" role="status" aria-live="polite">{searchTerms.length ? (lang === "nl" ? "Alle restaurants" : "All restaurants") : activeBrandCfg?.name} · {menuReady ? `${visible.length} ${t.common.items}` : (lang === "nl" ? "Menukaart laden" : "Loading menu")}</p>
        </div>
        <details data-menu-loyalty className={styles.loyaltyNotice} style={{ visibility: hydrated && !currentUser ? "visible" : "hidden" }} aria-hidden={!hydrated || !!currentUser}><summary><FaStar aria-hidden="true" /><strong>{lang === "nl" ? "Maak een account en spaar punten" : "Register and start earning loyalty points"}</strong><FaChevronRight aria-hidden="true" /></summary><div><p>{lang === "nl" ? "Spaar bij uw bestellingen en gebruik uw punten voor korting." : "Earn points with your orders and redeem them for discounts."}</p><Link href="/account#register">{lang === "nl" ? "Registreren" : "Register"}<FaArrowRight aria-hidden="true" /></Link></div></details>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6"><CatalogFeedback /></div>
      {/* Mobile & Tablet: Brand switch + Categories Bar (Sticky) */}
      <div className={`${styles.categoryBar} sticky z-40 border-b border-emerald-500/20 bg-white/90 shadow-lg shadow-emerald-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0c0703]/90 lg:hidden`}>
        {/* Restaurant switcher */}
        <MobileMenuScrollRow className="px-3 pt-2" showScrollButtons={false}>
          {sortedBrands.map((b) => {
            const active = b.id === activeBrand;
            return (
              <button
                key={b.id}
                onClick={() => selectBrand(b.id)}
                className={`flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                }`}
              >
                <span className="relative grid h-5 w-5 place-items-center overflow-hidden rounded-full bg-white">
                  {b.logo ? <Image src={b.logo} alt={b.name} fill sizes="20px" className="object-contain" /> : <FaStore className="text-[10px] text-slate-400" />}
                </span>
                {b.name}
              </button>
            );
          })}
        </MobileMenuScrollRow>
        <MobileMenuScrollRow className="px-3 py-2" showScrollButtons={false}>
          {(activeBrandCfg?.categories ?? []).map((c) => {
            const cat = c.name;
            const Icon = categoryIconFor(brands, cat);
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/30"
                    : "border border-slate-100 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/5 dark:bg-white/5 dark:text-slate-300"
                }`}
              >
                <Icon className="text-xs" /> <span className="whitespace-nowrap">{cat}</span>
              </button>
            );
          })}
        </MobileMenuScrollRow>
        {subcategoriesOf(activeBrand, activeCategory).length > 0 && (
          <MobileMenuScrollRow className="px-3 pb-2" showScrollButtons={false}>
            <button
              onClick={() => setActiveSubcategory("all")}
              className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                activeSubcategory === "all"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                  : "border border-slate-100 bg-white text-slate-600 hover:border-sky-400 hover:bg-sky-50 dark:border-white/5 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              All {activeCategory.toLowerCase()}
            </button>
            {subcategoriesOf(activeBrand, activeCategory).map((sub) => {
              const Icon = categoryIconFor(brands, sub.name);
              const active = activeSubcategory === sub.name;
              return (
                <button
                  key={sub.name}
                  onClick={() => setActiveSubcategory(sub.name)}
                  className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                    active
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                      : "border border-slate-100 bg-white text-slate-600 hover:border-sky-400 hover:bg-sky-50 dark:border-white/5 dark:bg-white/5 dark:text-slate-300"
                  }`}
                >
                  <Icon className="text-xs" /> <span className="whitespace-nowrap">{sub.name}</span>
                </button>
              );
            })}
          </MobileMenuScrollRow>
        )}
      </div>

      {/* Desktop Layout (Hidden on mobile) */}
      {bogoProducts.length > 0 && (
        <div className="mx-auto mb-5 max-w-7xl animate-pop rounded-2xl border-2 border-rose-400 bg-rose-50 px-5 py-4 text-center shadow-lg shadow-rose-500/20 dark:border-rose-400/70 dark:bg-rose-950/40">
          <p className="text-lg font-black uppercase tracking-wide text-rose-700 dark:text-rose-200">BUY 1 GET 1 FREE</p>
          <p className="mt-1 text-sm font-bold text-rose-600 dark:text-rose-300">Buy one, get the second one free: {bogoProducts.map((product) => product.name).join(", ")}</p>
        </div>
      )}
      <div data-menu-desktop className="mx-auto hidden max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[210px_1fr_300px] lg:px-8">
        {/* Desktop: Restaurant + Categories Sidebar */}
        <aside className={`${styles.categorySidebar} sticky top-[76px] self-start`} aria-label={lang === "nl" ? "Restaurants en categorieën" : "Restaurants and categories"}>
          <div className="space-y-3">
            {sortedBrands.map((b) => {
              const active = b.id === activeBrand;
              return (
                <div
                  key={b.id}
                  className={`lux-sweep overflow-hidden rounded-2xl border transition ${
                    active
                      ? "premium-panel shadow-lg shadow-emerald-600/10 dark:border-emerald-500/40"
                      : "border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-[#170d04]/80"
                  }`}
                >
                  {/* Brand header (logo) - click to switch restaurant */}
                  <button
                    onClick={() => selectBrand(b.id)}
                    className={`${styles.brandHeader} flex w-full items-center gap-3 px-3 py-3 text-left transition`}
                  >
                    <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 dark:ring-white/10">
                      {b.logo ? <Image src={b.logo} alt={b.name} fill sizes="44px" className="object-contain p-1" /> : <FaStore className="text-slate-400" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`${styles.brandName} block text-sm font-black text-slate-900 dark:text-white`}>{b.name}</span>
                      <span className={`text-[11px] font-semibold ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}>
                        {b.categories.length} {t.order.menuCategories}
                      </span>
                    </span>
                  </button>

                  {/* Category list for the active brand */}
                  {active && (
                    <div className="space-y-1 border-t border-slate-100 p-2 dark:border-white/5">
                      {b.categories.map((c) => {
                        const cat = c.name;
                        const Icon = categoryIconFor(brands, cat);
                        const isActive = cat === activeCategory;
                        return (
                          <div key={cat}>
                          <button
                            onClick={() => selectCategory(cat)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition duration-200 ${
                              isActive
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/30"
                                : "text-slate-600 hover:translate-x-1 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-white/10"
                            }`}
                          >
                            <Icon className="shrink-0 text-base" /> <span className="truncate">{cat}</span>
                          </button>
                          {isActive && subcategoriesOf(activeBrand, cat).length > 0 && (
                            <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-2 dark:border-white/10">
                              <button
                                onClick={() => setActiveSubcategory("all")}
                                className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition ${
                                  activeSubcategory === "all"
                                    ? "bg-sky-600 text-white"
                                    : "text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-white/10"
                                }`}
                              >
                                All {cat.toLowerCase()}
                              </button>
                              {subcategoriesOf(activeBrand, cat).map((sub) => {
                                const SubIcon = categoryIconFor(brands, sub.name);
                                const subActive = activeSubcategory === sub.name;
                                return (
                                  <button
                                    key={sub.name}
                                    onClick={() => setActiveSubcategory(sub.name)}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition ${
                                      subActive
                                        ? "bg-sky-600 text-white"
                                        : "text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-white/10"
                                    }`}
                                  >
                                    <SubIcon className="shrink-0" /> <span className="truncate">{sub.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          </div>
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
              {searchTerms.length > 0 ? <FaMagnifyingGlass className="text-emerald-600" aria-hidden="true" /> : activeBrandCfg?.logo ? (
                <Image src={activeBrandCfg.logo} alt={activeBrandCfg.name} fill sizes="36px" className="object-contain p-1" />
              ) : (
                <FaStore className="text-slate-400" />
              )}
            </span>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight text-slate-900 dark:text-white">{searchTerms.length ? (lang === "nl" ? "Alle restaurants" : "All restaurants") : activeBrandCfg?.name ?? ""}</h2>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {searchTerms.length ? (lang === "nl" ? "Zoekresultaten" : "Search results") : activeCategory}{!searchTerms.length && activeSubcategory !== "all" ? ` -> ${activeSubcategory}` : ""} · {visible.length} {t.common.items}
              </p>
            </div>
            <div className="gold-rule ml-2 flex-1" />
          </div>
          {ProductsGrid()}
        </section>

        {/* Desktop: Cart + Checkout - Right sidebar */}
        <aside className="sticky top-[76px] self-start">
          <div className="premium-panel ember-border lux-sweep texture-linen rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <FaCartShopping className="text-emerald-600 dark:text-emerald-400" /> {t.common.yourOrder}
              </h2>
              <span className={`rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 ${itemCount > 0 ? "animate-pop" : ""}`} key={itemCount}>
                {itemCount} {t.common.items}
              </span>
            </div>
            <div className="gold-rule mt-3" />

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {cartLines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-6 text-center dark:bg-white/5">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-xl text-emerald-500/70">
                    <FaCartShopping />
                  </span>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.common.emptyCart}</p>
                </div>
              ) : (
                cartLines.map(({ key, product, qty, sideChoice }) => (
                  <div key={key} data-cart-line={key} className={`${styles.cartLineCard} magnetic-card rounded-2xl border p-2.5`}>
                    <CartLinePhoto product={product} />
                    <div className={styles.cartLine}>
                      <div className="min-w-0 flex-1">
                        <p className={`${styles.cartLineName} text-sm font-semibold text-slate-900 dark:text-white`}>{product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">€{product.price.toFixed(2)} {t.common.each} · {qty * (product.bogoEnabled ? 2 : 1)} {t.common.items}</p>
                        {sideChoice && (
                          <p className="mt-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            {lang === "nl" ? "Bijgerecht" : "Side"}: {grillSideLabel(sideChoice, lang)}
                          </p>
                        )}
                      </div>
                      <div className={styles.cartLineControls}>
                        <button onClick={() => removeFromCart(product.id, sideChoice)} className={`${styles.cartQuantityButton} text-slate-600 transition hover:text-red-600 dark:text-slate-300`} type="button" aria-label={`${t.common.remove}: ${product.name}`}>
                          <span aria-hidden="true" className={`${styles.cartQuantityDisc} bg-white dark:bg-white/10`}>
                            {qty <= 1 ? <FaTrash className="text-[0.65rem]" /> : <FaMinus className="text-[0.65rem]" />}
                          </span>
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-slate-900 dark:text-white">{qty * (product.bogoEnabled ? 2 : 1)}</span>
                        <button onClick={() => addToCart(product.id, sideChoice)} className={`${styles.cartQuantityButton} transition`} type="button" aria-label={`${t.common.add}: ${product.name}`} disabled={qty >= 99}>
                          <span aria-hidden="true" className={`${styles.cartQuantityDisc} bg-emerald-600 text-white`}>
                            <FaPlus className="text-[0.65rem]" />
                          </span>
                        </button>
                      </div>
                      <span className={`${styles.cartLinePrice} text-sm font-bold text-slate-900 dark:text-white`}>€{(product.price * qty).toFixed(2)}</span>
                    </div>
                    {renderMenuUpgradeControls(product, qty)}
                  </div>
                ))
              )}
            </div>

            {/* Free-delivery progress - nudges the guest towards €0 delivery */}
            <details data-menu-checkout-detail open={cartLines.length > 0}>
              <summary>{t.order.deliveryDetails}<FaChevronRight aria-hidden="true" /></summary>
            {!isPickup && !isCompany && cartLines.length > 0 && (
              freeDelivery ? (
                <p className="animate-pop mt-4 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <FaCircleCheck /> {t.order.freeDeliveryUnlocked}
                </p>
              ) : (
                <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5"><FaTruck /> {t.common.delivery} €0.00</span>
                    <span>+€{(FREE_DELIVERY_FROM - payableBeforePoints).toFixed(2)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-900/10 dark:bg-white/10">
                    <div
                      className="progress-ember h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (payableBeforePoints / FREE_DELIVERY_FROM) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            )}

            {/* Delivery details */}
            <div data-checkout-fields className="form-lux mt-5 space-y-3">
              {fulfillmentToggle}
              <p className="text-sm font-bold text-slate-900 dark:text-white">{isPickup ? t.order.name : t.order.deliveryDetails}</p>
              <input aria-label={t.order.name} autoComplete="name" required maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t.order.name}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <input
                type="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} aria-label={lang === "nl" ? "E-mailadres voor bestelbevestiging" : "Email address for order confirmation"}
                autoComplete="email"
                required
                value={currentUser?.email || form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                readOnly={!!currentUser}
                placeholder={lang === "nl" ? "E-mailadres voor bestelbevestiging" : "Email address"}
                className={`${styles.checkoutEmail} w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white`}
              />
              <input aria-label={t.order.phone} type="tel" inputMode="tel" autoComplete="tel" required minLength={5} maxLength={30}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.order.phone}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {!isPickup && (
                <>
                  <input aria-label={t.order.address} autoComplete="street-address" required maxLength={300}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder={t.order.address}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <div>
                    <input aria-label={t.order.postcode} autoComplete="postal-code" required maxLength={10} autoCapitalize="characters" spellCheck={false}
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
                </>
              )}
              <textarea aria-label={t.order.note} maxLength={500}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={`${t.order.note} - ${t.order.notePlaceholder}`}
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
                        onClick={() => setScheduleType(opt)} aria-pressed={scheduleType === opt}
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
                  type="range" aria-label={t.order.usePoints} aria-valuetext={`${pointsUsed} ${lang === "nl" ? "punten" : "points"}`}
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

            {/* Totals - receipt style */}
            <div className="mt-5 space-y-2 rounded-2xl border border-dashed border-emerald-500/25 bg-slate-50 p-4 text-sm dark:bg-white/5">
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
                <span>{isPickup ? t.order.methodPickup : t.common.delivery}</span>
                {isPickup ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">€0.00</span>
                ) : freeDelivery && cartLines.length > 0 ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">€0.00</span>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">€{DELIVERY_FEE.toFixed(2)}</span>
                )}
              </div>
              <div className="mt-1 flex justify-between border-t border-dashed border-emerald-500/30 pt-2 text-base font-black text-slate-900 dark:text-white">
                <span>{t.common.total}</span>
                <span className="text-emerald-700 dark:text-emerald-300">€{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Loyalty points this order earns (1 point per €10) */}
            {currentUser && cartLines.length > 0 && pointsToEarn > 0 && (
              <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-amber-300/50 bg-gradient-to-r from-amber-400/15 via-amber-300/10 to-amber-400/15 px-3 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <FaStar className="animate-pulse-soft text-amber-400" />
                {t.order.willEarnPoints.replace("{points}", String(pointsToEarn))}
              </p>
            )}

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
              disabled={submitting || cartLines.length === 0}
              aria-busy={submitting}
              className="btn-ember btn-shine wiggle-hover mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white"
            >
              {submitting ? (lang === "nl" ? "Bestelling versturen…" : "Placing order…") : t.common.placeOrder} <FaArrowRight className="wiggle-target" />
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <FaLock className="text-emerald-500/70" /> {t.order.securePayment}
            </p>

            {message && (
              <p role={message.type === "error" ? "alert" : "status"}
                className={`mt-3 rounded-xl px-3 py-2 text-center text-sm font-medium ${
                  message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {message.text}
              </p>
            )}
            </details>
          </div>
        </aside>
      </div>

      {/* Mobile Layout: Products + Cart Footer (Hidden on desktop) */}
      <div data-menu-mobile className={`${styles.mobileFlow} lg:hidden`}>
        {/* Products follow the normal document scroll. */}
        <div className={styles.mobileProducts}>
          <h2 className="sr-only">{searchTerms.length ? (lang === "nl" ? "Zoekresultaten" : "Search results") : `${activeBrandCfg?.name ?? ""} — ${activeCategory}`}</h2>
          {ProductsGrid()}
        </div>

        {/* Mobile: Cart Footer - Sticky Bottom */}
        {cartLines.length > 0 && (
          <div className={`${styles.mobileCartBar} border-t border-emerald-500/20 bg-white/95 dark:border-white/10 dark:bg-[#0c0703]/95 px-4 py-3 sm:px-6`}>
            <button
              onClick={() => setShowCartModal(true)}
              className="btn-ember btn-shine wiggle-hover flex w-full items-center justify-between rounded-full px-4 py-3 text-sm font-bold text-white"
            >
              <span className="flex items-center gap-2">
                <FaCartShopping className="wiggle-target" /> {itemCount} {t.common.items}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-0.5">€{total.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Cart Modal - Mobile */}
      {showCartModal && (
        <OrderSheet titleId="cart-sheet-title" onClose={() => setShowCartModal(false)}>
          <div className="relative w-full rounded-t-3xl border-t border-emerald-500/25 bg-white shadow-2xl dark:bg-[#170d04] sm:max-w-md sm:rounded-3xl sm:border">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 id="cart-sheet-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">{t.common.yourOrder}</h2>
              <button type="button" autoFocus aria-label={lang === "nl" ? "Sluiten" : "Close"} title={lang === "nl" ? "Sluiten" : "Close"} onClick={() => setShowCartModal(false)} className={styles.sheetClose}>
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2 px-5 py-4 pr-3">
              {cartLines.map(({ key, product, qty, sideChoice }) => (
                <div key={key} data-cart-line={key} className={`${styles.cartLineCard} rounded-xl border p-2.5`}>
                  <CartLinePhoto product={product} />
                  <div className={styles.cartLine}>
                    <div className="min-w-0 flex-1">
                      <p className={`${styles.cartLineName} text-sm font-semibold text-slate-900 dark:text-white`}>{product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">€{product.price.toFixed(2)} {t.common.each} · {qty * (product.bogoEnabled ? 2 : 1)} {t.common.items}</p>
                      {sideChoice && (
                        <p className="mt-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          {lang === "nl" ? "Bijgerecht" : "Side"}: {grillSideLabel(sideChoice, lang)}
                        </p>
                      )}
                    </div>
                    <div className={styles.cartLineControls}>
                      <button onClick={() => removeFromCart(product.id, sideChoice)} className={`${styles.cartQuantityButton} text-slate-600 transition hover:text-red-600 dark:text-slate-300`} type="button" aria-label={`${t.common.remove}: ${product.name}`}>
                        <span aria-hidden="true" className={`${styles.cartQuantityDisc} bg-white dark:bg-white/10`}>
                          {qty <= 1 ? <FaTrash className="text-[0.6rem]" /> : <FaMinus className="text-[0.6rem]" />}
                        </span>
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-slate-900 dark:text-white">{qty * (product.bogoEnabled ? 2 : 1)}</span>
                      <button onClick={() => addToCart(product.id, sideChoice)} className={`${styles.cartQuantityButton} transition`} type="button" aria-label={`${t.common.add}: ${product.name}`} disabled={qty >= 99}>
                        <span aria-hidden="true" className={`${styles.cartQuantityDisc} bg-emerald-600 text-white`}>
                          <FaPlus className="text-[0.6rem]" />
                        </span>
                      </button>
                    </div>
                    <span className={`${styles.cartLinePrice} text-sm font-bold text-slate-900 dark:text-white`}>€{(product.price * qty).toFixed(2)}</span>
                  </div>
                  {renderMenuUpgradeControls(product, qty)}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 px-5 py-3 dark:border-white/10">
              {!isPickup && !isCompany && (
                freeDelivery ? (
                  <p className="animate-pop mb-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <FaCircleCheck /> {t.order.freeDeliveryUnlocked}
                  </p>
                ) : (
                  <div className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5"><FaTruck /> {t.common.delivery} €0.00</span>
                      <span>+€{(FREE_DELIVERY_FROM - payableBeforePoints).toFixed(2)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-900/10 dark:bg-white/10">
                      <div
                        className="progress-ember h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (payableBeforePoints / FREE_DELIVERY_FROM) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              )}
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
              <div className="space-y-2 rounded-lg border border-dashed border-emerald-500/25 bg-slate-50 p-3 text-sm dark:bg-white/5">
                <div className="pb-2">
                  {fulfillmentToggle}
                </div>
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
                  <span>{isPickup ? t.order.methodPickup : t.common.delivery}</span>
                  {isPickup || freeDelivery ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">€0.00</span>
                  ) : (
                    <span className="font-semibold">€{DELIVERY_FEE.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between border-t border-dashed border-emerald-500/30 pt-2 text-base font-black text-slate-900 dark:text-white">
                  <span>{t.common.total}</span>
                  <span className="text-emerald-700 dark:text-emerald-300">€{total.toFixed(2)}</span>
                </div>
              </div>

              {currentUser && pointsToEarn > 0 && (
                <p className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-amber-300/50 bg-gradient-to-r from-amber-400/15 via-amber-300/10 to-amber-400/15 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <FaStar className="animate-pulse-soft text-amber-400" />
                  {t.order.willEarnPoints.replace("{points}", String(pointsToEarn))}
                </p>
              )}

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
                className="btn-ember btn-shine mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white"
              >
                {t.common.placeOrder} <FaArrowRight className="text-xs" />
              </button>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 pb-1 text-[11px] text-slate-400 dark:text-slate-500">
                <FaLock className="text-emerald-500/70" /> {t.order.securePayment}
              </p>
            </div>
          </div>
        </OrderSheet>
      )}

      {/* Checkout Modal - Mobile */}
      {showCheckoutModal && (
        <OrderSheet titleId="checkout-sheet-title" onClose={() => setShowCheckoutModal(false)}>
          <div className="relative w-full rounded-t-3xl border-t border-emerald-500/25 bg-white shadow-2xl dark:bg-[#170d04] sm:max-w-md sm:rounded-3xl sm:border">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 id="checkout-sheet-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">{t.order.deliveryDetails}</h2>
              <button type="button" autoFocus aria-label={lang === "nl" ? "Sluiten" : "Close"} title={lang === "nl" ? "Sluiten" : "Close"} onClick={() => setShowCheckoutModal(false)} className={styles.sheetClose}>
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <div data-checkout-fields className="form-lux space-y-3 px-5 py-4">
              {fulfillmentToggle}
              <input aria-label={t.order.name} autoComplete="name" required maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t.order.name}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <input
                type="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} aria-label={lang === "nl" ? "E-mailadres voor bestelbevestiging" : "Email address for order confirmation"}
                autoComplete="email"
                required
                value={currentUser?.email || form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                readOnly={!!currentUser}
                placeholder={lang === "nl" ? "E-mailadres voor bestelbevestiging" : "Email address"}
                className={`${styles.checkoutEmail} w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white`}
              />
              <input aria-label={t.order.phone} type="tel" inputMode="tel" autoComplete="tel" required minLength={5} maxLength={30}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.order.phone}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {!isPickup && (
                <>
                  <input aria-label={t.order.address} autoComplete="street-address" required maxLength={300}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder={t.order.address}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <div>
                    <input aria-label={t.order.postcode} autoComplete="postal-code" required maxLength={10} autoCapitalize="characters" spellCheck={false}
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
                </>
              )}
              <textarea aria-label={t.order.note} maxLength={500}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={`${t.order.note} - ${t.order.notePlaceholder}`}
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
                        onClick={() => setScheduleType(opt)} aria-pressed={scheduleType === opt}
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
                <p role={message.type === "error" ? "alert" : "status"}
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
              disabled={submitting || cartLines.length === 0}
              aria-busy={submitting}
                className="btn-ember btn-shine flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white"
              >
                {submitting ? (lang === "nl" ? "Bestelling versturen…" : "Placing order…") : t.common.placeOrder} <FaArrowRight className="text-xs" />
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                <FaLock className="text-emerald-500/70" /> {t.order.securePayment}
              </p>
            </div>
          </div>
        </OrderSheet>
      )}

      {confirmedOrder && <OrderConfirmation order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />}

      {/* Product Details Modal */}
      {selectedProduct && <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />}
    </div>
  );
}
