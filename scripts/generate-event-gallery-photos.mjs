/* node scripts/generate-event-gallery-photos.mjs
 * Delivery derivatives only; original JPEGs, videos and logos are never rewritten.
 * Bump VERSION before changing pinned encoder options after acceptance.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const PINNED = { sharp: "0.34.5", vips: "8.17.3" };
const VERSION = "event-gallery-v1";
const OUTPUT = path.join("public", "brand", VERSION);
const MANIFEST = "app/lib/eventGalleryPhotos.ts";
const EVIDENCE = "docs/event-gallery-assets-v1.json";
const CSV = "docs/event-gallery-assets-v1.csv";
const WIDTHS = [320, 640, 960, 1280];
const BUDGET = 200000;
const QUALITIES = { avif: [68, 64, 60, 56, 52, 48], webp: [88, 84, 80, 76, 72, 68, 64] };
const OPTIONS = {
  resize: { withoutEnlargement: true, kernel: "lanczos3" },
  avif: { effort: 6, chromaSubsampling: "4:2:0", bitdepth: 8 },
  webp: { effort: 6, smartSubsample: true },
  lqip: { width: 20, sigma: 0.6, quality: 28, effort: 6 },
};
const SOURCES = {
  "/photos/687A0210.jpeg": "09b371e2044d80aa9f9e26ca5f13b110173436b065d7c180a80c96bdb18e775f",
  "/photos/687A0211.jpeg": "b4ebc33ad018bfe44c1a8f2e6ad94c7f1a0547dcdba5f2300072719d665a0ceb",
  "/photos/687A0216.jpeg": "71476b22ce3191ef58734eb7d1cf4559175b2d0268a0d34d04d599f1f4f257b1",
  "/photos/687A0321.jpeg": "e6aaf9f7ab13c33a832cafb36aca1ecf3249180906c248fa35e9550b4499dd69",
  "/photos/687A0090.jpeg": "f366528546ed464ca0ddc47ab1385ba9b7275ef87a7f847ec7a67372c906019d",
  "/photos/687A0336.jpeg": "f1fe8dba5da900050a223a0bc4f51edf13cfde300eb82de0302d18de7ef95306",
  "/photos/687A0343.jpeg": "799a7f46f906e07471da4c5545f387fea8d88d0c69ee24d1ffaa3de5351a1bab",
};
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const stripped = metadata => !metadata.exif && !metadata.xmp && !metadata.iptc && !metadata.icc && !metadata.hasProfile && !metadata.orientation;
const csvCell = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';

async function main() {
  for (const [name, version] of Object.entries(PINNED)) {
    if (sharp.versions[name] !== version) throw new Error("Expected " + name + " " + version);
  }
  sharp.concurrency(2);
  sharp.cache({ memory: 64, files: 8, items: 64 });
  let prior;
  try { prior = JSON.parse(await fs.readFile(EVIDENCE, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (prior && (prior.version !== VERSION || JSON.stringify(prior.options) !== JSON.stringify(OPTIONS) || JSON.stringify(prior.qualityChoices) !== JSON.stringify(QUALITIES) || prior.encoderVersions.sharp !== PINNED.sharp || prior.encoderVersions.vips !== PINNED.vips)) throw new Error("Encoder/options changed; bump delivery VERSION before regenerating");
  await fs.mkdir(OUTPUT, { recursive: true });
  const manifest = {}, photos = [], rows = [];
  for (const [source, expectedHash] of Object.entries(SOURCES)) {
    const local = "public" + source, original = await fs.readFile(local), originalSha256 = hash(original);
    if (originalSha256 !== expectedHash) throw new Error("Original changed; stop before generating " + source);
    const metadata = await sharp(original).metadata();
    if (!metadata.width || !metadata.height) throw new Error("Missing original dimensions");
    const swapped = [5, 6, 7, 8].includes(metadata.orientation);
    const orientedWidth = swapped ? metadata.height : metadata.width;
    const orientedHeight = swapped ? metadata.width : metadata.height;
    const widths = WIDTHS.filter(width => width <= orientedWidth);
    if (widths.length !== 4) throw new Error("Expected all requested widths without upscaling");
    const entry = { width: 0, height: 0, src: "", avifSrcSet: "", webpSrcSet: "", blurDataURL: "", avif: [], webp: [] };
    const outputs = [], stem = "shah-gallery-" + path.basename(source, ".jpeg").toLowerCase();
    const old = prior?.photos.find(photo => photo.source === source);
    if (old && old.originalSha256 !== originalSha256) throw new Error("Original differs from accepted evidence");
    rows.push({ kind: "original-preserved", original: source, path: source, format: "jpeg", width: orientedWidth, height: orientedHeight, originalOrientation: metadata.orientation ?? 1, bytes: original.length, quality: "", originalSha256, sha256: originalSha256, metadataStripped: false, withinBudget: "", upscaled: false });
    for (const width of widths) {
      for (const format of ["avif", "webp"]) {
        const src = "/brand/" + VERSION + "/" + stem + "-" + width + "." + format;
        const cached = old?.outputs.find(output => output.src === src);
        let chosen;
        if (cached) {
          try {
            const bytes = await fs.readFile("public" + src), cm = await sharp(bytes).metadata();
            if (hash(bytes) !== cached.sha256 || bytes.length !== cached.bytes || bytes.length >= BUDGET || cm.width !== width || cm.height > orientedHeight || cm.width > orientedWidth || !stripped(cm)) throw new Error("Cached delivery differs; review before regeneration");
            chosen = { ...cached }; outputs.push(chosen); entry[format].push(chosen);
          } catch (error) { if (error.code !== "ENOENT") throw error; }
        }
        if (!chosen) {
          for (const quality of QUALITIES[format]) {
            const image = sharp(original).rotate().resize({ ...OPTIONS.resize, width }).toColourspace("srgb");
            const bytes = await image[format]({ ...OPTIONS[format], quality }).toBuffer();
            if (bytes.length >= BUDGET) continue;
            const encoded = await sharp(bytes).metadata(), expectedHeight = Math.round(orientedHeight * width / orientedWidth);
            if (encoded.width !== width || encoded.height !== expectedHeight || encoded.width > orientedWidth || encoded.height > orientedHeight || !stripped(encoded)) throw new Error("Invalid oriented delivery or retained metadata");
            chosen = { src, width: encoded.width, height: encoded.height, bytes: bytes.length, format, quality, sha256: hash(bytes), metadataStripped: true, autoOriented: true, withinBudget: true, upscaled: false };
            try { const existing = await fs.readFile("public" + src); if (hash(existing) !== chosen.sha256) throw new Error("Existing derivative differs; bump VERSION"); }
            catch (error) { if (error.code !== "ENOENT") throw error; await fs.writeFile("public" + src, bytes, { flag: "wx" }); }
            outputs.push(chosen); entry[format].push(chosen); break;
          }
        }
        if (!chosen) throw new Error("No quality candidate meets budget for " + src);
        rows.push({ kind: "delivery", original: source, path: src, format, width: chosen.width, height: chosen.height, originalOrientation: metadata.orientation ?? 1, bytes: chosen.bytes, quality: chosen.quality, originalSha256, sha256: chosen.sha256, metadataStripped: true, withinBudget: true, upscaled: false });
      }
    }
    const blur = await sharp(original).rotate().resize({ width: OPTIONS.lqip.width, withoutEnlargement: true, kernel: "lanczos3" }).toColourspace("srgb").blur(OPTIONS.lqip.sigma).webp({ quality: OPTIONS.lqip.quality, effort: OPTIONS.lqip.effort }).toBuffer();
    const blurMeta = await sharp(blur).metadata();
    if (!stripped(blurMeta) || blur.length > 500) throw new Error("Invalid tiny LQIP");
    entry.blurDataURL = "data:image/webp;base64," + blur.toString("base64");
    entry.src = entry.webp.at(-1).src;
    entry.width = entry.webp.at(-1).width;
    entry.height = entry.webp.at(-1).height;
    entry.avifSrcSet = entry.avif.map(output => output.src + " " + output.width + "w").join(", ");
    entry.webpSrcSet = entry.webp.map(output => output.src + " " + output.width + "w").join(", ");
    if (hash(await fs.readFile(local)) !== originalSha256) throw new Error("Original modified during generation");
    manifest[source] = entry;
    photos.push({ source, originalBytes: original.length, originalWidth: metadata.width, originalHeight: metadata.height, originalOrientation: metadata.orientation ?? 1, orientedWidth, orientedHeight, originalSha256, originalMetadata: { exif: !!metadata.exif, xmp: !!metadata.xmp, iptc: !!metadata.iptc, icc: !!metadata.icc }, widths, outputs, blur: { width: blurMeta.width, height: blurMeta.height, bytes: blur.length, sha256: hash(blur), metadataStripped: true }, originalUnchanged: true });
    console.log(JSON.stringify({ source, outputs: outputs.length, maxAvifBytes: Math.max(...entry.avif.map(output => output.bytes)), maxWebpBytes: Math.max(...entry.webp.map(output => output.bytes)), qualities: outputs.map(output => [output.format, output.width, output.quality]), blurBytes: blur.length }));
  }
  const types = [
    "// Generated by scripts/generate-event-gallery-photos.mjs. Original JPEGs remain untouched.",
    "export type EventGalleryPhotoSource = Readonly<{ src: string; width: number; height: number; bytes: number; format: string; quality: number; sha256: string; metadataStripped: boolean; autoOriented: boolean; withinBudget: boolean; upscaled: boolean }>;",
    "export type EventGalleryPhoto = Readonly<{ width: number; height: number; src: string; avifSrcSet: string; webpSrcSet: string; blurDataURL: string; avif: readonly EventGalleryPhotoSource[]; webp: readonly EventGalleryPhotoSource[] }>;",
    "export const eventGalleryPhotos: Readonly<Record<string, EventGalleryPhoto>> = " + JSON.stringify(manifest, null, 2) + ";",
    "export function getEventGalleryPhoto(src: string): EventGalleryPhoto | undefined { return Object.prototype.hasOwnProperty.call(eventGalleryPhotos, src) ? eventGalleryPhotos[src] : undefined; }",
    "",
  ].join("\n");
  await fs.writeFile(MANIFEST, types);
  const evidence = { version: VERSION, generatedAt: new Date().toISOString(), encoderVersions: sharp.versions, budgetBytesExclusive: BUDGET, maximumWidth: 1280, options: OPTIONS, qualityChoices: QUALITIES, photos, validation: { outputs: photos.flatMap(photo => photo.outputs).length, originalCount: photos.length, originalUnchangedCount: photos.filter(photo => photo.originalUnchanged).length, autoOrientationRequiredCount: photos.filter(photo => photo.originalOrientation !== 1).length, everyOutputUnderBudget: photos.every(photo => photo.outputs.every(output => output.bytes < BUDGET)), manifestSha256: hash(types) }, visualReview: prior?.validation?.manifestSha256 === hash(types) && prior?.visualReview?.status === "completed-with-scope-limits" ? prior.visualReview : { status: "pending", limit: "Contact sheets and native crops must be manually inspected before acceptance." } };
  await fs.writeFile(EVIDENCE, JSON.stringify(evidence, null, 2) + "\n");
  const fields = Object.keys(rows[0]);
  await fs.writeFile(CSV, [fields.map(csvCell).join(","), ...rows.map(row => fields.map(field => csvCell(row[field])).join(","))].join("\n") + "\n");
  console.log(JSON.stringify({ complete: true, version: VERSION, ...evidence.validation }));
}
await main();
