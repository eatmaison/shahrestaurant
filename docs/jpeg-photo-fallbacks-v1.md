# JPEG compatibility fallbacks

Generated with `node scripts/generate-jpeg-photo-fallbacks.mjs`. Sharp 0.34.5, libvips 8.17.3 and mozjpeg 0826579 are pinned. Existing AVIF/WebP files, source photographs, posters, SVG artwork and videos are preserved; 183 protected files were checked by size and SHA-256 before and after generation.

| Delivery set | Sources | JPEG variants | Widths | Largest body | Exclusive limit |
|---|---:|---:|---|---:|---:|
| Restaurant photos | 6 | 30 | 160/320/640/960 and original maximum1200 or1400 | 194989 B | 200,000 B |
| Event gallery | 10 | 40 | 320/640/960/1280 | 194717 B | 200,000 B |
| Hero posters | 2 | 4 | desktop960/1600; mobile360/608 | 113207 B | 120,000 B |

All74variants are decoded JPEGs with verified dimensions, no upscaling and no retained EXIF, XMP, IPTC, ICC profile or orientation tag. Seven gallery originals require EXIF orientation; pixels are oriented before metadata removal. Gallery originals are JPEG. The six restaurant sources and two poster sources are WebP; their new JPEG files provide compatibility delivery, rather than changing the format of those originals.

AVIF and WebP source attributes and files retain first priority. Native photo/gallery img fallbacks now use responsive JPEG srcsets. The hero picture retains its original four modern source definitions and adds a mobile JPEG source; its final image uses the desktop JPEG srcset. Existing dimensions, alt text, lazy/eager settings, fetch priorities, classes and film DOM structure are retained. Cinematic CSS changes only its nine baseline URLs and adds JPEG choices after the existing modern image-set candidates. Existing hero preload hints are untouched. Gallery schema URLs continue to identify the highest delivered WebP; uploaded images continue through the existing Next Image path.

The three supplemental manifests contain only JPEG fallback URL/srcset/dimensions. Original modern manifests and their schema URL mapping remain unchanged. The generator refuses changed protected sources, changed encoder/options or mismatched existing derivatives; existing JPEG derivative files are never overwritten. Pinned quality candidates start at88 and step down only when needed for the byte limit. The desktop1600poster uses q48 to fit its120KB limit.

All18matched sheets were actually viewed: all30restaurant,40gallery and4poster variants, using full compositions and every-width native center crops beside resized original references. No blocking content, orientation or crop discrepancy was found. Minor expected softness/ringing remains visible in fine details at the lower JPEG qualities. This is lossy visual acceptance within the comparison scope, not pixel identity or a claim about every browser/display. The JSON records the Temp sheet locations and hashes.

This source-level pass ran TypeScript, targeted ESLint and an idempotent second generator pass successfully. Final combined-build HTTP responses, MIME/cache behavior and browser picture/preload selection remain the integration QA owner's checks; no build or browser test was run by this task.

## Current catalog original-format delivery

A separate bounded audit tested all188unique actual catalog JPEG sources through the stable Hj2 optimizer with `Accept: image/jpeg`, maximum allowed width3840 and quality75. All188responses were HTTP200 and decoded JPEG, with no retained metadata and no upscaling relative to SHA-verified captured originals. All were below200,000bytes; the largest was176,830bytes. All cache statuses were MISS. This is original-format re-encoding, not original-byte passthrough. The two authorized identity/fixture preflights verified the exact Hj2build and immutable224-product/two-brand snapshot.

The source-byte comparison reuses the approved captured originals: fresh upstream source-byte identity was not recaptured. This audit is not a universal hard cap for future uploads or optimizer failures. Installed Next16code can fall back to upstream source bytes if optimization fails; some source files exceed200KB and retain ICC profiles. No catalog source URLs/data were changed or duplicated. Unknown uploads and the two separate PNG catalog brand logos are outside this188-JPEG result.

See [local fallback evidence](jpeg-photo-fallbacks-v1.json), [per-file CSV](jpeg-photo-fallbacks-v1.csv), and [188 catalog JPEG delivery evidence](live-delivered-jpeg-fallback-audit-2026-11-11.json). Prior AVIF/WebP evidence remains unchanged.
