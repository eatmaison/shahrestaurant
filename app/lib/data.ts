import type { IconType } from "react-icons";
import {
  FaAppleWhole,
  FaBacon,
  FaBottleDroplet,
  FaBowlFood,
  FaBowlRice,
  FaBreadSlice,
  FaBurger,
  FaCarrot,
  FaCakeCandles,
  FaChampagneGlasses,
  FaCheese,
  FaCookieBite,
  FaDrumstickBite,
  FaEgg,
  FaFire,
  FaFish,
  FaGlassWater,
  FaHotdog,
  FaIceCream,
  FaLeaf,
  FaLemon,
  FaMartiniGlassCitrus,
  FaMugHot,
  FaPepperHot,
  FaPizzaSlice,
  FaPlateWheat,
  FaSeedling,
  FaShrimp,
  FaUtensils,
  FaWheatAwn,
  FaWineBottle,
} from "react-icons/fa6";
import type { Brand, BrandConfig, Category, Product } from "./types";
import { TANDOOR_CATEGORY_ORDER } from "./tandoorProducts";

export const DRINK_SUBCATEGORIES: Category[] = ["Soft Drinks", "Indian Lassi", "Matcha's", "Smoothies", "Bubble Tea's", "Wine Bottles"];

export const PIZZA_SUBCATEGORIES: Category[] = ["Indian fusion pizzas", "Classic pizzas"];

export const MENU_ELIGIBLE_CATEGORIES: Category[] = ["Wraps", "Pizzas", "Burgers"];
export const MENU_UPGRADE_PRICE = 4;
export const MENU_UPGRADE_CATEGORY = "Menu upgrades";

export const CATEGORY_ORDER: Category[] = ["Wraps", "Burgers", "Pizzas", "Drinks"];

/**
 * Which website this deployment is. The database is shared across the whole
 * restaurant group (eattogo / themaison / tandoor), so rows created here
 * are tagged with this id - e.g. reviews are shown only on the site they were
 * written on. Each sister site sets its own value.
 */
export const SITE_ID = "tandoor";

/** Ordered fulfilment lifecycle used to advance and display order status. */
export const ORDER_STATUS_FLOW = ["new", "preparing", "delivery", "delivered"] as const;

/** Order numbers start counting up from this base (first order becomes 1001). */
export const ORDER_NUMBER_START = 1000;

/** Format a sequential order number for display, e.g. 1042 -> "ETG-1042". */
export function formatOrderNumber(n: number): string {
  return `ETG-${n}`;
}

/** Restaurant/brand metadata used to render the menu switcher and group orders. */
export interface BrandInfo {
  id: Brand;
  name: string;
  logo: string;
  categories: Category[];
}

export const BRANDS: BrandInfo[] = [
  { id: "eattogo", name: "Eat to go", logo: "/eattogo.png", categories: CATEGORY_ORDER },
  // Order-system brand stays "The Tandoor Company" for now (shared DB); a
  // separate "Shah Restaurant" brand will be added later by the owner.
  { id: "tandoor", name: "The Tandoor Company", logo: "/tandoorcompany.png", categories: TANDOOR_CATEGORY_ORDER },
];

export function brandInfo(id: Brand): BrandInfo {
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0];
}

/** Drink categories (across all brands) never receive loyalty/company discounts. */
export const DRINK_CATEGORIES: Category[] = ["Drinks", ...DRINK_SUBCATEGORIES, "Soft Drinks", "Lassi", "Wine Bottles"];

export function isDrinkCategory(category: Category): boolean {
  const normalized = category.trim().toLowerCase();
  return (
    DRINK_CATEGORIES.some((c) => c.toLowerCase() === normalized) ||
    normalized.includes("drink") ||
    normalized.includes("lassi") ||
    normalized.includes("matcha") ||
    normalized.includes("smoothie") ||
    normalized.includes("bubble tea")
  );
}

export function isMenuEligibleCategory(category: Category): boolean {
  const normalized = category.trim().toLowerCase();
  return MENU_ELIGIBLE_CATEGORIES.some((c) => c.toLowerCase() === normalized);
}

export function isSoftDrinkProduct(product: Pick<Product, "category" | "subcategory" | "name">): boolean {
  const subcategory = product.subcategory?.trim().toLowerCase() ?? "";
  const name = product.name.trim().toLowerCase();
  return isDrinkCategory(product.category) && (subcategory === "soft drinks" || /cola|fanta|sprite|water|spa|fernandes|ice tea|ginger/.test(name));
}

