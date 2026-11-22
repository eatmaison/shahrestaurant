import { STOCK_PHOTO_ACCEPTED, STOCK_PHOTO_MAX_UPLOAD } from "../../lib/stockPhotoLimits";

const uploadTypes: readonly string[] = STOCK_PHOTO_ACCEPTED;
export const stockPhotoAccept = [...uploadTypes, ".heic", ".heif", "image/heic", "image/heif"].join(",");
export const stockPhotoMaxOriginal = 20 * 1024 * 1024;

export async function prepareStockPhoto(file: File): Promise<Blob> {
  if (file.size > stockPhotoMaxOriginal) throw new Error("too_large");
  if (!file.size) throw new Error("invalid_image");
  const type = file.type.toLowerCase();
  const mayConvert = uploadTypes.includes(type) ||
    ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"].includes(type) ||
    (!type && /\.(?:jpe?g|png|webp|avif|heic|heif)$/i.test(file.name));
  if (!mayConvert) throw new Error("invalid_image");
  if (file.size <= STOCK_PHOTO_MAX_UPLOAD && uploadTypes.includes(type)) return file;

  // Downscale phone photos locally so uploads remain below the default proxy limit.
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height || width * height > 64_000_000) throw new Error("invalid_image");
    const scale = Math.min(1, 512 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("invalid_image");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob || blob.size > STOCK_PHOTO_MAX_UPLOAD) throw new Error("invalid_image");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
