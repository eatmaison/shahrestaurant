"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBagShopping,
  FaBoxOpen,
  FaBuilding,
  FaCalendarCheck,
  FaChartLine,
  FaChevronDown,
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
  FaCircleExclamation,
  FaShareNodes,
  FaSliders,
  FaSpinner,
  FaStore,
  FaTrash,
  FaTruck,
  FaUser,
  FaUserGroup,
  FaUsers,
  FaUtensils,
  FaXmark,
} from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { CATEGORY_ICON_CHOICES, categoryIconFor, formatOrderNumber, isDrinkCategory, ORDER_STATUS_FLOW } from "../lib/data";
import { SOCIAL_PLATFORMS } from "../components/socialIcons";
import RichTextEditor from "../components/RichTextEditor";
import type { Brand, Category, Order, OrderStatus, Product } from "../lib/types";

const statusIcons: Record<OrderStatus, typeof FaClock> = {
  new: FaClock,
  preparing: FaBoxOpen,
  delivery: FaTruck,
  delivered: FaCircleCheck,
};

/** Feedback state for the add/edit product forms. */
type SaveState = { status: "idle" | "saving" | "success" | "error"; message?: string };

type CategoryEditDraft =
  | { kind: "category"; brandId: string; name: string; nextName: string; icon: string }
  | { kind: "subcategory"; brandId: string; categoryName: string; name: string; nextName: string; icon: string };

/** Period filter for stats and order management. */
type RangeFilter = { preset: "all" | "today" | "7d" | "30d" | "date"; date?: string };

/** Predicate matching timestamps inside the selected period (local time). */
const makeRangeCheck = (f: RangeFilter): ((ts: number) => boolean) => {
  if (f.preset === "all") return () => true;
  if (f.preset === "7d") {
    const from = Date.now() - 7 * 86_400_000;
    return (ts) => ts >= from;
  }
  if (f.preset === "30d") {
    const from = Date.now() - 30 * 86_400_000;
    return (ts) => ts >= from;
  }
  // "today" or a specific calendar date - one local-time day window.
  if (f.preset === "date" && !f.date) return () => true;
  const start = f.preset === "date" && f.date ? new Date(`${f.date}T00:00:00`).getTime() : new Date().setHours(0, 0, 0, 0);
  const end = start + 86_400_000;
  return (ts) => ts >= start && ts < end;
};

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

/** Splits a comma-separated admin input into a clean list ("a, b," → ["a","b"]). */
const parseList = (value: string): string[] =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

/**
 * Reads an image file and returns a downscaled data URL (default: max 1200px JPEG).
 * Large phone photos (10MB+) would otherwise exceed the request size limit and
 * silently fail to save; this also converts formats like Apple HEIC to JPEG.
 */
