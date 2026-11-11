import { DRINK_SUBCATEGORIES } from "./data";
import type { BrandCategory, BrandConfig, BrandSubcategory } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- Existing database row normalization is preserved verbatim. */

export function rowToBrand(r: any): BrandConfig {
  const cats = Array.isArray(r.categories) ? r.categories : JSON.parse(r.categories ?? "[]");
  return {
    id: r.id,
    name: r.name,
    logo: r.logo ?? "",
    categories: (cats as BrandCategory[]).map((c) => ({
      name: String(c.name),
      icon: String(c.icon ?? "utensils"),
      subcategories: Array.isArray(c.subcategories)
        ? c.subcategories.map((s) => ({ name: String(s.name), icon: String(s.icon ?? "glass-water") }))
        : undefined,
    })),
  };
}

export function normalizeDrinkSubcategories(categories: BrandCategory[], defaults?: BrandCategory[]): { categories: BrandCategory[]; changed: boolean } {
  const defaultDrinks = defaults?.find((c) => c.name === "Drinks");
  const drinkSubcategoryNames = new Set([...DRINK_SUBCATEGORIES.map((c) => c.toLowerCase()), "lassi"]);
  let changed = false;
  const existingDrinks = categories.find((c) => c.name === "Drinks");
  const flatDrinkCategories = categories.filter((c) => drinkSubcategoryNames.has(c.name.toLowerCase()));
  if (!existingDrinks && flatDrinkCategories.length === 0) return { categories, changed };
  const drinks = existingDrinks
    ? {
        ...existingDrinks,
        subcategories: existingDrinks.subcategories ?? defaultDrinks?.subcategories ?? [],
      }
    : defaultDrinks ?? { name: "Drinks", icon: "glass-water", subcategories: [] };
  const subcategories = new Map<string, BrandSubcategory>();
  for (const sub of drinks.subcategories ?? []) {
    const name = sub.name === "Lassi" ? "Indian Lassi" : sub.name;
    subcategories.set(name.toLowerCase(), { name, icon: sub.icon ?? "glass-water" });
  }
  const nextCategories: BrandCategory[] = [];
  for (const category of categories) {
    if (category.name === "Drinks") continue;
    if (drinkSubcategoryNames.has(category.name.toLowerCase())) {
      const name = category.name === "Lassi" ? "Indian Lassi" : category.name;
      subcategories.set(name.toLowerCase(), { name, icon: category.icon ?? "glass-water" });
      changed = true;
      continue;
    }
    nextCategories.push(category);
  }
  const normalizedDrinks = { ...drinks, subcategories: Array.from(subcategories.values()) };
  const hadDrinks = categories.some((c) => c.name === "Drinks");
  const drinksIndex = categories.findIndex((c) => c.name === "Drinks");
  if (hadDrinks && drinksIndex >= 0) nextCategories.splice(Math.min(drinksIndex, nextCategories.length), 0, normalizedDrinks);
  else {
    nextCategories.push(normalizedDrinks);
    changed = true;
  }
  changed ||= JSON.stringify(nextCategories) !== JSON.stringify(categories);
  return { categories: nextCategories, changed };
}

