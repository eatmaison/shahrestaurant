import { DEFAULT_BRAND_CONFIGS } from "./brandDefaults";
import { rowToBrand, normalizeDrinkSubcategories } from "./brandMapping";
import { rowToProduct } from "./mappers";
import type { PublicCatalogSnapshot } from "./publicCatalogTypes";

export const CATALOG_PRODUCT_LIMIT = 1000;
export const CATALOG_BRAND_LIMIT = 100;
export const CATALOG_TIMEOUT_MS = 750;
const MAX_SNAPSHOT_BYTES = 512_000;

export const CATALOG_SELECTS = [
  {
    text: "SELECT id, brand, group_id, category, subcategory, name, description, description_nl, price, image, sort_order, is_popular, is_new, bogo_enabled, detailed_description, ingredients, ingredients_nl, allergens, allergens_nl FROM products ORDER BY sort_order ASC, created_at ASC, id ASC LIMIT $1",
    params: [CATALOG_PRODUCT_LIMIT + 1],
  },
  {
    text: "SELECT id, name, logo, categories FROM brands ORDER BY sort ASC, created_at ASC LIMIT $1",
    params: [CATALOG_BRAND_LIMIT + 1],
  },
] as const;

export type CatalogTransport = (queries: typeof CATALOG_SELECTS, signal: AbortSignal) => Promise<unknown>;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string";

/** A bounded SELECT-only transport; failures mean unavailable, never a fabricated catalogue. */
export async function readCatalogSnapshot(transport: CatalogTransport, timeoutMs = CATALOG_TIMEOUT_MS): Promise<PublicCatalogSnapshot | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error("Catalogue read timed out")); }, timeoutMs);
    });
    const result = await Promise.race([transport(CATALOG_SELECTS, controller.signal), timeout]);
    if (!Array.isArray(result) || result.length !== 2) return null;
    const [productRows, brandRows] = result;
    if (!Array.isArray(productRows) || !Array.isArray(brandRows) || productRows.length > CATALOG_PRODUCT_LIMIT || brandRows.length > CATALOG_BRAND_LIMIT) return null;
    if (!productRows.every(row => record(row) && text(row.id) && text(row.brand) && text(row.category) && text(row.name) && text(row.description))) return null;
    if (!brandRows.every(row => record(row) && text(row.id) && text(row.name))) return null;
    for (const row of brandRows) {
      const categories: unknown = Array.isArray(row.categories) ? row.categories : JSON.parse(row.categories ?? "[]");
      if (!Array.isArray(categories) || !categories.every(category => record(category) && text(category.name) &&
        (category.subcategories === undefined || Array.isArray(category.subcategories) && category.subcategories.every(subcategory => record(subcategory) && text(subcategory.name))))) return null;
    }
    const products = productRows.map(rowToProduct);
    const brands = brandRows.map(rowToBrand).map(brand => ({
      ...brand,
      categories: normalizeDrinkSubcategories(brand.categories, DEFAULT_BRAND_CONFIGS.find(item => item.id === brand.id)?.categories).categories,
    }));
    if (products.some(product => !product.id || !product.brand || !product.category || !product.name || !Number.isFinite(product.price) || product.price < 0 ||
      (product.image !== undefined && !text(product.image)) || !Number.isFinite(product.sortOrder) ||
      ![product.ingredients, product.ingredientsNl, product.allergens, product.allergensNl].every(list => Array.isArray(list) && list.every(text)) ||
      ![product.isPopular, product.isNew, product.bogoEnabled].every(flag => typeof flag === "boolean"))) return null;
    if (brands.some(brand => !brand.id || !brand.name || brand.categories.some(category => !category.name || !category.icon ||
      category.subcategories?.some(subcategory => !subcategory.name || !subcategory.icon)))) return null;
    const brandIds = new Set(brands.map(brand => brand.id));
    if (brandIds.size !== brands.length || new Set(products.map(product => product.id)).size !== products.length || products.some(product => !brandIds.has(product.brand))) return null;
    const snapshot = { products, brands };
    if (Buffer.byteLength(JSON.stringify(snapshot), "utf8") > MAX_SNAPSHOT_BYTES) return null;
    return snapshot;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
