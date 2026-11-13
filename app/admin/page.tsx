"use client";
import workspace from "../components/Workspace.module.css";
import { WorkspaceDialog } from "../components/WorkspaceDialog";

import { OrderTotals } from "../components/OrderTotals";


import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  FaBagShopping,
  FaBoxOpen,
  FaBuilding,
  FaCalendarCheck,
  FaChevronDown,
  FaClock,
  FaCrown,
  FaEnvelope,
  FaFileInvoice,
  FaGripVertical,
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
  FaCircleExclamation,
  FaDownload,
  FaShareNodes,
  FaSliders,
  FaSpinner,
  FaStore,
  FaTrash,
  FaTruck,
  FaUser,
  FaUserGroup,
  FaUtensils,
  FaXmark,
} from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { CATEGORY_ICON_CHOICES, categoryIconFor, formatOrderNumber, isDrinkCategory, ORDER_STATUS_FLOW } from "../lib/data";
import { SOCIAL_PLATFORMS } from "../components/socialIcons";
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(() => import("../components/RichTextEditor"), { ssr: false });
import { AdminOverview } from "./AdminOverview";
import { processImageFile } from "./adminImage";
import { downloadCsv } from "./adminFormat";
import adminStyles from "./admin.module.css";
import { BrandNameEditor } from "./BrandNameEditor";
const PhoneAgentPanel = dynamic(() => import("./PhoneAgentPanel"));
import type { Brand, Category, Order, OrderStatus, Product } from "../lib/types";
import type { RestaurantOpenOverride } from "../lib/openingHours";
import { amsterdamDateKey, makeRangeCheck, rangeFilterError, type RangeFilter } from "../lib/adminMetrics";

const statusIcons: Record<OrderStatus, typeof FaClock> = {
  new: FaClock,
  preparing: FaBoxOpen,
  delivery: FaTruck,
  delivered: FaCircleCheck,
};

/** Feedback state for the add/edit product forms. */
type SaveState = { status: "idle" | "saving" | "success" | "error"; message?: string };

type ProductGroup = { key: string; product: Product; products: Product[] };

type CategoryEditDraft =
  | { kind: "category"; brandId: string; name: string; nextName: string; icon: string }
  | { kind: "subcategory"; brandId: string; categoryName: string; name: string; nextName: string; icon: string };

/** Keeps only digits and a single decimal dot while typing; a comma becomes a dot. */
const sanitizePrice = (value: string): string => {
  let s = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  return s;
};

/** Parses a sanitized price string ("8.73"). Returns null when invalid or not positive. */
const parsePrice = (raw: string): number | null => {
  const s = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = parseFloat(s);
  return n > 0 ? n : null;
};

const normalizeProductName = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

const productGroupKey = (product: Product): string =>
  `${normalizeProductName(product.name)}|${Number(product.price).toFixed(2)}`;

