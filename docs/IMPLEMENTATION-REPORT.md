# Shah Restaurant implementation and verification

11 November 2026. Final source build: ZvsF7jSptyH4JJlRdUepP. Local review only; nothing deployed or published. The implementation preserves the existing restaurant data and the prior unrelated changes in this working tree. The full requested definition of done is not claimed: the JavaScript budget remains exceeded, and field Core Web Vitals and live transaction success have not been established.

## Review and start

Production preview: http://localhost:3398/
Dutch pages: /, /menukaart, /reserveren, /privacy, /voorwaarden.
English pages: /en, /en/menu, /en/reservations, /en/privacy, /en/terms.

Port 3398 is an explicitly read-only preview proxy over the production app at 3397. It uses the existing checked-in 104-product seed, not live database records. Users, orders, reservations and reviews are empty; non-GET/HEAD requests and unhandled APIs are blocked. This protects the real database and prevents review clicks from placing orders or reservations. Catalogue rendering and interactions are tested; actual database prices, payments, email and booking submissions are not verified by this fixture.

Ordinary project development command:
```powershell
npm run dev -- --hostname 127.0.0.1 --port 3395
```
The running verification process overrides DATABASE_URL with an unreachable loopback value. See the verification report for the exact persistent production/proxy start commands and temporary tool paths. The original .env files were not edited.

## What changed

- Audit and keyword map were written before source edits: AUDIT.md and KEYWORD-MAP.md.
- Ten crawlable public routes with server-correct Dutch/English HTML, one primary intent per page, selfcanonicals and reciprocal nl-NL/en/x-default.
- Legacy /order, /reservations and /terms permanently redirect once to Dutch canonical paths, retaining query values. Host/path canonicalization is combined. Transactional deep links continue to work.
- Titles are unique and within 50-60 characters; descriptions are unique and within 140-158. Matching Open Graph/Twitter metadata uses the existing social image.
- Sitemap emits ten public URLs, revision lastmod and language alternatives. Utility and protected pages remain noindex/outside sitemap.
- Visible and structured breadcrumbs are in the public route wrappers, so client navigation updates them correctly.
- Unknown pages return real 404/noindex without misleading canonicals. Existing event/party admin authorization is preserved.
- URL-driven language state and shared localized links retain the selected language through navigation. English switching loads the actual English URL, rather than relabeling one canonical after hydration.

## Section pass

| Section | Change or preservation |
| --- | --- |
| Header/navigation | Original SVG logo and placement retained; localized links; accessible names include visible language labels; targeted 48px controls and focus styles. |
| Hero | Same original fullscreen v4 films, dimensions, duration and scroll/frame mapping. Poster/content immediately usable. Full original file prebuffers in the background; decoded film appears only when scrolling requires it. |
| Intro | Existing prose and hospitality voice preserved; visible cuisine/location H1 added in hero. |
| Menu/highlights | Loading feedback and the guest notice reserve stable space; inactive brand labels retain sufficient contrast. Existing products/prices untouched; actual visible dishes generate Menu/Section/Item/Offer schema, with no seed prices hardcoded into product code. |
| Gallery | Existing photos/composition preserved; keyboard, arrows, End, Escape and focus restoration verified. |
| Story | Existing copy, palette and visual treatment preserved. |
| Dining/takeaway | Existing flows retained; links stay in current language. |
| Occasions | Existing admin-only visibility and access restrictions retained. |
| Reviews | Existing genuine API-backed visible reviews retained; unsupported own-business rating markup removed. No fabricated guest text or scores. |
| Visit/contact | NAP and weekly hours unchanged; scheduled dining status uses 22:00 rather than the earlier ordering cutoff; actual operational availability is not promised. |
| Arrival | Current route-planner links and contact advice; no invented nearest stops, line numbers, walking times, parking or accessibility claims. Existing click-to-load map remains. |
| FAQ | Eight public questions in each language, identical visible answers and FAQ schema. Unknown terrace/payment/child/parking details are questions for the restaurant, not assertions. |
| Partners/footer/cookie | Existing copy and partners retained; localized public links; targeted focus/touch improvements. |
| Motion | Existing shared observer/reduced-motion foundations retained; stable hero track avoids hydration/failure height jumps. Removed already-hidden global atmosphere markup and unused animation CSS. |
| Legal/templates | Existing legal text preserved, localized URL pairs and breadcrumbs added; revision dates use existing higher-contrast text colors. |

