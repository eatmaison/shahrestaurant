import type { PublicCatalogSnapshot } from "./publicCatalogTypes";
import type { BrandConfig, Product } from "./types";

/** An authoritative ready result, including an empty menu, always wins. */
export function catalogForDisplay(initial: PublicCatalogSnapshot | null, products: Product[], brands: BrandConfig[], status: "loading" | "ready" | "error", hasSeenReady: boolean) {
  return initial && !hasSeenReady && status !== "ready"
    ? { products: initial.products, brands: initial.brands, usingInitial: true }
    : { products, brands, usingInitial: false };
}

export function initialCatalogSelection(initial: PublicCatalogSnapshot | null) {
  if (!initial) return { brand: "tandoor", category: "Soups" };
  const brand = initial.brands.find(item => item.id === "tandoor") ?? initial.brands[0];
  const populated = (name: string) => initial.products.some(product => product.brand === brand?.id && product.category === name);
  const category = brand?.categories.find(item => item.name === "Soups" && populated(item.name)) ?? brand?.categories.find(item => populated(item.name)) ?? brand?.categories[0];
  return { brand: brand?.id ?? "tandoor", category: category?.name ?? "Soups" };
}
