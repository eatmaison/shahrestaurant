import type { NextRequest } from "next/server";
import { loadStockCategories } from "../../../lib/stockCategoryStore";
import { canManageStock, readStockPayload, sameOriginJson, stockDatabaseCode, stockJson as json } from "../../../lib/stockRequest";
import { stockMutation, stockValues } from "../../../lib/stock";
import { addStock, loadStock, updateStock } from "../../../lib/stockStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function databaseError(error: unknown) {
  const code = stockDatabaseCode(error);
  if (code === "23503") return json({ error: "category_not_found" }, 409);
  if (code === "40P01" || code === "40001") return json({ error: "category_concurrent" }, 409);
  if (code === "23505") return json({ error: "duplicate" }, 409);
  if (code === "42P01") return json({ error: "migration_required" }, 503);
  return json({ error: "unavailable" }, 503);
}

export async function GET(request: NextRequest) {
  try {
    if (!await canManageStock(request)) return json({ error: "forbidden" }, 403);
    const [items, categories] = await Promise.all([loadStock(), loadStockCategories()]);
    return json({ items, categories });
  } catch (error) { return databaseError(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!await canManageStock(request) || !sameOriginJson(request)) return json({ error: "forbidden" }, 403);
    const input = stockValues.safeParse(await readStockPayload(request));
    if (!input.success) return json({ error: "invalid_input" }, 400);
    return json({ item: await addStock(input.data) }, 201);
  } catch (error) { return databaseError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!await canManageStock(request) || !sameOriginJson(request)) return json({ error: "forbidden" }, 403);
    const input = stockMutation.safeParse(await readStockPayload(request));
    if (!input.success) return json({ error: "invalid_input" }, 400);
    const result = await updateStock(input.data);
    if (!result) return json({ error: "not_found" }, 404);
    if (!result.updated) return json({ error: "conflict", item: result.item }, 409);
    return json({ item: result.item });
  } catch (error) { return databaseError(error); }
}
