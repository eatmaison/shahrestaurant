import type { NextRequest } from "next/server";
import { z } from "zod";
import { canManageStockPhotos, readStockPhotoBody, sameOriginStockPhoto, stockPhotoError,
  stockPhotoHeaders, stockPhotoJson } from "../../../../../lib/stockPhotoHttp";
import { normalizeStockPhoto } from "../../../../../lib/stockPhotoImage";
import { STOCK_PHOTO_ACCEPTED } from "../../../../../lib/stockPhotoLimits";
import { loadStockPhoto, removeStockPhoto, saveStockPhoto } from "../../../../../lib/stockPhotoStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const uuid = z.uuid();

export async function GET(request: NextRequest, { params }: Context) {
  try {
    if (!await canManageStockPhotos(request)) return stockPhotoJson({ error: "forbidden" }, 403);
    const { id } = await params;
    const version = request.nextUrl.searchParams.get("v");
    if (!uuid.safeParse(id).success || !uuid.safeParse(version).success || !version) {
      return stockPhotoJson({ error: "not_found" }, 404);
    }
    const image = await loadStockPhoto(id, version);
    if (!image) return stockPhotoJson({ error: "not_found" }, 404);
    return new Response(new Uint8Array(image), {
      headers: { ...stockPhotoHeaders, "Content-Type": "image/webp", "Content-Length": String(image.byteLength) },
    });
  } catch (error) {
    return stockPhotoError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    if (!sameOriginStockPhoto(request) || !await canManageStockPhotos(request)) {
      return stockPhotoJson({ error: "forbidden" }, 403);
    }
    const { id } = await params;
    if (!uuid.safeParse(id).success) return stockPhotoJson({ error: "not_found" }, 404);
    const type = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!(STOCK_PHOTO_ACCEPTED as readonly string[]).includes(type)) {
      return stockPhotoJson({ error: "invalid_image" }, 415);
    }
    const bytes = await readStockPhotoBody(request);
    if (!bytes) return stockPhotoJson({ error: "too_large" }, 413);
    const image = await normalizeStockPhoto(bytes, type);
    if (!image) return stockPhotoJson({ error: "invalid_image" }, 422);
    const version = await saveStockPhoto(id, image);
    return version ? stockPhotoJson({ version }) : stockPhotoJson({ error: "not_found" }, 404);
  } catch (error) {
    return stockPhotoError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    if (!sameOriginStockPhoto(request) || !await canManageStockPhotos(request)) {
      return stockPhotoJson({ error: "forbidden" }, 403);
    }
    const { id } = await params;
    if (!uuid.safeParse(id).success) return stockPhotoJson({ error: "not_found" }, 404);
    await removeStockPhoto(id);
    return stockPhotoJson({ removed: true });
  } catch (error) {
    return stockPhotoError(error);
  }
}