export function normalizeDrinkSubcategory(category?: Category): Category | undefined {
  const normalized = (category ?? "").trim().toLowerCase();
  if (!normalized || normalized === "drinks") return undefined;
  if (normalized === "lassi") return "Indian Lassi";
  return DRINK_SUBCATEGORIES.find((c) => c.toLowerCase() === normalized) ?? category;
}

/** Icon shown for a menu category, with a sensible fallback. */
const CATEGORY_ICONS: Record<string, IconType> = {
  // Eat to go
  Wraps: FaBowlFood,
  Burgers: FaBurger,
  Pizzas: FaPizzaSlice,
  Snacks: FaCookieBite,
  Sauces: FaBottleDroplet,
  Souces: FaBottleDroplet,
  "Indian fusion pizzas": FaPizzaSlice,
  "Classic pizzas": FaPizzaSlice,
  Drinks: FaGlassWater,
  "Indian Lassi": FaMugHot,
  "Matcha's": FaLeaf,
  Smoothies: FaGlassWater,
  "Bubble Tea's": FaMugHot,
  // The Tandoor Company
  Soups: FaMugHot,
  "Vegetarian Starters": FaLeaf,
  "Tandoori Starters": FaDrumstickBite,
  "Starters for Two": FaUtensils,
  "Tandoori Mains": FaFire,
  "Tandoori Platters": FaUtensils,
  Curries: FaBowlRice,
  "Vegetarian Mains": FaCarrot,
  Biryani: FaBowlRice,
  Sides: FaPlateWheat,
  Bread: FaBreadSlice,
  Desserts: FaIceCream,
  Lassi: FaMugHot,
  "Soft Drinks": FaGlassWater,
  "Wine Bottles": FaWineBottle,
  Fish: FaFish,
};

export function getCategoryIcon(category: Category): IconType {
  return CATEGORY_ICONS[category] ?? FaUtensils;
}

/* ------------------------------------------------------------------ dynamic brands & category icons */

/** Icons an admin can pick for a category (stored by `id` in the database). */
export const CATEGORY_ICON_CHOICES: { id: string; Icon: IconType }[] = [
  { id: "utensils", Icon: FaUtensils },
  { id: "bowl-food", Icon: FaBowlFood },
  { id: "burger", Icon: FaBurger },
  { id: "pizza", Icon: FaPizzaSlice },
  { id: "cookie-bite", Icon: FaCookieBite },
  { id: "bottle-droplet", Icon: FaBottleDroplet },
  { id: "pepper-hot", Icon: FaPepperHot },
  { id: "cheese", Icon: FaCheese },
  { id: "glass-water", Icon: FaGlassWater },
  { id: "mug-hot", Icon: FaMugHot },
  { id: "martini-citrus", Icon: FaMartiniGlassCitrus },
  { id: "champagne", Icon: FaChampagneGlasses },
  { id: "leaf", Icon: FaLeaf },
  { id: "seedling", Icon: FaSeedling },
  { id: "drumstick", Icon: FaDrumstickBite },
  { id: "hotdog", Icon: FaHotdog },
  { id: "bacon", Icon: FaBacon },
  { id: "egg", Icon: FaEgg },
  { id: "fire", Icon: FaFire },
  { id: "bowl-rice", Icon: FaBowlRice },
  { id: "carrot", Icon: FaCarrot },
  { id: "apple", Icon: FaAppleWhole },
  { id: "lemon", Icon: FaLemon },
  { id: "plate-wheat", Icon: FaPlateWheat },
  { id: "wheat", Icon: FaWheatAwn },
  { id: "bread", Icon: FaBreadSlice },
  { id: "ice-cream", Icon: FaIceCream },
  { id: "cake", Icon: FaCakeCandles },
  { id: "wine-bottle", Icon: FaWineBottle },
  { id: "fish", Icon: FaFish },
  { id: "shrimp", Icon: FaShrimp },
];

/** Resolve an icon key (e.g. "burger") to its component, or undefined. */
export function iconByKey(key?: string): IconType | undefined {
  return CATEGORY_ICON_CHOICES.find((c) => c.id === key)?.Icon;
}

/** Icon key used when seeding the built-in category names. */
function defaultIconKey(category: string): string {
  const icon = CATEGORY_ICONS[category];
  return CATEGORY_ICON_CHOICES.find((c) => c.Icon === icon)?.id ?? "utensils";
}

