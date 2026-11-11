# Shah Restaurant audit

Audit date: 11 November 2026. Scope: the existing repository, localhost first. No deployment, publication, remote database writes or transactional submissions are authorized by this task. Read AGENTS.md and the installed Next.js 16.2.10 image, font, metadata, internationalization, headers and sitemap documentation before implementation.

## Baseline and preservation

- Stack: Next.js 16.2.10 App Router, React 19.2.4, TypeScript, Tailwind 4, ESLint 9. Node scripts: npm run dev (next dev --webpack), npm run build, npm start, npm run lint.
- Repository: 256 tracked files. Existing modifications in API routes, openingHours, rateLimit, providers, package.json and phone-agent belong to earlier work. Preserve them; no broad reset/staging/commit.
- Public page routes before work: /, /order, /reservations, /privacy, /terms.
- Restricted routes: /events and its six children, /parties and confirmation remain admin-only and noindex. Utility/account/auth/payment/admin routes remain noindex. Never turn private occasions into public SEO landing pages.
- Local preview started at http://localhost:3395 with process-only DATABASE_URL pointed at invalid loopback, so remote configuration is not used. Actual database-backed catalogue/booking success cannot be inferred from this preview.
- Baseline home GET: 200; development HTML 84,938 bytes; title "Indiaas restaurant Amsterdam-Noord | Shah Restaurant"; h1 "Shah Restaurant"; canonical https://shahrestaurant.nl; lang nl; no hreflang.
- Lighthouse is not installed or cached. A temporary-tool attempt is pending. No Lighthouse/CWV/INP or production route payload score has been measured; never treat development compile times as user performance.
- Attachment read completely (112 lines; 10,410 bytes) from Library. Supported local transfer failed: Windows Python has no os.setxattr; final local attachment path does not exist. No custom transfer bypass used.

## Files, assets, typography and palette

Public assets: 73 files, 157,748,673 bytes. JPEG: 10 / 37,553,137 bytes; MP4: 14 / 115,222,941; PNG: 16 / 411,649; SVG: 13 / 88,576; WebP: 20 / 4,472,370. Full reproducible file/route/asset inventory will accompany verification; generated .next/node_modules content is not source inventory.

Active original v4 film: desktop 36,744,691 bytes; mobile 11,337,072 bytes. HeroFilm currently fetches the whole movie into a Blob and holds scrolling/other page content inert for up to 60 seconds. Preserve source files, fullscreen composition and scroll-time mapping; remove blocking delivery, use native buffering, immediate still and slow-connection/reduced-motion fallback.
Posters: desktop 410,246 bytes; mobile 138,306 bytes, both over 120 KB. Other active sources: bar 220,768; room 153,334; table 76,786; dining 63,426 bytes. Next image optimization already supplies responsive AVIF/WebP. Legacy original JPEGs reach 9,370,303 bytes; retain originals, deliver optimized variants. No fabricated all-assets-under-budget claim.

Existing frozen palette is already in app/design-system.css: teal #0D4952, gold #E0AF59; light surface #fffdfa, page #fbf7ef, ink #0D4952; dark surface #0a3540, page #062b32, ink #f7f2e7. Preserve historical gold/neutral variants in the cascade. Do not introduce new hues.
Type: Jost body, Cormorant Garamond display via next/font (self-hosted by Next, swap). Body 16px, lead 18px, eyebrows 12px, h3 28px; home h2 50px/38px/34px; intro clamp(44px,4.8vw,68px), story clamp(42px,4.5vw,64px).
Logo renderer already uses original SVGs with explicit proportions; no redesign.
Preservation SHA-256:
- Desktop film: 91934E4FC834E7050F37B3CD2C6EE063779B622C22E8BA61E3C788B1E63D3A2C
- Mobile film: 685F08858741F06D04BC436C2B633AF01D2FB4E56A07C24F2FC5EC0D311B67F0
- Landscape gold logo: 13DE955BAE005CDCBD680ADAF6BE1546E2AEDC1452791F7640700AE73138E46B
- Landscape teal logo: B543B5EE55804B9044C7D8A570E859BF4977FFD673256A4124F22445139685B7

