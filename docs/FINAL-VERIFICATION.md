# Final local verification — 11 November 2026

Final production build: `ZvsF7jSptyH4JJlRdUepP`. All 20 final mobile/desktop route measurements are complete. The baseline is in [verification-baseline-2026-11-11.md](verification-baseline-2026-11-11.md).

## Scope and data isolation

The local review server uses the production build on loopback. An explicitly read-only proxy supplies the existing checked-in 104-product catalogue and computes hours using the existing schedule module. Users, orders, bookings, reviews and social records are empty fixtures. They are not a live-data snapshot. The production database configuration files remain unchanged; the preview process overrides its database URL with an unreachable loopback placeholder.

No reservation, checkout, payment, email, review or account mutation was submitted. The proxy blocks non-GET/HEAD requests and rejects APIs outside the two public fixture responses. This means transactional behavior and the configured live database have not been verified. The app has not been deployed or published.

## Browser checks completed

The full interaction regression was repeated on build `ZlYNbva0yq_WTF9vuv_-Z`. The subsequent final source change only darkened two legal-page date labels; final navigation, legal styling and all twenty Lighthouse runs were checked on `ZvsF7jSptyH4JJlRdUepP`.

- Fresh 375x667 and 320x568 screens have no horizontal overflow. Both hero reservation and phone CTAs fit above the dismissible cookie notice; 320px is a tight fit.
- Gallery opens with Enter; ArrowRight and End navigate; Escape closes; focus returns to the trigger and body overflow restores.
- Menu category filtering and search work. The rendered Menu schema follows the visible result set. In the seed fixture, searching `butter chicken` yields the matching single EUR 26.00 MenuItem.
- Eight visible FAQ questions match eight FAQPage entities.
- No Google Maps iframe loads before interaction.
- Full-page image scroll found no missing alt attributes or broken loaded images.
- Header language switching navigates to `/en`, sets `lang="en"`, changes the H1 and retains English public navigation.
- No browser runtime exceptions were observed during the completed interactions.
- An initial HTML crawl checked 180 internal link instances across ten public locale routes: no broken internal targets, missing anchor IDs, wrong-locale English public links or public links to administrator-gated sections. The expected `/account` utility link remains.
- Legacy `/order`, `/reservations` and `/terms` each issue one 308 redirect to the Dutch canonical route and then return 200. The selected-dish query survives the menu redirect.

## Media verification

The original protected hero files remain the source: desktop 36,744,691 bytes, 1920x1080; mobile 11,337,072 bytes, 608x1080. Both are 12.25 seconds. Frame targeting retains the original 24 fps quantization. The film prebuffers fully; it is not an adaptive stream.

The film engine was tested on build `tFLXBf6wgrceydEy2vlvL`; later changes only affect labels, reserved menu space and text contrast. On an unthrottled desktop connection, the detached original was observed ready by the first 1.07 s poll. At initial scroll 0 no video was attached, and the native browser observer recorded no VIDEO LCP candidate. Real wheel input attached a decoded original frame; 25%/75%/0 seek checks settled in 48.5/36.1/24.9 ms with the expected frame times.

With simulated 1.6 Mbps download and 150 ms latency, the mobile poster was complete by the 3.22 s poll, and the complete 11,337,072-byte film was observed ready by 61.75 s (one-second polling). The poster and restaurant content stayed accessible throughout, with no body/inert lock. After readiness, the three real-wheel seeks settled in 60.3/26.2/18.9 ms. Save-Data and reduced-motion checks made zero MP4 requests and retained the static poster. No runtime exceptions were observed. These few seeks are not a dropped-frame benchmark or a guarantee of stutter-free playback.

