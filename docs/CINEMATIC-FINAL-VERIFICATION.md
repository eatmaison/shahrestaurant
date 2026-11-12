# Local release verification — 12 November 2026

The approved English and Dutch CapCut intros, cinematic page sequence, menu/cart refinements and compact mobile footer are implemented locally. **The full original performance definition of done remains unmet.** Nothing was deployed, published, pushed, or submitted as a real order or booking.

Review: **http://localhost:3398/** (Dutch), **http://localhost:3398/en** (English). Same-network phone: **http://192.168.0.122:3618/**, with `/en` for English. [Exact start commands, current promotion status and fixture limits](LOCAL_PREVIEW.md); [phone policy](PHONE-PREVIEW.md).

## Frozen combined candidate

Build **`s_2pU6IxrWANtKLhFIf2S`**, Next.js 16.2.10 / Webpack, `.next-review-shah-complete-20261112`. Source SHA-256 **`0d98fae249ab1b1516cd84408a7a4725ddaf9dcc0028a3093c28c0b9d5ea670d`**, **548 inputs**, identical before and after the successful build/TypeScript check. It generates 61 routes. Public source/media and narrow shared-feature hunks are saved in local commit `277a47b1e25a4d40d0ae982faaa329e1d57a17c8`; no push occurred. The candidate is http://localhost:3708/ over direct app3707; main3398 was promoted and its exact build/read-only headers verified; the phone listener record is maintained separately in PHONE-PREVIEW.

The combined snapshot intentionally preserves parallel admin, guest recognition, API and phone-agent work. Local public-feature commits exclude their unrelated hunks; a clean checkout of those commits alone is not asserted to reproduce this combined snapshot. The archived [n5 milestone](cinematic-n5-session-milestone-report-2026-11-11.md) records its old layout-shift failure; that failed implementation is no longer the release controller.

The final artifact differs from the preceding tEO candidate only by removing obsolete homepage CSS. All436 emitted module factory variant sets are byte-identical; eight local browser pages and12 paired computed-style states show zero differences across desktop/mobile, dark/light, hover/active, selection and pseudo-elements. Intro/cart/footer results below retain their actual tEO/ROl identities and are carried with that proof. [CSS comparison](cinematic-css-equivalence-complete-2026-11-12.json), [final live/source checkpoint](cinematic-final-live-checkpoint-2026-11-12.json).

## Intro, languages and accessibility

A fresh homepage tab selects the URL's language, then the desktop or portrait variant at the existing767px breakpoint. Opposite saved language preferences cannot override a public URL. All files retain their approved burned-in typography; no duplicate HTML titles overlay the film.

| Locale | Delivered public MP4 | Bytes |
|---|---|---:|
| EN desktop | `/brand/capcut-luxury-v3/shah-luxury-capcut-desktop-v3.mp4` |22,055,086|
| EN mobile | `/brand/capcut-luxury-v3/shah-luxury-capcut-mobile-v2.mp4` |14,802,082|
| NL desktop | `/brand/capcut-luxury-nl-v1/shah-luxury-capcut-desktop-nl-v1-web.mp4` |21,595,932|
| NL mobile | `/brand/capcut-luxury-nl-v1/shah-luxury-capcut-mobile-nl-v1-web.mp4` |14,767,612|

English approved master copies are unchanged. Dutch originals are also preserved in `assets/video-masters/capcut-luxury-nl-v1/`; their delivery derivatives are lossless fast-start stream copies, retaining silent AAC. All368 decoded frames and presentation timestamps match the Dutch masters. A1µs container-duration rounding difference is documented. Separate portrait footage is used, not a crop of the landscape export. Matching AVIF/WebP/JPEG posters use a visible frame rather than the intentionally dark ending; all24 EN/NL posters are below120,000B. [Exact media hashes and QA](CAPCUT-DUTCH-ASSETS.md), [English master delivery](capcut-luxury-v3-delivery.md).

In the final second, a fixed film layer moves upward to reveal the stationary page/header; it is then removed. This implements the requested cinematic transition **without changing window scroll position**, avoiding the measured layout shift of the earlier in-flow approach. The user cannot scroll back into a removed film, while ordinary page scrolling remains available. A shared once-per-tab marker prevents replay on reload, menu-to-home or language returns. A new independent tab can play it. Duplicated tabs can inherit storage; blocked session storage only preserves the marker within the current document.

