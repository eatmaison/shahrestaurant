# Cinematic verification — 11 November 2026

The public redesign and verification work is complete for the build below. **The full requested definition of done is not met:** route JavaScript, several mobile loading/interaction targets and the remaining validation items below are unresolved. Nothing was deployed, published or pushed.

Review: **http://localhost:3398/**, left running. Build **Hj2ubUjCMfbacacwFligZ**, Webpack / Next.js 16.2.10, .next-review-cookie-ssr-20261111. Source SHA-256: 1b9a194de54237b2104232c89ce249729ddd466a648d819a1118bcd81717fc62, **418 inputs**. Compilation 24.0s, TypeScript 11.4s and all 54 routes pass. Latest source commits: 013b7f1 (initial notice/critical gallery visibility), 068fc07 (locale/contrast/category access), following the earlier public-source work. The measured candidate on 3518 and main preview on 3398 serve the same artifact and fixture. [Exact start command](LOCAL_PREVIEW.md).

## Scope and data boundary

Seventeen public URLs are covered: five NL/EN pairs for home, menu, reservations, privacy and terms, plus seven Dutch event URLs. All /events marketing sections are public. /parties, its nested pages and private APIs remain administrator-only; the exact existing payment-webhook exception remains. English event interface choices work, but seven English URL/hreflang pairs are missing.

The read-only preview uses an actual public-catalogue snapshot: 224 products/two brands, captured 2026-11-11T14:02:15.463Z, SHA-256 66eda306b74cf90dc15ad018cc3064212349151810d8df2e098a06d6e8588892. Restaurant-status fixture clock: 2026-11-11T12:47:58.379Z. Bootstrap 144159 raw/23914 gzip bytes, SHA-256 87cd9c939a82820c555968a3189d82dca413eecb18d90126add52327a60b3bbf. It is not the old 104-product seed or a live availability claim.

Users, orders, bookings and reviews are empty. The isolated transport allows only the exact two bounded read-only public SELECTs and 190 public image URLs. Preview business mutations are blocked. Gallery fixture v2 explicitly returns an empty administrator-upload list, labelled empty-upload-fixture-not-live; the ten supplied photographs remain. This corrected a preview-only 503, not the live API. No business records, orders, reservations, payments or emails were changed. Live transactional and account flows remain unverified.

## Design and functional results

The fullscreen opening has no ordinary text, navigation, cookie notice or booking/phone overlay. Information starts in the separate introduction; a focus-only keyboard skip remains. Native scrolling scrubs the original 24fps timeline, holds its decoded final frame and supports reverse scrolling. Reduced motion, Save-Data, 2G, early scrolling, fragments and error/timeout paths preserve access to content. Bypass is distinguished from watched completion.

The introduction, menu chapter, stepped gallery/lightbox, teal story, three public evening cards, reviews, visit/FAQ, partner rail and closing/footer were reviewed. The four original partner cards stay on one horizontal row, drift right to left and support pause, keyboard and touch; reduced motion disables autoplay. Original logo artwork, palette, menu/prices and contact details remain. [Per-section implementation](CINEMATIC-REVISION.md).

Dutch event URLs now remain Dutch during initial rendering despite a saved English preference. Explicit English choices survive rerenders, sibling navigation and Back/Forward. Scoped event contrast fixes passed 24 compiled cases/360 observations in the preceding matching-style control; all 94 dark failures were corrected. The final34 audits independently score Accessibility100. Sidebar Tab/Enter access after expanding Curries passed three desktop sizes; two mobile layouts passed with no page overflow. [Event proof](cinematic-event-usability-verification-2026-11-11.json), [fresh sidebar proof](cinematic-menu-sidebar-2026-11-11.json).

The notice now renders in initial HTML for a first visit. A non-sensitive host-only acknowledgement cookie omits it on subsequent requests; a small head bootstrap respects existing local-storage acknowledgements before paint and migrates them without changing stored choice values. Copy and both actions are unchanged. It remains hidden over the film before hydration and with JavaScript disabled. Acceptance passed 18 SSR cases plus 27 browser/keyboard states, including blocked storage, legacy migration, both Enter actions, reload/cross-route persistence, and real privacy links. The first gallery photo is now visible immediately, eager/High; nine others retain entrances. [Cookie/first-paint proof](cinematic-cookie-ssr-verification-2026-11-11.json).

Fresh final-build core checks pass: 12 photo-preload cases, fonts on three routes, two NoJS cases, header geometry, SSR/query/ready-empty precedence, navigation fallbacks and 13 search/draft/history states. Dummy cart/draft data was cleared. The offline catalogue 6, font 13-route/eight-file/25-face, real-NextRequest 11, event/JWT 11 and final main-preview HTTP 31 checks pass. [Core proof](cinematic-cookie-ssr-preflight-2026-11-11.json), [search proof](cinematic-final-search-2026-11-11.json), [access/source proof](events-visibility-http-20261111.json).

