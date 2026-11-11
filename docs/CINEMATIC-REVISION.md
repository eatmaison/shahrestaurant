# Cinematic design revision - 11 November 2026

Final build: `Hj2ubUjCMfbacacwFligZ`, source `1b9a194de54237b2104232c89ce249729ddd466a648d819a1118bcd81717fc62` (418 inputs), compiled in `.next-review-cookie-ssr-20261111`. Metrics, passed checks and unmet targets belong to [CINEMATIC-FINAL-VERIFICATION.md](CINEMATIC-FINAL-VERIFICATION.md). `NUcp9_HWho-gmCR-jRh8K` and earlier named captures are **prior controls**; their scope is retained below. Nothing was deployed, published or pushed. The main review is **http://localhost:3398/**, using the tested `start-cookie-ssr-review.cjs` helper; its exact invocation and local limits are in [LOCAL_PREVIEW.md](LOCAL_PREVIEW.md).

## Public scope and opening

The implemented public scope is 17 URLs: five NL/EN core pairs (home, menu, reservations, privacy and terms), plus seven Dutch-first event URLs. The event hub, about, gallery, birthdays, celebrations, company catering and company lunches are public. Ticketed `/parties` pages and management APIs remain admin-only, with the existing exact payment-webhook exception. English event URL counterparts are missing; existing English UI strings do not supply seven new English canonicals or reciprocal hreflang. [Visibility policy and tests](EVENT-VISIBILITY.md).

The opening contains the original fullscreen film/poster without overlaid page text, visible navigation, cookie notice or ordinary actions. Restaurant information begins below the opening, following the owner's later direction. A focus-only keyboard skip remains available.

The existing cookie notice is now server-rendered for a first visit or an unknown acknowledgement value. A valid `shah_notice_ack_v1=1` cookie suppresses it in server HTML. The head bootstrap respects an existing nonempty `tm.cookieConsent` value before paint and migrates it on mount without rewriting the legacy stored value. Notice copy, the two existing choices and their stored value/timestamp behavior remain unchanged. Existing film-opening CSS keeps the notice out of the clean opening, including the recorded no-JavaScript/app-script-blocked cases. [Hj2 cookie and first-paint verification](cinematic-cookie-ssr-verification-2026-11-11.json), [fresh first-visit protocol](cinematic-cookie-ssr-preflight-2026-11-11.json).

## Film and accessible motion

Native scrolling scrubs the unchanged 24fps timeline through the first 80% of the activated track and holds its decoded final frame for the final 20%. Reverse scrolling restores earlier frames without collapsing an activated track. Early scrolling, reduced motion, Save-Data, detected 2G, an initial fragment, missing observers or timeout/error can select a one-viewport still. Keyboard skip moves focus to the introduction. A deliberate skip or large fling can bypass an undecoded track; bypass is not reported as watched completion.

Chromium prepares the original whole-file Blob video outside the document and attaches a decoded frame when scrolling needs it. WebKit retains its native warmup path. Poster decode, animation-frame and idle scheduling precede movie work. The protected sources retain their recorded 36,744,691/11,337,072-byte sizes and 12.25-second duration. This remains substantial full-quality buffering, with no smooth-decoding guarantee for every device.

Shared observers and frame callbacks handle visible scenes. Layout reads precede writes; entrances are capped, and focus/hash targets reveal immediately. The public root loading boundary was removed after a real no-JavaScript test exposed a persistent splash; loading boundaries remain on internal admin/terminal routes. [Recorded core functional checks](cinematic-final-core-functional-2026-11-11.json).

## Presentation

| Section | Implemented treatment |
| --- | --- |
| Opening | Fullscreen composition, responsive poster and matching AVIF hints; no hero overlay copy. |
| Introduction | Cuisine/location H1, address, hours, booking/phone actions and owner-confirmed approximate EUR 35 spend. |
| Menu chapter | Sticky photography, editorial dish rows and real menu search. |
| Home gallery | Stepped frames, restrained visible-scene motion, keyboard lightbox and focus restoration. |
| Story | Teal composition and paced type using the existing logo and palette. |
| Evening | Three public cards for dining, takeaway and gathering/events. Public event links are available to guests; private ticketed parties remain separate. |
| Reviews | Existing review data when available; no review text or rating invented by the design revision. |
| Visit/FAQ | Native disclosures, practical facts, KARWEI guidance and route-planner links. |
| Partners | One horizontal row of the four original brands, with native horizontal browsing, optional motion and explicit controls. |
| Full menu | Photo-led title, compact rows, normal mobile document flow, native disclosures and stable cart controls. |
| Reservations/legal | Stationary form and compact practical information; editorial legal chapters in both core languages. |
| Public events | Seven pages with Dutch primary metadata, visible/schema breadcrumbs and a shared verified business graph. |

The partner rail pauses on touch/pointer interaction or keyboard focus. It supports previous/next, Arrow keys and Home/End; reduced motion or missing observers stops automatic motion while retaining native browsing. Only four original items form the semantic list; the looping visual copy is inert and hidden from assistive technology. Without JavaScript, the original row remains available. These behaviors are implemented in [DrinkPartners](../app/components/DrinkPartners.tsx) and its stylesheet.

The recorded `qtEl0n7z1LSeYdyHiZ19Y` review contains 97 visual states and 44 rail states, including reduced-motion, touch, keyboard and no-JavaScript cases. It also identified a mobile cover-image defect, which was separately corrected and retested. Proof: `%TEMP%/shah-cinematic-route-qa-20261111/webpack-qtEl0n7z1LSeYdyHiZ19Y/final-actual-visual/final-public-visual-review.json` and the adjacent `partner-rail-qtEl0n7z1LSeYdyHiZ19Y/partner-rail-results.json`. These are scoped captures, not a final whole-site accessibility certificate.