## Preservation and measured assets

All four protected film/logo hashes match AUDIT.md. No video re-encoding, recut or timing changes; original menu source, prices and contact data are unchanged. Existing teal/gold and neutral color values are preserved; docs/DESIGN-TOKENS.md records tokens and typography.

| Poster | Before | New AVIF | New WebP |
| --- | ---: | ---: | ---: |
| Desktop source / delivery 1600 px | 410246 B | 109653 B | 113000 B |
| Mobile source / delivery 608 px | 138306 B | 64406 B | 76500 B |
| Desktop responsive 960 px | — | 82537 B | 92946 B |
| Mobile responsive 360 px | — | 37243 B | 37440 B |

Desktop AVIF is 73.3% smaller than the prior desktop still; mobile AVIF is 53.4% smaller. All delivery stills are under 120,000 bytes and visually inspected. Originals remain. Other images continue through the existing responsive Next AVIF/WebP pipeline; unknown administrator image sources remain compatible rather than being deleted.

## Video: waiting, quality and smoothness

Full-file buffering is valuable for scroll-controlled seeking, which can jump through the movie rather than play sequentially. The implemented solution retains that strategy and the original quality. It removes the requirement to lock the entire page while waiting.

1. Render the responsive still and booking information.
2. After the still settles, schedule a low-priority phase of work at browser idle (the fetch itself uses normal browser priority).
3. Download the untouched whole v4 file; decode/warm up using the existing attached Safari native strategy or an effect-owned detached Blob video in Chromium.
4. Keep the picture as the initial visible image. Chromium keeps its video out of the document until a decoded scroll target is ready; the original fullscreen stage and initial still stay visible. Safari retains the attached native warmup path.
5. Save-Data, reduced motion and detected 2G use the still. A 60-second loading timeout also returns to the still without blocking the page.

Observed Chrome film tests on build tFLXBf6wgrceydEy2vlvL with the read-only production preview. The final ZvsF7jSptyH4JJlRdUepP build changes only menu layout/contrast and descriptive privacy/date text styling; the tested film logic and original files are unchanged:
- Fast unthrottled loopback desktop: original 36,744,691-byte 1920 x 1080 film ready by the first 1.07 s poll; duration 12.25 s. Real-wheel scroll seeks settled in 48.5, 36.1 and 24.9 ms.
- Simulated slow 4G mobile (1.6 Mbps, 150 ms): poster complete by 3.22 s; original 11,337,072-byte 608 x 1080 film ready by 61.75 s after navigation. The restaurant remained usable with no page/body lock. Real-wheel seeks settled in 60, 26 and 19 ms.
- Save-Data and reduced motion: no MP4 request.
- Initial Chromium prewarming has no attached VIDEO or VIDEO LCP candidate. Real wheel input attaches the decoded original frame; no runtime exceptions were observed.
- The final guard waits for the still's decode and two animation frames before optional movie work. Opacity/visibility-only pilots were rejected because Chrome still counted the hidden movie as LCP.

These are local Chromium observations, not a guarantee of stutter-free playback. Real Safari/iPhone hardware, different CPU/storage, cache conditions and interrupted connections remain unverified. A full-quality desktop film may exceed the timeout on slow connections. Non-reduced fallback keeps the stable cinematic scroll track; reduced-motion CSS uses one viewport.

## Validation and limits