Whole-repository ESLint: 197 files, 22 prior errors/six warnings in unchanged terminal, phone-agent tests and utility/test scripts. Changed public files have zero lint errors; two existing menu dependency warnings remain. Parallel admin/guest/API/status/package/phone-agent work is preserved and excluded from these feature commits.

## SEO, schema and facts

All 17 current HTTP checks pass: exact build/language, one H1, unique titles 50–56/descriptions 144–154, canonicals, social metadata, 15 breadcrumbs, 468 internal links, 27 anchors, 17 sitemap entries and 30 core language alternatives. Both nine-question FAQs match visible copy. The two initially visible Menu subsets match pinned names/prices; all 224 bootstrap names/prices match the snapshot. Four Service graphs refer to the shared Restaurant; displayed package prices remain unchanged. [Final SEO](cinematic-final-seo-2026-11-11.json), [local schema inventory and external-test limits](STRUCTURED-DATA-VALIDATION.md).

Owner-confirmed approximate EUR 35 spend, walk-in welcome, no social profiles and KARWEI parking guidance are distinguished from sourced BAG coordinates/bus 38 facts in [LOCAL-FACTS.md](LOCAL-FACTS.md). Unknown nearest-stop walking times, bike parking, accessibility, terrace/kids/payment facilities and certifications were not invented. No capacity or ranking guarantee is made.

## Lighthouse and sampled interactions

Lighthouse 13.6.0 uses simulated mobile 4G/CPU 4x and desktop 10Mbps/CPU 1x. Runs were sequential, with explicit first-visit cookie/local-storage absence before server navigation and after hydration, fresh targets and visible notice checks (home opening deliberately hides it). The prior CrBm control lacked these explicit per-route assertions; comparisons are bounded observations, not isolated causal experiments or field CWV. Host/source guards remained clean.

All 34 runs have **Accessibility100, BestPractices100, SEO100 and unrounded raw CLS0**. Mobile Performance 70–100; desktop 98–100. Original strict gates remain P>=92 mobile, LCP<1800ms, CLS<.02, TBT<150ms, INP<150ms. Displayed times below are rounded; raw JSON retains precision.

| Route | Mobile P | Mobile LCP ms | Mobile TBT ms | Desktop P | Desktop LCP ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| / | 72 | 4607* | 465.0 | 98 | 1050* |
| /en | 70 | 4738* | 515.0 | 99 | 1026* |
| /menukaart | 88 | 3900 | 59.0 | 99 | 850 |
| /en/menu | 88 | 3902 | 60.5 | 99 | 847 |
| /reserveren | 90 | 3582 | 53.5 | 100 | 762 |
| /en/reservations | 90 | 3566 | 48.5 | 100 | 797 |
| /privacy | 100 | 923 | 60.5 | 100 | 265 |
| /en/privacy | 100 | 920 | 57.0 | 100 | 263 |
| /voorwaarden | 99 | 920 | 124.9 | 100 | 270 |
| /en/terms | 99 | 920 | 117.0 | 100 | 266 |
| /events | 100 | 1074 | 59.5 | 100 | 307 |
| /events/about | 100 | 1075 | 51.5 | 100 | 302 |
| /events/birthdays | 100 | 1080 | 63.5 | 100 | 305 |
| /events/celebrations | 100 | 1070 | 59.0 | 100 | 303 |
| /events/company-catering | 100 | 1070 | 77.0 | 100 | 303 |
| /events/company-lunches | 100 | 1071 | 74.0 | 100 | 303 |
| /events/gallery | 92 | 3343 | 73.0 | 100 | 549 |

* Four home LCP values are UKM fallbacks with zero eligible native candidates. They do not validate poster LCP. Five native mobile LCP values fail 1800ms; six mobile Performance values fail 92; both mobile home TBT values fail 150ms. [All 34 raw-bound rows](cinematic-final-performance-2026-11-11.json).

Official web-vitals sampled INP used actual 1.6Mbps/150ms network emulation, CPU 4x for both viewport sizes, cold browser cache, trusted inputs and 600ms action cadence. EventTiming/LoAF/action/focus markers and overlapping groups are retained. No business writes or runtime errors occurred.

| Page | Mobile INP ms | Desktop INP ms |
| --- | ---: | ---: |
| home | 224 | 208 |
| menu | 1712 | 1720 |
| reservations | 72 | 368 |

Five of six samples fail 150ms. These local samples are not a field distribution or TBT inference. Control traces show quick commits followed by long native-presentation gaps on some menu actions; later typing also has long framework tasks. This does not identify a specific CSS/component cause. [Current INP](cinematic-final-inp-2026-11-11.json), [causal investigation](cinematic-inp-causal-NUcp9-2026-11-11.md).

The corrective batch changed celebrations mobile P86/LCP4052ms to P100/1070ms and gallery P78/5901ms to P92/3343ms in the recorded runs. New native LCP targets are an initially rendered notice paragraph and the visible first gallery image respectively. Cookie timing, critical image visibility and the explicit first-visit protocol changed together; no broader before/after claim follows. There is no valid pre-project baseline or evidence that every section became measurably faster. [Archived CrBm controls](cinematic-crbm-control-index-2026-11-11.json).

