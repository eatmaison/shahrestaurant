import type { NextRequest } from "next/server";
import { hasEventAdminAccess } from "../../../lib/eventAccess";
import { stockMutation, stockValues } from "../../../lib/stock";
import { addStock, loadStock, updateStock } from "../../../lib/stockStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", Vary: "Cookie" };
const json = (body: object, status = 200) => Response.json(body, { status, headers });

async function canManageStock(request: NextRequest) {
  return hasEventAdminAccess(request.cookies.get("etg_session")?.value);
}

function sameOriginJson(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_URL || request.url).origin;
  return request.headers.get("sec-fetch-site") !== "cross-site" &&
    (!origin || origin === expected) &&
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
}

async function readPayload(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > 4096) return undefined;
  const raw = await request.text();
  if (raw.length > 4096) return undefined;
  try { return JSON.parse(raw) as unknown; } catch { return undefined; }
}

function databaseError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (code === "23505") return json({ error: "duplicate" }, 409);
  if (code === "42P01") return json({ error: "migration_required" }, 503);
  return json({ error: "unavailable" }, 503);
}

export async function GET(request: NextRequest) {
  try {
    if (!await canManageStock(request)) return json({ error: "forbidden" }, 403);
    return json({ items: await loadStock() });
  } catch (error) { return databaseError(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!await canManageStock(request) || !sameOriginJson(request)) return json({ error: "forbidden" }, 403);
    const input = stockValues.safeParse(await readPayload(request));
    if (!input.success) return json({ error: "invalid_input" }, 400);
    return json({ item: await addStock(input.data) }, 201);
  } catch (error) { return databaseError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!await canManageStock(request) || !sameOriginJson(request)) return json({ error: "forbidden" }, 403);
    const input = stockMutation.safeParse(await readPayload(request));
    if (!input.success) return json({ error: "invalid_input" }, 400);
    const result = await updateStock(input.data);
    if (!result) return json({ error: "not_found" }, 404);
    if (!result.updated) return json({ error: "conflict", item: result.item }, 409);
    return json({ item: result.item });
  } catch (error) { return databaseError(error); }
}
