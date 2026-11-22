import type { NextRequest } from "next/server";
import { stockCategoryCreate, stockCategoryRemove } from "../../../../lib/stock";
import { addStockCategory, removeStockCategory } from "../../../../lib/stockCategoryStore";
import { canManageStock, readStockPayload, sameOriginJson, stockDatabaseCode, stockJson } from "../../../../lib/stockRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function databaseError(error: unknown, action: "add" | "remove") {
  const code = stockDatabaseCode(error);
  if (code === "23505") return stockJson({ error: action === "add" ? "category_duplicate" : "category_product_duplicate" }, 409);
  if (code === "23503") return stockJson({ error: "category_in_use" }, 409);
  if (code === "40P01" || code === "40001") return stockJson({ error: "category_concurrent" }, 409);
  if (code === "42P01" || code === "42883") return stockJson({ error: "migration_required" }, 503);
  return stockJson({ error: "unavailable" }, 503);
}

export async function POST(request: NextRequest) {
  try {
    if (!await canManageStock(request) || !sameOriginJson(request)) return stockJson({ error: "forbidden" }, 403);
    const input = stockCategoryCreate.safeParse(await readStockPayload(request));
    if (!input.success) return stockJson({ error: "invalid_input" }, 400);
    return stockJson({ category: await addStockCategory(input.data.name) }, 201);
  } catch (error) { return databaseError(error, "add"); }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!await canManageStock(request) || !sameOriginJson(request)) return stockJson({ error: "forbidden" }, 403);
    const input = stockCategoryRemove.safeParse(await readStockPayload(request));
    if (!input.success) return stockJson({ error: "invalid_input" }, 400);
    const result = await removeStockCategory(input.data.id, input.data.replacement);
    if (result === "removed") return stockJson({ removed: true });
    if (result === "category_in_use") return stockJson({ error: result }, 409);
    if (result === "category_not_found" || result === "replacement_not_found") return stockJson({ error: result }, 404);
    return stockJson({ error: "invalid_input" }, 400);
  } catch (error) { return databaseError(error, "remove"); }
}
