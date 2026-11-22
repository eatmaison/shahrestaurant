import type { NextRequest } from "next/server";
import { hasEventAdminAccess } from "./eventAccess";
import { STOCK_PHOTO_MAX_UPLOAD } from "./stockPhotoLimits";

export const stockPhotoHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  Vary: "Cookie",
};
export const stockPhotoJson = (value: object, status = 200) =>
  Response.json(value, { status, headers: stockPhotoHeaders });

export function stockPhotoError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  return stockPhotoJson({ error: code === "42P01" ? "migration_required" : "unavailable" }, 503);
}
export const canManageStockPhotos = (request: NextRequest) =>
  hasEventAdminAccess(request.cookies.get("etg_session")?.value);
export function sameOriginStockPhoto(request: NextRequest) {
  const expected = new URL(process.env.APP_URL || request.url).origin;
  return request.headers.get("origin") === expected && request.headers.get("sec-fetch-site") !== "cross-site";
}

export async function readStockPhotoBody(request: NextRequest): Promise<Buffer | null> {
  if (Number(request.headers.get("content-length")) > STOCK_PHOTO_MAX_UPLOAD) return null;
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > STOCK_PHOTO_MAX_UPLOAD) {
        void reader.cancel().catch(() => undefined);
        return null;
      }
      parts.push(chunk.value);
    }
    return Buffer.concat(parts, size);
  } finally {
    reader.releaseLock();
  }
}
