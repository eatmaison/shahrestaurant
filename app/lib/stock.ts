import { z } from "zod";

export const stockCategories = ["soft-drinks", "beer", "syrups"] as const;
type DefaultStockCategory = typeof stockCategories[number];
export type StockCategory = string;
export type StockCategoryOption = { id: StockCategory; name: string };
const stockCategoryId = z.union([z.enum(stockCategories), z.uuid()]);
export const stockCategoryCreate = z.strictObject({
  name: z.string().trim().min(1).max(60).refine(name => !Array.from(name).some(char => {
    const code = char.charCodeAt(0);
    return code < 32 || code >= 127 && code <= 159;
  })),
});
export const stockCategoryRemove = z.strictObject({
  id: stockCategoryId, replacement: stockCategoryId.nullable(),
}).refine(input => input.id !== input.replacement, { path: ["replacement"] });

export function stockCategoryLabel(category: StockCategoryOption, defaults: Record<DefaultStockCategory, string>) {
  const key = stockCategories.find(id => id === category.id);
  return key ? defaults[key] : category.name;
}
export const STOCK_MAX_COUNT = 1_000_000;
export const STOCK_MAX_CASE_SIZE = 1_000;

const stockOfferDate = z.iso.date().refine(date => date >= "0001-01-01");

export const stockPurchasePrice = z.strictObject({
  packUnits: z.number().int().min(1).max(STOCK_MAX_CASE_SIZE),
  regularCents: z.number().int().min(1).max(9_999_999),
  offerCents: z.number().int().min(0).max(9_999_999).nullable(),
  offerStart: stockOfferDate.optional(),
  offerEnd: stockOfferDate.optional(),
}).refine(price => price.offerCents === null || price.offerCents < price.regularCents, { path: ["offerCents"] })
  .refine(price => (!price.offerStart && !price.offerEnd) || price.offerCents !== null, { path: ["offerEnd"] })
  .refine(price => !price.offerStart || !price.offerEnd || price.offerStart <= price.offerEnd, { path: ["offerEnd"] });

export type StockPurchasePrice = z.infer<typeof stockPurchasePrice>;

const amsterdamDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" });
export function stockAmsterdamDate(now = new Date()): string {
  const parts = amsterdamDate.formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return part("year") + "-" + part("month") + "-" + part("day");
}

export function activeStockOffer(price: StockPurchasePrice, today: string): number | null {
  if (price.offerCents === null || price.offerCents >= price.regularCents) return null;
  if (price.offerStart && today < price.offerStart) return null;
  if (price.offerEnd && today > price.offerEnd) return null;
  return price.offerCents;
}

export function parseStockEuro(value: string): number | null {
  const amount = value.trim();
  if (!amount) return null;
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(amount)) return NaN;
  const [euros, fraction = ""] = amount.split(/[.,]/);
  return Number(euros) * 100 + Number(fraction.padEnd(2, "0"));
}

export const STOCK_SLIGRO_LINK_MAX_LENGTH = 512;

export function normalizeStockSligroLink(value: string): string | null {
  const directLink = value.trim().split(/[?#]/, 1)[0];
  // Strip copied tracking and fragments; never persist them or contact the supplier.
  const productPath = /^https:\/\/(?:www\.)?sligro\.nl(\/p\.[0-9]{1,12}\.html\/[a-z0-9][-a-z0-9_]*\.html)$/i.exec(directLink)?.[1];
  if (!productPath || productPath !== productPath.toLowerCase()) return null;
  const canonical = "https://www.sligro.nl" + productPath;
  return canonical.length <= STOCK_SLIGRO_LINK_MAX_LENGTH ? canonical : null;
}

const sligroLink = z.string().max(2048).transform((value, ctx) => {
  const canonical = normalizeStockSligroLink(value);
  if (canonical) return canonical;
  ctx.addIssue({ code: "custom", message: "Enter a direct Sligro product URL." });
  return z.NEVER;
});

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
  purchasePrice?: StockPurchasePrice | null;
  sligroUrl?: string | null;
}

export function stockUnits(cases: number, caseSize: number | null, loose: number) {
  return cases * (caseSize ?? 0) + loose;
}

export function compareStockItems(a: StockItem, b: StockItem) {
  return a.totalUnits - b.totalUnits || a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en");
}

export const stockValues = z.strictObject({
  name: z.string().trim().min(1).max(100).refine(name => !Array.from(name).some(char => char.charCodeAt(0) < 32)),
  category: stockCategoryId,
  cases: z.number().int().min(0).max(STOCK_MAX_COUNT),
  caseSize: z.number().int().min(1).max(STOCK_MAX_CASE_SIZE).nullable(),
  loose: z.number().int().min(0).max(STOCK_MAX_COUNT),
  purchasePrice: stockPurchasePrice.nullable().optional(),
  sligroUrl: sligroLink.nullable().optional(),
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
