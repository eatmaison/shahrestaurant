# Local verification baseline — 11 November 2026

This is an initial HTML baseline captured before implementation changes. It is a development-server crawl, not a production performance measurement. The configured remote database was never used: the preview process overrides `DATABASE_URL` with an unreachable loopback placeholder. No orders, reservations, accounts, payments, reviews or other transaction APIs were submitted.

## Stack and tooling

- Next.js 16.2.10 App Router, React 19.2.4, TypeScript, Webpack development server.
- Start command: `npm run dev -- --hostname 127.0.0.1 --port 3395`.
- Installed Chrome and Edge are available. Lighthouse and Playwright were absent from project dependencies and global tooling.
- Initial temporary Lighthouse CLI setup failed with an npm `ECOMPROMISED` lock error. A retry in a task-private Temp cache installed Lighthouse, but its CLI has a missing nested `string-width` dependency. The programmatic Lighthouse API imports successfully. It became available after implementation started, so no before-change Lighthouse scores exist.
- No INP, field Core Web Vitals, Rich Results Test result or search-ranking result was measured.

## Initial HTML route crawl

Byte counts are uncompressed development HTML, including Next development runtime data. Compile times are excluded from performance claims. There were exactly 21 file-based `page.tsx` routes before implementation, plus metadata routes and APIs.

| Route | Status | HTML bytes | Initial H1 | Indexability |
| --- | ---: | ---: | --- | --- |
| `/` | 200 | 84,938 | Shah Restaurant | index, follow |
| `/order` | 200 | 93,752 | Stel je bestelling samen | index, follow |
| `/reservations` | 200 | 65,256 | Reserveer uw tafel | index, follow |
| `/privacy` | 200 | 44,545 | Privacybeleid | index, follow |
| `/terms` | 200 | 44,159 | Algemene Voorwaarden | index, follow |
| `/account` | 200 | 39,265 | none in initial HTML | noindex, nofollow |
| `/admin` | 200 | 38,902 | none in initial HTML | noindex, nofollow |
| `/terminal` | 200 | 36,423 | none in initial HTML | noindex, nofollow |
| `/forgot-password` | 200 | 40,201 | Wachtwoord opnieuw instellen | noindex, nofollow |
| `/reset-password` | 200 | 39,546 | Kies een nieuw wachtwoord | noindex, nofollow |
| `/verify-email` | 200 | 38,703 | Link verlopen of ongeldig | noindex, nofollow |
| `/pay/complete` | 200 | 39,486 | Betaling niet voltooid | noindex, nofollow |
| `/events` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/events/about` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/events/birthdays` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/events/celebrations` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/events/company-catering` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/events/company-lunches` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/events/gallery` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/parties` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |
| `/parties/complete` | 404 | 9 | none | X-Robots-Tag: noindex, nofollow |

The events and parties sections are explicitly administrator-gated by the existing proxy. Their public 404 responses are intentional and are not missing public landing pages.

All rendered baseline HTML pages use `lang="nl"`. Public pages have self-referencing canonical URLs on `https://shahrestaurant.nl`. No reciprocal language alternatives were emitted.

Initial homepage title: `Indiaas restaurant Amsterdam-Noord | Shah Restaurant`.

Initial order title: `Indiaas eten bestellen in Amsterdam-Noord | Shah Restaurant Amsterdam`.

Initial reservation title: `Tafel reserveren bij Shah Restaurant Amsterdam-Noord | Shah Restaurant Amsterdam`.

`/robots.txt` returned 200 with 193 bytes. `/sitemap.xml` returned 200 with 676 bytes.

A nonexistent path returned a real 404 and H1 `Pagina niet gevonden`, but emitted both `noindex` and inherited `index, follow` robots meta tags, plus an inherited canonical pointing to the nonexistent URL.

## Isolated preview data

For browser verification, a temporary read-only proxy on `http://localhost:3396` forwards page and asset requests to the local app at port 3395. It serves the existing checked-in `TANDOOR_PRODUCTS` seed (104 products) and computes opening status from the existing hours module. Reviews, users, orders and reservations are empty. This is not a snapshot of live restaurant records, and it is not proof that the configured database or transactional flows work.

The proxy returns `X-Preview-Data: checked-in-seed-read-only`, blocks non-GET/HEAD requests and rejects unhandled API routes. Source product APIs and remote database configuration are unchanged. The proxy is a temporary verification tool, not deployment code.
