# Shah admin restructuring — 13 November 2026

The admin workspace now separates daily operations, customers/visitors, statistics and events/photos. Existing brand colours, public pages, original order/reservation actions, product tools, VIP management, phone-agent work and approved media are retained. No production deployment, customer-data access, production migration, order, payment or email submission was performed.

## Review the running version

- Synthetic, read-only admin: http://localhost:4068/admin
- Accounts and Recently Online: http://localhost:4068/admin/customers
- Statistics and Customer Insights: http://localhost:4068/admin/stats
- Events and gallery tools: http://localhost:4068/admin/events
- Public site: http://localhost:3398/ and http://localhost:3398/en
- Same-Wi-Fi public site: http://192.168.0.122:3618/ and `/en`

The private preview uses **invented accounts, events and activity**, labelled LOCAL DEMO. Its API writes return 405. It binds to loopback only; the phone listener excludes admin, account, terminal, private parties, payment and recovery routes. This is not an authentication bypass in application source. The isolated Next runtime verifies a task-only signed session against a task-only, read-only role fixture. Production credentials and databases are not used. The private proxy's temporary demo session lasts 48 hours.

Build **`Q2nFHmc8z6XlftjRttVYU`**, `.next-review-shah-admin-release-20261113`, Next.js 16.2.10 / Webpack, 65 generated routes. Frozen source **`b3c001864ded7ec998ea4a347f91dc433c923b138204e069a262b48667321939`**, 483 inputs, identical before and after compilation/type checking. [Build identity](admin-redesign-build-2026-11-13.json), [input hashes](admin-redesign-source-2026-11-13.json).

