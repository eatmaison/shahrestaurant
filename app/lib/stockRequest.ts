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

export async function readStockPayload(request: Request, maxBytes = 4096): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes) return undefined;
  const reader = request.body?.getReader();
  if (!reader) return undefined;
  const decoder = new TextDecoder();
  let bytes = 0;
  let raw = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); return undefined; }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(raw) as unknown; } catch { return undefined; }
}

export function stockDatabaseCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
}