## SEO and section audit

Root: no crawlable English route; client language/localStorage switches a single canonical after hydration. Canonical patterns exist but no reciprocal alternates. Sitemap has five URLs, no lastmod/language alternates. Robots excludes APIs/private areas. Subpages lack visible/schema breadcrumbs. Reservation/menu titles duplicate brand through template and their social cards use an older existing asset.
Restaurant JSON-LD has invalid priceRange "???" and unverified coordinates. Omit unknown fields. NAP/hours consistent: Shah Restaurant; Klaprozenweg 36a, 1032 KL Amsterdam; +31 20 341 2995; info@shahrestaurant.nl; Tue-Sun 15:00-22:00; Monday closed. Menu data is client bootstrap, initially empty. Existing own-site reviews generate AggregateRating/Review; retain visible genuine data, omit eligibility claims and unsupported rating markup.
Home h1 is generic/hidden. Hero lacks immediate cuisine + location + booking information. Add concise visible context/CTA without changing existing copy or film. Menu/search/category/detail/gallery dialogs already functional; preserve prices and data. Semantic Menu markup must be generated only from actual currently visible catalogue data.
Gallery/story/evening/reviews/visit/FAQ/partners/closing/footer are present. Reveals already share an observer and unobserve fired targets; tilt is rAF/pointer-fine. Reduced motion path exists. Do not add expensive canvas/video effects.
Visit: click-to-load LocationMap exists on reservations. No verified nearest stops, walking times, bike/paid-parking/accessibility facts. Link to current route planners and ask guests to contact the team instead of inventing them. Existing home "open now" incorrectly uses the 21:30 ordering cutoff; dining continues until 22:00.
FAQ: three public answers plus one admin-only. Add factual/confirmation-based answers for actual visitor questions; keep schema and visible answers identical.
Accessibility: some controls 44-46px versus 48px target; improve bounded common touch controls, visible focus, reduced motion. Keyboard/console/mobile QA remains required.

## Search reconnaissance (11 November 2026)

Search sampled restaurant Amsterdam, where to eat Amsterdam, Indian restaurant Amsterdam, Indiaas restaurant Amsterdam-Noord, branded/address and landmark variants. This is an unpersonalized sample, not a ranked-position study.
- Shah already appears with cuisine/location title and booking snippet: https://shahrestaurant.nl/
- Mt Everest reservation result has a direct booking title, form, NAP and hours: https://mteveresttandoori.nl/reserveren/
- Meghna publishes actual menu-category links and truthful area/landmark context: https://meghna.nl/
- Broad restaurant searches also return large directories/editorial collections, including Michelin: https://guide.michelin.com/us/en/noord-holland/amsterdam/restaurants
Gap: expose equivalent English/menu/booking information to crawlers, accurate entity data, direct booking and useful arrival answers. Do not target all Amsterdam neighborhoods with doorway pages, impersonate another Shah-named restaurant, or claim "best", canal view, lunch/late-night or unverified facilities.
Structured-data guidance reviewed: https://developers.google.com/search/docs/appearance/structured-data/local-business . Google describes reviews of other businesses; own-business stars are not a promised feature. SearchAction requires an actual site search target; no fake endpoint will be added.

## Implementation order and gates

1. This audit and KEYWORD-MAP.md must exist before source changes.
2. Crawlable NL/EN public pairs with clean Dutch URLs; preserve legacy deep links/queries through one-hop redirects, private/auth restrictions.
3. Self-canonicals, reciprocal nl-NL/en/x-default, social cards, sitemap and breadcrumbs.
4. Non-blocking original hero delivery, optimized still variants, existing-palette usability.
5. Factual home/FAQ/location context, actual-menu schema, consistent dining status.
6. Typecheck, lint, production build, public GET crawl, language/schema/link checks, browser mobile/keyboard QA, measurements available locally. No purchase/reservation/email/payment submissions.
7. Leave localhost preview running, report exact command, changed files, measured budgets and explicit gaps. External Rich Results and Search Console submission require a public reachable version/account and will be documented, not claimed.

## Verification log

Implementation not started when this audit was first written. Measured outcomes and remaining budget gaps will be appended after changes.