Reduced motion, Save-Data/2G, native Skip, hash links, blocked autoplay/manual controls, backgrounding and early interruption have usable paths. No-JavaScript retains a poster and native Skip. A running film keeps its selected source/clock during rotation and uses containment if its aspect no longer matches; a resize before loading chooses the current breakpoint. Changing language dismisses old media rather than replaying another intro.

Fresh preceding tEO NL-desktop and EN-mobile natural flows record initial native **CLS0**, actual playback, handoff at about11.33s of12.3327s,33 intermediate transform samples, removed media and zero new MP4 requests on same-tab returns. The preceding ROl's27 lifecycle and5 responsive/language cases are explicitly carried through unchanged controller/provider/media hashes and emitted-module comparisons, not relabeled as fresh release captures. Six ROl NL/EN desktop/390×844/360×800 cases show actual natural currentTime advancement of0.655–0.665s and eighteen manually inspected title/message/closing frames. [Release flow and control bindings](hero-intro-handoff-verification-2026-11-11.json), [locale source and visual proof](intro-locales-browser-verification-2026-11-12.json).

## Requested interface changes

The Events label aligns with adjacent desktop navigation. A single round EN/NL control shows the current language and switches to the other; public route/query/hash pairing and utility-page draft preservation were checked. New visitors receive dark mode before paint regardless of system preference; saved explicit light/dark choices and the theme toggle remain. The dark cookie Privacy link was corrected to the palette's gold after an actual contrast failure; measured contrast is6.544.

Partners stay on one horizontal right-to-left rail. The requested visible arrow/pause row is gone; native touch scrolling, keyboard navigation, a focus-visible pause control and reduced-motion behavior remain. Restaurant, category and third-level Drinks side arrows are removed without removing their selectors.

Restaurant names wrap fully in the sidebar, whose available height increases6px. Mobile food photographs use the full card width with4:3 containment. Cart names remain visible; smaller visible quantity discs retain48px hit targets and sit above the price. Cart product-photo backgrounds load lazily at low priority under a readable overlay with solid fallback. Hidden mobile desktop-cart branches request zero photo bodies in the measured cases. Menu offers have clearer quantity/pricing and per-combo labels; desktop drink text is14px, mobile native selects16px. The English email placeholder is exactly **Email address**.

Each wrap can independently be plain or a paid menu with its own drink. Five actual Chicken Tikka Masala Wraps at€9.99 with five distinct€4 menus total **€69.95**; three menus plus two plain wraps total **€61.95**. Fresh preceding tEO UI checks verify both quotes and reload persistence. The preceding full12-width/theme, actual11-event cross-tab, editing, removal, legacy migration, unavailable-drink, quantity clamp and hidden-image cases carry through exact unchanged modules. No real order was submitted. [Full cart proof](combo-menu-browser-verification-2026-11-12.json), [fresh release smoke](combo-menu-release-smoke-2026-11-12.json).

Twenty-three offline contracts exercise real route validation/store calculation with all database, payment and email effects stubbed. Server financial rules are preserved; the UI now follows the same menu-fee ordering and rounding, including the caught€30-versus€32.49 free-delivery boundary. Older scalar drink choices migrate to arrays. Positive unknown products reject before persistence; zero-quantity legacy keys remain ignored. Existing Zod removal of an own `__proto__` key is an explicitly documented exception, not a claim that every raw key rejects. Shared files were staged by feature-only hunks.

The mobile footer uses two columns where they fit, with all copy, links, readable fonts and48px targets retained. The final tEO320–430px NL/EN controls are331–379px shorter (about27–32%), carried to the unchanged final footer module. A detected320px floating Back-to-top overlap was fixed by docking that same button beside the footer logo while the footer is visible; all footer-link intersection/hit checks pass with no docking height jump. Back-to-top focuses the main landmark and respects reduced motion. [Final footer evidence](footer-mobile-verification-2026-11-12.json).

## Whole-site, images and local SEO

Cinematic entrances/movement cover the introduction, menu, gallery, story, three public event cards, reviews, visit/FAQ, partners and footer. Existing logo, palette, prices and contact details are retained. Owner-confirmed approximate€35 spend, no social profiles, walk-in welcome and qualified KARWEI parking guidance are distinguished from sourced facts. Facilities, accessibility, capacity, rankings and guaranteed availability were not invented.