From the repository, PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-admin-release-main.cjs"
node "$env:TEMP\shah-admin-redesign-20261113\start-or-verify-private-release.cjs"
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-Q2nFHmc8z6XlftjRttVYU-consent.json"
```

These task-local helpers verify/reuse matching previews; they do not replace unknown listeners. The normal application remains `npm run dev` / `npm run build` / `npm start`, with its separately configured backend and a real admin login. Do not point this synthetic review workflow at a production database. No firewall, VPN, router or network-profile setting changed.

## What changed

| Route | Purpose |
| --- | --- |
| `/admin` | Restaurant status, immediate order/reservation work, product tools, VIP requests, social links and existing phone panel |
| `/admin/customers` | Compact searchable/filterable account directory and Recently Online, 25 rows per page, full details/actions on demand |
| `/admin/stats` | Period filters, paid/company order values, daily chart/table, product/category summaries and Customer Insights |
| `/admin/events` | Existing private party/event booking manager and separately loaded public gallery manager |

All four routes have a shared navigation, refresh state and actual last-successful-load timestamp. Polling runs every 30 seconds only while visible and online. A failed refresh preserves the loaded data and shows an error. A new route can replace an in-flight request; aborted/stale responses cannot overwrite the selected scope. Main navigation does not prefetch the other private tools. Events/photo components mount only when selected.

The server still checks the current user's database role for private API data. The Next proxy now also guards `/admin` and every nested admin path, rejects invalid/expired/non-admin sessions and revoked roles, and applies private/no-store/noindex responses. Public `/events` pages remain public; `/parties` stays private.

Registered accounts retain contact/address, account type, verification, VIP, stored completed-order/points counts, timestamps, reservation counts, legacy estimated activity, history and copy actions. Account-type and verification actions use confirmation dialogs; account-type changes retain the existing expected-type conflict check. All 175 fixture accounts were reachable across seven pages. Search/filtering runs before pagination.

Customer Insights previously merged same-name guests and included unpaid personal orders in spend. It now groups by account ID, guest browser session, or an unlinked individual order. Conflicting session names are withheld. These are **order groups, not unique people**. Values distinguish paid orders from unpaid company invoices, deduplicate order IDs and use cents for accumulation. Unpaid personal orders are excluded. The daily chart preserves the existing paid-or-company definition, explicitly labels the separate order-count scale, and keeps Amsterdam date/DST handling. Category totals prefer the captured order-item category and are labelled gross item values before order-wide discounts, points and delivery. This is not a cash-received, refund reconciliation or accounting report. CSV exports protect user-supplied spreadsheet-formula prefixes.

Gallery loading failures no longer look like an empty gallery. Upload failure preserves the draft. Deletion requires confirmation and removes the visible photo only after a successful server response; rejected deletion retains it and reports the error.

## Sources, consent and uncertainty

The old `tm.cookieConsent` / `shah_notice_ack_v1` acknowledged a necessary-storage notice; it **never grants the new analytics permission**. The separate `shah_visit_analytics_v1` choice is off unless explicitly allowed. Preferences can be reopened from the footer. Withdrawal stops the observer and requests deletion of this browser's optional observations. Functional account/order records are retained.

With permission and the optional table installed, `/api/visits` accepts only same-origin, bounded, schema-validated observations on a fixed public-path allowlist. It stores restricted campaign slugs, an external referrer **hostname only**, the allowlisted path, timestamps and coarse uncertain activity/automation signals. It does not store raw referrer URLs, query strings, IPs, raw user agents, typed key contents or fingerprints in this table. Account identity comes from the server session, not the submitted body. Same-browser guest and signed-in contexts remain separate. First source is retained within each 30-day browser/account context; for an account with several browsers, the latest observed browser context is displayed.

Sources are first observed **after permission**. Visits before permission, missing/stripped referrers, JavaScript-disabled clients and historical activity may remain unknown. A current-page campaign is not proof of a person's true acquisition source. Crawler/automation user-agent names or reported webdriver state produce **Possible automation**; reported interaction produces **Interaction reported**. Neither verifies a bot, a human, or identity. No historical data is fabricated or backfilled.

Recently Online means a request observed within five minutes, not verified continuous attention. The existing visit counter counts bootstrap activity checks, not unique visits. Existing `activeSeconds` is labelled an interval-based estimate. Existing guest-recognition ambiguity rules and non-additive address-match counts remain intact.

### Optional migration — NOT applied in production

The ordinary admin redesign works without a database migration. New source recording requires [20261113_visitor_observations.sql](../db/migrations/20261113_visitor_observations.sql). Missing/restricted metadata or a missing table is a supported, clearly labelled state. Startup does not apply this migration.

Before enabling the optional table, an operator must review/approve it, take the normal database backup, verify `APP_URL` matches the real public origin and arrange expired-row cleanup with the existing database maintenance system. The migration creates a separate table/indexes and does not rewrite orders, reservations or historical identities. Records expire after a fixed 30 days; reads exclude expired rows immediately. Application reads/writes prune at most hourly; an idle installation also needs the documented daily cleanup job:

```sql
DELETE FROM visitor_observations WHERE expires_at <= now();
```

Physical cleanup depends on that job/application activity. The permission preference lasts 180 days. No production migration, maintenance job or legal-compliance certification was performed here.

## Measured results

[Density evidence](admin-redesign-density-2026-11-13.json) compares the preserved old synthetic admin and new customers page. Their old admin source hashes match the prior approved build. At 1440 px, sampled account cards fell from 280 px to 77 px; at 390 px,363.5 px to 162 px. New collapsed rows retain counts and usable controls. Rendering 25 rows instead of 175 and moving the other tools reduces the fixture document from about 14,570 elements to about 1,001. This is a layout/DOM measurement, not a real-device latency claim.

[Initial external JavaScript, gzip6](admin-redesign-bundles-2026-11-13.json):

| Route | Before combined admin | New route |
| --- | ---: | ---: |
| `/admin` |245,602 B|238,113 B|
| `/admin/stats` |245,602 B|204,827 B|
| `/admin/customers` |245,602 B|206,122 B|
| `/admin/events` |245,602 B|199,571 B|

The main route reduction is 3.05%. Main source shrank from 248,923 B to 159,063 B. Statistics omit visitor/reservation/VIP queries; events omit private order/user/reservation history. Other pages still receive full relevant history; pagination is client-side. No production SQL timing or large live-database benchmark was taken. The root framework/provider payload remains substantial; no general JavaScript-budget or real INP/LCP target is claimed solved.

The public homepage's initial JS grew from180,776B to184,219B (+3,443B, about1.9%) for the new consent controls. The observer itself loads only after permission. [Public comparison](admin-redesign-public-bundle-2026-11-13.json). Counts exclude HTML, API payloads, media, deferred imports, prefetch and nomodule scripts; they are not total-session transfer or Lighthouse scores.

## Verification and limits

- Build and TypeScript passed on the unchanged 483-input snapshot. Focused lint:0 errors/0 warnings. Full repository lint still has22 errors and 4 warnings in unrelated/pre-existing terminal, phone-agent and test-script code; no claim that full lint passes. [Findings](admin-redesign-lint-2026-11-13.json).
- Offline regression:6 new metrics/privacy/SQL/API/CSV cases,21 guest-recognition/scope cases,16 proxy cases, daily metric/DST/100k-order checks and actual chart/date-input rendering checks passed. Optional migration/queries ran against isolated in-memory PostgreSQL, including absent-table behavior, account separation, immutable first source, fixed expiry and browser/site-scoped deletion.
- [25 real HTTP authorization cases](admin-redesign-authorization-2026-11-13.json) passed against the real compiled proxy and isolated signed sessions/read-only role transport, including a changed database role. No production credentials were used.
- [24 browser layouts](admin-redesign-browser-2026-11-13.json): four fully loaded admin routes × EN/NL ×1440/390/360px, no page overflow or page JavaScript errors. Automated WCAG 2/2.1/2.2 A/AA checks reported no violations in tested workspace scans. This is not a full manual accessibility certification. Existing party management copy remains English.
- [Interactions](admin-redesign-interactions-2026-11-13.json), [gallery failures/successes](admin-redesign-gallery-browser-2026-11-13.json), [consent](admin-redesign-consent-browser-2026-11-13.json), [slow-request/error/visibility simulation and light/reduced-motion checks](admin-redesign-resilience-browser-2026-11-13.json) passed. Account/gallery writes were intercepted with synthetic responses, never sent to real services. Hidden-state/poll timing was simulated, not a physical background-device measurement.
- [50 public route/robots/sitemap/private-party HTTP checks](events-visibility-http-admin-redesign-20261113.json) passed. Existing photos/videos and all public event pages are retained. LAN verification passed56 policy checks,60 public asset HEADs,17 route/method guards,3 fixture APIs and4 media ranges. The exact public consent-observer chunk was added to the LAN asset allowlist; private pages and all submissions remain blocked. [LAN record](phone-preview-2026-11-11.json), [LAN browser check](admin-redesign-lan-browser-2026-11-13.json).
- [Four post-promotion playback cases](admin-redesign-public-playback-2026-11-13.json) verified EN/NL desktop and portrait sources, muted inline autoplay, increasing video-frame counts and media time. Seeking near the end exercised the existing film-to-content transition and confirmed the removed video cannot reappear through upward scrolling. These are PC Chrome checks (including the LAN URL), not fresh physical-phone or slow-network measurements.
- Public preview is read-only: ordering, payments, bookings, account changes, actual mail, external storage writes and real payment reconciliation were not exercised. No new physical-phone/Safari/screen-reader or production-load result is claimed. Local previews are not public deployment.

[Desktop accounts](admin-redesign-screenshots/customers-desktop.png), [mobile accounts](admin-redesign-screenshots/customers-mobile-light.png), [statistics](admin-redesign-screenshots/stats-desktop.png), [events](admin-redesign-screenshots/events-desktop.png), [mobile gallery](admin-redesign-screenshots/gallery-mobile.png).
