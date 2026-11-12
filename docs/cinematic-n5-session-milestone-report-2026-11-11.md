# Cinematic verification — 11 November 2026

The approved CapCut desktop v3/mobile v2 intro and the requested one-time closing-second transition are available locally. **The original full definition of done is not met:** JavaScript and several measured performance targets remain over budget, and external/device validation is limited as described below. Nothing was deployed, published or pushed.

**Known current n5 transition failure:** a no-input native LayoutShift diagnostic records0.528143 desktop/0.887179 mobile immediately after the in-flow film is removed. Functional/session checks pass, but this fails the original.02 stability gate in the observed automatic flow. A before-paint fixed-film/transform-reveal correction is being built; n5 remains a control, not final transition acceptance. Tiny reload-only shifts below must not be read as whole-flow results.

Current preview: **http://localhost:3398/**; English: **http://localhost:3398/en**. Same-router phone preview: **http://192.168.0.122:3618/**. [Exact restart commands and fixture boundary](LOCAL_PREVIEW.md), [phone listener/security record](PHONE-PREVIEW.md).

## Current artifact

Build **`n5lZlmRftteZljWg3KVl-`**, Next.js16.2.10 / Webpack, `.next-review-capcut-session-20261111`. Frozen combined source SHA-256 **`50dc47b44958495088ace0cde911ad36684a249b333ab6ac3683078b27b0c93b`**, **530 inputs**. Compile27.2s, TypeScript15.9s, all61 generated routes passed; before/after fingerprints match. The snapshot includes preserved parallel working-tree changes and is not a claim that a clean source commit reproduces the combined build. [Build identity](cinematic-capcut-session-build-2026-11-11.json), [source hashes](cinematic-capcut-session-source-2026-11-11.json).

The candidate on3638 and main on3398 serve the same artifact and pinned fixture. Main promotion followed real desktop/mobile playback, closing-second scrolling and strict same-tab return tests. Fifty HTTP/source/access cases pass on the current artifact: all24 public pages, fourteen event URLs, private parties/API checks, redirects,24-entry sitemap/72alternates, robots and three homepage event cards per locale. [HTTP evidence](events-visibility-http-20261111.json).

## Intro and navigation

The approved movie plays muted and inline, using desktop landscape above767px and the original portrait edit below768px. Its animated typography is burned into the approved video; duplicate HTML headings are absent. The fullscreen playing stage hides ordinary navigation and cookie notice until the handoff. Page information starts in the separate content chapter.

During the final second, native smooth scrolling brings the introduction/header into view. The consumed film is then removed from layout and its media/network/blob resources are released. Ordinary scrolling remains native: there is no wheel/key prevention or persistent minimum-scroll clamp. Scroll up/Home reaches the content/header and cannot reveal the removed movie. Intentional early scrolling, Skip, hash navigation and handoff interruption consume the intro while retaining access to the page. This intentionally means the normal new handoff can unload the film before its natural end; old368-frame natural-completion checks must not be relabeled as this new flow.

The presentation is remembered **once per tab session** using the versioned `shah:intro:desktop-v3-mobile-v2:1` key and document-memory fallback. Same-tab reload and menu→home return have the consumed marker/header/zero-height hero immediately, with zero extra MP4 requests. A separate new tab can play it; opener-cloned storage can inherit the marker. When session storage is blocked, only current-document memory persists. With JavaScript disabled, the static poster and native Skip remain available; automatic removal cannot run.

Desktop and390px mobile actual playback advance to a handoff at11.356147/11.350483s of12.332667s. Each recorded70 intermediate native smooth-scroll samples before hero0/video removal/header visibility/introTop0. Trusted up/Home cannot reveal the movie, while normal down/up remains usable. The strengthened return check requires session key1 and no early movie at DOMContentLoaded/first animation frame; it does not wait for another playback to hide itself. Small raw layout-shift entries are retained, with input qualification, rather than described as field/performance results. [Current flow and fallback evidence](hero-intro-handoff-verification-2026-11-11.json).

The preceding NAZ build exposed a real parent-ref timing bug: a child layout effect could miss the session claim. The final code finds its own mounted stage ancestor, with a passive-effect fallback and one-claim guard. Forty-three offline lifecycle/media assertions, TypeScript and targeted ESLint pass. [Failed NAZ control, including the initially insufficient reload assertion](hero-handoff-naz0-control-2026-11-11.json).

## Approved media and framing

| Variant | Public file | Bytes | Dimensions |
|---|---|---:|---|
| Desktop v3 | `/brand/capcut-luxury-v3/shah-luxury-capcut-desktop-v3.mp4` |22,055,086|1920×1080|
| Mobile v2 | `/brand/capcut-luxury-v3/shah-luxury-capcut-mobile-v2.mp4` |14,802,082|1080×1920|