const processImageFile = (file: File, opts?: { maxDim?: number; mime?: string }): Promise<string> =>
  new Promise((resolve, reject) => {
    const maxDim = opts?.maxDim ?? 1200;
    const mime = opts?.mime ?? "image/jpeg";
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL(mime, 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });

const ADMIN_ONLINE_WINDOW_MS = 5 * 60_000;
const ADMIN_INITIAL_NOW = Date.now();

export default function AdminPage() {
  const { t, lang } = useLang();
  const { currentUser, products, orders, users, addProductGroup, removeProduct, updateProductGroup, brands, manageBrands, updateOrderStatus, setOrderPaid, setInvoiceSent, vipRequests, approveVipRequest, rejectVipRequest, socialLinks, updateSocialLink, reservations, setReservationStatus, cancelReservation, hydrated } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  /** Brand whose logo will receive the next picked file. */
  const logoBrandIdRef = useRef<string | null>(null);
  const [now, setNow] = useState(ADMIN_INITIAL_NOW);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    descriptionNl: "",
    price: "",
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

  // Product pending deletion (shown in a confirmation dialog).
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState<Brand | "all">("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState<Category | "all">("all");
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState<Category | "all">("all");

  // Period filters: one for the statistics block, one for order management.
  const [statsRange, setStatsRange] = useState<RangeFilter>({ preset: "all" });
  const [ordersRange, setOrdersRange] = useState<RangeFilter>({ preset: "all" });
  const statsCheck = useMemo(() => makeRangeCheck(statsRange), [statsRange]);
  const ordersCheck = useMemo(() => makeRangeCheck(ordersRange), [ordersRange]);

  const stats = useMemo(() => {
    const inPeriod = orders.filter((o) => statsCheck(o.createdAt));
    const revenue = inPeriod.reduce((s, o) => s + o.total, 0);
    const avg = inPeriod.length ? revenue / inPeriod.length : 0;
    const byCategory: Record<string, number> = {};
    const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of inPeriod) {
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
    return { revenue, avg, byCategory, top, maxCat, orderCount: inPeriod.length };
  }, [orders, products, statsCheck]);

  /** All category names across restaurants (plus any legacy ones found in orders). */
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const b of brands) for (const c of b.categories) set.add(c.name);
    for (const c of Object.keys(stats.byCategory)) set.add(c);
    return [...set];
  }, [brands, stats.byCategory]);

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

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
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
  }, [activeProductCategoryFilter, activeProductSubcategoryFilter, brands, productBrandFilter, productSearch, products]);

  /** Last 20 users seen on the site, most recent first. */
  const recentlyOnline = useMemo(
    () =>
      users
        .filter((u) => u.lastSeenAt)
        .sort((a, b) => (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0))
        .slice(0, 20),
    [users]
  );

  /** Reservation list filter: upcoming (pending/confirmed, today onwards) or all. */
  const [resFilter, setResFilter] = useState<"upcoming" | "all">("upcoming");
  const visibleReservations = useMemo(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const list =
      resFilter === "upcoming"
        ? reservations.filter((r) => r.date >= today && (r.status === "pending" || r.status === "confirmed"))
        : [...reservations].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    return list;
  }, [reservations, resFilter]);

  /** "just now" / "5 min ago" / "3 h ago" / "2 d ago" */
  const relativeTime = (ts: number): string => {
    const diffMin = Math.max(0, Math.floor((now - ts) / 60_000));
    if (diffMin < 1) return t.admin.justNow;
    if (diffMin < 60) return t.admin.minutesAgo.replace("{n}", String(diffMin));
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return t.admin.hoursAgo.replace("{n}", String(diffH));
    return t.admin.daysAgo.replace("{n}", String(Math.floor(diffH / 24)));
  };

  const lastSeenSiteLabel = (site?: string): string | null => {
    if (!site) return null;
    return (
      {
        eattogo: "Eat to go",
        themaison: "The Maison",
        tandoor: "The Tandoor Company",
      }[site] ?? site
    );
  };

  /** Local drafts for the social link URL inputs (saved on blur / Enter). */
  const [socialDrafts, setSocialDrafts] = useState<Record<string, string>>({});
  const [socialSavedFor, setSocialSavedFor] = useState<string | null>(null);
  // Social links panel is collapsed by default to save space in the admin panel.
  const [socialOpen, setSocialOpen] = useState(false);
  // Sales-by-category and top-products panels are also collapsed by default.
  const [salesOpen, setSalesOpen] = useState(false);
  const [topOpen, setTopOpen] = useState(false);

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
    setTimeout(() => setAddState((s) => (s.status === "success" ? { status: "idle" } : s)), 4000);
  };

  const openEditor = (p: Product) => {
    setEditing(p);
    setEditState({ status: "idle" });
    // Preselect every restaurant this product is already sold at (its group).
    const groupBrands = [...new Set((p.groupId ? products.filter((x) => x.groupId === p.groupId) : [p]).map((x) => x.brand))];
    setEditDraft({
      name: p.name,
      description: p.description,
      descriptionNl: p.descriptionNl ?? "",
      price: String(p.price),
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

  const cards = [
    { icon: FaEuroSign, label: t.admin.totalRevenue, value: `€${stats.revenue.toFixed(2)}` },
    { icon: FaReceipt, label: t.admin.totalOrders, value: stats.orderCount },
    { icon: FaUsers, label: t.admin.totalUsers, value: users.filter((u) => statsCheck(u.createdAt)).length },
    { icon: FaChartLine, label: t.admin.avgOrder, value: `€${stats.avg.toFixed(2)}` },
  ];

  /** Pill buttons + date picker used to filter stats and order management. */
  const renderRangeFilter = (value: RangeFilter, onChange: (f: RangeFilter) => void) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {(
        [
          ["all", t.admin.filterAll],
          ["today", t.admin.filterToday],
          ["7d", t.admin.filterWeek],
          ["30d", t.admin.filterMonth],
        ] as const
      ).map(([preset, label]) => (
        <button
          key={preset}
          onClick={() => onChange({ preset })}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            value.preset === preset
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
              : "bg-slate-100 text-slate-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-white/10 dark:text-slate-300"
          }`}
        >
          {label}
        </button>
      ))}
      <input
        type="date"
        value={value.preset === "date" ? value.date ?? "" : ""}
        onChange={(e) => onChange(e.target.value ? { preset: "date", date: e.target.value } : { preset: "all" })}
        aria-label={t.admin.filterPickDate}
        title={t.admin.filterPickDate}
        className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none transition focus:border-emerald-500 dark:bg-white/10 dark:text-white ${
          value.preset === "date"
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:text-slate-300"
        }`}
      />
    </div>
  );

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

  const filteredCustomerOrders = customerOrders.filter((o) => ordersCheck(o.createdAt) && matchesOrder(o, customerSearch));
  const filteredCompanyOrders = companyOrders.filter((o) => ordersCheck(o.createdAt) && matchesOrder(o, companySearch));

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
            <span className="font-semibold text-slate-900 dark:text-white">{o.address || "-"}</span>, {o.postcode || "-"}
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FaPhone className="shrink-0 text-emerald-600 dark:text-emerald-400" /> {o.phone || "-"}
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.admin.title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.admin.subtitle}</p>
        </div>
        <Link
          href="/terminal"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
        >
          <FaReceipt /> {t.terminal.title} →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-4">{renderRangeFilter(statsRange, setStatsRange)}</div>
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
        {/* Sales by category (collapsible) */}
        <div className="self-start rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setSalesOpen((o) => !o)}
            aria-expanded={salesOpen}
            className="flex w-full items-center gap-2 text-left"
          >
            <h2 className="flex-1 text-lg font-black text-slate-900 dark:text-white">{t.admin.ordersByCategory}</h2>
            <FaChevronDown className={`shrink-0 text-slate-400 transition-transform duration-300 ${salesOpen ? "rotate-180" : ""}`} />
          </button>
          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${salesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="mt-4 space-y-3">
                {allCategories.map((cat) => {
                  const val = stats.byCategory[cat] || 0;
                  const Icon = categoryIconFor(brands, cat);
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
          </div>
        </div>

        {/* Top products (collapsible) */}
        <div className="self-start rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setTopOpen((o) => !o)}
            aria-expanded={topOpen}
            className="flex w-full items-center gap-2 text-left"
          >
            <h2 className="flex-1 text-lg font-black text-slate-900 dark:text-white">{t.admin.topProducts}</h2>
            <FaChevronDown className={`shrink-0 text-slate-400 transition-transform duration-300 ${topOpen ? "rotate-180" : ""}`} />
          </button>
          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${topOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
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
              const FavIcon = c.favCategory ? categoryIconFor(brands, c.favCategory.name) : categoryIconFor(brands, "");
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
                        {c.favProduct ? `${c.favProduct.name} ×${c.favProduct.qty}` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FavIcon className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-slate-500 dark:text-slate-400">{t.admin.favoriteCategory}:</span>
                      <span className="ml-auto truncate font-bold text-slate-900 dark:text-white">
                        {c.favCategory ? `${c.favCategory.name} ×${c.favCategory.qty}` : "-"}
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

      {/* Recently online - last 20 signed-in visitors */}
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
              const online = now - (u.lastSeenAt ?? 0) < ADMIN_ONLINE_WINDOW_MS;
              const orderCount = orders.filter((o) => o.userId === u.id).length;
              const lastSeenSite = lastSeenSiteLabel(u.lastSeenSite);
              return (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-black text-white">
                    {u.name.charAt(0).toUpperCase()}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#170d04] ${
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
                    {u.phone && (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <FaPhone className="shrink-0 text-[10px] text-slate-400" /> {u.phone}
                      </p>
                    )}
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300"
                    title={t.admin.ordersLabel}
                  >
                    <FaReceipt className="text-[10px] text-emerald-600 dark:text-emerald-400" /> {orderCount}
                  </span>
                  {lastSeenSite && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-700 dark:text-sky-300"
                      title="Website"
                    >
                      <FaStore className="text-[10px]" /> {lastSeenSite}
                    </span>
                  )}
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
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.socialTitle}</h2>
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

      {/* Reservations management */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FaCalendarCheck />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.reservationsTitle}</h2>
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
        </div>

        {visibleReservations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t.admin.noReservationsAdmin}</p>
        ) : (
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {visibleReservations.map((r) => {
              const badge =
                r.status === "confirmed"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : r.status === "pending"
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-600 dark:text-amber-300"
                    : "border-slate-300/60 bg-slate-400/10 text-slate-500 dark:text-slate-400";
              const statusLabel =
                r.status === "pending"
                  ? t.reservations.statusPending
                  : r.status === "confirmed"
                    ? t.reservations.statusConfirmed
                    : r.status === "declined"
                      ? t.reservations.statusDeclined
                      : t.reservations.statusCancelled;
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
                    <span className="inline-flex items-center gap-1.5"><FaUser className="text-emerald-500" /> {r.guestName}</span>
                    <span className="inline-flex items-center gap-1.5"><FaUserGroup className="text-emerald-500" /> {r.guests}</span>
                    <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 hover:text-emerald-600"><FaPhone className="text-emerald-500" /> {r.phone}</a>
                    {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 hover:text-emerald-600"><FaEnvelope className="text-emerald-500" /> {r.email}</a>}
                  </div>
                  {(r.occasion || r.note) && (
                    <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      {r.occasion && <span className="font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{r.occasion}</span>}
                      {r.occasion && r.note && " · "}
                      {r.note}
                    </p>
                  )}
                  {(r.status === "pending" || r.status === "confirmed") && (
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
                        <button
                          onClick={() => cancelReservation(r.id)}
                          className="flex-1 rounded-full border border-red-300/60 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/10 dark:border-red-400/30"
                        >
                          {t.admin.resCancelAdmin}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Product management */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
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
              </div>
              <select
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
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.manageProducts}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {filteredProducts.length}/{products.length}
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-2 md:grid-cols-[1fr_0.7fr_0.7fr]">
              <label className="relative block">
                <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t.admin.productSearch}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
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
                    <Icon className="text-[11px]" /> {cat}
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
                      <Icon className="text-[11px]" /> {sub}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                {t.admin.noProductMatches}
              </p>
            ) : filteredProducts.map((p) => {
              const Icon = categoryIconFor(brands, p.category);
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
                        title={brands.find((b) => b.id === p.brand)?.name ?? p.brand}
                      >
                        {(brands.find((b) => b.id === p.brand)?.name ?? p.brand).replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase()}
                      </span>
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
      </div>

      {/* Gallery photos (public /events/gallery page) */}
      <GalleryManager />

      {/* Restaurants & categories manager */}
      {manageOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setManageOpen(false)} />
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-[#170d04] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
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
                      className={`flex items-center gap-3 rounded-2xl border p-2.5 transition ${
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
                              <Icon className="text-emerald-600 dark:text-emerald-400" /> {c.name}
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
                            <Icon />
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
        </div>
      )}

      {/* Edit product modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/40" onClick={closeEditor} />
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-[#170d04] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
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
        </div>
      )}

      {/* Delete product confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleting(null)} />
          <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-[#170d04] sm:rounded-3xl">
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

/* ------------------------------------------------------------------ gallery manager */

/** Admin-managed photo on the public gallery page (file stored in DigitalOcean Spaces). */
type AdminGalleryImage = {
  id: string;
  url: string;
  alt: string;
  altNl: string;
  category: string;
  portrait: boolean;
  createdAt: number;
};

/** Upload, list and delete the photos shown on /events/gallery. */
function GalleryManager() {
  const { lang } = useLang();
  const nl = lang === "nl";
  const [images, setImages] = useState<AdminGalleryImage[]>([]);
  const [draft, setDraft] = useState({ image: "", alt: "", altNl: "", category: "ambiance", portrait: false });
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.images)) setImages(d.images);
      })
      .catch(() => {});
  }, []);

  const catLabel = (key: string): string =>
    (
      {
        dishes: nl ? "Gerechten" : "Dishes",
        interior: nl ? "Interieur" : "Interior",
        bar: nl ? "Bar & Drankjes" : "Bar & Drinks",
        ambiance: nl ? "Sfeer" : "Ambiance",
      } as Record<string, string>
    )[key] ?? key;

  const onPick = async (file?: File) => {
    if (!file) return;
    try {
      const image = await processImageFile(file, { maxDim: 1600 });
      setDraft((d) => ({ ...d, image }));
      setState({ status: "idle" });
    } catch {
      if (pickRef.current) pickRef.current.value = "";
      setState({ status: "error", message: nl ? "Kon de foto niet lezen." : "Could not read the photo." });
    }
  };

  const upload = async () => {
    if (!draft.image || state.status === "saving") return;
    setState({ status: "saving" });
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!data.ok || !data.image) throw new Error(data.error || "error");
      setImages((list) => [data.image, ...list]);
      setDraft({ image: "", alt: "", altNl: "", category: "ambiance", portrait: false });
      if (pickRef.current) pickRef.current.value = "";
      setState({ status: "success", message: nl ? "Foto toegevoegd aan de galerij." : "Photo added to the gallery." });
      setTimeout(() => setState((s) => (s.status === "success" ? { status: "idle" } : s)), 4000);
    } catch {
      setState({ status: "error", message: nl ? "Uploaden mislukt. Probeer het opnieuw." : "Upload failed. Please try again." });
    }
  };

  const remove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await fetch(`/api/gallery?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setImages((list) => list.filter((i) => i.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <FaImage className="text-emerald-600 dark:text-emerald-400" /> {nl ? "Galerij" : "Gallery"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {nl
              ? "Beheer de foto's op de openbare galerijpagina. Foto's worden opgeslagen in DigitalOcean Spaces."
              : "Manage the photos on the public gallery page. Photos are stored in DigitalOcean Spaces."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {images.length}
        </span>
      </div>

      {/* Upload form */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => pickRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:text-slate-300"
          >
            <FaPlus /> {nl ? "Foto kiezen" : "Choose photo"}
          </button>
          {draft.image && (
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
              <Image src={draft.image} alt="preview" fill sizes="48px" className="object-cover" />
              <button
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, image: "" }));
                  if (pickRef.current) pickRef.current.value = "";
                }}
                className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-black/60 text-[10px] text-white transition hover:bg-red-600"
                aria-label="remove"
              >
                <FaXmark />
              </button>
            </span>
          )}
          <input ref={pickRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={draft.alt}
            onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
            placeholder={nl ? "Beschrijving (Engels)" : "Description (English)"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
          <input
            value={draft.altNl}
            onChange={(e) => setDraft({ ...draft, altNl: e.target.value })}
            placeholder={nl ? "Beschrijving (Nederlands)" : "Description (Dutch)"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            aria-label={nl ? "Categorie" : "Category"}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
          >
            {["ambiance", "dishes", "interior", "bar"].map((c) => (
              <option key={c} value={c}>
                {catLabel(c)}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={draft.portrait}
              onChange={(e) => setDraft({ ...draft, portrait: e.target.checked })}
              className="h-4 w-4 accent-emerald-600"
            />
            {nl ? "Staande foto (portret)" : "Portrait photo (tall)"}
          </label>
        </div>

        {state.status === "error" && (
          <p className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
            <FaCircleExclamation className="mt-0.5 shrink-0" /> {state.message}
          </p>
        )}
        {state.status === "success" && (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <FaCircleCheck className="shrink-0" /> {state.message}
          </p>
        )}

        <button
          onClick={upload}
          disabled={!draft.image || state.status === "saving"}
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "saving" ? (
            <span className="inline-flex items-center gap-2">
              <FaSpinner className="animate-spin" /> {nl ? "Uploaden…" : "Uploading…"}
            </span>
          ) : nl ? (
            "Toevoegen aan galerij"
          ) : (
            "Add to gallery"
          )}
        </button>
      </div>

      {/* Existing photos */}
      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-black/20">
                <Image src={img.url} alt={img.alt || "gallery"} fill sizes="200px" className="object-cover" />
              </div>
              <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                {catLabel(img.category)}
              </span>
              <button
                onClick={() => remove(img.id)}
                disabled={deletingId === img.id}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-xs text-white backdrop-blur transition hover:bg-red-600 disabled:opacity-60"
                aria-label={nl ? "Verwijderen" : "Delete"}
                title={nl ? "Verwijderen" : "Delete"}
              >
                {deletingId === img.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
