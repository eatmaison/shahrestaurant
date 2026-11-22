import { sql } from "./db";
import type { StockCategoryOption } from "./stock";

export async function loadStockCategories(): Promise<StockCategoryOption[]> {
  return await sql.query("SELECT id, name FROM shah_stock_categories ORDER BY lower(name), id") as StockCategoryOption[];
}

export async function addStockCategory(name: string): Promise<StockCategoryOption> {
  const rows = await sql.query("INSERT INTO shah_stock_categories (name) VALUES ($1) RETURNING id, name", [name]) as StockCategoryOption[];
  return rows[0];
}

export async function removeStockCategory(id: string, replacement: string | null) {
  const rows = await sql.query("SELECT shah_remove_stock_category($1, $2) AS result", [id, replacement]) as Array<{ result: string }>;
  return rows[0].result;
}