## Film loading and quality tradeoff

All eight fast sequence/fallback cases and two actual cold4G cases completed with zero runtime errors. Unthrottled readiness was 1497.1ms desktop/719.2ms mobile; cache was not purged, so these are not cold-fast guarantees. Original compressed files remain36744691/11337072 bytes. Normal completion reaches currentTime 12.249/12.25s with decoded mediaTime 12.208333; reverse, wheel, touch, keyboard, reduced motion, Save-Data and2G paths were checked.

Cold mobile 4G full buffering took **60.77s**. Early scrolling canceled media and selected the static fallback at **4.57s**, with visible content, unlocked body and no unexpected inert/overflow. Full buffering removes further network demand during scrubbing while retaining the original file; it cannot guarantee smooth decoding. Dropped-frame counters were not collected. Physical Safari/iPhone/iPad/GPU playback remains unverified. The separate CapCut edit was not delivered or integrated. [Exact film cases](cinematic-final-film-2026-11-11.json).

## Assets and payload

The four protected movie/logo hashes still match the initial audit. Eight poster variants are below 120000 bytes; 60 restaurant-photo variants below 200000 (maximum 176090); 376 menu-image AVIF/WebP responses and four brand-logo responses pass 200000. All 80 controlled gallery variants pass: AVIF maximum 192305, WebP 197878. Original photos remain; orientation/metadata and contact-sheet/native-crop checks are recorded in the asset reports. Eight byte-identical WOFF2 files preserve all 25 faces/fallback metrics and both licenses. [Font pipeline](FONT-PIPELINE.md).

These are modern-format delivery checks for the named snapshots. Raw originals can be larger; native gallery pictures fall back to WebP while original JPEGs remain separate, so the literal original-format picture-fallback requirement is incomplete. Unknown uploads and original-JPEG optimizer responses are not covered. Lossy encoding review does not guarantee pixel identity or 4K quality.

Initial external files are distinct per cold route, each gzip level 6 and byte-matched to the served build. HTML is recorded separately; inline/Flight scripts, fonts, media, APIs, dynamic imports, prefetch and legacy nomodule are excluded from external JS/CSS. These are not total-transfer figures.

| Route | JS gzip B | CSS gzip B | HTML raw/gzip B |
| --- | ---: | ---: | ---: |
| / | 225989 | 39440 | 107921 / 20922 |
| /en | 225989 | 39440 | 108035 / 20656 |
| /menukaart | 217735 | 32779 | 297985 / 44251 |
| /en/menu | 217735 | 32779 | 298115 / 44038 |
| /reserveren | 204015 | 32004 | 69137 / 15735 |
| /en/reservations | 204015 | 32004 | 69426 / 15551 |
| /privacy | 196588 | 30475 | 45112 / 11653 |
| /en/privacy | 196439 | 30475 | 45348 / 11537 |
| /voorwaarden | 196426 | 30475 | 44674 / 11632 |
| /en/terms | 196426 | 30475 | 44562 / 11338 |
| /events | 196174 | 26127 | 54419 / 13047 |
| /events/about | 197861 | 26127 | 54893 / 13180 |
| /events/birthdays | 198553 | 26127 | 63323 / 14892 |
| /events/celebrations | 198834 | 26127 | 70589 / 14865 |
| /events/company-catering | 198861 | 26127 | 63140 / 15183 |
| /events/company-lunches | 198817 | 26127 | 67935 / 14403 |
| /events/gallery | 210003 | 26127 | 75411 / 14601 |

External CSS passes 40000 bytes on all 17; external JS fails 120000 on all 17. This artifact's shared startup/runtime files alone total 126236 gzip bytes, not a universal framework minimum. [Exact memberships](cinematic-cookie-ssr-payload-2026-11-11.json).

## Remaining requirements and boundaries

The definition of done is incomplete: JavaScript, six mobile performance scores, five native mobile LCPs, two TBT values and five sampled INPs remain over target; four home LCPs are unvalidated. Google Rich Results CODE tests are **NOT RUN**: browser DOM providers were unavailable and native-input testing was not completed. Local schema checks and historical external results do not establish a current Google pass.

Seven English event URL pairs, a universal original-format picture fallback and comprehensive 48px target certification remain absent; preserved rules include 44px minima. No real-device Safari, field CWV/rankings, company scheduling or live booking/order/payment/email success is certified. Live catalogue success inside 750ms is unproven; a five-second diagnostic read succeeded. A JavaScript-disabled visitor with only an old local-storage acknowledgement cannot be recognized server-side until migration; HTTPS Secure behaviour was source-tested only.

The full 112-line Library brief was read before the original audit/map. Local materialization failed on Windows os.setxattr; complete Library text retrieval succeeded. The prior local-commit approval block was resolved by explicit owner approval; no approval is pending. Originals and unrelated work are preserved. [Shipped intent map](../KEYWORD-MAP.md), [historical audit](../AUDIT.md), [start/review instructions](LOCAL_PREVIEW.md).
