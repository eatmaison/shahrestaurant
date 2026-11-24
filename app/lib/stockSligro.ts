import { z } from "zod";
import { normalizeStockSligroLink, stockPurchasePrice } from "./stock";

// Keep each request compatible with the existing Chrome companion and save API.
export const SLIGRO_PREVIEW_LIMIT = 50;

export function sligroBatches<T>(rows: readonly T[]): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += SLIGRO_PREVIEW_LIMIT) {
    batches.push(rows.slice(i, i + SLIGRO_PREVIEW_LIMIT));
  }
  return batches;
}

const stopReasons = new Set(["login-needed", "supplier-blocked", "time-limit", "connection-lost", "adapter-unverified"]);
export const sligroUpdateRow = z.strictObject({
  id: z.uuid(),
  revision: z.number().int().min(1).max(2_147_483_647),
  url: z.string().max(512).refine(value => normalizeStockSligroLink(value) === value),
  sku: z.string().regex(/^\d{1,20}$/),
  purchasePrice: stockPurchasePrice,
}).refine(({ sku, url }) => sligroSku(url) === sku)
  .refine(({ purchasePrice }) => purchasePrice.offerCents === null || !!purchasePrice.offerEnd);

export function sligroSku(url: string): string | null {
  return /^https:\/\/www\.sligro\.nl\/p\.(\d{1,20})\.html(?:\/|$)/.exec(url)?.[1] ?? null;
}

export const sligroApply = z.strictObject({
  updates: z.array(sligroUpdateRow).min(1).max(SLIGRO_PREVIEW_LIMIT)
    .refine(rows => rows.length === new Set(rows.map(row => row.id)).size),
});

export type SligroUpdateRow = z.infer<typeof sligroUpdateRow>;

const resultRow = z.strictObject({
  id: z.uuid(), revision: z.string().regex(/^\d{1,10}$/), url: z.string().max(512), sku: z.string().regex(/^\d{1,12}$/),
  packUnits: z.number().int(),
  regularCents: z.number().int(), offerCents: z.number().int().nullable(),
  offerStart: z.string().nullable(), offerEnd: z.string().nullable(),
});
export const sligroExtensionResult = z.strictObject({
  source: z.literal("shah-sligro-extension"),
  type: z.literal("SLIGRO_PRICE_PREVIEW_RESULT"),
  requestId: z.string().uuid(),
  results: z.array(resultRow).max(SLIGRO_PREVIEW_LIMIT),
  skipped: z.array(z.strictObject({ id: z.string().max(36), reason: z.string().max(80) })).max(SLIGRO_PREVIEW_LIMIT),
});

export type SligroProduct = { id: string; url: string; packUnits: number; revision: string };
export function sligroReviewBatch(value: unknown, requested: readonly SligroProduct[], requestId: string): { rows: SligroUpdateRow[]; interrupted: boolean } | null {
  const result = sligroExtensionResult.safeParse(value);
  if (!result.success || result.data.requestId !== requestId) return null;
  const seen = new Set<string>();
  const repeated = new Set<string>();
  const expected = new Map(requested.map(product => [product.id, product]));
  const rows: SligroUpdateRow[] = [];
  for (const row of result.data.results) {
    if (seen.has(row.id)) repeated.add(row.id);
    seen.add(row.id);
    const product = expected.get(row.id);
    if (!product || row.url !== product.url || row.packUnits !== product.packUnits || row.revision !== product.revision) continue;
    const parsed = sligroUpdateRow.safeParse({
      id: row.id, revision: Number(row.revision), url: row.url, sku: row.sku,
      purchasePrice: {
        packUnits: row.packUnits, regularCents: row.regularCents, offerCents: row.offerCents,
        ...(row.offerStart ? { offerStart: row.offerStart } : {}),
        ...(row.offerEnd ? { offerEnd: row.offerEnd } : {}),
      },
    });
    if (parsed.success) rows.push(parsed.data);
  }
  return {
    rows: rows.filter(row => !repeated.has(row.id)),
    interrupted: result.data.skipped.some(row => expected.has(row.id) && stopReasons.has(row.reason)),
  };
}
