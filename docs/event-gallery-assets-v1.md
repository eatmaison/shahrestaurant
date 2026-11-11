# Event gallery delivery assets — version 1

Ten original JPEGs now have 80 AVIF/WebP delivery variants at 320, 640, 960 and 1280 pixels wide. Every file is below 200,000 bytes. The largest AVIF is 192,305 bytes; the largest WebP is 197,878 bytes.

All ten original SHA-256 hashes matched before and after generation and after visual acceptance. Seven images required EXIF rotation. All 80 derivatives have no EXIF, XMP, IPTC, ICC profile or orientation tag. Tiny WebP placeholders are 100–182 bytes.

Reproduce with:

    node scripts/generate-event-gallery-photos.mjs

Sharp 0.34.5 and libvips 8.17.3 are pinned. Full options, selected qualities, dimensions and output hashes are recorded in [JSON](event-gallery-assets-v1.json) and [CSV](event-gallery-assets-v1.csv). Regeneration verifies cached derivative hashes and refuses changed originals.

The gallery-only picture component preserves the existing grid, fill positioning, aspect containers, hover classes and responsive sizes. Known photos select controlled AVIF/WebP sources with a 1280-pixel cap, explicit dimensions and lazy/async loading. Unknown admin uploads keep their existing Next Image pipeline and remain outside this delivery guarantee. Known ImageGallery schema URLs use the highest delivered WebP. Global image configuration and the homepage photo manifest were not changed.

Two reviewers inspected all 80 variants on ten contact sheets and ten native crop comparisons. No definite content substitution, orientation/crop inconsistency, objectionable blocks or banding was found. Mild lossy softness is possible; the original depth-of-field blur remains. This is not pixel equality or a 4K quality promise. Large originals that exceeded tool output limits were reviewed through auto-oriented 1280-pixel reference renders. Review files remain in the task Temp directory recorded in JSON.

## Confirmed caption corrections

Only confirmed photographed-subject errors were corrected. All other business narrative, menu prices and contact information remain unchanged.

| Original JPEG | Previous label | Corrected observable subject |
|---|---|---|
| [687A0211.jpeg](../public/photos/687A0211.jpeg) | Lamb seekh kebab | Dining room with tables and upholstered chairs |
| [687A0216.jpeg](../public/photos/687A0216.jpeg) | Paneer tikka | Dining room tables and pendant lights |
| [687A0321.jpeg](../public/photos/687A0321.jpeg) | Plated tandoori dish | Dining area with tables, chairs and a view of the bar |
| [687A0336.jpeg](../public/photos/687A0336.jpeg) | Dishes category | Interior category; the atmosphere caption remains |

Exact bilingual before/after lines and comparison filenames are retained in JSON. Original JPEG bytes and filenames remain untouched; derivative filenames use neutral photo IDs.

Full TypeScript checking and targeted ESLint passed. Final compiled HTTP/browser selection checks remain for the root rebuild. No deployment occurred.