const normalizeCustomerAddress = (address: string, postcode: string): string =>
  `${address} ${postcode}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Splits a comma-separated admin input into a clean list ("a, b," → ["a","b"]). */
const parseList = (value: string): string[] =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

const ADMIN_INITIAL_NOW = Date.now();

export default function AdminPage() {
  const { t, lang } = useLang();
  const { currentUser, products, orders, users, addProductGroup, removeProduct, updateProductGroup, moveProduct, brands, manageBrands, updateOrderStatus, setOrderPaid, setInvoiceSent, deleteOrder, vipRequests, vipPurchases, approveVipRequest, rejectVipRequest, socialLinks, updateSocialLink, reservations, restaurantStatus, updateRestaurantOpenOverride, setReservationStatus, cancelReservation, deleteReservation, recentVisitors, refresh, hydrated } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  /** Brand whose logo will receive the next picked file. */
  const logoBrandIdRef = useRef<string | null>(null);
  const [now, setNow] = useState(ADMIN_INITIAL_NOW);
  const [restaurantStatusSaving, setRestaurantStatusSaving] = useState<RestaurantOpenOverride | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    descriptionNl: "",
    price: "",
    isPopular: false,
    isNew: false,
    bogoEnabled: false,
    brands: [] as Brand[],
    category: "Wraps" as Category,
    subcategory: "" as Category,
    image: "" as string | undefined,
    detailEn: "",
    detailNl: "",
    ingredientsEn: "",
    ingredientsNl: "",
    allergensEn: "",
    allergensNl: "",
  });

  // Product currently being edited (null = editor closed).
  const [editing, setEditing] = useState<Product | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    description: "",
    descriptionNl: "",
    price: "",
    isPopular: false,
    isNew: false,
    bogoEnabled: false,
    brands: [] as Brand[],
    category: "Wraps" as Category,
    subcategory: "" as Category,
    image: undefined as string | undefined,
    detailEn: "",
    detailNl: "",
    ingredientsEn: "",
    ingredientsNl: "",
    allergensEn: "",
    allergensNl: "",
  });

  // Save progress + feedback for the add form and the edit modal.
  const [addState, setAddState] = useState<SaveState>({ status: "idle" });
  const [editState, setEditState] = useState<SaveState>({ status: "idle" });
  // The rich-text/ingredients/allergens fields are hidden by default to keep the form compact.
  const [addMoreTextsOpen, setAddMoreTextsOpen] = useState(false);
  const [editMoreTextsOpen, setEditMoreTextsOpen] = useState(false);

  // Restaurants & categories manager modal.
  const [manageOpen, setManageOpen] = useState(false);
  const [manageBrandId, setManageBrandId] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("utensils");
  const [newSubcatCategory, setNewSubcatCategory] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [categoryEdit, setCategoryEdit] = useState<CategoryEditDraft | null>(null);
  const [manageState, setManageState] = useState<SaveState>({ status: "idle" });

  /** Categories of a brand from the admin-managed list. */
  const categoriesOf = (brandId: string) => brands.find((b) => b.id === brandId)?.categories ?? [];
  const subcategoriesOf = (brandId: string, categoryName: string) =>
    categoriesOf(brandId).find((c) => c.name === categoryName)?.subcategories ?? [];
  const firstSubcategoryOf = (brandId: string, categoryName: string) => subcategoriesOf(brandId, categoryName)[0]?.name ?? "";
  const hasSubcategories = (brandId: string, categoryName: string) => subcategoriesOf(brandId, categoryName).length > 0;
  const draftSubcategory = (brandId: string, categoryName: string, current = "") =>
    hasSubcategories(brandId, categoryName) ? current || firstSubcategoryOf(brandId, categoryName) : "";
  const subcategoryManageCategories = manageBrandId ? categoriesOf(manageBrandId) : [];
  const activeNewSubcatCategory = subcategoryManageCategories.some((c) => c.name === newSubcatCategory)
    ? newSubcatCategory
    : subcategoryManageCategories[0]?.name ?? "";

  /** Every category name offered by any restaurant (a product can be sold wherever its category exists). */
  const allBrandCategories = useMemo(() => {
    const set = new Set<string>();
    for (const b of brands) for (const c of b.categories) set.add(c.name);
    return [...set];
  }, [brands]);

  /** Restaurant ids that offer a category with this name. */
  const brandsWithCategory = (categoryName: string) =>
    brands.filter((b) => b.categories.some((c) => c.name === categoryName)).map((b) => b.id);

  /** Subcategory names offered for a category across the given restaurants (deduped). */
  const subcategoriesForBrands = (brandIds: string[], categoryName: string) => {
    const set = new Set<string>();
    for (const b of brands) {
      if (!brandIds.includes(b.id)) continue;
      for (const s of b.categories.find((c) => c.name === categoryName)?.subcategories ?? []) set.add(s.name);
    }
    return [...set];
  };

  /** Build the per-restaurant publish targets for the selected brands + category. */
  const buildTargets = (brandIds: Brand[], category: Category, subcategory: Category) =>
    brandIds
      .filter((id) => brands.find((b) => b.id === id)?.categories.some((c) => c.name === category))
      .map((id) => ({ brand: id, category, subcategory: draftSubcategory(id, category, subcategory) || undefined }));

  // Keep the add form's category valid and its selected restaurants limited to
  // the ones that actually offer that category (defaulting to all of them).
  const brandsInitRef = useRef(false);
  useEffect(() => {
    if (brands.length === 0) return;
    const validCategory = allBrandCategories.includes(draft.category) ? draft.category : allBrandCategories[0] ?? "";
    const eligible = brandsWithCategory(validCategory);
    if (!brandsInitRef.current) {
      // First load: sell the product at every restaurant that offers this category.
      brandsInitRef.current = true;
      queueMicrotask(() => setDraft((d) => ({ ...d, category: validCategory, brands: eligible })));
      return;
    }
    if (validCategory !== draft.category) {
      queueMicrotask(() => setDraft((d) => ({ ...d, category: validCategory, brands: eligible, subcategory: "" })));
      return;
    }
    // Drop restaurants that no longer offer the category (never silently re-add).
    const pruned = draft.brands.filter((id) => eligible.includes(id));
    if (pruned.length !== draft.brands.length) {
      queueMicrotask(() => setDraft((d) => ({ ...d, brands: pruned })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, draft.brands, draft.category, allBrandCategories]);

  // Order search filters (by customer/company name or order number).
  const [customerSearch, setCustomerSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(() => new Set());
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [customerOrdersLimit, setCustomerOrdersLimit] = useState(20);
  const [companyOrdersLimit, setCompanyOrdersLimit] = useState(20);
  const [selectedCustomer, setSelectedCustomer] = useState<{ key: string; name: string; address: string; userId?: string } | null>(null);

  // Product pending deletion (shown in a confirmation dialog).
  const [deleting, setDeleting] = useState<Product | null>(null);

  const [productSearch, setProductSearch] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState<Brand | "all">("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState<Category | "all">("all");
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState<Category | "all">("all");
  const [draggingProductKey, setDraggingProductKey] = useState<string | null>(null);
  const [dropProductKey, setDropProductKey] = useState<string | null>(null);
  const [movingProductKey, setMovingProductKey] = useState<string | null>(null);

  const [ordersRange, setOrdersRange] = useState<RangeFilter>({ preset: "all" });
  const ordersCheck = useMemo(() => makeRangeCheck(ordersRange, now), [ordersRange, now]);

  const productFilterCategories = useMemo(() => {
    const set = new Set<string>();
    for (const b of brands) {
      if (productBrandFilter !== "all" && b.id !== productBrandFilter) continue;
      for (const c of b.categories) set.add(c.name);
    }
    for (const p of products) {
      if (productBrandFilter === "all" || p.brand === productBrandFilter) set.add(p.category);
    }
    return [...set];
  }, [brands, products, productBrandFilter]);

  const activeProductCategoryFilter =
    productCategoryFilter !== "all" && productFilterCategories.includes(productCategoryFilter)
      ? productCategoryFilter
      : "all";

  const productFilterSubcategories = useMemo(() => {
    const set = new Set<string>();
    for (const b of brands) {
      if (productBrandFilter !== "all" && b.id !== productBrandFilter) continue;
      if (activeProductCategoryFilter === "all") continue;
      for (const sub of b.categories.find((c) => c.name === activeProductCategoryFilter)?.subcategories ?? []) set.add(sub.name);
    }
    for (const p of products) {
      const categoryMatches = activeProductCategoryFilter === "Drinks" ? isDrinkCategory(p.category) : p.category === activeProductCategoryFilter;
      if (activeProductCategoryFilter !== "all" && (productBrandFilter === "all" || p.brand === productBrandFilter) && categoryMatches && p.subcategory) set.add(p.subcategory);
    }
    return [...set];
  }, [activeProductCategoryFilter, brands, productBrandFilter, products]);

  const activeProductSubcategoryFilter =
    productSubcategoryFilter !== "all" && productFilterSubcategories.includes(productSubcategoryFilter)
      ? productSubcategoryFilter
      : "all";

  const productGroups = useMemo<ProductGroup[]>(() => {
    const map = new Map<string, ProductGroup>();
    for (const product of products) {
      const key = productGroupKey(product);
      const group = map.get(key);
      if (group) group.products.push(product);
      else map.set(key, { key, product, products: [product] });
    }
    return [...map.values()];
  }, [products]);

  const filteredProductGroups = useMemo<ProductGroup[]>(() => {
    const q = productSearch.trim().toLowerCase();
    return productGroups.flatMap((group) => {
      const matches = group.products.filter((p) => {
        if (productBrandFilter !== "all" && p.brand !== productBrandFilter) return false;
        if (activeProductCategoryFilter !== "all") {
          if (activeProductCategoryFilter === "Drinks") {
            if (!isDrinkCategory(p.category)) return false;
          } else if (p.category !== activeProductCategoryFilter) {
            return false;
          }
          if (activeProductSubcategoryFilter !== "all" && p.subcategory !== activeProductSubcategoryFilter) return false;
        }
        if (!q) return true;
        const brandName = brands.find((b) => b.id === p.brand)?.name ?? p.brand;
        return [p.name, p.description, p.descriptionNl ?? "", p.category, p.subcategory ?? "", brandName, p.price.toFixed(2)]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
      return matches.length > 0 ? [{ ...group, product: matches[0] }] : [];
    });
  }, [activeProductCategoryFilter, activeProductSubcategoryFilter, brands, productBrandFilter, productGroups, productSearch]);

  const handleProductDragStart = (event: DragEvent<HTMLDivElement>, group: ProductGroup) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", group.key);
    setDraggingProductKey(group.key);
  };

  const handleProductDragOver = (event: DragEvent<HTMLDivElement>, group: ProductGroup) => {
    if (!draggingProductKey || draggingProductKey === group.key || movingProductKey) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropProductKey(group.key);
  };

  const handleProductDragLeave = (event: DragEvent<HTMLDivElement>, group: ProductGroup) => {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setDropProductKey((key) => (key === group.key ? null : key));
    }
  };

  const handleProductDrop = async (event: DragEvent<HTMLDivElement>, target: ProductGroup) => {
    event.preventDefault();
    const sourceKey = event.dataTransfer.getData("text/plain") || draggingProductKey;
    const source = filteredProductGroups.find((group) => group.key === sourceKey);
    setDropProductKey(null);
    if (!source || source.key === target.key || movingProductKey) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const placement = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setMovingProductKey(source.key);
    await moveProduct(source.product.id, target.product.id, placement);
    setDraggingProductKey(null);
    setMovingProductKey(null);
  };

  const handleProductDragEnd = () => {
    setDraggingProductKey(null);
    setDropProductKey(null);
  };

  const exportProducts = () => downloadCsv("products.csv", [["Name", "Brand", "Category", "Subcategory", "Price"], ...products.map((p) => [p.name, brands.find((b) => b.id === p.brand)?.name ?? p.brand, p.category, p.subcategory ?? "", p.price.toFixed(2)])]);

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
  const [catalogOpen, setCatalogOpen] = useState(false);
  useEffect(() => { if (location.hash === "#workspace-products") queueMicrotask(() => setCatalogOpen(true)); }, []);
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

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const image = await processImageFile(file);
      setDraft((d) => ({ ...d, image }));
      setAddState((s) => (s.status === "error" ? { status: "idle" } : s));
    } catch {
      if (fileRef.current) fileRef.current.value = "";
      setAddState({ status: "error", message: t.admin.imageError });
    }
  };

  const saveProduct = async () => {
    if (addState.status === "saving") return;
    if (!draft.name.trim()) {
      setAddState({ status: "error", message: t.admin.nameRequired });
      return;
    }
    const price = parsePrice(draft.price);
    if (price === null) {
      setAddState({ status: "error", message: t.admin.priceInvalid });
      return;
    }
    setAddState({ status: "saving" });
    const detailEn = draft.detailEn.trim();
    const detailNl = draft.detailNl.trim();
    const targets = buildTargets(draft.brands, draft.category, draft.subcategory);
    if (targets.length === 0) {
      setAddState({ status: "error", message: t.admin.atLeastOneRestaurant });
      return;
    }
    const res = await addProductGroup(
      {
        name: draft.name.trim(),
        description: draft.description.trim(),
        descriptionNl: draft.descriptionNl.trim(),
        price,
        isPopular: draft.isPopular,
        isNew: draft.isNew,
        bogoEnabled: draft.bogoEnabled,
        image: draft.image,
        detailedDescription: detailEn || detailNl ? { en: detailEn, nl: detailNl } : undefined,
        ingredients: parseList(draft.ingredientsEn),
        ingredientsNl: parseList(draft.ingredientsNl),
        allergens: parseList(draft.allergensEn),
        allergensNl: parseList(draft.allergensNl),
      },
      targets
    );
    if (!res.ok) {
      setAddState({ status: "error", message: `${t.admin.saveFailed}${res.error ? ` (${res.error})` : ""}` });
      return;
    }
    setDraft({
      name: "",
      description: "",
      descriptionNl: "",
      price: "",
      isPopular: false,
      isNew: false,
      bogoEnabled: false,
      brands: draft.brands,
      category: draft.category,
      subcategory: draft.subcategory,
      image: undefined,
      detailEn: "",
      detailNl: "",
      ingredientsEn: "",
      ingredientsNl: "",
      allergensEn: "",
      allergensNl: "",
    });
    if (fileRef.current) fileRef.current.value = "";
    setAddState({ status: "success", message: t.admin.productAdded });
    setAddMoreTextsOpen(false);
    setTimeout(() => setAddState((s) => (s.status === "success" ? { status: "idle" } : s)), 4000);
  };

  const openEditor = (p: Product) => {
    setEditing(p);
    setEditState({ status: "idle" });
    // Preselect every restaurant this product is already sold at (its group).
    const groupBrands = [...new Set(products.filter((x) => productGroupKey(x) === productGroupKey(p)).map((x) => x.brand))];
    setEditDraft({
      name: p.name,
      description: p.description,
      descriptionNl: p.descriptionNl ?? "",
      price: String(p.price),
      isPopular: p.isPopular ?? false,
      isNew: p.isNew ?? false,
      bogoEnabled: p.bogoEnabled ?? false,
      brands: groupBrands,
      category: p.category,
      subcategory: p.subcategory ?? "",
      image: p.image,
      detailEn: p.detailedDescription?.en ?? "",
      detailNl: p.detailedDescription?.nl ?? "",
      ingredientsEn: (p.ingredients ?? []).join(", "),
      ingredientsNl: (p.ingredientsNl ?? []).join(", "),
      allergensEn: (p.allergens ?? []).join(", "),
      allergensNl: (p.allergensNl ?? []).join(", "),
    });
    setEditMoreTextsOpen(!!(p.detailedDescription?.en || p.detailedDescription?.nl || p.ingredients?.length || p.ingredientsNl?.length || p.allergens?.length || p.allergensNl?.length));
  };

  const closeEditor = () => {
    setEditing(null);
    setEditState({ status: "idle" });
    if (editFileRef.current) editFileRef.current.value = "";
  };

  const onEditFile = async (file?: File) => {
    if (!file) return;
    try {
      const image = await processImageFile(file);
      setEditDraft((d) => ({ ...d, image }));
      setEditState((s) => (s.status === "error" ? { status: "idle" } : s));
    } catch {
      if (editFileRef.current) editFileRef.current.value = "";
      setEditState({ status: "error", message: t.admin.imageError });
    }
  };

  const saveEdit = async () => {
    if (!editing || editState.status === "saving") return;
    if (!editDraft.name.trim()) {
      setEditState({ status: "error", message: t.admin.nameRequired });
      return;
    }
    const price = parsePrice(editDraft.price);
    if (price === null) {
      setEditState({ status: "error", message: t.admin.priceInvalid });
      return;
    }
    setEditState({ status: "saving" });
    const detailEn = editDraft.detailEn.trim();
    const detailNl = editDraft.detailNl.trim();
    const targets = buildTargets(editDraft.brands, editDraft.category, editDraft.subcategory);
    if (targets.length === 0) {
      setEditState({ status: "error", message: t.admin.atLeastOneRestaurant });
      return;
    }
    const res = await updateProductGroup(
      editing.id,
      {
        name: editDraft.name.trim(),
        description: editDraft.description.trim(),
        descriptionNl: editDraft.descriptionNl.trim(),
        price,
        isPopular: editDraft.isPopular,
        isNew: editDraft.isNew,
        bogoEnabled: editDraft.bogoEnabled,
        image: editDraft.image,
        // null (not undefined) so clearing both fields also clears it in the database.
        detailedDescription: (detailEn || detailNl
          ? { en: detailEn, nl: detailNl }
          : null) as unknown as Product["detailedDescription"],
        ingredients: parseList(editDraft.ingredientsEn),
        ingredientsNl: parseList(editDraft.ingredientsNl),
        allergens: parseList(editDraft.allergensEn),
        allergensNl: parseList(editDraft.allergensNl),
      },
      targets
    );
    if (!res.ok) {
      setEditState({ status: "error", message: `${t.admin.saveFailed}${res.error ? ` (${res.error})` : ""}` });
      return;
    }
    setEditState({ status: "success", message: t.admin.productUpdated });
    setTimeout(() => closeEditor(), 1500);
  };

  /** Translate a brand/category management error code to a readable message. */
  const brandErrorText = (code?: string): string => {
    switch (code) {
      case "brandExists":
        return t.admin.brandExists;
      case "categoryExists":
        return t.admin.categoryExists;
      case "brandHasProducts":
        return t.admin.brandHasProducts;
      case "categoryHasProducts":
        return t.admin.categoryHasProducts;
      case "lastBrand":
        return t.admin.lastBrand;
      case "lastCategory":
        return t.admin.lastCategory;
      default:
        return `${t.admin.saveFailed}${code ? ` (${code})` : ""}`;
    }
  };

  /** Run a brand/category mutation with saving + error feedback. Returns success. */
  const runManage = async (input: Parameters<typeof manageBrands>[0]): Promise<boolean> => {
    if (manageState.status === "saving") return false;
    setManageState({ status: "saving" });
    const res = await manageBrands(input);
    if (!res.ok) {
      setManageState({ status: "error", message: brandErrorText(res.error) });
      return false;
    }
    setManageState({ status: "idle" });
    return true;
  };

  const submitAddBrand = async () => {
    if (!newBrandName.trim()) return;
    if (await runManage({ action: "addBrand", name: newBrandName.trim() })) setNewBrandName("");
  };

  const submitAddCategory = async () => {
    if (!manageBrandId || !newCatName.trim()) return;
    if (await runManage({ action: "addCategory", brandId: manageBrandId, name: newCatName.trim(), icon: newCatIcon })) {
      setNewCatName("");
    }
  };

  const submitAddSubcategory = async () => {
    if (!manageBrandId || !activeNewSubcatCategory || !newSubcatName.trim()) return;
    if (await runManage({ action: "addSubcategory", brandId: manageBrandId, categoryName: activeNewSubcatCategory, name: newSubcatName.trim(), icon: "utensils" })) {
      setNewSubcatName("");
    }
  };

  const startEditCategory = (brandId: string, category: { name: string; icon: string }) => {
    setCategoryEdit({ kind: "category", brandId, name: category.name, nextName: category.name, icon: category.icon || "utensils" });
    setManageState({ status: "idle" });
  };

  const startEditSubcategory = (brandId: string, categoryName: string, subcategory: { name: string; icon: string }) => {
    setCategoryEdit({ kind: "subcategory", brandId, categoryName, name: subcategory.name, nextName: subcategory.name, icon: subcategory.icon || "utensils" });
    setManageState({ status: "idle" });
  };

  const submitCategoryEdit = async () => {
    if (!categoryEdit || !categoryEdit.nextName.trim()) return;
    const ok =
      categoryEdit.kind === "category"
        ? await runManage({ action: "updateCategory", brandId: categoryEdit.brandId, name: categoryEdit.name, nextName: categoryEdit.nextName.trim(), icon: categoryEdit.icon })
        : await runManage({ action: "updateSubcategory", brandId: categoryEdit.brandId, categoryName: categoryEdit.categoryName, name: categoryEdit.name, nextName: categoryEdit.nextName.trim(), icon: categoryEdit.icon });
    if (ok) setCategoryEdit(null);
  };

  /** Pick-a-logo flow: open the file picker targeting a specific restaurant. */
  const pickLogo = (brandId: string) => {
    logoBrandIdRef.current = brandId;
    logoFileRef.current?.click();
  };

  const onLogoFile = async (file?: File) => {
    const brandId = logoBrandIdRef.current;
    if (logoFileRef.current) logoFileRef.current.value = "";
    if (!file || !brandId) return;
    try {
      // Logos stay small (400px) and keep transparency by encoding as PNG.
      const logo = await processImageFile(file, { maxDim: 400, mime: "image/png" });
      await runManage({ action: "setLogo", brandId, logo });
    } catch {
      setManageState({ status: "error", message: t.admin.imageError });
    }
  };

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
      <nav className={adminStyles.sectionLinks} aria-label={lang === "nl" ? "Dagelijkse onderdelen" : "Daily operation sections"}>{[ ["workspace-orders", t.fulfillment.orderManagement], ["workspace-reservations", t.admin.reservationsTitle], ["workspace-products", t.admin.manageProducts], ["workspace-vip", t.admin.vipRequests], ["workspace-social", t.admin.socialTitle], ["workspace-phone", lang === "nl" ? "Telefoon" : "Phone"] ].map(([id,label]) => <a key={id} href={"#"+id} onClick={() => { if(id === "workspace-social")setSocialOpen(true); if(id === "workspace-products")setCatalogOpen(true); const node=document.getElementById(id); const details=node?.closest("details"); if(details)details.open=true; requestAnimationFrame(()=>node?.focus({preventScroll:true})); }}>{label}</a>)}</nav>

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

      {/* Product management */}
      <section className={`${adminStyles.panel} mt-6`}>
        <div className={adminStyles.panelHeader}><div><h2 id="workspace-products" tabIndex={-1}>{t.admin.manageProducts}</h2><p className={adminStyles.muted}>{lang === "nl" ? "Open de catalogus om producten, restaurants en categorieën te beheren. Formulierinvoer blijft bewaard zolang u op deze pagina blijft." : "Open the catalogue to manage products, restaurants and categories. Form inputs are retained while you stay on this page."}</p></div><button type="button" className={adminStyles.button} aria-expanded={catalogOpen} aria-controls="admin-catalog-content" onClick={() => setCatalogOpen(!catalogOpen)}>{catalogOpen ? (lang === "nl" ? "Catalogus sluiten" : "Close catalogue") : (lang === "nl" ? "Catalogus openen" : "Open catalogue")} · {products.length}</button></div>
        <div id="admin-catalog-content" hidden={!catalogOpen}>{catalogOpen && (<div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Add product */}
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <FaPlus className="text-emerald-600 dark:text-emerald-400" /> {t.admin.addProduct}
            </h2>
            <button
              onClick={() => {
                setManageOpen(true);
                setManageBrandId(brands[0]?.id ?? null);
                setManageState({ status: "idle" });
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300"
            >
              <FaSliders /> {t.admin.manageMenus}
            </button>
          </div>
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
            <textarea
              value={draft.descriptionNl}
              onChange={(e) => setDraft({ ...draft, descriptionNl: e.target.value })}
              placeholder={t.admin.productDescNl}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setAddMoreTextsOpen((o) => !o)}
              aria-expanded={addMoreTextsOpen}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              {addMoreTextsOpen ? t.admin.hideMoreTexts : t.admin.addMoreTexts}
              <FaChevronDown className={`transition-transform duration-300 ${addMoreTextsOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${addMoreTextsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="space-y-3 overflow-hidden">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                {t.admin.productDetail}
              </label>
              <RichTextEditor
                value={draft.detailEn}
                onChange={(html) => setDraft({ ...draft, detailEn: html })}
                placeholder={t.admin.productDetail}
              />
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 mt-4">
                {t.admin.productDetailNl}
              </label>
              <RichTextEditor
                value={draft.detailNl}
                onChange={(html) => setDraft({ ...draft, detailNl: html })}
                placeholder={t.admin.productDetailNl}
              />
              <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.productDetailHint}</p>
            </div>
            <div>
              <input
                value={draft.ingredientsEn}
                onChange={(e) => setDraft({ ...draft, ingredientsEn: e.target.value })}
                placeholder={t.admin.productIngredients}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <input
                value={draft.ingredientsNl}
                onChange={(e) => setDraft({ ...draft, ingredientsNl: e.target.value })}
                placeholder={t.admin.productIngredientsNl}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <input
                value={draft.allergensEn}
                onChange={(e) => setDraft({ ...draft, allergensEn: e.target.value })}
                placeholder={t.admin.productAllergens}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <input
                value={draft.allergensNl}
                onChange={(e) => setDraft({ ...draft, allergensNl: e.target.value })}
                placeholder={t.admin.productAllergensNl}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.listHint}</p>
            </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t.admin.sellAtRestaurants}</p>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const has = b.categories.some((c) => c.name === draft.category);
                  const checked = has && draft.brands.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      title={has ? b.name : `${b.name} — ${draft.category}?`}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        !has
                          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                          : checked
                          ? "cursor-pointer border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200"
                          : "cursor-pointer border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-emerald-600"
                        disabled={!has}
                        checked={checked}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            brands: e.target.checked ? [...d.brands.filter((id) => id !== b.id), b.id] : d.brands.filter((id) => id !== b.id),
                          }))
                        }
                      />
                      {b.name}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: sanitizePrice(e.target.value) })}
                  placeholder={t.admin.productPrice}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.priceHint}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-amber-700"><input type="checkbox" checked={draft.isPopular} onChange={(e) => setDraft({ ...draft, isPopular: e.target.checked })} /> Popular</label>
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700"><input type="checkbox" checked={draft.isNew} onChange={(e) => setDraft({ ...draft, isNew: e.target.checked })} /> New</label>
                  <label className="inline-flex items-center gap-2 text-xs font-black text-rose-700"><input type="checkbox" checked={draft.bogoEnabled} onChange={(e) => setDraft({ ...draft, bogoEnabled: e.target.checked })} /> BUY 1 GET 1 FREE</label>
                </div>
              </div>

              <select aria-label={t.admin.productCategory}
                value={draft.category}
                onChange={(e) => {
                  const category = e.target.value as Category;
                  setDraft({ ...draft, category, brands: brandsWithCategory(category), subcategory: "" });
                }}
                className="w-full self-start rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                {allBrandCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {subcategoriesForBrands(draft.brands, draft.category).length > 0 && (
              <select
                value={draft.subcategory}
                onChange={(e) => setDraft({ ...draft, subcategory: e.target.value as Category })}
                aria-label={`${draft.category} subcategory`}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 outline-none transition focus:border-emerald-500 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
              >
                <option value="">—</option>
                {subcategoriesForBrands(draft.brands, draft.category).map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:text-slate-300"
              >
                <FaImage /> {t.admin.productImage}
              </button>
              {draft.image && (
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                  <Image src={draft.image} alt="preview" fill sizes="48px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setDraft((d) => ({ ...d, image: undefined }));
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-black/60 text-[10px] text-white transition hover:bg-red-600"
                    aria-label={t.common.remove}
                    title={t.common.remove}
                  >
                    <FaXmark />
                  </button>
                </span>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            {addState.status === "error" && (
              <p className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <FaCircleExclamation className="mt-0.5 shrink-0" /> {addState.message}
              </p>
            )}
            {addState.status === "success" && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <FaCircleCheck className="shrink-0" /> {addState.message}
              </p>
            )}

            <button
              onClick={saveProduct}
              disabled={addState.status === "saving"}
              className="w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addState.status === "saving" ? (
                <span className="inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" /> {t.admin.saving}
                </span>
              ) : (
                t.admin.save
              )}
            </button>
          </div>
        </div>

        {/* Product list */}
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <h2  className="text-lg font-black text-slate-900 dark:text-white">{t.admin.manageProducts}</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={exportProducts} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-emerald-400 dark:border-white/10 dark:text-slate-300"><FaDownload /> {t.admin.exportProducts}</button>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {filteredProductGroups.length}/{productGroups.length}
              </span>
            </div>
          </div>
          {(productSearch || productBrandFilter !== "all" || productCategoryFilter !== "all" || productSubcategoryFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setProductSearch("");
                setProductBrandFilter("all");
                setProductCategoryFilter("all");
                setProductSubcategoryFilter("all");
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <FaXmark className="text-[10px]" /> {t.admin.clearProductFilters}
            </button>
          )}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-2 md:grid-cols-[1fr_0.7fr_0.7fr]">
              <label className="relative block">
                <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t.admin.productSearch}
                  aria-label={t.admin.productSearch}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                {productSearch && <button type="button" onClick={() => setProductSearch("")} aria-label="Clear product search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600"><FaXmark /></button>}
              </label>
              <select
                value={productBrandFilter}
                onChange={(e) => {
                  setProductBrandFilter(e.target.value as Brand | "all");
                  setProductCategoryFilter("all");
                  setProductSubcategoryFilter("all");
                }}
                aria-label={t.admin.restaurant}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option value="all">{t.admin.allRestaurants}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                value={activeProductCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value as Category | "all")}
                aria-label={t.admin.productCategory}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option value="all">{t.admin.allCategories}</option>
                {productFilterCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setProductCategoryFilter("all")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  activeProductCategoryFilter === "all"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
                }`}
              >
                {t.admin.allCategories}
              </button>
              {productFilterCategories.map((cat) => {
                const Icon = categoryIconFor(brands, cat);
                const active = activeProductCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setProductCategoryFilter(cat);
                      setProductSubcategoryFilter("all");
                    }}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
                    }`}
                  >
                    <Icon aria-hidden="true" className="text-[11px]" /> {cat}
                  </button>
                );
              })}
            </div>
            {activeProductCategoryFilter !== "all" && productFilterSubcategories.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setProductSubcategoryFilter("all")}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    activeProductSubcategoryFilter === "all"
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-sky-700 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
                  }`}
                >
                  All {activeProductCategoryFilter.toLowerCase()}
                </button>
                {productFilterSubcategories.map((sub) => {
                  const Icon = categoryIconFor(brands, sub);
                  const active = activeProductSubcategoryFilter === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setProductSubcategoryFilter(sub)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-sky-700 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
                      }`}
                    >
                      <Icon aria-hidden="true" className="text-[11px]" /> {sub}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {filteredProductGroups.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                {t.admin.noProductMatches}
              </p>
            ) : filteredProductGroups.map((group) => {
              const p = group.product;
              const Icon = categoryIconFor(brands, p.category);
              const groupBrands = [...new Set(group.products.map((item) => item.brand))];
              const isMoving = movingProductKey === group.key;
              const isDragging = draggingProductKey === group.key;
              const isDropTarget = dropProductKey === group.key && draggingProductKey !== group.key;
              return (
                <div
                  key={group.key}
                  draggable={!movingProductKey}
                  onDragStart={(event) => handleProductDragStart(event, group)}
                  onDragOver={(event) => handleProductDragOver(event, group)}
                  onDragLeave={(event) => handleProductDragLeave(event, group)}
                  onDrop={(event) => handleProductDrop(event, group)}
                  onDragEnd={handleProductDragEnd}
                  className={`flex cursor-grab items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 transition active:cursor-grabbing dark:border-white/5 dark:bg-white/5 ${
                    isDragging ? "opacity-50 ring-2 ring-sky-400" : ""
                  } ${isDropTarget ? "border-sky-300 bg-sky-50 ring-2 ring-sky-300 dark:border-sky-500/40 dark:bg-sky-500/10" : ""} ${
                    isMoving ? "opacity-70" : ""
                  }`}
                  title="Drag to reorder"
                >
                  <span className="grid h-8 w-4 shrink-0 place-items-center text-slate-300 dark:text-slate-600" aria-hidden="true">
                    {isMoving ? <FaSpinner className="animate-spin text-xs" /> : <FaGripVertical className="text-xs" />}
                  </span>
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {p.image ? <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" /> : <Icon aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <span className="truncate">{p.name}</span>
                      {groupBrands.map((brandId) => {
                        const brandName = brands.find((b) => b.id === brandId)?.name ?? brandId;
                        return (
                          <span
                            key={brandId}
                            className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                            title={brandName}
                          >
                            {brandName.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase()}
                          </span>
                        );
                      })}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {p.category}{p.subcategory ? ` -> ${p.subcategory}` : ""} · €{p.price.toFixed(2)}
                    </p>
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
      </div>)}</div>
      </section>

      {/* Gallery photos (public /events/gallery page) */}


      {/* Restaurants & categories manager */}
      {manageOpen && (
        <WorkspaceDialog titleId="workspace-manage-title" onClose={() => setManageOpen(false)}>
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-[#170d04] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <h2 id="workspace-manage-title" className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                  <FaSliders className="text-emerald-600 dark:text-emerald-400" /> {t.admin.manageMenus}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.admin.manageMenusSub}</p>
              </div>
              <button
                onClick={() => setManageOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
                aria-label={t.common.cancel}
              >
                <FaXmark />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              {/* Restaurants */}
              <div className="space-y-2">
                {brands.map((b) => {
                  const selected = b.id === manageBrandId;
                  return (
                    <div
                      key={b.id}
                      className={`flex flex-wrap items-center gap-3 rounded-2xl border p-2.5 transition ${
                        selected
                          ? "border-emerald-400 bg-emerald-50/50 dark:border-emerald-500/40 dark:bg-emerald-400/5"
                          : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"
                      }`}
                    >
                      <button onClick={() => setManageBrandId(b.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{b.name}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{b.categories.length} {t.admin.productCategory.toLowerCase()}</span>
                        </span>
                      </button>
                      <BrandNameEditor brandId={b.id} name={b.name} onSaved={async () => { await refresh(); }} />
                      {/* Logo: click to upload/replace, × to remove */}
                      <span className="relative shrink-0">
                        <button
                          onClick={() => pickLogo(b.id)}
                          className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition hover:ring-emerald-400 dark:ring-white/10"
                          aria-label={`${t.admin.uploadLogo}: ${b.name}`}
                          title={t.admin.uploadLogo}
                        >
                          {b.logo ? (
                            <Image src={b.logo} alt={b.name} fill sizes="40px" className="object-contain p-0.5" />
                          ) : (
                            <FaStore className="text-slate-400" />
                          )}
                          <span className="absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                            <FaImage className="text-xs" />
                          </span>
                        </button>
                        {b.logo && (
                          <button
                            onClick={() => runManage({ action: "setLogo", brandId: b.id, logo: "" })}
                            className="absolute -right-1.5 -top-1.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-black/60 text-[9px] text-white transition hover:bg-red-600"
                            aria-label={`${t.common.remove} logo: ${b.name}`}
                            title={t.common.remove}
                          >
                            <FaXmark />
                          </button>
                        )}
                      </span>
                      <button
                        onClick={() => runManage({ action: "removeBrand", id: b.id })}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-600"
                        aria-label={`${t.common.remove} ${b.name}`}
                        title={t.common.remove}
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  );
                })}

                {/* Add restaurant */}
                <div className="flex gap-2">
                  <input
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitAddBrand()}
                    placeholder={t.admin.restaurantName}
                    className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                  <button
                    onClick={submitAddBrand}
                    disabled={!newBrandName.trim() || manageState.status === "saving"}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaPlus /> {t.admin.addRestaurant}
                  </button>
                </div>
                <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogoFile(e.target.files?.[0])} />
              </div>

              {/* Categories of the selected restaurant */}
              {manageBrandId && brands.some((b) => b.id === manageBrandId) && (
                <div className="rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {brands.find((b) => b.id === manageBrandId)?.name} · {t.admin.productCategory}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {categoriesOf(manageBrandId).map((c) => {
                      const Icon = categoryIconFor(brands, c.name);
                      const categoryDraft = categoryEdit?.kind === "category" && categoryEdit.brandId === manageBrandId && categoryEdit.name === c.name ? categoryEdit : null;
                      return (
                        <div
                          key={c.name}
                          className="rounded-2xl bg-slate-100 p-2 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200"
                        >
                          {categoryDraft ? (
                            <div className="space-y-2">
                              <input
                                value={categoryDraft.nextName}
                                onChange={(e) => setCategoryEdit((d) => (d?.kind === "category" ? { ...d, nextName: e.target.value } : d))}
                                onKeyDown={(e) => e.key === "Enter" && submitCategoryEdit()}
                                className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                              />
                              <div className="flex max-w-[18rem] flex-wrap gap-1">
                                {CATEGORY_ICON_CHOICES.map(({ id, Icon: ChoiceIcon }) => (
                                  <button
                                    key={id}
                                    onClick={() => setCategoryEdit((d) => (d?.kind === "category" ? { ...d, icon: id } : d))}
                                    aria-label={id}
                                    title={id}
                                    className={`grid h-7 w-7 place-items-center rounded-lg border text-[13px] transition ${
                                      categoryDraft.icon === id
                                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                    }`}
                                  >
                                    <ChoiceIcon />
                                  </button>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  onClick={submitCategoryEdit}
                                  disabled={!categoryDraft.nextName.trim() || manageState.status === "saving"}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <FaCircleCheck /> {t.common.saveChanges}
                                </button>
                                <button
                                  onClick={() => setCategoryEdit(null)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-700 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
                                >
                                  <FaXmark /> {t.common.cancel}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <Icon aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" /> {c.name}
                              <button
                                onClick={() => startEditCategory(manageBrandId, c)}
                                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 transition hover:bg-emerald-500/15 hover:text-emerald-600"
                                aria-label={`${t.common.edit} ${c.name}`}
                                title={t.common.edit}
                              >
                                <FaPen className="text-[10px]" />
                              </button>
                              <button
                                onClick={() => runManage({ action: "removeCategory", brandId: manageBrandId, name: c.name })}
                                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 transition hover:bg-red-500/15 hover:text-red-600"
                                aria-label={`${t.common.remove} ${c.name}`}
                                title={t.common.remove}
                              >
                                <FaXmark className="text-[10px]" />
                              </button>
                            </span>
                          )}
                          {(c.subcategories ?? []).length > 0 && (
                            <div className="mt-2 flex max-w-full flex-wrap gap-1.5 border-t border-white/60 pt-2 dark:border-white/10">
                              {(c.subcategories ?? []).map((sub) => {
                                const SubIcon = categoryIconFor(brands, sub.name);
                                const subcategoryDraft =
                                  categoryEdit?.kind === "subcategory" && categoryEdit.brandId === manageBrandId && categoryEdit.categoryName === c.name && categoryEdit.name === sub.name
                                    ? categoryEdit
                                    : null;
                                return (
                                  subcategoryDraft ? (
                                    <div key={sub.name} className="space-y-2 rounded-2xl bg-white p-2 text-[11px] text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                                      <input
                                        value={subcategoryDraft.nextName}
                                        onChange={(e) => setCategoryEdit((d) => (d?.kind === "subcategory" ? { ...d, nextName: e.target.value } : d))}
                                        onKeyDown={(e) => e.key === "Enter" && submitCategoryEdit()}
                                        className="w-48 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                      />
                                      <div className="flex max-w-[18rem] flex-wrap gap-1">
                                        {CATEGORY_ICON_CHOICES.map(({ id, Icon: ChoiceIcon }) => (
                                          <button
                                            key={id}
                                            onClick={() => setCategoryEdit((d) => (d?.kind === "subcategory" ? { ...d, icon: id } : d))}
                                            aria-label={id}
                                            title={id}
                                            className={`grid h-7 w-7 place-items-center rounded-lg border text-[13px] transition ${
                                              subcategoryDraft.icon === id
                                                ? "border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                                : "border-slate-200 bg-white text-slate-500 hover:border-sky-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                            }`}
                                          >
                                            <ChoiceIcon />
                                          </button>
                                        ))}
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        <button
                                          onClick={submitCategoryEdit}
                                          disabled={!subcategoryDraft.nextName.trim() || manageState.status === "saving"}
                                          className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-black text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          <FaCircleCheck /> {t.common.saveChanges}
                                        </button>
                                        <button
                                          onClick={() => setCategoryEdit(null)}
                                          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-700 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
                                        >
                                          <FaXmark /> {t.common.cancel}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span key={sub.name} className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-2 pr-1 text-[11px] text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                                      <SubIcon className="text-sky-600 dark:text-sky-300" /> {sub.name}
                                      <button
                                        onClick={() => startEditSubcategory(manageBrandId, c.name, sub)}
                                        className="grid h-4 w-4 place-items-center rounded-full text-slate-400 transition hover:bg-sky-500/15 hover:text-sky-600"
                                        aria-label={`${t.common.edit} ${sub.name}`}
                                        title={t.common.edit}
                                      >
                                        <FaPen className="text-[8px]" />
                                      </button>
                                      <button
                                        onClick={() => runManage({ action: "removeSubcategory", brandId: manageBrandId, categoryName: c.name, name: sub.name })}
                                        className="grid h-4 w-4 place-items-center rounded-full text-slate-400 transition hover:bg-red-500/15 hover:text-red-600"
                                        aria-label={`${t.common.remove} ${sub.name}`}
                                        title={t.common.remove}
                                      >
                                        <FaXmark className="text-[9px]" />
                                      </button>
                                    </span>
                                  )
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {subcategoryManageCategories.length > 0 && (
                    <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-400/20 dark:bg-sky-400/10">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Subcategories</p>
                      <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr_auto]">
                        <select
                          value={activeNewSubcatCategory}
                            aria-label={t.admin.productCategory}
                          onChange={(e) => setNewSubcatCategory(e.target.value)}
                          className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        >
                          {subcategoryManageCategories.map((category) => (
                            <option key={category.name} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                        <input
                          value={newSubcatName}
                          onChange={(e) => setNewSubcatName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && submitAddSubcategory()}
                          placeholder="Indian fusion pizzas, Classic pizzas..."
                          className="w-full flex-1 rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        />
                        <button
                          onClick={submitAddSubcategory}
                          disabled={!newSubcatName.trim() || manageState.status === "saving"}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FaPlus /> Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add category */}
                  <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 dark:border-white/5">
                    <input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitAddCategory()}
                      placeholder={t.admin.categoryName}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    />
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{t.admin.pickIcon}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORY_ICON_CHOICES.map(({ id, Icon }) => (
                          <button
                            key={id}
                            onClick={() => setNewCatIcon(id)}
                            aria-label={id}
                            title={id}
                            className={`grid h-9 w-9 place-items-center rounded-xl border text-base transition ${
                              newCatIcon === id
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "border-slate-200 text-slate-500 hover:border-emerald-400 dark:border-white/10 dark:text-slate-300"
                            }`}
                          >
                            <Icon aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={submitAddCategory}
                      disabled={!newCatName.trim() || manageState.status === "saving"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaPlus /> {t.admin.addCategoryBtn}
                    </button>
                  </div>
                </div>
              )}

              {manageState.status === "saving" && (
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <FaSpinner className="animate-spin" /> {t.admin.saving}
                </p>
              )}
              {manageState.status === "error" && (
                <p className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  <FaCircleExclamation className="mt-0.5 shrink-0" /> {manageState.message}
                </p>
              )}
            </div>
          </div>
        </WorkspaceDialog>
      )}

      {/* Edit product modal */}
      {editing && (
        <WorkspaceDialog titleId="workspace-edit-title" onClose={closeEditor}>
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-[#170d04] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 id="workspace-edit-title" className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                <FaPen className="text-emerald-600 dark:text-emerald-400" /> {t.admin.editProduct}
              </h2>
              <button
                onClick={closeEditor}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
                aria-label={t.common.cancel}
              >
                <FaXmark />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto px-5 py-4">
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
              <textarea
                value={editDraft.descriptionNl}
                onChange={(e) => setEditDraft({ ...editDraft, descriptionNl: e.target.value })}
                placeholder={t.admin.productDescNl}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setEditMoreTextsOpen((o) => !o)}
                aria-expanded={editMoreTextsOpen}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                {editMoreTextsOpen ? t.admin.hideMoreTexts : t.admin.addMoreTexts}
                <FaChevronDown className={`transition-transform duration-300 ${editMoreTextsOpen ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${editMoreTextsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="space-y-3 overflow-hidden">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {t.admin.productDetail}
                </label>
                <RichTextEditor
                  value={editDraft.detailEn}
                  onChange={(html) => setEditDraft({ ...editDraft, detailEn: html })}
                  placeholder={t.admin.productDetail}
                />
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 mt-4">
                  {t.admin.productDetailNl}
                </label>
                <RichTextEditor
                  value={editDraft.detailNl}
                  onChange={(html) => setEditDraft({ ...editDraft, detailNl: html })}
                  placeholder={t.admin.productDetailNl}
                />
                <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.productDetailHint}</p>
              </div>
              <div>
                <input
                  value={editDraft.ingredientsEn}
                  onChange={(e) => setEditDraft({ ...editDraft, ingredientsEn: e.target.value })}
                  placeholder={t.admin.productIngredients}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <input
                  value={editDraft.ingredientsNl}
                  onChange={(e) => setEditDraft({ ...editDraft, ingredientsNl: e.target.value })}
                  placeholder={t.admin.productIngredientsNl}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <input
                  value={editDraft.allergensEn}
                  onChange={(e) => setEditDraft({ ...editDraft, allergensEn: e.target.value })}
                  placeholder={t.admin.productAllergens}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <input
                  value={editDraft.allergensNl}
                  onChange={(e) => setEditDraft({ ...editDraft, allergensNl: e.target.value })}
                  placeholder={t.admin.productAllergensNl}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.listHint}</p>
              </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t.admin.sellAtRestaurants}</p>
                <div className="flex flex-wrap gap-2">
                  {brands.map((b) => {
                    const has = b.categories.some((c) => c.name === editDraft.category);
                    const checked = has && editDraft.brands.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        title={has ? b.name : `${b.name} — ${editDraft.category}?`}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          !has
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                            : checked
                            ? "cursor-pointer border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200"
                            : "cursor-pointer border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-emerald-600"
                          disabled={!has}
                          checked={checked}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              brands: e.target.checked ? [...d.brands.filter((id) => id !== b.id), b.id] : d.brands.filter((id) => id !== b.id),
                            }))
                          }
                        />
                        {b.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    value={editDraft.price}
                    onChange={(e) => setEditDraft({ ...editDraft, price: sanitizePrice(e.target.value) })}
                    placeholder={t.admin.productPrice}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{t.admin.priceHint}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-amber-700"><input type="checkbox" checked={editDraft.isPopular} onChange={(e) => setEditDraft({ ...editDraft, isPopular: e.target.checked })} /> Popular</label>
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700"><input type="checkbox" checked={editDraft.isNew} onChange={(e) => setEditDraft({ ...editDraft, isNew: e.target.checked })} /> New</label>
                    <label className="inline-flex items-center gap-2 text-xs font-black text-rose-700"><input type="checkbox" checked={editDraft.bogoEnabled} onChange={(e) => setEditDraft({ ...editDraft, bogoEnabled: e.target.checked })} /> BUY 1 GET 1 FREE</label>
                  </div>
                </div>
                <div className="col-span-2 flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700"><input type="checkbox" checked={editDraft.isPopular} onChange={(e) => setEditDraft({ ...editDraft, isPopular: e.target.checked })} /> Popular</label>
                  <label className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700"><input type="checkbox" checked={editDraft.isNew} onChange={(e) => setEditDraft({ ...editDraft, isNew: e.target.checked })} /> New</label>
                </div>
                <select
                  value={editDraft.category}
                  onChange={(e) => {
                    const category = e.target.value as Category;
                    setEditDraft({ ...editDraft, category, brands: brandsWithCategory(category), subcategory: "" });
                  }}
                  aria-label={t.admin.changeCategory}
                  className="w-full self-start rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {allBrandCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {subcategoriesForBrands(editDraft.brands, editDraft.category).length > 0 && (
                <select
                  value={editDraft.subcategory}
                  onChange={(e) => setEditDraft({ ...editDraft, subcategory: e.target.value as Category })}
                  aria-label={`${editDraft.category} subcategory`}
                  className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 outline-none transition focus:border-emerald-500 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                >
                  <option value="">—</option>
                  {subcategoriesForBrands(editDraft.brands, editDraft.category).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => editFileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:text-slate-300"
                >
                  <FaImage /> {t.admin.productImage}
                </button>
                {editDraft.image && (
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                    <Image src={editDraft.image} alt="preview" fill sizes="48px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft((d) => ({ ...d, image: undefined }));
                        if (editFileRef.current) editFileRef.current.value = "";
                      }}
                      className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-black/60 text-[10px] text-white transition hover:bg-red-600"
                      aria-label={t.common.remove}
                      title={t.common.remove}
                    >
                      <FaXmark />
                    </button>
                  </span>
                )}
                <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onEditFile(e.target.files?.[0])} />
              </div>
              {editState.status === "error" && (
                <p className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  <FaCircleExclamation className="mt-0.5 shrink-0" /> {editState.message}
                </p>
              )}
              {editState.status === "success" && (
                <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <FaCircleCheck className="shrink-0" /> {editState.message}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeEditor}
                  className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editState.status === "saving" || editState.status === "success"}
                  className="flex-1 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editState.status === "saving" ? (
                    <span className="inline-flex items-center gap-2">
                      <FaSpinner className="animate-spin" /> {t.admin.saving}
                    </span>
                  ) : (
                    t.common.saveChanges
                  )}
                </button>
              </div>
            </div>
          </div>
        </WorkspaceDialog>
      )}

      {/* Delete product confirmation */}
      {deleting && (
        <WorkspaceDialog titleId="workspace-delete-title" onClose={() => setDeleting(null)}>
          <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-[#170d04] sm:rounded-3xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
              <FaTrash />
            </div>
            <h2 id="workspace-delete-title" className="mt-4 text-center text-lg font-black text-slate-900 dark:text-white">{t.admin.deleteConfirmTitle}</h2>
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
        </WorkspaceDialog>
      )}

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
