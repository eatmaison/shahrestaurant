# Event gallery delivery audit — 11 November 2026

Measured compiled build qtEl0n7z1LSeYdyHiZ19Y on local port 3477. These 20 responses cover 10 built-in JPEGs only; product CDN images, catalog logos and admin-uploaded gallery photos are separate.

Requested 3840px width/API quality 75 with explicit AVIF or WebP negotiation and at most 2 concurrent requests. All 20 responses were HTTP 200 with matching MIME, decoded successfully, had no EXIF/XMP/IPTC/ICC, and stayed within source dimensions. All 10 original SHA256 hashes matched before/after. Encoded sizes below are decimal bytes.

| Source JPEG | AVIF bytes | WebP bytes | Delivery budget |
|---|---:|---:|---|
| 687A0402.jpeg | 105807 | 164892 | Both below 200000B |
| 687A0210.jpeg | 353986 | 502550 | At least one over budget |
| 687A0211.jpeg | 274139 | 400404 | At least one over budget |
| 687A0260.jpeg | 137764 | 224378 | At least one over budget |
| 687A0216.jpeg | 341593 | 453416 | At least one over budget |
| 687A0321.jpeg | 822129 | 1071958 | At least one over budget |
| 687A0090.jpeg | 81705 | 94894 | Both below 200000B |
| 687A0336.jpeg | 505142 | 673646 | At least one over budget |
| 687A0343.jpeg | 516761 | 728930 | At least one over budget |
| 687A0412.jpeg | 140611 | 205578 | At least one over budget |

Six AVIF and eight WebP representations exceed the 200000B limit. This is a maximum candidate audit; actual browser choices depend on viewport, DPR and sizes. Large original JPEGs are not themselves a delivered-budget failure.

Proposed next step: gallery-specific versioned AVIF/WebP delivery variants at 320/640/960/1280w, each measured below 200000B, with 1600w accepted only if bytes and native-crop review permit. Preserve originals and inspect orientation/color/texture before accepting quality settings. No derivative assets or app changes were made.

Full bytes, dimensions, orientation, metadata flags, cache status and source hashes: [JSON](event-gallery-delivery-qtEl0n7z-2026-11-11.json) and [CSV](event-gallery-delivery-qtEl0n7z-2026-11-11.csv).
