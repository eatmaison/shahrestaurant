# Reservations, guest recognition and catalogue follow-ups

The public My reservations list now shows bookings made with the signed-in profile or its exact normalized account email, including for administrators. Ordinary accounts verify email before accessing email-only bookings; administrators retain their existing read permission while the list still uses their own email. The default bootstrap is personal, with no customer directory, global reservation list or guest identities. Full collections require an explicit authorized admin scope; the protected kitchen terminal retains its operations scope.

The server filters before serializing, and the page independently filters cached rows before sorting. Leaving admin clears the private snapshot and reloads personal data. Late responses for a different route scope are discarded. Failed loads offer retry instead of claiming there are no reservations. Existing cancellation and review actions recognize authorized email-linked bookings; foreign bookings remain rejected for ordinary accounts. No ownership row is rewritten or claimed.

## Guest customers and visitor activity

Guest sessions used to be limited to the past 24 hours even when an old order had an exact saved session link. The query now retains order-linked historical sessions. Submitted guest contacts without reliable browsing attribution have separate order-history records, searchable by name, email, address, order reference or record ID. Their order date is not converted into a browsing session, source or online status. Ambiguous shared-browser identities remain anonymous; their individual submitted contacts remain searchable as history. No IP, partial-address or fuzzy-name matching is introduced.

Direct session orders and separate exact name/address matches can both be opened. Related matches are labelled separately and are not added to session totals. Customer orders dialogs link to /admin/customers using an order ID rather than personal data in the URL. Search, history-only filtering and clearing a deep link are supported. History-only records never inherit browser observations. A recorded linked order submission can contribute to functional activity; the UI labels this explicitly. Guest reservation/arrived counts use actual linked statuses. Registered accounts remain searchable independently of guest volume.

A targeted read-only transaction checked only the two user-supplied order links, one supplied session reference and aggregate link presence. Both supplied orders had historical session links outside the old 24-hour window; the supplied current anonymous session had no linked orders. No production row was changed. Raw audit metadata remains outside the repository; no customer name, address, session reference, order identifiers or timestamps from that audit are included in the published evidence. This is separate from the synthetic browser and SQL tests.

## Menu and approved photograph

Initial menu selection no longer prefers Soups: it follows the first populated category in the saved administrator order. A late live catalogue reconciles an older/missing server snapshot once, while preserving a visitor's explicit category, brand or subcategory choice. The usual initial house restaurant is unchanged; switching to Shah to go uses its own sequence.

The reservation hero uses the already approved food-focused dining photograph in AVIF/WebP/JPEG at its existing responsive breakpoints. Its blur placeholder and responsive preload links now match that artwork. The obsolete hero preload is removed. No photo file, theme palette, dependency or image-generation output was changed.

## Verified release

Build **amap-EWDoPlscfZd3totK**, source **a28b8411a41ccb362e135723c29946056635b80a06055cbc8d77e879baf52037**, 504 frozen inputs, 67 routes. Build and TypeScript passed, with all 244 public media files unchanged. [Checks](personal-reservations-checks-2026-11-14.json), [source](personal-reservations-source-2026-11-14.json), [build](personal-reservations-build-2026-11-14.json).

- 44 regressions passed: node --test scripts/test-personal-reservations.cjs scripts/test-product-workspace.cjs scripts/test-guest-recognition.cjs scripts/test-public-catalog.cjs. Actual bootstrap/mutation functions, isolated PostgreSQL ownership and historical-session SQL, role/scope rejection, contact grouping, ambiguous sessions, no fabricated observations and catalogue persistence were exercised. In 1,005 synthetic reservations only three authorized personal bookings were returned; an unverified ordinary account received its one profile booking.
- [12 personal layouts and three real client-navigation workflows](personal-reservations-browser-2026-11-14.json): EN/NL, both themes, 942/390/360px, no foreign-card flash, failed refresh/retry and stale admin response handling.
- [Six menu variants and two delayed-response workflows](personal-reservations-menu-default-2026-11-14.json): EN/NL, 1440/390/360px, reordered Tandoori Starters/Pizzas, reload, restaurant switching and preserving a user's Curries choice before the live response.
- [16 actual hero variants](reservation-hero-browser-2026-11-14.json): both languages/themes, desktop/phone and 1x/2x density, requested approved image, successful decode, no overflow or obsolete dining request; three JPEG fallbacks return 200.
- [12 guest layouts and two navigation workflows](guest-recognition-browser-2026-11-14.json): historical-name search, legacy contacts, linked/related order details, order reference search, history-only filtering and customer-dialog deep links. Four scoped axe scans found zero violations. No site-wide AA claim is made.
- 50 public HTTP cases and 59 byte-matched LAN assets passed. Focused lint: zero errors and one existing hook-dependency warning in OrderExperience, reproduced on the published baseline. The catalogue test loader now supports its existing TSX icon dependency.

No production latency/frame-rate claim, physical-phone/Safari/screen-reader test, real order/payment/email, migration or live deployment is claimed. The read-only previews use synthetic accounts and a pinned public catalogue; actual admin saves were verified with isolated SQL/API fixtures. No dependency or mandatory database migration was added. Existing optional observation/session-link migrations remain separate and unapplied. [GitHub handoff and safe server-update prerequisites](GITHUB-RELEASE-HANDOFF.md).

Public: http://localhost:3398/en/reservations and /en/menu (Dutch /reserveren and /menukaart). Synthetic personal admin example: http://localhost:4068/en/reservations. Synthetic customer search: http://localhost:4068/admin/customers; try Sample Repeat Guest or Legacy Order Contact. Same Wi-Fi: http://192.168.0.122:3618/en. All review submissions are blocked.

Guarded PowerShell start/verify from this checkout, requiring matching build and local Temp fixtures:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-personal-reservations-v8-main.cjs"
node "$env:TEMP\shah-gold-cinema-20261113\start-or-verify-private-personal-reservations-v8.cjs"
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-amap-EWDoPlscfZd3totK.json"
```
