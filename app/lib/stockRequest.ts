import type { NextRequest } from "next/server";
import { hasEventAdminAccess } from "./eventAccess";

export const stockPrivateHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", Vary: "Cookie" };
export const stockJson = (body: object, status = 200) => Response.json(body, { status, headers: stockPrivateHeaders });

export function canManageStock(request: NextRequest) {
  return hasEventAdminAccess(request.cookies.get("etg_session")?.value);
}

export function sameOriginJson(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_URL || request.url).origin;
  return request.headers.get("sec-fetch-site") !== "cross-site" &&
    (!origin || origin === expected) &&
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
}

export async function readStockPayload(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > 4096) return undefined;
  const raw = await request.text();
  if (raw.length > 4096) return undefined;
  try { return JSON.parse(raw) as unknown; } catch { return undefined; }
}

export function stockDatabaseCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
}
