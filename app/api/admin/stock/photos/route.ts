import type { NextRequest } from "next/server";
import { canManageStockPhotos, stockPhotoError, stockPhotoJson } from "../../../../lib/stockPhotoHttp";
import { loadStockPhotoVersions } from "../../../../lib/stockPhotoStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!await canManageStockPhotos(request)) return stockPhotoJson({ error: "forbidden" }, 403);
    return stockPhotoJson({ photos: await loadStockPhotoVersions() });
  } catch (error) {
    return stockPhotoError(error);
  }
}
