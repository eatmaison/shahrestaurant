# Structured data verification — 11 November 2026

**Current status: local validation passed for all 17 public pages. Current Google Rich Results Test CODE validation: NOT RUN.** No current Google eligibility, indexing, ranking or rich-result-display claim is made.

## Current compiled evidence

Inspected cookie SSR candidate build: Hj2ubUjCMfbacacwFligZ. Compiled source hash: 1b9a194de54237b2104232c89ce249729ddd466a648d819a1118bcd81717fc62 (418 build inputs). Local HTTP checks started at 2026-11-11T19:29:00.493Z and ended at 2026-11-11T19:29:00.953Z. This build contains cookie SSR and first-gallery rendering changes; the schema payloads and public image bytes were verified unchanged from prior controls. No publication occurred.

All 17 server-rendered JSON-LD payloads parse. The seven event pages each contain the exact shared Dutch site graph, with one Restaurant, Organization, WebSite and ImageObject, plus the route breadcrumb. The duplicate About-page Restaurant is gone. Four service pages reference the root Restaurant ID and contain no fixed offer-price fields.

Both homepages contain nine FAQ questions and answers. Their text and order exactly match the nine server-rendered details panels. All 15 non-home breadcrumb lists have the expected canonical path sequence and positions. Canonical comparisons normalize equivalent homepage URL serialization with or without the final slash.

The two canonical menu routes each initially emit two visible Tandoor menu items. Every emitted name/price pair matches the approved immutable public snapshot of 224 products and two brands, captured at 2026-11-11T14:02:15.463Z. Snapshot SHA-256: 66eda306b74cf90dc15ad018cc3064212349151810d8df2e098a06d6e8588892. This is subset verification, not validation of every product as a Google rich result or a fresh live-database price claim.

All seventeen code payloads and their individual script blocks are byte-identical to verified CrBm and nlBA, and therefore to the prepared polished SK payloads. The ten core-page snippets also remain identical to qtEl. Compared with the older TFn5 payloads, the two homepage FAQ blocks changed from eight questions to nine. Exact per-block JSON text hashes, script hashes, saved-code hashes and metadata are in [the current cookie SSR local proof](structured-data-local-Hj2ubUjC-2026-11-11.json).

| Public route | Local schema checks | CODE SHA-256 prefix | Current Google CODE result |
|---|---|---|---|
| / | Pass; FAQPage (9) | 20a1b7957573… | Not run |
| /en | Pass; FAQPage (9) | aaccbf517ee2… | Not run |
| /menukaart | Pass; Menu (2 visible items) | 5819906bc1b5… | Not run |
| /en/menu | Pass; Menu (2 visible items) | e2c6a1ed3ea1… | Not run |
| /reserveren | Pass | fc6c97c50b01… | Not run |
| /en/reservations | Pass | ea885de48098… | Not run |
| /privacy | Pass | bc2650c1cd05… | Not run |
| /en/privacy | Pass | d6e99a21ddfe… | Not run |
| /voorwaarden | Pass | c3a8fcb90b27… | Not run |
| /en/terms | Pass | aa627c3869e3… | Not run |
| /events | Pass | d013b21204ae… | Not run |
| /events/about | Pass | 426449171534… | Not run |
| /events/birthdays | Pass; Service | c9ff32670676… | Not run |
| /events/celebrations | Pass; Service | 5496cf707e29… | Not run |
| /events/company-catering | Pass; Service | 16f0b73dae76… | Not run |
| /events/company-lunches | Pass; Service | 5dd137c579c6… | Not run |
| /events/gallery | Pass; ImageGallery | 8fa8fe73ee5a… | Not run |

Every row also contains the shared site graph. Non-home rows include BreadcrumbList. The table's local pass is not an external Google pass.

## Served image evidence

The ImageGallery schema references the ten highest delivered WebP URLs. On verified nlBA, all 80 gallery variants and three shared schema/social files were fetched: all 83 returned HTTP 200, correct MIME types, bodies below 200,000 bytes and immutable one-year cache headers. Every gallery response matched its recorded size and SHA-256; the largest was 197,878 bytes. For current Hj2, all 83 public files were checked again and matched those exact bytes and hashes. This refresh made 17 schema-page GETs, with zero image/API re-downloads. The image HTTP observations are explicitly carried from nlBA, not reported as fresh Hj2 responses. These are encoded image bodies, not total page transfers.

