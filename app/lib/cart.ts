import type { Category, GrillSideChoice, Lang, Product } from "./types";

const CART_OPTION_SEPARATOR = "::side:";

export const GRILL_SIDE_OPTIONS: { id: GrillSideChoice; label: string; labelNl: string }[] = [
  { id: "rice", label: "Rice", labelNl: "Rijst" },
  { id: "fries", label: "Fries", labelNl: "Friet" },
];

export function isGrillSideChoice(value: string | undefined): value is GrillSideChoice {
  return value === "rice" || value === "fries";
}

export function isGrillDishesCategory(category: Category): boolean {
  return category.trim().toLowerCase() === "grill dishes";
}

export function isGrillSideRequired(product: Pick<Product, "category">): boolean {
  return isGrillDishesCategory(product.category);
}

export function cartKeyForProduct(productId: string, sideChoice?: GrillSideChoice): string {
  return sideChoice ? `${productId}${CART_OPTION_SEPARATOR}${sideChoice}` : productId;
}

export function parseCartKey(key: string): { productId: string; sideChoice?: GrillSideChoice } {
  const separatorIndex = key.lastIndexOf(CART_OPTION_SEPARATOR);
  if (separatorIndex === -1) return { productId: key };
  const productId = key.slice(0, separatorIndex);
  const option = key.slice(separatorIndex + CART_OPTION_SEPARATOR.length);
  return { productId, sideChoice: isGrillSideChoice(option) ? option : undefined };
}

export function grillSideLabel(choice: GrillSideChoice | undefined, lang: Lang = "en"): string | undefined {
  const option = GRILL_SIDE_OPTIONS.find((item) => item.id === choice);
  if (!option) return undefined;
  return lang === "nl" ? option.labelNl : option.label;
}