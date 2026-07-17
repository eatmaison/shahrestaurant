import { randomUUID } from "node:crypto";
import type { S3Client } from "@aws-sdk/client-s3";

/**
 * DigitalOcean Spaces (S3-compatible) object storage shared by ALL sister
 * sites (Eat to go / The Maison / The Tandoor Company). Admin-uploaded images
 * (product photos, brand logos, gallery photos) are stored here once as real
 * files instead of base64 blobs in the shared database.
 *
 * Required environment variables (use the SAME values on every site):
 *   SPACES_REGION   Spaces region slug, e.g. "ams3"
 *   SPACES_BUCKET   Space (bucket) name, e.g. "horica-media"
 *   SPACES_KEY      Spaces access key id
 *   SPACES_SECRET   Spaces secret access key
 * Optional:
 *   SPACES_CDN_URL  CDN endpoint, e.g. "https://horica-media.ams3.cdn.digitaloceanspaces.com"
 *
 * When these variables are missing the site keeps working exactly as before
 * (images are stored as data URLs in the database), so local development
 * never breaks.
 */

const REGION = process.env.SPACES_REGION?.trim() ?? "";
const BUCKET = process.env.SPACES_BUCKET?.trim() ?? "";
const KEY = process.env.SPACES_KEY?.trim() ?? "";
const SECRET = process.env.SPACES_SECRET?.trim() ?? "";
const CDN_URL = (process.env.SPACES_CDN_URL?.trim() ?? "").replace(/\/+$/, "");

/** Direct (non-CDN) public origin of the bucket. */
const ORIGIN_URL = REGION && BUCKET ? `https://${BUCKET}.${REGION}.digitaloceanspaces.com` : "";

/** True when all required Spaces credentials are configured. */
export function spacesEnabled(): boolean {
  return Boolean(REGION && BUCKET && KEY && SECRET);
}

// The AWS SDK is imported lazily (only when an image is actually uploaded or
// deleted) so that merely loading this module - which happens on EVERY API
// route via serverStore, including /api/auth and /api/bootstrap - can never
// crash when @aws-sdk/client-s3 is missing or broken on the server.
let clientPromise: Promise<S3Client> | null = null;
function getClient(): Promise<S3Client> {
  if (!clientPromise) {
    clientPromise = import("@aws-sdk/client-s3").then(
      ({ S3Client }) =>
        new S3Client({
          region: REGION,
          endpoint: `https://${REGION}.digitaloceanspaces.com`,
          forcePathStyle: false,
          credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
        })
    );
    clientPromise.catch(() => {
      clientPromise = null; // allow a retry on the next call
    });
  }
  return clientPromise;
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Public URL of a stored object (prefers the CDN endpoint when configured). */
function publicUrl(key: string): string {
  return `${CDN_URL || ORIGIN_URL}/${key}`;
}

/** True when a stored image URL points into our Space (so it is safe to delete). */
function isSpacesUrl(url: string): boolean {
  return Boolean(
    (ORIGIN_URL && url.startsWith(`${ORIGIN_URL}/`)) || (CDN_URL && url.startsWith(`${CDN_URL}/`))
  );
}

/** Upload a base64 image data URL and return the public URL of the new object. */
export async function uploadDataUrl(dataUrl: string, folder: string): Promise<string> {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL");
  const mime = match[1].toLowerCase();
  const body = Buffer.from(match[2], "base64");
  const key = `${folder}/${randomUUID()}.${MIME_EXT[mime] ?? "bin"}`;
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await (await getClient()).send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: mime,
      ACL: "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return publicUrl(key);
}

/**
 * If `image` is a data URL and Spaces is configured, upload it and return the
 * public URL. Anything else (existing URLs, /public paths, empty values) is
 * returned unchanged, and an upload failure falls back to the original value
 * so saving a product/photo never breaks.
 */
export async function storeImage(
  image: string | undefined | null,
  folder: string
): Promise<string | undefined | null> {
  if (!image || !image.startsWith("data:") || !spacesEnabled()) return image;
  try {
    return await uploadDataUrl(image, folder);
  } catch (err) {
    console.error("[spaces] upload failed:", err);
    return image;
  }
}

/** Delete a previously uploaded object by its public URL (no-op for any other URL). */
export async function deleteStoredImage(url: string | undefined | null): Promise<void> {
  if (!url || !spacesEnabled() || !isSpacesUrl(url)) return;
  try {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const key = decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ""));
    await (await getClient()).send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    // Never fail the caller because of storage cleanup.
    console.error("[spaces] delete failed:", err);
  }
}
