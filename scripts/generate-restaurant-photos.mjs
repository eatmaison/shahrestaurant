/* Reproduce with: node scripts/generate-restaurant-photos.mjs
 * Derived delivery assets only. Never rewrites original photos, videos or logos.
 * Encoder/options are pinned; bump the output version before changing them.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const PINNED = { sharp: "0.34.5", vips: "8.17.3" };
const VERSION = "restaurant-photos-v1";
const OUTPUT = path.join("public", "brand", VERSION);
const MANIFEST = "app/lib/restaurantPhotos.ts";
const EVIDENCE = "docs/restaurant-photo-assets-v1.json";
const CSV = "docs/restaurant-photo-assets-v1.csv";
const WIDTHS = [160, 320, 640, 960, 1440, 1600];
const BUDGET = 200000;
const QUALITIES = { webp: [88, 84, 80, 76, 72, 68, 64], avif: [68, 64, 60, 56, 52, 48] };
// Keep the detailed bar photo at its budgeted full-size WebP quality at every width.
const PHOTO_QUALITIES = { bar: { webp: [76, 72, 68, 64] } };
const OPTIONS = {
  resize: { withoutEnlargement: true, kernel: "lanczos3" },
  webp: { effort: 6, smartSubsample: true },
  avif: { effort: 6, chromaSubsampling: "4:2:0", bitdepth: 8 },
  lqip: { width: 20, sigma: 0.6, quality: 30, effort: 6 }
};
const NAMES = ["bar", "room", "atmosphere"];
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const csvCell = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';

async function main() {
  for (const [name, version] of Object.entries(PINNED)) {
    if (sharp.versions[name] !== version) throw new Error("Expected " + name + " " + version + "; got " + sharp.versions[name]);
  }
  sharp.concurrency(2);
  sharp.cache({ memory: 64, files: 8, items: 64 });
  let prior = null;
  try { prior = JSON.parse(await fs.readFile(EVIDENCE, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const compatibleCache = prior?.version === VERSION && prior.encoderVersions?.sharp === PINNED.sharp && prior.encoderVersions?.vips === PINNED.vips && JSON.stringify(prior.options) === JSON.stringify(OPTIONS) && JSON.stringify(prior.qualityChoices) === JSON.stringify(QUALITIES) && JSON.stringify(prior.perPhotoQualityChoices) === JSON.stringify(PHOTO_QUALITIES);
  await fs.mkdir(OUTPUT, { recursive: true });
  const manifest = {}, photos = [], rows = [];
  for (const name of NAMES) {
    const source = "/brand/shah-" + name + "-v1.webp";
    const local = "public" + source;
    const original = await fs.readFile(local);
    const originalSha256 = hash(original);
    const old = prior?.photos.find(item => item.source === source);
    if (old && old.originalSha256 !== originalSha256) throw new Error("Original changed; bump delivery version before regenerating " + source);
    const metadata = await sharp(original).metadata();
    if (!metadata.width || !metadata.height) throw new Error("Missing original dimensions");
    const widths = [...new Set([...WIDTHS.filter(width => width <= metadata.width), metadata.width])].sort((a, b) => a - b);
    const entry = { width: metadata.width, height: metadata.height, src: "", avifSrcSet: "", webpSrcSet: "", blurDataURL: "", avif: [], webp: [] };
    const outputs = [];
    rows.push({ kind: "original-preserved", original: source, path: source, format: "webp", width: metadata.width, height: metadata.height, bytes: original.length, quality: "", originalSha256, sha256: originalSha256, metadataStripped: !metadata.exif && !metadata.xmp && !metadata.iptc && !metadata.icc, withinBudget: original.length < BUDGET, upscaled: false });
    for (const width of widths) {
      for (const format of ["avif", "webp"]) {
        const expectedSrc = "/brand/" + VERSION + "/shah-" + name + "-" + width + "." + format;
        const cached = compatibleCache ? old?.outputs.find(item => item.width === width && item.format === format && item.src === expectedSrc) : null;
        let cachedBytes;
        if (cached) {
          try { cachedBytes = await fs.readFile("public" + expectedSrc); } catch (error) { if (error.code !== "ENOENT") throw error; }
        }
        if (cachedBytes) {
          const cm = await sharp(cachedBytes).metadata();
          if (hash(cachedBytes) !== cached.sha256 || cachedBytes.length !== cached.bytes || cachedBytes.length >= BUDGET || cm.width !== width || cm.width > metadata.width || cm.height > metadata.height || cm.exif || cm.xmp || cm.iptc || cm.icc || cm.hasProfile) throw new Error("Cached delivery differs; review before regenerating " + expectedSrc);
          const item = { src: expectedSrc, width: cm.width, height: cm.height, bytes: cachedBytes.length };
          entry[format].push(item); outputs.push(cached);
          rows.push({ kind: "delivery", original: source, path: expectedSrc, format, width: cm.width, height: cm.height, bytes: cachedBytes.length, quality: cached.quality, reusedOriginal: cached.reusedOriginal, originalSha256, sha256: cached.sha256, metadataStripped: true, withinBudget: true, upscaled: false });
          continue;
        }
        let chosen;
        for (const quality of (PHOTO_QUALITIES[name]?.[format] ?? QUALITIES[format])) {
          const image = sharp(original).resize({ ...OPTIONS.resize, width }).toColourspace("srgb");
          let bytes = await image[format]({ ...OPTIONS[format], quality }).toBuffer();
          const reusedOriginal = format === "webp" && width === metadata.width && original.length < BUDGET && original.length < bytes.length && !metadata.exif && !metadata.xmp && !metadata.iptc && !metadata.icc;
          if (reusedOriginal) bytes = original;
          const encodedQuality = reusedOriginal ? null : quality;
          if (bytes.length >= BUDGET) continue;
          const outputMeta = await sharp(bytes).metadata();
          if (outputMeta.width !== width || outputMeta.width > metadata.width || outputMeta.height > metadata.height) throw new Error("Invalid/upscaled dimensions");
          if (outputMeta.exif || outputMeta.xmp || outputMeta.iptc || outputMeta.icc || outputMeta.hasProfile) throw new Error("Metadata not stripped");
          const file = "shah-" + name + "-" + width + "." + format;
          const src = "/brand/" + VERSION + "/" + file;
          await fs.writeFile(path.join(OUTPUT, file), bytes);
          chosen = { src, width: outputMeta.width, height: outputMeta.height, bytes: bytes.length };
          const evidence = { ...chosen, format, quality: encodedQuality, reusedOriginal, sha256: hash(bytes), metadataStripped: true, withinBudget: true, upscaled: false };
          outputs.push(evidence); entry[format].push(chosen);
          rows.push({ kind: "delivery", original: source, path: src, format, width: outputMeta.width, height: outputMeta.height, bytes: bytes.length, quality: encodedQuality, reusedOriginal, originalSha256, sha256: evidence.sha256, metadataStripped: true, withinBudget: true, upscaled: false });
          break;
        }
        if (!chosen) throw new Error("No acceptable quality meets budget: " + source + " " + width + " " + format);
      }
    }
    const blur = await sharp(original).resize({ width: OPTIONS.lqip.width, withoutEnlargement: true, kernel: "lanczos3" }).blur(OPTIONS.lqip.sigma).webp({ quality: OPTIONS.lqip.quality, effort: OPTIONS.lqip.effort }).toBuffer();
    const blurMeta = await sharp(blur).metadata();
    if (blurMeta.exif || blurMeta.xmp || blurMeta.iptc || blurMeta.icc) throw new Error("LQIP metadata not stripped");
    entry.blurDataURL = "data:image/webp;base64," + blur.toString("base64");
    entry.src = entry.webp.at(-1).src;
    entry.avifSrcSet = entry.avif.map(item => item.src + " " + item.width + "w").join(", ");
    entry.webpSrcSet = entry.webp.map(item => item.src + " " + item.width + "w").join(", ");
    if (hash(await fs.readFile(local)) !== originalSha256) throw new Error("Original modified during generation");
    manifest[source] = entry;
    photos.push({ source, originalWidth: metadata.width, originalHeight: metadata.height, originalBytes: original.length, originalSha256, originalMetadata: { exif: !!metadata.exif, xmp: !!metadata.xmp, iptc: !!metadata.iptc, icc: !!metadata.icc }, widths, outputs, blur: { width: blurMeta.width, height: blurMeta.height, bytes: blur.length }, originalUnchanged: true });
    console.log(JSON.stringify({ source, widths, outputs: outputs.length, largestAvif: entry.avif.at(-1).bytes, largestWebp: entry.webp.at(-1).bytes, blurBytes: blur.length }));
  }
  const type = [
    "// Generated by scripts/generate-restaurant-photos.mjs. Originals remain untouched.",
    "export type RestaurantPhotoSource = Readonly<{ src: string; width: number; height: number; bytes: number }>;",
    "export type RestaurantPhoto = Readonly<{",
    "  width: number; height: number; src: string; avifSrcSet: string; webpSrcSet: string; blurDataURL: string;",
    "  avif: readonly RestaurantPhotoSource[]; webp: readonly RestaurantPhotoSource[];",
    "}>;",
    "",
    "export const restaurantPhotos: Readonly<Record<string, RestaurantPhoto>> = " + JSON.stringify(manifest, null, 2) + ";",
    "",
    "export function getRestaurantPhoto(originalSrc: string): RestaurantPhoto | undefined {",
    "  return restaurantPhotos[originalSrc];",
    "}",
    ""
  ].join("\n");
  await fs.writeFile(MANIFEST, type);
  const header = ["kind", "original", "path", "format", "width", "height", "bytes", "quality", "reusedOriginal", "originalSha256", "sha256", "metadataStripped", "withinBudget", "upscaled"];
  await fs.writeFile(CSV, header.map(csvCell).join(",") + "\n" + rows.map(row => header.map(key => csvCell(row[key])).join(",")).join("\n") + "\n");
  const evidence = {
    version: VERSION, generatedAt: new Date().toISOString(), encoderVersions: sharp.versions, options: OPTIONS, qualityChoices: QUALITIES, perPhotoQualityChoices: PHOTO_QUALITIES,
    widthCandidates: WIDTHS, budgetBytesExclusive: BUDGET, neverUpscale: true, metadataPolicy: "Sharp defaults strip EXIF, XMP, IPTC and ICC; verified on every output. sRGB pixels retained.",
    visualQA: "Manual view_image review required after generation; metrics do not imply lossless photo encoding.",
    excludedInactivePhoto: { source: "/photos/plant-wall.webp", reason: "Earlier story background is overridden by a later solid background in home.module.css." },
    partnerLogoTradeoff: "Existing transparent WebP artwork remains preferred and untouched. In-memory lossless AVIF4:4:4 preserves exact RGBA but is much larger; no unused alternatives generated.",
    photos, summary: { originals: photos.length, outputs: photos.reduce((sum, photo) => sum + photo.outputs.length, 0), everyOutputUnderBudget: photos.every(photo => photo.outputs.every(output => output.bytes < BUDGET)), everyOutputMetadataStripped: photos.every(photo => photo.outputs.every(output => output.metadataStripped)), allOriginalsUnchanged: true }
  };
  await fs.writeFile(EVIDENCE, JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify({ manifest: MANIFEST, evidence: EVIDENCE, csv: CSV, summary: evidence.summary }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
