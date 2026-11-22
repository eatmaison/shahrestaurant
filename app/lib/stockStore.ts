import { sql } from "./db";
import type { StockItem, StockMutation, StockValues } from "./stock";

type StockRow = {
  id: string; name: string; category: StockItem["category"]; cases_count: number;
  case_size: number | null; loose_count: number; total_units: number;
  revision: number; archived: boolean;
};

const projection = "id, name, category, cases_count, case_size, loose_count, total_units, revision, (archived_at IS NOT NULL) AS archived";

const itemFrom = (row: StockRow): StockItem => ({
  id: row.id, name: row.name, category: row.category, cases: row.cases_count,
  caseSize: row.case_size, loose: row.loose_count, totalUnits: row.total_units,
  revision: row.revision, archived: row.archived,
});

const fields = (values: StockValues) => [values.name, values.category, values.cases, values.caseSize, values.loose];

export async function loadStock(): Promise<StockItem[]> {
  const rows = await sql.query("SELECT " + projection + " FROM shah_stock_items ORDER BY total_units, lower(name), id") as StockRow[];
  return rows.map(itemFrom);
}

export async function addStock(values: StockValues): Promise<StockItem> {
  const rows = await sql.query(
    "INSERT INTO shah_stock_items (name, category, cases_count, case_size, loose_count) VALUES ($1, $2, $3, $4, $5) RETURNING " + projection,
    fields(values),
  ) as StockRow[];
  return itemFrom(rows[0]);
}

export async function updateStock(input: StockMutation): Promise<{ item: StockItem; updated: boolean } | null> {
  // The revision check prevents one admin from silently overwriting another's count.
  const statements = {
    edit: "UPDATE shah_stock_items SET name = $3, category = $4, cases_count = $5, case_size = $6, loose_count = $7, ",
    archive: "UPDATE shah_stock_items SET archived_at = now(), ",
    restore: "UPDATE shah_stock_items SET archived_at = NULL, ",
  };
  const condition = input.action === "restore" ? " AND archived_at IS NOT NULL" : " AND archived_at IS NULL";
  const rows = await sql.query(
    statements[input.action] + "revision = revision + 1, updated_at = now() WHERE id = $1 AND revision = $2" + condition + " RETURNING " + projection,
    input.action === "edit" ? [input.id, input.revision, ...fields(input.values)] : [input.id, input.revision],
  ) as StockRow[];
  if (rows[0]) return { item: itemFrom(rows[0]), updated: true };
  const current = await sql.query("SELECT " + projection + " FROM shah_stock_items WHERE id = $1", [input.id]) as StockRow[];
  return current[0] ? { item: itemFrom(current[0]), updated: false } : null;
}