All **24 public URLs in12 NL/EN pairs**, including every event section, have URL-authoritative SSR language, canonical/social metadata and reciprocal alternatives. `/parties` and private APIs retain admin restrictions. Fifty exact-build HTTP/source/access checks pass. Fresh24-route SEO/schema checks pass:72hreflang/sitemap alternatives,22breadcrumbs,654localized public links,34anchors, two visible nine-question FAQs and initial menu prices matching the pinned catalog. [SEO proof](cinematic-paired-events-seo-2026-11-11.json), [schema scope](STRUCTURED-DATA-VALIDATION.md).

The five specifically reported curry photos are valid separate images, not missing files. Correct mobile responsive sizing reduces those five unique AVIF bodies from338,044 to215,062B (**36.38%**); this is not a whole-page saving. First visible image priority, native lazy loading and stable placeholders remain. Delayed offscreen requests were distinguished from image failure; no guaranteed instant-loading claim is made. Added74 JPEG compatibility variants preserve modern format priority; a bounded188-source optimizer audit tops out at176,830B. Future uploads and optimizer failure passthrough are outside a universal size guarantee. [Image delivery evidence](PRODUCT-IMAGE-LOADING.md).

## Original budgets and remaining limitations

[Current24-route external payload inventory](cinematic-shah-complete-payload-2026-11-12.json), individually gzip level6, excludes HTML/Flight, inline code, media, fonts, SVG bodies, API data, deferred imports, prefetch and legacy nomodule:

| Scope | Initial JS gzip B | Initial CSS gzip B |
|---|---:|---:|
| Home NL/EN |183,621|39,866|
| Menu NL/EN |174,149|34,211|
| Reservations NL/EN |161,076|32,621|
| All24 public URLs |153,296–183,621|26,601–39,866|

Every route still fails the original JS<120,000B gate. All24 routes pass CSS<40,000B after removing only obsolete, unconditionally overridden homepage rules. Dictionary delivery moves some bytes into HTML and SVG sprites add their own cost, so external JS savings are not total-transfer savings. [Qualified historical comparison](DELIVERY-IMPROVEMENTS.md), [bounded runtime investigation](RUNTIME-BUDGET-INVESTIGATION.md).

The latest full48-run Lighthouse matrix belongs to the older **Cde original-v4 control**, not this NL/dark release. All its A/BestPractices/SEO scores are100, but7Performance cases,6eligible LCP cases and8TBT cases fail the original gates; four home LCPs lack eligible native candidates. The Dutch reservation outlier P39/TBT11,663ms is retained. All six sampled INPs fail150ms (mobile home/menu/reservations352/1712/376ms; desktop664/1992/680ms). No full final-film Lighthouse/INP matrix or field CWV claim is made. [Exact historical control index](cinematic-cde-v4-control-index-2026-11-11.json).

Full buffering preserves the approved video quality but imposes startup cost. The older byte-identical English mobile master control at1.6Mbps/150ms/CPU4 needed **80.095s** before playback and recorded six dropped frames. New Dutch fast-start files remain substantial; their cold-link timing was not remeasured. Fast local playback does not establish instant loading, zero dropped frames or guaranteed smoothness on every connection. Physical Safari/iPhone/iPad coverage is unavailable; the owner's earlier phone-playback confirmation applies to that earlier build.

Google current CODE validators remain **NOT_RUN**. CUA failed during browser initialization before Google navigation or code submission; the bounded12November retry timed out twice after about33s and31s. This is a tool blocker, not failed schema acceptance. [Exact retry record](structured-data-external-validator-retry-20261112.json). Local schema parsing proves neither indexing nor rich-result display.

Changed-feature checks,23 mocked contracts, TypeScript/build and focused lint pass with zero errors/two pre-existing warnings. Whole-repository lint retains22 prior errors/six warnings in unrelated paths. No live transactional, account, email or payment success is certified. The preview is GET/HEAD-only with a pinned224-product/two-brand public fixture, fixed status clock, empty uploaded-gallery/private data and disabled submissions; it is not live restaurant availability. No firewall, network-profile, router or VPN change was made.