Real iPhone/iPad Safari testing remains pending. The native WebKit warmup branch is retained, but Chrome viewport emulation does not verify Safari or a real mobile GPU. [WebKit video policy documentation](https://webkit.org/blog/6784/new-video-policies-for-ios/) is reference material, not a device-test result. Full local evidence is in [film-verification-2026-11-11.json](film-verification-2026-11-11.json).

## Performance and SEO measurements

One sequential lab navigation was measured per device/route using Lighthouse 13.6.0. All 20 rows identify build `ZvsF7jSptyH4JJlRdUepP`. Film checks and other Lighthouse batches did not overlap the final measurements; unused test tabs were reset to blank. Mobile uses Lighthouse's simulated mobile settings; desktop uses its desktop configuration. Scores vary with host load, cache and simulation. These are production-build localhost fixture measurements, not field data.

### Mobile

| Route | P | A | BP | SEO | LCP (s) | CLS | TBT (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 83 | 100 | 100 | 100 | 4.611 | 0.01701 | 88.0 |
| `/en` | 83 | 100 | 100 | 100 | 4.581 | 0.01701 | 71.5 |
| `/menukaart` | 85 | 100 | 100 | 100 | 4.365 | 0.00000 | 34.5 |
| `/en/menu` | 86 | 100 | 100 | 100 | 4.226 | 0.00000 | 30.5 |
| `/reserveren` | 86 | 100 | 100 | 100 | 4.186 | 0.00000 | 39.5 |
| `/en/reservations` | 86 | 100 | 100 | 100 | 4.176 | 0.00000 | 44.0 |
| `/privacy` | 100 | 100 | 100 | 100 | 1.219 | 0.00000 | 37.0 |
| `/en/privacy` | 100 | 100 | 100 | 100 | 1.225 | 0.00000 | 39.0 |
| `/voorwaarden` | 100 | 100 | 100 | 100 | 1.222 | 0.00000 | 42.5 |
| `/en/terms` | 100 | 100 | 100 | 100 | 1.219 | 0.00000 | 36.5 |

### Desktop

| Route | P | A | BP | SEO | LCP (s) | CLS | TBT (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 99 | 100 | 100 | 100 | 0.834 | 0.00000 | 0.0 |
| `/en` | 99 | 100 | 100 | 100 | 0.874 | 0.00000 | 0.0 |
| `/menukaart` | 94 | 100 | 100 | 100 | 1.571 | 0.00000 | 0.0 |
| `/en/menu` | 99 | 100 | 100 | 100 | 0.929 | 0.00000 | 0.0 |
| `/reserveren` | 99 | 100 | 100 | 100 | 0.670 | 0.00000 | 0.0 |
| `/en/reservations` | 100 | 100 | 100 | 100 | 0.609 | 0.00000 | 0.0 |
| `/privacy` | 100 | 100 | 100 | 100 | 0.390 | 0.00000 | 0.0 |
| `/en/privacy` | 100 | 100 | 100 | 100 | 0.403 | 0.00000 | 0.0 |
| `/voorwaarden` | 100 | 100 | 100 | 100 | 0.306 | 0.00000 | 0.0 |
| `/en/terms` | 100 | 100 | 100 | 100 | 0.299 | 0.00000 | 0.0 |

### Acceptance results and remaining limits

- Performance >= 92: 14/20. The mobile Performance/LCP targets remain unmet on `/`, `/en`, `/menukaart`, `/en/menu`, `/reserveren`, `/en/reservations`. Reaching them requires further client architecture/rendering work; they are not declared complete.
- Accessibility >= 95: 20/20; Best Practices >= 95: 20/20; SEO100: 20/20. The final weighted accessibility audits reported no failing findings. Automated checks do not establish complete WCAG conformance.
- LCP<1.8s: 14/20; CLS<0.02: 20/20; TBT<150ms: 20/20. INP was not measured and must not be inferred from TBT.
- The route JavaScript budget remains unmet; exact gzip payload and static hash checks are documented in [PAYLOAD-BUDGET.md](PAYLOAD-BUDGET.md). Lighthouse request transfer sizes include headers, runtime requests and prefetch behavior and are not exact gzip-bundle sizes. The full original film also keeps total first-visit media transfer high by design.
- No valid pre-change Lighthouse baseline exists, so no before/after score deltas are claimed. Development compile times and unlike-build HTML sizes do not establish performance deltas.
- No rankings, Search Console submission, field Core Web Vitals, real mobile GPU behavior, live database or transactional flow were validated by these runs. Rich Results/local schema scope is documented separately in [STRUCTURED-DATA-VALIDATION.md](STRUCTURED-DATA-VALIDATION.md).

Compact final data: [performance-results-2026-11-11.json](performance-results-2026-11-11.json). Full per-route Lighthouse JSON and internal QA screenshots remain in `C:\Users\DaviiC\AppData\Local\Temp\shah-preview-20261111`. Earlier pilot files are historical diagnostics and are excluded from these tables.

## Local review commands

From the project directory:

```powershell
npm run build
$env:DATABASE_URL = 'postgresql://preview:preview@127.0.0.1:1/preview'
$env:APP_URL = 'http://localhost:3397'
npm run start -- --port 3397
```

In a second PowerShell window:

```powershell
node "$env:TEMP\shah-preview-20261111\preview-proxy-production.cjs"
```

Open **http://localhost:3398/** or **http://localhost:3398/en** for the read-only review. The direct app runs at http://localhost:3397/ with no live database access. The temporary proxy script must remain present for the second command. Both servers bind to 127.0.0.1.

Completion check: the direct production page and both read-only locale entry points returned HTTP200. Only the three task-owned headless test browsers were closed; the loopback production server and read-only proxy remain running.
