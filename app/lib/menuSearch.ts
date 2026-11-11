import type { Product } from "./types";

export type MenuSearchParams = Record<string, string | string[] | undefined>;
export const MENU_SEARCH_MAX_LENGTH = 120;

export function firstMenuQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function menuSearchInput(value: string | string[] | undefined): string {
  return (firstMenuQueryValue(value) ?? "").slice(0, MENU_SEARCH_MAX_LENGTH);
}

export function normalizeMenuSearch(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function matchesMenuSearch(product: Product, query: string): boolean {
  const terms = normalizeMenuSearch(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = normalizeMenuSearch([product.name, product.description, product.descriptionNl, product.category,
    ...(product.ingredients ?? []), ...(product.ingredientsNl ?? []), ...(product.allergens ?? []), ...(product.allergensNl ?? [])].join(" "));
  return terms.every(term => text.includes(term));
}
