import sharp from "sharp";
import { STOCK_PHOTO_EDGE, STOCK_PHOTO_MAX_STORED, STOCK_PHOTO_MAX_UPLOAD } from "./stockPhotoLimits";

const formatForType: Readonly<Record<string, string>> = {
  "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp", "image/avif": "heif",
};

export async function normalizeStockPhoto(bytes: Buffer, type: string): Promise<Buffer | null> {
  if (!bytes.length || bytes.length > STOCK_PHOTO_MAX_UPLOAD ||
      !Object.hasOwn(formatForType, type)) return null;
  try {
    const image = sharp(bytes, { limitInputPixels: 24_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== formatForType[type] || !metadata.width || !metadata.height ||
        metadata.width * metadata.height > 24_000_000 || (metadata.pages ?? 1) > 1 ||
        (type === "image/avif" && metadata.compression !== "av1")) return null;
    const result = await image.autoOrient()
      .resize(STOCK_PHOTO_EDGE, STOCK_PHOTO_EDGE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 }).toBuffer();
    return result.length <= STOCK_PHOTO_MAX_STORED ? result : null;
  } catch {
    return null;
  }
}