## Image and font delivery

Six existing restaurant photos have 60 AVIF/WebP variants with dimensions and small placeholders; every variant is below 200,000 bytes. Original sources remain. [Restaurant photo manifest](restaurant-photo-assets-v1.json).

Ten event-gallery originals now have **80** controlled AVIF/WebP variants at 320, 640, 960 and 1280 pixels. All are below 200,000 bytes; maxima are 192,305 AVIF and 197,878 WebP. All ten original hashes remain unchanged; all 80 derivatives pass the recorded metadata/orientation checks. The existing grid/aspect containers remain, and confirmed photographed-subject caption errors were corrected. Unknown administrator uploads retain their existing Next Image path and are outside this 80-file guarantee. [Asset manifest and scoped visual review](event-gallery-assets-v1.json), [integration notes](event-gallery-assets-v1.md).

For the ten supplied gallery photos, the first figure is immediately visible: its entry animation is disabled while eager/high-priority image loading remains. The other nine retain their existing entrances. Hj2's app-script-blocked check records first-figure opacity 1, no entry animation and a decoded image; copy, grid, hover styling and the other photos are preserved. [Hj2 verification](cinematic-cookie-ssr-verification-2026-11-11.json).

Mobile menu thumbnails now use a 512-CSS-pixel `sizes` contract to retain detail for tall cover crops. The `SK_WHU6G9CzKDtJ1iVaCs` review decoded 12 AVIF responses across six cases; all sampled images met their rendered physical-pixel cover requirement, including corrected 640-pixel/DPR1 and 1080-pixel/DPR2 selections. This is a selection/sharpness correction, not a pixel-equality or universal-device claim. Proof: `%TEMP%/shah-cinematic-route-qa-20261111/mobile-cover-SK_WHU6G9CzKDtJ1iVaCs/mobile-cover-fix-results.json` and `polished-SK_WHU6G9CzKDtJ1iVaCs/polished-functional-review.json`; the latter also records 80 served gallery variants and 40 gallery browser observations.

The captured public catalogue contains 224 products, 188 distinct product-image sources and two brand logos. Recorded optimized delivery covers 376 product responses and four brand-logo responses below 200,000 bytes, with decoded dimensions/orientation/metadata checks. This covers the pinned capture, not future uploads. [Product delivery proof](live-delivered-image-audit-2026-11-11.json), [brand-logo delivery proof](live-brand-logo-delivery-audit-2026-11-11.json).

Eight original Jost/Cormorant files remain byte-identical at versioned first-party URLs, preserving 25 faces/fallbacks and both OFL licenses. Fresh Hj2 browser proof records one fetch per Latin file on each of three sampled routes, zero home font preloads and two on the other sampled routes. [Exact font policy, hashes and current reuse evidence](FONT-PIPELINE.md).

## Content, schema and data boundary

The fresh Hj2 17-route SEO crawl verifies unique metadata, canonicals, 15 non-home breadcrumbs, shared business graphs and a sitemap with 17 URLs/17 revision dates/30 core alternates. Both nine-question FAQs match visible text. The two initial Menu schemas match the two visible dishes and prices in the pinned public snapshot; they do not expose the full catalogue as initially visible. Event pricing copy is preserved; mismatching structured offers were removed and services reference the shared Restaurant identity. [Final build-scoped SEO evidence](cinematic-final-seo-2026-11-11.json). The historical SK and later control crawls remain separately preserved.

Server catalogue reads use two bounded SELECTs in a read-only transaction, a 750ms deadline and size/shape checks. They do not initialize schema or fabricate a catalogue. A snapshot yields permanently to ready client data, including ready-empty. Reproducible previews use the captured actual 224-product/two-brand snapshot; they do not establish current live database contents or transaction success. A five-second diagnostic read succeeded; live success within the production 750ms deadline is not established. [Catalogue boundary proof](cinematic-ssr-catalog-2026-11-11-webpack-polish.json).

Owner-confirmed facts and official BAG/GVB evidence remain distinguished in [LOCAL-FACTS.md](LOCAL-FACTS.md). No new capacity, facility, certification, availability, history or ranking claim was added by the SEO correction.

## Measurement and remaining limits

Final Hj2 measurements and remaining acceptance limits are recorded in [CINEMATIC-FINAL-VERIFICATION.md](CINEMATIC-FINAL-VERIFICATION.md). NUcp and earlier pilot records remain controls. The external CSS gate passes; the external JavaScript gate remains unmet on every public route. Other score/timing results and limits belong to the final verification report rather than a duplicated control table here. These external-file gates exclude HTML, inline scripts, fonts, media, APIs, prefetch and deferred imports.

Google's current-CODE Rich Results tests have **not been run**. Local JSON-LD checks do not establish rich-result eligibility, indexing or rankings. Seven English event URL counterparts remain absent. Physical Safari/iPhone/iPad, real mobile GPU decoding, field Core Web Vitals and live booking/payment/email success remain unverified. Preview mutations are blocked. The existing notice buttons require JavaScript; a script-disabled visitor with only a legacy localStorage preference cannot be recognized by the server until a JavaScript visit migrates it, while a valid acknowledgement cookie works without JavaScript. Full-quality buffering and unknown future uploads retain their stated limits; no stutter-free or ranking guarantee is made.
