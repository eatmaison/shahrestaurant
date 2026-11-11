# Font delivery and redirect verification

Updated 2026-11-11 for final build `Hj2ubUjCMfbacacwFligZ`, source `1b9a194de54237b2104232c89ce249729ddd466a648d819a1118bcd81717fc62` (418 inputs), compiled in `.next-review-cookie-ssr-20261111`. Final acceptance, metrics and unmet targets belong to [CINEMATIC-FINAL-VERIFICATION.md](CINEMATIC-FINAL-VERIFICATION.md). `NUcp9_HWho-gmCR-jRh8K` and SK captures remain prior controls; the three-route browser evidence below is fresh Hj2 proof.

The public scope is 17 URLs: five NL/EN core pairs and seven unpaired Dutch-first event URLs. English event URL counterparts are not implemented; English UI strings do not create alternate canonicals. The font policy applies through the shared root layout.

## Provenance and exact preservation

The earlier Webpack artifact `lFTqIAU9xP5fM3RMpYwdn` served no font preload links in HTML or HTTP `Link` headers on the sampled home, menu and English privacy routes. Its font manifest was empty despite `.p` filenames. Filenames alone therefore did not prove working hints.

[app/fonts.css](../app/fonts.css), imported by the root layout, now references versioned first-party files under `public/fonts`. All eight WOFF2 files were copied byte-for-byte from that artifact, with no conversion, subsetting or glyph changes: 181,252 bytes total. [FONT-INVENTORY.csv](FONT-INVENTORY.csv) records URLs, full SHA-256 hashes, versions, subsets, weights, licenses and original assets. [FONT-SOURCES-v1.json](../public/fonts/FONT-SOURCES-v1.json) retains the original font-face declarations and source mapping.

Jost 3.710 retains Cyrillic, Latin Extended and Latin subsets with CSS weights `100 900`. Cormorant Garamond 4.001 retains Cyrillic Extended, Cyrillic, Vietnamese, Latin Extended and Latin subsets, with the existing separate CSS weights 400/500/600/700. Its underlying variable axis supports 300–700; the CSS weight coverage was not expanded. All faces remain normal style with `font-display: swap`. The 23 original subset/weight faces and two fallback faces are preserved apart from their URLs.

| Fallback family | Local font | Ascent | Descent | Line gap | Size adjust |
| --- | --- | --- | --- | --- | --- |
| Jost Fallback | Arial | 111.45% | 39.06% | 0.00% | 96.01% |
| Cormorant Garamond Fallback | Times New Roman | 95.27% | 29.59% | 0.00% | 96.98% |

The same `--font-jost` and `--font-cormorant` stacks remain global. Checked-in [Jost](../public/fonts/OFL-Jost-v1.txt) and [Cormorant](../public/fonts/OFL-Cormorant-Garamond-v1.txt) licenses retain the authoritative SIL OFL 1.1 notices from the Google Fonts [Jost](https://raw.githubusercontent.com/google/fonts/main/ofl/jost/OFL.txt) and [Cormorant](https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt) sources. License hashes are recorded in both inventories.

Repository attributes retain LF for OFL files and binary treatment for WOFF2. This prevents Windows `core.autocrlf=true` from changing license bytes and breaking raw hash checks on checkout. No global renormalization was performed.

## Preload and cache policy

Every route except `/` and `/en` emits two matching Latin preloads with `as="font"`, `type="font/woff2"` and `crossOrigin="anonymous"`:

- `/fonts/jost-latin-235d8f8964bf-v1.woff2` — 26,588 bytes.
- `/fonts/cormorant-garamond-latin-5d618c462b7a-v1.woff2` — 37,776 bytes.

This includes the public event pages, private routes and unrecognized paths. The film-first home screens contain no page text, so they add no competing font preload hints. Font faces remain available through CSS on home; no preload does not mean no font request. Versioned files receive `Cache-Control: public, max-age=31536000, immutable`; changed bytes require new hashed/versioned filenames.

## Final recorded browser reuse

[cinematic-cookie-ssr-preflight-2026-11-11.json](cinematic-cookie-ssr-preflight-2026-11-11.json) identifies Hj2 and records three passing font-route cases. Its hashed `font-noscript-redirect-preflight.json` proof records the exact observations below; the referenced raw proof's SHA-256 was checked against that manifest.

| Sampled route | Font preloads | Jost Latin requests | Cormorant Latin requests | Recorded result |
| --- | ---: | ---: | ---: | --- |
| `/` | 0 | 1 | 1 | Correct computed typography; no duplicate requests; zero horizontal overflow. |
| `/menukaart` | 2 | 1 | 1 | Correct computed typography; no duplicate preload/CSS requests; zero horizontal overflow. |
| `/en/privacy` | 2 | 1 | 1 | Correct computed typography; no duplicate preload/CSS requests; zero horizontal overflow. |

This proves one request per Latin URL in each recorded Hj2 route case, including reuse of the preloaded files by CSS. It does not establish every browser, all 17 routes or cross-page warm-cache behavior. Earlier NUcp and [SK core functional captures](cinematic-final-core-functional-2026-11-11.json) recorded the same pattern but remain historical controls. Physical Safari/iOS and unrecorded device/cache paths remain unverified.

Hj2 also preserves the clean opening while rendering the unchanged cookie notice in first-visit server HTML on text pages. Valid acknowledgement cookies suppress it; the head bootstrap respects legacy localStorage preferences before paint. These changes do not alter the font bytes, families, fallback metrics or preload policy. [Cookie/first-paint verification](cinematic-cookie-ssr-verification-2026-11-11.json) records first-visit, acknowledgement, legacy migration, blocked storage and keyboard checks. The main reviewed preview is http://localhost:3398/; the tested helper invocation is in [LOCAL_PREVIEW.md](LOCAL_PREVIEW.md).

## Redirects and focused checks

Redirect destinations use `new URL(request.url)`. The installed `NextURL` retained an incoming trailing-slash flag when its pathname changed, causing self-redirects or slashes on alias targets. Native URL serialization keeps the query values and 308 status without that inherited flag. Public `/events` remains accessible; private `/parties` checks and the exact payment-webhook exception remain in place.

Recorded focused checks after implementation passed without network or production database calls:

| Check | Recorded scope/result |
| --- | --- |
| `node scripts/test-public-fonts.cjs` | Eight font hashes, 25 original faces, both license hashes, matching CSS/preload URLs and immutable caching; 13 server-layout route cases. |
| `node scripts/test-proxy.cjs` | 11 cases using real installed `NextRequest`/`NextURL`, including canonical redirects and private-party/webhook behavior. |
| Preserved original proxy regression | Seven redirect assertions fail as expected; the corrected proxy passes all 11 cases. |
| TypeScript and focused ESLint | Passed for the implementation checks; final build-wide status belongs to the final verification report. |

The fresh Hj2 preflight also records five actual 308 redirects without self-loops, including query preservation where `%20` becomes the semantically equivalent `+`. Live-host behavior remains unobservable through the fixture that rewrites `Host`; real-NextRequest/source tests cover it. These font and redirect observations are not a whole-site accessibility, performance or transactional-success claim. Seven English event URL counterparts remain absent, and Google's current-CODE Rich Results tests have not been run.