/** Built-in restaurants used to seed the `brands` table on first run. */
export const DEFAULT_BRAND_CONFIGS: BrandConfig[] = BRANDS.map((b) => ({
  id: b.id,
  name: b.name,
  logo: b.logo,
  categories: b.categories.map((name) => ({
    name,
    icon: defaultIconKey(name),
    ...(name === "Pizzas"
      ? { subcategories: PIZZA_SUBCATEGORIES.map((sub) => ({ name: sub, icon: defaultIconKey(sub) })) }
      : {}),
    ...(name === "Drinks"
      ? { subcategories: DRINK_SUBCATEGORIES.map((sub) => ({ name: sub, icon: defaultIconKey(sub) })) }
      : {}),
  })),
}));

/** Find a brand in the dynamic (admin-managed) list, with a safe fallback. */
export function brandById(brands: BrandConfig[], id: string): BrandConfig | undefined {
  return brands.find((b) => b.id === id);
}

/** Icon for a category using the dynamic brand config, falling back to built-ins. */
export function categoryIconFor(brands: BrandConfig[], category: string): IconType {
  for (const b of brands) {
    const cat = b.categories.find((c) => c.name === category);
    if (cat) {
      const Icon = iconByKey(cat.icon);
      if (Icon) return Icon;
    }
    for (const parent of b.categories) {
      const subcategory = parent.subcategories?.find((s) => s.name === category);
      const Icon = iconByKey(subcategory?.icon);
      if (Icon) return Icon;
    }
  }
  return getCategoryIcon(category);
}

/**
 * NOTE: All products are now loaded dynamically from the database via the bootstrap() API.
 * No hardcoded product catalogue is used anymore.
 * Products are queried directly from the database and cached in app state.
 */
export const SEED_PRODUCTS: Product[] = [];

/** Secret code required to create an admin account during registration. */
export const ADMIN_CODE = "EATTOGO-ADMIN";

/** Flat delivery fee in euros. */
export const DELIVERY_FEE = 2.5;

/** Orders above this amount (after discounts) get free delivery. */
export const FREE_DELIVERY_FROM = 30;

/** Minimum order value (subtotal before discounts and points). */
export const MIN_ORDER = 20;

/**
 * Delivery area - we only deliver within Amsterdam-Noord.
 * Amsterdam-Noord uses Dutch postcodes with a 4-digit prefix in the 1020–1039 range.
 */
export const DELIVERY_AREA_MIN = 1020;
export const DELIVERY_AREA_MAX = 1039;
export const DELIVERY_AREA_NAME = "Amsterdam-Noord";

/** Normalise a Dutch postcode: strip spaces, uppercase (e.g. "1032 kl" -> "1032KL"). */
export function normalizePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** True when the input is a complete, well-formed Dutch postcode (e.g. "1032 KL"). */
export function isValidDutchPostcode(raw: string): boolean {
  return /^\d{4}\s?[A-Za-z]{2}$/.test(raw.trim());
}

/** Extract the 4-digit numeric prefix from a postcode, or null when unavailable. */
export function getPostcodePrefix(raw: string): number | null {
  const match = normalizePostcode(raw).match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/** True when the postcode falls inside our Amsterdam-Noord delivery area. */
export function isPostcodeInDeliveryArea(raw: string): boolean {
  const prefix = getPostcodePrefix(raw);
  return prefix !== null && prefix >= DELIVERY_AREA_MIN && prefix <= DELIVERY_AREA_MAX;
}

/** VIP membership: standard price and current sale price (in euros). */
export const VIP_PRICE = 100;
export const VIP_SALE_PRICE = 35;

/** VIP members always get this discount on food (not drinks). */
export const VIP_DISCOUNT_PCT = 10;

/** Company accounts always get this discount on food (not drinks). */
export const COMPANY_DISCOUNT_PCT = 20;

/** Minimum order value for company accounts (subtotal before discounts and points). */
export const COMPANY_MIN_ORDER = 100;

/** 1 loyalty point is worth €1 when redeemed. */
export const POINT_VALUE = 1;

/** Earn 1 point for every €10 spent. */
export const POINTS_EARN_EVERY = 10;

/** VIP price for a food product (drinks are never discounted). */
export function vipPrice(price: number, category: Category): number {
  if (isDrinkCategory(category)) return price;
  return +(price * (1 - VIP_DISCOUNT_PCT / 100)).toFixed(2);
}
