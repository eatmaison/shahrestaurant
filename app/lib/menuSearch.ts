import type { Product } from "./types";

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