Both public copies match their approved Downloads master hashes. Original v4 movies, rejected exports and all masters remain untouched. Both approved tracks contain368 frames at30fps, with last frame PTS12.299333 and container duration12.332667; their short dark ending is intentional. Twelve matching AVIF/WebP/JPEG posters use visible frame43/PTS1.499333; all are below120,000B, maximum116,162B. No video transcode was performed on this preview path. [Master/poster hashes, decoding and dimensions](capcut-luxury-v3-delivery.md).

The initial KIb cover crop clipped typography at320×844. At widths≤767px and aspect ratios≤9/20, video/poster now contain the complete portrait frame on a black matte within a100svh stage; standard390px and desktop cover framing remains. All five320 holds were visually accepted on NAZ, with390/desktop title/message/closing-line checks. Final n5 freshly checked both320/390 titles and four NoJS/reduced poster/real keyboard Skip cases.529/530 inputs, all CSS and all fourteen media/poster assets match NAZ; only the ref-timing HeroFilm code differs. The larger paused-frame matrix is carried as that named control, not claimed as a new capture. [Current visual proof and archived failed crop](cinematic-handoff-visual-verification-2026-11-11.json).

Reduced motion, Save-Data and2G keep a usable static poster/content path and do not start the movie. Navigation/notice are usable in the reduced/static path. A blocked autoplay exposes native manual controls; media errors and early exits preserve page access. Backgrounding pauses active playback; the visitor's explicit pause is respected. Synthetic policy/network conditions are labeled in the reports and are not physical-browser certification.

## Loading measurements and limitations

The exact approved media were measured on the earlier KIb playback build, before the new handoff/session code. Four unthrottled local NL/EN×desktop/mobile first-playing events occurred at1441.1/1023.8/1123.0/1010.8ms; all four then naturally reached368 frames with zero recorded drops/stalls/errors. These bounded local observations are not instant-loading or zero-drop guarantees for the final site.

One cold mobile case at1.6Mbps/150ms and CPU4× needed **80.095s before native playback**. It reached368 frames with **six native dropped-frame counts** and no observed stalls after starting. This is the actual tradeoff of full-file buffering and direct approved masters: network demand is largely completed before playback, but startup can be long and decoding can still drop frames. The identical asset bytes were retained for the new flow; the80-second test was not repeated or relabeled as a new handoff timing. Native WebKit uses a native source after prebuffering; cache reuse there is not physically verified. [Exact approved-media control](hero-capcut-approved-verification-2026-11-11.json).

The owner confirmed that the prior KIb LAN preview opened and played on their actual phone. The device/OS/frame rate were not recorded. Updated listener/build HTTP and policy verification are separate from that user report. No physical Safari/iPhone/iPad performance claim follows.

## Whole-site design, content and SEO

The introduction, menu, stepped gallery/lightbox, teal story, three public evening cards, reviews, visit/FAQ, horizontal partner rail and closing/footer retain the cinematic entrances and scene motion, with reduced-motion alternatives. The four original partner brands remain on one horizontal row, moving right to left with touch/keyboard/pause support; smaller screens do not stack them. Original logo, palette, menu/prices and contact details are preserved. [Design record](CINEMATIC-REVISION.md).

There are **24 public URLs in12 NL/EN pairs**, including all seven event pairs. All /events marketing pages are public; /parties and its private APIs retain administrator checks. Current24-route HTTP/SEO checks pass: one H1, unique titles50–56characters/descriptions144–158, correct language/canonical/social metadata,72hreflang/sitemap alternatives,22breadcrumbs,678localized links and34anchors. Both nine-question FAQs match visible copy, and both initial Menu subsets match the pinned catalog. [Current SEO proof](cinematic-paired-events-seo-2026-11-11.json), [local schema scope and external limits](STRUCTURED-DATA-VALIDATION.md).

Owner-confirmed approximate€35 spend, walk-in welcome, no social profiles and KARWEI parking guidance are distinguished from sourced location/transit facts in [LOCAL-FACTS.md](LOCAL-FACTS.md). Unknown accessibility/facilities, nearest-stop walking times, certification and capacity were not invented. No rankings, rich-result display or availability guarantee is made.

## Delivery budgets and prior performance controls

Current byte-matched initial external files, individually gzip level6:

| Scope | JS gzip B | CSS gzip B | Original exclusive gate |
|---|---:|---:|---|
| Both home URLs |184,534|39,867|JS fails120,000; CSS passes40,000|
| Both menu URLs |174,418|33,181|JS fails; CSS passes|
| Both reservation URLs |161,300|32,406|JS fails; CSS passes|
| All24 public URLs |152,715–184,534|26,419–39,867|All24 JS fail; all24 CSS pass|