- Production build and TypeScript pass.
- Changed public files have no lint errors. Full-project ESLint reports 22 existing errors and 6 warnings in terminal, phone-agent tests, utility scripts and existing code; those were not rewritten as part of this task.
- Ten public routes:200, correct HTML language, one H1, correct selfcanonical and three reciprocal language alternatives.
- 180 internal link/anchor instances crawled with no broken destinations, wrong-locale English destinations or publicly exposed private events.
- Real404/private routes and one-hop legacy redirects verified.
- 320 x 568 and375 x 667 mobile checks have no horizontal overflow; reservation and phone hero CTAs remain above the cookie notice.
- Gallery keyboard/focus, menu filters/search, eight-question FAQ/schema equality, English route switch, no eager map iframe, no missing alt or broken loaded images, and no runtime exceptions were verified.
- Local preview data does not validate actual live menu edits, real review content, database access, payment/booking/email submission or external service availability.
- Google code validation is recorded in docs/STRUCTURED-DATA-VALIDATION.md (two valid business/organization items, one optional priceRange warning). Final Lighthouse results are in docs/FINAL-VERIFICATION.md; exact bundle membership is in docs/PAYLOAD-BUDGET.md. No before-change Lighthouse baseline exists, so no before/after score delta is claimed.
- JS budget of 120 KB gzip remains unmet. See docs/PAYLOAD-BUDGET.md for actual route membership and framework/provider/icon attribution. Do not equate CSS compliance or passing SEO with meeting every requested performance target.
- Price range, verified coordinates, social profile identities and dietary certification fields remain omitted pending evidence. SearchAction is omitted because the site has no real URL-addressable site search. No invented reviews/ratings or promises of rankings.
- The sitemap path is https://shahrestaurant.nl/sitemap.xml. It has not been submitted to Search Console, and there is no live deployment to submit.

## Files changed by this task

SEO/routing: app/layout.tsx; proxy.ts; app/robots.ts; app/sitemap.ts; app/lib/locale.ts; app/lib/seo.ts; app/components/Breadcrumbs.tsx; eight new public page wrappers under app/en, app/menukaart, app/reserveren and app/voorwaarden; metadata layouts under app/order, app/reservations, app/privacy and app/terms. The privacy/terms page bodies have only the revision-date color classes changed.

Public UI: app/providers.tsx (only URL language/initial-language changes, preserving pre-existing status work); app/page.tsx; app/home.module.css; app/lib/homeContent.ts; app/order/page.tsx; app/reservations/page.tsx; app/components/{LocaleLink,MenuSchema,ArrivalInfo}.tsx; ArrivalInfo.module.css; header.tsx; footer.tsx; CookieConsent.tsx; CatalogFeedback.tsx; DrinkPartners.tsx; HeroFilm.tsx; HeroFilm.module.css; app/accessibility.css; app/optimizations.css.

Assets: eight new /public/brand/shah-hero-poster-*-delivery-v1* AVIF/WebP files.
Documentation: audit/map, asset/file inventories, frozen token report, baseline, payload and final verification reports.

Pre-existing API/opening-hours/rate-limit/phone-agent/package changes and unrelated untracked hero assets were preserved. Measurements use this preserved working tree, including earlier uncommitted work; the task commits do not capture those earlier edits. No deployment, publication, transaction or external message was sent.

## Local commits

The initial automatic approval block was resolved by the owner's explicit approval for local commits. No deployment or remote push occurred.

- 03a895b — Audited bilingual routes and factual SEO.
- 9e1c4df — Full-quality background hero buffering and homepage/asset pass.
- b050f08 — Stable menu loading and visible-dish schema.
- dc8b6aa — Localized reservation links and factual arrival guidance.
- a6731b3 — Existing-palette legal revision-date contrast.
- Verification/audit documentation is saved in the final report commit.

Only this task's language hunks were staged from the previously dirty provider file. Earlier status/API/phone-agent/package modifications remain unstaged. The index is verified empty after commits.

## Final measured acceptance

All 20 final-build Lighthouse rows score 100 for Accessibility, Best Practices and SEO. Desktop Performance is 94-100; mobile legal pages score 100. Mobile home/menu/reservation pairs score 83-86, with LCP 4.18-4.61 s, so the mobile Performance/LCP goals remain unmet. CLS is at most 0.01701 and TBT at most 88 ms across the runs. JavaScript is 218.8-233.7 KB gzip and remains above 120 KB; CSS is 27.3-40.0 KB and passes the strict 40,000-byte check. These are local simulated lab results with seed data, not live traffic or field INP. Full route tables and methodology are in [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md).
