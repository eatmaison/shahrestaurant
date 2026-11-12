# Product image loading: observed cause and change

Butter Chicken and the four named Jalfrezi dishes use valid, distinct catalog images. All five returned HTTP 200 and decoded in the completed tests. No missing source or question-mark fallback was reproduced. The blank frames observed during loading contained pending native-lazy images, with image opacity set to 1.

The old mobile hint declared a 512px slot for a 356px frame at a 390px viewport. The corrected hint uses viewport width minus 34px. The first order photo now requests eager/high priority; other photos remain native lazy. Source images, quality 75, codecs, crops and the stable 4:3 frame are unchanged.

| Photo | Previous 1080w body | Current 750w body | Reduction |
|---|---:|---:|---:|
| Butter Chicken | 68,417 B | 43,120 B | 36.97% |
| Jalfrezi Chicken | 64,205 B | 40,870 B | 36.34% |
| Jalfrezi Fish | 69,189 B | 44,319 B | 35.95% |
| Jalfrezi Lamb | 67,107 B | 42,836 B | 36.17% |
| Jalfrezi Prawn | 69,126 B | 43,917 B | 36.47% |

The five unique AVIF bodies total **338,044 → 215,062 bytes**, a 36.38% reduction. This is not total-page traffic savings. Exact sizes were read from existing Next disk-cache files without new requests; the current sizes match captured Content-Length headers.

Actual Chromium candidate checks retain display density. At a 320px viewport, the 286px frame selects 384/640/1080 pixels for DPR 1/2/3 instead of 640/1080/1920. At 390px, the 356px frame selects 384/750/1080. The selection-only fixture blocked image HTTP and did not warm the optimizer. Actual 390px/DPR 2 route captures independently confirm the change from 1080 to 750.

The slow test used 1.6Mbps and 150ms latency with a cold client cache. Chicken and Fish initially remained below the viewport at Low priority. Their roughly 9.2-second wait occurred before the HTTP request timing clock began; cached headers then took about 173ms. In a separate stable hold with both photos visible, Chrome promoted them to High within 28ms. They loaded about **1.92 and 2.07 seconds after selecting the category**. This locates the long wait in pre-request scheduling, without establishing a browser bug. Later scrolling between cards did not cause the earlier wait.

Fast tests used optimizer MISS; slow tests used HIT. Some canceled requests were reissued successfully. Smaller files did not improve every measured interval. No instant-loading or universal speed claim is made. Shared-host activity, cache state and the changed default theme limit causal and visual comparisons.

TypeScript and targeted ESLint passed. This task changed only ProductImage props, the mobile sizes hint and its obsolete comment; Root supplied the first-photo priority call. No catalog, image asset or quality setting changed.

Evidence: [summary](product-image-loading-summary-2026-11-11.json), [P0 control](product-image-loading-P0-control-2026-11-11.json), [bLR result](product-image-loading-final-blr-2026-11-11.json), [stable visible hold](product-image-loading-stable-view-blr-2026-11-11.json), [body bytes](product-image-body-comparison-2026-11-11.json), and [DPR selection](product-image-dpr-selection-2026-11-11.json).

## Promoted localhost delivery

On 12 November, the actual main at http://127.0.0.1:3398 was verified as build **KfLjCFEAboBDf5nZnS0uh**, source **0b3971245151ab7ecade89e5641d50723042b4d22d09ba9647d5c877c416f6ef**. The five exact 750/q75 AVIF responses all returned HTTP 200 and matched the bLR body lengths and SHA-256 hashes: **215,062 bytes total**. All five optimizer responses were MISS, so these authorized checks warmed that cache. No new timing claim is made.

The two recorded 530-input source manifests confirm that ProductImage, cinematic CSS, Next config, package files and all 324 public-media file hashes are unchanged. The approved fixture and five image-reference hashes also match. OrderExperience has known cart/sidebar changes and is not claimed byte-identical. The final delivered-byte proof therefore carries the image optimization to the promoted main while keeping browser/layout acceptance separate.

[Final main delivery proof](product-image-delivery-final-2026-11-12.json).
