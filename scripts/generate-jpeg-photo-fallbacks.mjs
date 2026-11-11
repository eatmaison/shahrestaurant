/* Reproduce: node scripts/generate-jpeg-photo-fallbacks.mjs
 * Adds compatibility JPEG delivery only. Modern delivery files and originals are read-only inputs.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const PINNED = { sharp: "0.34.5", vips: "8.17.3", mozjpeg: "0826579" };
const VERSION = "jpeg-fallback-v1", ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "public", "brand", VERSION);
const EVIDENCE = "docs/jpeg-photo-fallbacks-v1.json", CSV = "docs/jpeg-photo-fallbacks-v1.csv";
const OPTIONS = { resize: { withoutEnlargement: true, kernel: "lanczos3" }, jpeg: { mozjpeg: true, progressive: true, chromaSubsampling: "4:2:0" } };
const QUALITIES = [88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40];
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const stripped = m => !m.exif && !m.xmp && !m.iptc && !m.icc && !m.hasProfile && !m.orientation;
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
const localPath = src => { const p = path.resolve(ROOT, "public", "." + src); if (!p.startsWith(path.join(ROOT, "public") + path.sep)) throw new Error("Source containment"); return p; };
const posterSources = [
  { group: "hero", key: "desktop", source: "/brand/shah-hero-poster-desktop-v4.webp", originalSha256: "d5df0ef28042faa40f0c4f2d6680cf74b43fcc436aa0ec817c80f29cee8e2447", widths: [960, 1600], stem: "shah-hero-poster-desktop", budget: 120000 },
  { group: "hero", key: "mobile", source: "/brand/shah-hero-poster-mobile-v4.webp", originalSha256: "acb9c9be758294404f973731394a7ebd1e551c2c3501df03ac6461c2113933a7", widths: [360, 608], stem: "shah-hero-poster-mobile", budget: 120000 },
];

async function main() {
  for (const [key, version] of Object.entries(PINNED)) if (sharp.versions[key] !== version) throw new Error("Unexpected encoder: " + key);
  sharp.concurrency(2); sharp.cache({ memory: 64, files: 8, items: 64 });
  const restaurant = await readJson("docs/restaurant-photo-assets-v1.json"), gallery = await readJson("docs/event-gallery-assets-v1.json");
  const sources = [
    ...restaurant.photos.map(p => ({ group: "restaurant", key: p.source, source: p.source, originalSha256: p.originalSha256, widths: p.widths, stem: path.basename(p.source, ".webp").replace(/-v1$/, ""), budget: 200000 })),
    ...gallery.photos.map(p => ({ group: "gallery", key: p.source, source: p.source, originalSha256: p.originalSha256, widths: p.widths, stem: "shah-gallery-" + path.basename(p.source, ".jpeg").toLowerCase(), budget: 200000 })), ...posterSources,
  ];
  const protectedSources = new Set(sources.map(p => p.source));
  for (const p of [...restaurant.photos, ...gallery.photos]) for (const out of p.outputs) protectedSources.add(out.src);
  for (const f of await fs.readdir("public/brand", { withFileTypes: true })) if (f.isFile() && (/\.(?:mp4|svg)$/i.test(f.name) || /^shah-hero-poster-.*delivery.*\.(?:avif|webp)$/i.test(f.name))) protectedSources.add("/brand/" + f.name);
  const protection = [];
  for (const src of protectedSources) { const b = await fs.readFile(localPath(src)); protection.push({ src, bytes: b.length, sha256: sha(b) }); }
  let prior = null;
  try { prior = await readJson(EVIDENCE); } catch (e) { if (e.code !== "ENOENT") throw e; }
  if (prior && (prior.version !== VERSION || JSON.stringify(prior.options) !== JSON.stringify(OPTIONS) || JSON.stringify(prior.qualityChoices) !== JSON.stringify(QUALITIES) || JSON.stringify(prior.pinnedEncoders) !== JSON.stringify(PINNED))) throw new Error("Options changed; bump JPEG output version");
  await fs.mkdir(OUTPUT, { recursive: true });
  const manifests = { restaurant: {}, gallery: {}, hero: {} }, photos = [], rows = [];
  for (const p of sources) {
    const priorPhoto = prior?.photos.find(photo => photo.source === p.source);
    if (prior && (!priorPhoto || priorPhoto.originalSha256 !== p.originalSha256 || JSON.stringify(priorPhoto.widths) !== JSON.stringify(p.widths))) throw new Error("Protected input/width set changed; bump JPEG output version");
    const original = await fs.readFile(localPath(p.source));
    if (sha(original) !== p.originalSha256) throw new Error("Protected original changed: " + p.source);
    const m = await sharp(original).metadata();
    if (!m.width || !m.height || m.hasAlpha) throw new Error("Unexpected dimensions/alpha: " + p.source);
    const swapped = [5, 6, 7, 8].includes(m.orientation), width = swapped ? m.height : m.width, height = swapped ? m.width : m.height;
    const outputs = [];
    for (const target of p.widths) {
      if (target > width) throw new Error("Upscaling prohibited");
      const src = "/brand/" + VERSION + "/" + p.stem + "-" + target + ".jpg", priorOutput = prior?.photos.find(x => x.source === p.source)?.outputs.find(x => x.src === src);
      let selected;
      try {
        const b = await fs.readFile(localPath(src)), cm = await sharp(b).metadata();
        if (!priorOutput || sha(b) !== priorOutput.sha256 || b.length !== priorOutput.bytes || b.length >= p.budget || cm.format !== "jpeg" || cm.width !== target || cm.height !== Math.round(height * target / width) || !stripped(cm)) throw new Error("Existing JPEG differs; stop before overwriting: " + src);
        selected = { ...priorOutput };
      } catch (e) { if (e.code !== "ENOENT") throw e; }
      if (!selected) for (const quality of QUALITIES) {
        const b = await sharp(original).rotate().resize({ ...OPTIONS.resize, width: target }).toColourspace("srgb").jpeg({ ...OPTIONS.jpeg, quality }).toBuffer();
        if (b.length >= p.budget) continue;
        const cm = await sharp(b).metadata();
        if (cm.format !== "jpeg" || cm.width !== target || cm.height !== Math.round(height * target / width) || cm.width > width || cm.height > height || !stripped(cm)) throw new Error("Invalid JPEG metadata/dimensions");
        await fs.writeFile(localPath(src), b, { flag: "wx" });
        selected = { src, format: "jpeg", width: cm.width, height: cm.height, bytes: b.length, quality, sha256: sha(b), metadataStripped: true, autoOriented: true, upscaled: false, budgetBytesExclusive: p.budget, withinBudget: true }; break;
      }
      if (!selected) throw new Error("No acceptable JPEG quality fits budget: " + src);
      outputs.push(selected); rows.push({ group: p.group, original: p.source, originalFormat: m.format, path: src, format: "jpeg", width: selected.width, height: selected.height, bytes: selected.bytes, quality: selected.quality, budgetBytesExclusive: p.budget, sha256: selected.sha256, metadataStripped: true, autoOriented: true, upscaled: false });
    }
    const largest = outputs.at(-1);
    manifests[p.group][p.key] = { src: largest.src, srcSet: outputs.map(o => o.src + " " + o.width + "w").join(", "), width: largest.width, height: largest.height };
    photos.push({ group: p.group, source: p.source, originalFormat: m.format, originalSha256: p.originalSha256, originalBytes: original.length, originalWidth: m.width, originalHeight: m.height, originalOrientation: m.orientation ?? 1, orientedWidth: width, orientedHeight: height, widths: p.widths, outputs });
    console.log(JSON.stringify({ source: p.source, jpegOutputs: outputs.length, maxBytes: Math.max(...outputs.map(o => o.bytes)), qualities: outputs.map(o => [o.width, o.quality]) }));
  }
  for (const p of protection) { const b = await fs.readFile(localPath(p.src)); if (b.length !== p.bytes || sha(b) !== p.sha256) throw new Error("Protected source/delivery modified: " + p.src); }
  const configs = [
    { group: "restaurant", file: "app/lib/restaurantPhotoJpegFallbacks.ts", name: "restaurantPhotoJpegFallbacks", getter: "getRestaurantPhotoJpegFallback" },
    { group: "gallery", file: "app/lib/eventGalleryJpegFallbacks.ts", name: "eventGalleryJpegFallbacks", getter: "getEventGalleryJpegFallback" },
    { group: "hero", file: "app/lib/heroPosterJpegFallbacks.ts", name: "heroPosterJpegFallbacks" },
  ];
  const manifestHashes = [];
  for (const c of configs) {
    const body = "// Generated by scripts/generate-jpeg-photo-fallbacks.mjs. Modern sources and originals stay unchanged.\n" +
      "export type JpegPhotoFallback = Readonly<{ src: string; srcSet: string; width: number; height: number }>;\n" +
      "export const " + c.name + ": Readonly<Record<string, JpegPhotoFallback>> = " + JSON.stringify(manifests[c.group], null, 2) + ";\n" +
      (c.getter ? "export function " + c.getter + "(src: string): JpegPhotoFallback | undefined { return Object.prototype.hasOwnProperty.call(" + c.name + ", src) ? " + c.name + "[src] : undefined; }\n" : "");
    await fs.writeFile(c.file, body); manifestHashes.push({ file: c.file, sha256: sha(body) });
  }
  const evidence = { version: VERSION, generatedAtUTC: new Date().toISOString(), pinnedEncoders: PINNED, options: OPTIONS, qualityChoices: QUALITIES, originalFormatScope: "Gallery sources are JPEG. Restaurant/photo poster sources are WebP; their new JPEG is a compatibility delivery alternative, not an assertion that their source format was JPEG.", sourcePolicy: "Original files, modern AVIF/WebP deliveries, logos and videos are preserved. JPEG pixels auto-oriented before metadata removal; no upscaling.", photos, protectedFiles: protection.map(p => ({ ...p, unchanged: true })), manifests: manifestHashes, validation: { sourceCount: photos.length, outputCount: rows.length, everyOutputUnderBudget: rows.every(o => o.bytes < o.budgetBytesExclusive), everyOutputMetadataStripped: true, everyOriginalAndModernProtectedFileUnchanged: true, maxPhotoJpegBytes: Math.max(...rows.filter(r => r.group !== "hero").map(r => r.bytes)), maxPosterJpegBytes: Math.max(...rows.filter(r => r.group === "hero").map(r => r.bytes)) }, visualReview: prior?.visualReview ?? { status: "pending", scope: "All74JPEG delivery variants require matched source/variant contact sheets and native crops before acceptance." } };
  await fs.writeFile(EVIDENCE, JSON.stringify(evidence, null, 2) + "\n");
  const keys = Object.keys(rows[0]), cell = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
  await fs.writeFile(CSV, [keys.map(cell).join(","), ...rows.map(row => keys.map(k => cell(row[k])).join(","))].join("\n") + "\n");
  console.log(JSON.stringify({ complete: true, ...evidence.validation, evidence: EVIDENCE }));
}
await main();
