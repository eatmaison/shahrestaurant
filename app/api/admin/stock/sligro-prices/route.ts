import type { NextRequest } from "next/server";
import { sligroApply } from "../../../../lib/stockSligro";
import { applySligroPrices } from "../../../../lib/stockStore";
import { canManageStock, readStockPayload, sameOriginJson, stockDatabaseCode, stockJson } from "../../../../lib/stockRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!await canManageStock(request) || !sameOriginJson(request) || !request.headers.has("origin")) {
      return stockJson({ error: "forbidden" }, 403);
    }
    const parsed = sligroApply.safeParse(await readStockPayload(request, 40_960));
    if (!parsed.success) return stockJson({ error: "invalid_input" }, 400);
    const items = await applySligroPrices(parsed.data.updates);
    const saved = new Set(items.map(item => item.id));
    return stockJson({ items, skipped: parsed.data.updates.filter(row => !saved.has(row.id)).map(row => row.id) });
  } catch (error) {
    const code = stockDatabaseCode(error);
    return stockJson({ error: code === "42703" || code === "42P01" ? "migration_required" : "unavailable" }, 503);
  }
}
