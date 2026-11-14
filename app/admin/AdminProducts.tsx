"use client";
import workspace from "../components/Workspace.module.css";
import { WorkspaceDialog } from "../components/WorkspaceDialog";


import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { FaChevronDown, FaGripVertical, FaImage, FaLock, FaMagnifyingGlass, FaPen, FaPlus, FaCircleCheck, FaCircleExclamation, FaDownload, FaSliders, FaSpinner, FaStore, FaTrash, FaXmark } from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { CATEGORY_ICON_CHOICES, categoryIconFor, isDrinkCategory } from "../lib/data";
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(() => import("../components/RichTextEditor"), { ssr: false });
import { processImageFile } from "./adminImage";
import { downloadCsv } from "./adminFormat";
import adminStyles from "./admin.module.css";
import { BrandNameEditor } from "./BrandNameEditor";
import { CategoryOrdering } from "./CategoryOrdering";
import type { Brand, Category, Product } from "../lib/types";

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

/** Splits a comma-separated admin input into a clean list ("a, b," → ["a","b"]). */
const parseList = (value: string): string[] =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

export default function AdminProducts() {
  const {t,lang}=useLang();
  const {currentUser,products,addProductGroup,removeProduct,updateProductGroup,moveProduct,brands,manageBrands,refresh,hydrated}=useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  /** Brand whose logo will receive the next picked file. */
  const logoBrandIdRef = useRef<string | null>(null);

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
  const manageBusy = useRef(false);

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

  // Product pending deletion (shown in a confirmation dialog).
  const [deleting, setDeleting] = useState<Product | null>(null);

  const [productSearch, setProductSearch] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState<Brand | "all">("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState<Category | "all">("all");
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState<Category | "all">("all");
  const [draggingProductKey, setDraggingProductKey] = useState<string | null>(null);
  const [dropProductKey, setDropProductKey] = useState<string | null>(null);
  const [movingProductKey, setMovingProductKey] = useState<string | null>(null);

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
      case "menuChanged":
        return lang === "nl" ? "Het menu is elders gewijzigd. De nieuwste versie is geladen; controleer de volgorde en probeer opnieuw." : "The menu changed in another session. The latest version was loaded; check the order and try again.";
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
    if (manageBusy.current) return false;
    manageBusy.current = true;
    setManageState({ status: "saving" });
    try {
      const res = await manageBrands(input);
      if (!res.ok) {
        if (res.error === "menuChanged") await refresh();
        setManageState({ status: "error", message: brandErrorText(res.error) });
        return false;
      }
      setManageState({ status: "idle" });
      return true;
    } finally { manageBusy.current = false; }
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
  return (<div className="admin-products">
      {/* Product management */}
      <section className={`${adminStyles.panel} mt-6`}>
        <div className={adminStyles.panelHeader}><div><h2 id="workspace-products" tabIndex={-1}>{t.admin.manageProducts}</h2><p className={adminStyles.muted}>{lang === "nl" ? "Beheer producten en de volgorde van categorieën in het bestelmenu." : "Manage products and category order in the ordering menu."}</p></div><button type="button" className={adminStyles.button} onClick={() => {setManageOpen(true);setManageBrandId(brands[0]?.id ?? null);setManageState({status:"idle"});}}><FaSliders />{t.admin.manageMenus}</button></div>
        <div id="admin-catalog-content" className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Add product */}
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <FaPlus className="text-emerald-600 dark:text-emerald-400" /> {t.admin.addProduct}
            </h2>

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
      </div>
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

            <div data-category-scroll className="space-y-4 overflow-y-auto px-5 py-4">
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
                  <CategoryOrdering key={manageBrandId} categories={categoriesOf(manageBrandId)} busy={manageState.status === "saving"} nl={lang === "nl"} onMove={(name, targetName, placement) => runManage({action: "moveCategory", brandId: manageBrandId, name, targetName, placement, expectedOrder: categoriesOf(manageBrandId).map(category => category.name)})} renderCategory={(c) => {
                      const Icon = categoryIconFor(brands, c.name);
                      const categoryDraft = categoryEdit?.kind === "category" && categoryEdit.brandId === manageBrandId && categoryEdit.name === c.name ? categoryEdit : null;
                      return (
                        <div
                          key={c.name}
                          className="min-w-0 rounded-xl bg-slate-100 p-2 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200"
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
                    }} />

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
                <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
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

  </div>);
}