These figures exclude HTML/Flight/inline scripts, SVG bodies, fonts, media, API data, deferred imports, prefetch and legacy nomodule. Dictionary data moved partly into HTML; SVG sprites have a separate transfer cost. They are not total page transfers or isolated causal savings. [Exact current memberships](cinematic-capcut-session-payload-2026-11-11.json), [qualified comparison and displaced costs](DELIVERY-IMPROVEMENTS.md).

Added74 responsive JPEG compatibility variants while preserving AVIF/WebP priority;12 new approved posters also include JPEG. Named restaurant/gallery bodies pass200KB and posters120KB. A separate188-source original-format optimizer audit passed200KB, max176,830B. Unknown future uploads and optimizer-failure passthrough cannot be certified universally.107 public icon wrappers preserve ordered glyph geometry in three SVG sprites with licences; selected-language delivery and utility-language race/draft recovery were browser-tested. Public48px CSS was verified in bounded78-case geometry/29-input and enlarged-text/native-Skip controls, rather than claiming every future state. [JPEG](jpeg-photo-fallbacks-v1.md), [icons](icon-sprites-v1.md), [language controls](event-locale-browser-2026-11-11.json), [targets](cinematic-touch-target-verification-2026-11-11.json).

The latest full Lighthouse/INP matrix is explicitly **the older Cde original-v4 control**, not this approved-film/handoff artifact. Its48 local Lighthouse runs all score Accessibility100/BestPractices100/SEO100 with rawCLS0. Seven strict Performance cases fail (six mobile, one desktop), six eligible native LCPs fail1800ms, four home LCPs lack eligible native candidates, and eight TBT cases fail150ms. The Dutch reservation outlier P39/TBT11,663ms is retained without selective rerun. No full current-film Lighthouse/INP matrix is claimed. [Cde evidence index](cinematic-cde-v4-control-index-2026-11-11.json).

| Older Cde sampled INP | Mobile ms | Desktop ms |
|---|---:|---:|
| Home |352|664|
| Menu |1712|1992|
| Reservations |376|680|

All six samples fail the original150ms gate. These are local samples, not a field distribution. Bounded profiling found DOM creation/property work during an actual menu category render, but long wall-time presentation/GC gaps had little thread CPU; the evidence does not prove a single app/host cause. No speculative rewrite was adopted. Supported Pages prototypes with actual features also missed budgets; the plain probe did fit, so the observed App runtime total is not a universal framework minimum. [Runtime investigation](RUNTIME-BUDGET-INVESTIGATION.md).

## Data, validation and remaining limits

The read-only preview uses224 products/two brands captured2026-11-11T14:02:15.463Z, snapshot SHA256 `66eda306b74cf90dc15ad018cc3064212349151810d8df2e098a06d6e8588892`, fixed status clock12:47:58.379Z and bootstrap hash `87cd9c939a82820c555968a3189d82dca413eecb18d90126add52327a60b3bbf`. Users/orders/reservations/reviews are empty. The upload-gallery fixture is explicitly empty, while ten supplied photos remain. Only bounded public reads are allowed; submissions/private data are blocked. This is not live operational availability. No real reservation/order/payment/email/account success was tested or changed.

Whole-repository ESLint reports22 prior errors/six warnings in unrelated terminal, phone-agent tests and utility paths; modified public files have zero lint errors. Parallel admin/guest/API/status/package/phone-agent changes remain preserved and excluded from public-feature staging.

Original thresholds remain mobileP≥92, SEO100, accessibility/best-practices≥95, LCP<1800ms, CLS<.02, INP/TBT<150ms, JS<120,000B, CSS<40,000B, posters<120,000B and delivered images<200,000B. JavaScript and the older measured performance failures are unresolved; final-film full-matrix performance remains unmeasured. Slow-link startup, physical Safari/device coverage, field CWV and live transactional flows remain limitations.

Current external Google CODE tests are **NOT_RUN**: CUA browser initialization failed before opening Google or submitting code (`orchestrator_helper_incomplete`, kernel exited1). This is a tool failure, not a schema-validation failure. Current local schema parsing does not establish external eligibility, indexing or display. [Exact attempted action and blocker](structured-data-external-validator-attempt-20261111.json).

The full112-line Library brief was read before the original audit and keyword map. Windows materialization hit os.setxattr, but full Library text retrieval succeeded. The earlier local-commit approval rejection was resolved by explicit owner approval; no new approval is pending. Originals, private data and unrelated work are preserved. [Audit](../AUDIT.md), [keyword map](../KEYWORD-MAP.md), [archived Hj2 milestone](cinematic-hj2-milestone-report-2026-11-11.md).
