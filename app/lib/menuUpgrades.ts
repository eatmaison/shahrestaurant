import { isDrinkCategory, isMenuEligibleCategory, isSoftDrinkProduct, MENU_UPGRADE_CATEGORY, MENU_UPGRADE_PRICE } from "./data";
import { parseCartKey } from "./cart";
import type { MenuUpgrades, MenuUpgradesInput, OrderItem, Product } from "./types";

/** Preserve the existing same-restaurant preference, with a shared-catalogue fallback. */
export function softDrinksForMenu(product: Product, products: Product[]): Product[] {
  const drinks = products.filter(isSoftDrinkProduct);
  const sameBrand = drinks.filter(drink => drink.brand === product.brand);
  return sameBrand.length > 0 ? sameBrand : drinks;
}

export function menuFoodQuantities(cart: Record<string, number>): Record<string, number> {
  const quantities: Record<string, number> = Object.create(null);
  for (const [key, qty] of Object.entries(cart)) {
    if (!Number.isInteger(qty) || qty <= 0) continue;
    const { productId } = parseCartKey(key);
    quantities[productId] = (quantities[productId] ?? 0) + qty;
  }
  return quantities;
}

/**
 * Storage migration and quantity reconciliation. Scalars mean the old all-wraps
 * upgrade. Arrays are individual menus: increasing food qty never adds menus,
 * decreasing it retains the earliest choices. Unavailable/blank drinks remain
 * selected so the customer can correct them instead of losing a priced menu.
 */
export function normalizeMenuUpgrades(value: unknown, cart: Record<string, number>): MenuUpgrades {
  const normalized: MenuUpgrades = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return normalized;
  const quantities = menuFoodQuantities(cart);
  for (const [id, choice] of Object.entries(value)) {
    if (["__proto__", "constructor", "prototype"].includes(id)) continue;
    const qty = Math.min(99, quantities[id] ?? 0);
    if (qty <= 0) continue;
    const choices = typeof choice === "string" ? (choice ? Array<string>(qty).fill(choice) : [])
      : Array.isArray(choice) ? choice.slice(0, qty).map(drink => typeof drink === "string" ? drink : "") : [];
    if (choices.length > 0) normalized[id] = choices;
  }
  return normalized;
}

export function menuUpgradeSubtotal(upgrades: MenuUpgrades): number {
  return Object.values(upgrades).reduce((sum, drinks) => sum + drinks.length * MENU_UPGRADE_PRICE, 0);
}

/**
 * Match the order store's arithmetic: paid cart rows first, then each food's
 * menu fee in the exact payload order. Starting with/lumping the menu fees can
 * change binary rounding at discount or free-delivery boundaries. Zero-price
 * BOGO, fries and included drinks do not affect either sum. Keep invalid drink
 * choices priced here while checkout waits for the customer to correct them.
 */
export function cartMenuPriceTotals(
  lines: ReadonlyArray<{ product: Pick<Product, "price" | "category">; qty: number }>,
  upgrades: MenuUpgrades,
): { subtotal: number; foodSubtotal: number } {
  const rows = lines.map(({ product, qty }) => ({ price: product.price, qty, category: product.category }));
  for (const choices of Object.values(upgrades)) {
    rows.push({ price: MENU_UPGRADE_PRICE, qty: choices.length, category: MENU_UPGRADE_CATEGORY });
  }
  return {
    subtotal: +rows.reduce((sum, row) => sum + row.price * row.qty, 0).toFixed(2),
    foodSubtotal: rows.reduce((sum, row) => isDrinkCategory(row.category) ? sum : sum + row.price * row.qty, 0),
  };
}

export interface MenuCartState {
  cart: Record<string, number>;
  menuUpgrades: MenuUpgrades;
}

/** Reconcile both pieces atomically, including consecutive +/- clicks. */
export function withMenuCartQuantity(state: MenuCartState, cart: Record<string, number>): MenuCartState {
  return { cart, menuUpgrades: normalizeMenuUpgrades(state.menuUpgrades, cart) };
}

/** Build the existing flat order-item format with one quantity per chosen drink. */
export function buildMenuUpgradeItems(
  input: MenuUpgradesInput,
  cart: Record<string, number>,
  products: Product[],
): { ok: true; items: OrderItem[] } | { ok: false; error: "invalidInput" } {
  const invalid = { ok: false, error: "invalidInput" } as const;
  const quantities = menuFoodQuantities(cart);
  const productById = new Map(products.map(product => [product.id, product]));
  const items: OrderItem[] = [];
  for (const [foodId, raw] of Object.entries(input)) {
    if (["__proto__", "constructor", "prototype"].includes(foodId)) return invalid;
    if (raw === "") continue; // Legacy empty scalar means the upgrade was off.
    const food = productById.get(foodId);
    const qty = quantities[foodId] ?? 0;
    if (!food || qty <= 0 || !isMenuEligibleCategory(food.category)) return invalid;
    if (typeof raw === "string" && qty > 99) return invalid;
    const choices = typeof raw === "string" ? Array<string>(qty).fill(raw) : raw;
    if (!Array.isArray(choices) || choices.length > qty || choices.length > 99) return invalid;
    const allowed = new Map(softDrinksForMenu(food, products).map(drink => [drink.id, drink]));
    const drinkCounts = new Map<string, number>();
    for (const drinkId of choices) {
      if (typeof drinkId !== "string" || !allowed.has(drinkId)) return invalid;
      drinkCounts.set(drinkId, (drinkCounts.get(drinkId) ?? 0) + 1);
    }
    if (choices.length === 0) continue;
    items.push(
      { productId: `menu-upgrade:${food.id}`, name: `Full menu upgrade for ${food.name}`, price: MENU_UPGRADE_PRICE, qty: choices.length, brand: food.brand, category: MENU_UPGRADE_CATEGORY },
      { productId: `menu-fries:${food.id}`, name: `Fries included with ${food.name}`, price: 0, qty: choices.length, brand: food.brand, category: MENU_UPGRADE_CATEGORY },
    );
    for (const [drinkId, drinkQty] of drinkCounts) {
      const drink = allowed.get(drinkId)!;
      items.push({ productId: `menu-drink:${food.id}:${drink.id}`, name: `Free soft drink: ${drink.name}`, price: 0, qty: drinkQty, brand: drink.brand, category: "Drinks" });
    }
  }
  return { ok: true, items };
}
