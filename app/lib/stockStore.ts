import { sql } from "./db";
import type { StockItem, StockMutation, StockValues } from "./stock";

type StockRow = {
  id: string; name: string; category: StockItem["category"]; cases_count: number;
  case_size: number | null; loose_count: number; total_units: number;
  revision: number; archived: boolean;
  sligro_url: string | null;
  purchase_offer_start: string | null; purchase_offer_end: string | null;
  purchase_pack_units: number | null; purchase_regular_cents: number | null; purchase_offer_cents: number | null;
};

const projection = "id, name, category, cases_count, case_size, loose_count, total_units, revision, (archived_at IS NOT NULL) AS archived, purchase_pack_units, purchase_regular_cents, purchase_offer_cents, sligro_url, to_char(purchase_offer_start, 'YYYY-MM-DD') AS purchase_offer_start, to_char(purchase_offer_end, 'YYYY-MM-DD') AS purchase_offer_end";

const itemFrom = (row: StockRow): StockItem => ({
  id: row.id, name: row.name, category: row.category, cases: row.cases_count,
  caseSize: row.case_size, loose: row.loose_count, totalUnits: row.total_units,
  revision: row.revision, archived: row.archived, sligroUrl: row.sligro_url,
  purchasePrice: row.purchase_pack_units !== null && row.purchase_regular_cents !== null
    ? { packUnits: row.purchase_pack_units, regularCents: row.purchase_regular_cents, offerCents: row.purchase_offer_cents,
      ...(row.purchase_offer_start ? { offerStart: row.purchase_offer_start } : {}),
      ...(row.purchase_offer_end ? { offerEnd: row.purchase_offer_end } : {}),
    }
    : null,
});

const priceFields = (price: StockValues["purchasePrice"]) => [price?.packUnits ?? null, price?.regularCents ?? null, price?.offerCents ?? null, price?.offerStart ?? null, price?.offerEnd ?? null];

const fields = (values: StockValues) => [values.name, values.category, values.cases, values.caseSize, values.loose];

export async function loadStock(): Promise<StockItem[]> {
  const rows = await sql.query("SELECT " + projection + " FROM shah_stock_items ORDER BY total_units, lower(name), id") as StockRow[];
  return rows.map(itemFrom);
}

export async function addStock(values: StockValues): Promise<StockItem> {
  const rows = await sql.query(
    "INSERT INTO shah_stock_items (name, category, cases_count, case_size, loose_count, purchase_pack_units, purchase_regular_cents, purchase_offer_cents, purchase_offer_start, purchase_offer_end, sligro_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING " + projection,
    [...fields(values), ...priceFields(values.purchasePrice), values.sligroUrl ?? null],
  ) as StockRow[];
  return itemFrom(rows[0]);
}

export async function updateStock(input: StockMutation): Promise<{ item: StockItem; updated: boolean } | null> {
  // The revision check prevents one admin from silently overwriting another's count.
  const editParams: Array<string | number | null> = input.action === "edit" ? fields(input.values) : [];
  const editAssignments: string[] = [];
  if (input.action === "edit" && input.values.purchasePrice !== undefined) {
    const columns = ["purchase_pack_units", "purchase_regular_cents", "purchase_offer_cents", "purchase_offer_start", "purchase_offer_end"];
    priceFields(input.values.purchasePrice).forEach((price, index) => {
      editAssignments.push(columns[index] + " = $" + (editParams.push(price) + 2));
    });
  }
  if (input.action === "edit" && input.values.sligroUrl !== undefined) {
    editAssignments.push("sligro_url = $" + (editParams.push(input.values.sligroUrl) + 2));
  }
  const statements = {
    edit: "UPDATE shah_stock_items SET name = $3, category = $4, cases_count = $5, case_size = $6, loose_count = $7, " + (editAssignments.length ? editAssignments.join(", ") + ", " : ""),
    archive: "UPDATE shah_stock_items SET archived_at = now(), ",
    restore: "UPDATE shah_stock_items SET archived_at = NULL, ",
  };
  const condition = input.action === "restore" ? " AND archived_at IS NOT NULL" : " AND archived_at IS NULL";
  const rows = await sql.query(
    statements[input.action] + "revision = revision + 1, updated_at = now() WHERE id = $1 AND revision = $2" + condition + " RETURNING " + projection,
    [input.id, input.revision, ...editParams],
  ) as StockRow[];
  if (rows[0]) return { item: itemFrom(rows[0]), updated: true };
  const current = await sql.query("SELECT " + projection + " FROM shah_stock_items WHERE id = $1", [input.id]) as StockRow[];
  return current[0] ? { item: itemFrom(current[0]), updated: false } : null;
}

export async function applySligroPrices(updates: readonly import("./stockSligro").SligroUpdateRow[]): Promise<StockItem[]> {
  // One statement, conditional per row: never change counts, metadata, links or rows edited since preview.
  const incoming = updates.map(row => ({
    id: row.id, revision: row.revision, url: row.url, pack: row.purchasePrice.packUnits,
    regular: row.purchasePrice.regularCents, offer: row.purchasePrice.offerCents,
    offer_start: row.purchasePrice.offerStart ?? null, offer_end: row.purchasePrice.offerEnd ?? null,
  }));
  const rows = await sql.query(
    `UPDATE shah_stock_items SET purchase_pack_units = incoming.pack,
      purchase_regular_cents = incoming.regular, purchase_offer_cents = incoming.offer,
      purchase_offer_start = incoming.offer_start, purchase_offer_end = incoming.offer_end,
      revision = shah_stock_items.revision + 1, updated_at = now()
    FROM jsonb_to_recordset($1::jsonb) AS incoming(id uuid, revision integer, url text, pack integer,
      regular integer, offer integer, offer_start date, offer_end date)
    WHERE shah_stock_items.id = incoming.id AND shah_stock_items.revision = incoming.revision
      AND shah_stock_items.archived_at IS NULL AND shah_stock_items.sligro_url = incoming.url
      AND COALESCE(shah_stock_items.purchase_pack_units, shah_stock_items.case_size, 1) = incoming.pack
    RETURNING ` + projection.replace(/^id,/, "shah_stock_items.id,").replace(", revision,", ", shah_stock_items.revision,"),
    [JSON.stringify(incoming)],
  ) as StockRow[];
  return rows.map(itemFrom);
}