[Gallery generation and visual QA](event-gallery-assets-v1.md) documents preserved originals, EXIF auto-orientation, responsive variants and corrected photograph captions. Unknown future admin-uploaded images retain their existing pipeline and are outside the 80-file guarantee.

Fresh current Hj2 server HTML contains ten native gallery pictures with AVIF sources before WebP sources and exact 320/640/960/1280 srcsets. Only known gallery index 0 is eager with high fetch priority; the other nine remain lazy and all use async decoding. This HTTP-only pass did not inspect browser currentSrc selection.

The previously verified read-only v2 preview fixture returned HTTP 200 for bootstrap with 224 products, two brands and no user; all 224 product names/prices matched the approved snapshot. Its gallery endpoint returned an explicit empty upload fixture with HTTP 200. This does not assert that the production upload gallery is empty. The v2 fixture and approved snapshot were unchanged in this cookie SSR refresh; no new API request was made. The menu schema subsets were freshly parsed and compared against the approved snapshot again. Only GET requests were sent; no write endpoint was exercised.

Previous evidence is retained separately: [CrBm AA proof](structured-data-local-CrBmCcjg-2026-11-11.json), [nlBA usability proof](structured-data-local-nlBAxpm6-2026-11-11.json) and [SK polished proof](structured-data-local-SK_WHU6G-2026-11-11.json).

## Google CODE scope and current limits

No current payload has been submitted in this audit. Current result URLs, detected-item counts, external errors and screenshots therefore remain unrecorded. Isolated browser DOM providers are unavailable in this session, and no coordinated native input window occurred. Current external Google CODE validation is NOT RUN.

Google's [Rich Results Test help](https://support.google.com/webmasters/answer/7445569) permits testing pasted code. Such a test checks supported rich-result markup; it is not a live URL inspection or a deployment, and it does not establish crawling, indexing or actual display. Google also states that valid structured data does not guarantee a particular Search appearance in its [Local Business guidance](https://developers.google.com/search/docs/appearance/structured-data/local-business).

FAQPage remains emitted for semantic consistency, but Google removed FAQ rich results and its Rich Results Test support in 2026; see [Google's documentation updates](https://developers.google.com/search/updates). It must not be reported as a currently validated Google FAQ feature.

Menu, MenuSection and MenuItem are not standalone features in [Google's supported structured-data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery). Local Menu parsing and snapshot price equality do not validate their embedded Offers as Google rich results. Service and ImageGallery parsing likewise carries no standalone rich-result eligibility claim.

The real menu search target is present in SearchAction, but Google removed the sitelinks search-box feature from 21 November 2024; see [Google's announcement](https://developers.google.com/search/blog/2024/10/sitelinks-search-box). The presence of WebSite, SearchAction or a basic ImageObject must not be described as external validation of every schema.org type.

## Historical Google result — not current-build evidence

An earlier Dutch shared business graph was submitted to Google's CODE test earlier on 11 November 2026; its exact UTC test time and block hashes were not recorded. It reported two valid items: one Local Business/Restaurant and one Organization, with a non-critical missing-priceRange warning.

Historical result: [Google CODE result](https://search.google.com/test/rich-results/result?id=nsFbGi_Lng-DoAcVPq8sBw). Historical detail: [Local Business item](https://search.google.com/test/rich-results/result/r%2Flocal-business?id=nsFbGi_Lng-DoAcVPq8sBw). These links can expire.

That submitted payload predates the current priceRange, geo, SearchAction and FAQ changes. Its missing-priceRange warning is obsolete for the current payload, where the field is present. The historical result does not validate the current 17 pages, their Menu/FAQ/Service/ImageGallery types, or the current gallery URLs. No new Google screenshots or result counts are implied.

No Search Console submission, public URL inspection, deployment or publication occurred in this task.
