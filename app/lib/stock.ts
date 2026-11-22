import { z } from "zod";

export const stockCategories = ["soft-drinks", "beer", "syrups"] as const;
export type StockCategory = typeof stockCategories[number];
export const STOCK_MAX_COUNT = 1_000_000;
export const STOCK_MAX_CASE_SIZE = 1_000;

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  cases: number;
  caseSize: number | null;
  loose: number;
  totalUnits: number;
  revision: number;
  archived: boolean;
}

export function stockUnits(cases: number, caseSize: number | null, loose: number) {
  return cases * (caseSize ?? 0) + loose;
}

export function compareStockItems(a: StockItem, b: StockItem) {
  return a.totalUnits - b.totalUnits || a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en");
}

export const stockValues = z.strictObject({
  name: z.string().trim().min(1).max(100).refine(name => !Array.from(name).some(char => char.charCodeAt(0) < 32)),
  category: z.enum(stockCategories),
  cases: z.number().int().min(0).max(STOCK_MAX_COUNT),
  caseSize: z.number().int().min(1).max(STOCK_MAX_CASE_SIZE).nullable(),
  loose: z.number().int().min(0).max(STOCK_MAX_COUNT),
}).refine(input => input.cases === 0 || input.caseSize !== null, { path: ["caseSize"] });

export type StockValues = z.infer<typeof stockValues>;

const mutationId = { id: z.uuid(), revision: z.number().int().min(1).max(2_147_483_647) };
export const stockMutation = z.discriminatedUnion("action", [
  z.strictObject({ ...mutationId, action: z.literal("edit"), values: stockValues }),
  z.strictObject({ ...mutationId, action: z.literal("archive") }),
  z.strictObject({ ...mutationId, action: z.literal("restore") }),
]);
export type StockMutation = z.infer<typeof stockMutation>;

export type StockFilter = "active" | "zero" | "archived";
export function visibleStockItems(items: StockItem[], filter: StockFilter, category: StockCategory | "all", search: string) {
  const term = search.trim().toLocaleLowerCase("en");
  return items.filter(item =>
    (filter === "archived" ? item.archived : !item.archived && (filter !== "zero" || item.totalUnits === 0)) &&
    (category === "all" || item.category === category) &&
    item.name.toLocaleLowerCase("en").includes(term)
  ).sort(compareStockItems);
}
