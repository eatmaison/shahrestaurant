# Shah admin: second improvement round

This round builds on `1b50d4682ef5e3b503a6e05710693266d040d1aa`. The first admin restructure is documented in [ADMIN-REDESIGN.md](ADMIN-REDESIGN.md). The changes below are additional work; the earlier route split, compact account rows, guest recognition and optional consent-based source recording are retained.

All development and checks use local builds and invented data. No deployment, production migration, real order, payment, email, customer edit or external image upload was performed. The unrelated `phone-agent` working tree is excluded.

Verified build: `xAq9sMM06TxZlpVjSRdv3`, `.next-review-shah-admin-plus50-final-20261113`, 496 unchanged inputs, source SHA-256 `c5dfe68d113f96ab7cd28782fd427392cf2002332990b14ad4b06cb993b1cd62`. [Build identity](admin-plus50-build-2026-11-13.json), [input hashes](admin-plus50-source-2026-11-13.json). All 65 routes generated. All [244 public asset hashes](admin-plus50-assets-2026-11-13.json) match the prior release, including the approved photographs and English/Dutch videos.

## Current previews and restart commands

- Public: http://localhost:3398/en and http://localhost:3398/.
- Synthetic, read-only, loopback-only admin: http://localhost:4068/admin, `/admin/customers`, `/admin/stats`, `/admin/events`.
- Same-Wi-Fi public preview: http://192.168.0.122:3618/en and `/`. Admin/account/private-party pages and all writes remain blocked on this listener.

From this checkout in PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-admin-plus50-main.cjs"
node "$env:TEMP\shah-admin-plus50-20261113\start-or-verify-private-main.cjs"
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-xAq9sMM06TxZlpVjSRdv3.json"
```

These task-local helpers verify the frozen build/fixture or start on free designated ports; they do not stop unknown listeners. Keep Temp helpers, fixtures and build files together. They are not portable production deployment commands. Standard project development remains `npm run dev -- --port 3398` when that port is free; unlike the guarded review this connects the configured application services.

## Numbered changes

These 60 entries group related behavior rather than counting individual translations, labels or repeated instances as separate improvements. Gold light mode and larger public navigation are separate from this count.

1. Offline status disables the workspace refresh action and suspends scheduled requests; reconnect requests fresh data.
2. Administrators can pause and resume automatic workspace refresh without losing the displayed snapshot.
3. Failed automatic refreshes back off exponentially, capped at five minutes, rather than repeating every interval.
4. A snapshot older than 90 seconds receives a visible warning alongside absolute and relative load times.
5. Private workspace skeletons and a recoverable route error boundary replace an unrelated public loading screen and unrecoverable view failure.
6. Workspace navigation gains heading focus on route changes, an active-tab reveal on small screens and an explicit skip-to-content target.
7. List navigation adds first/last pages and a validated page-number jump, focusing the relevant results heading after explicit page changes.
8. Lists offer bounded 10/25/50-row preferences stored per list in session storage; searches and personal data are not stored there.
9. Directory, visitor, history, image and booking searches normalize accents and support formatted telephone numbers.
10. Search-heavy lists use deferred queries and busy-state semantics while React updates their results.
11. The account directory can filter customers and administrators independently of its existing VIP/company/verification filters.
12. Accounts can be sorted alphabetically with deterministic ID tie-breaking.
13. Expanded order history becomes an on-demand, searchable, paginated explorer with paid/unpaid filters.
14. Account details distinguish loaded paid/unpaid order counts and paid value from the stored completed-order counter.
15. Personal account, insight and booking exports require an explicit confirmation showing the filtered row count and information being exported.
16. Expand/collapse controls identify their account, visitor or customer group in accessible names rather than repeating an ambiguous “Details”.
17. Copy controls report success, a permission-denied manual-copy fallback and timed status reset; obsolete async results are ignored after unmount or another attempt.
18. Account and visitor reference IDs are visible and copyable for unambiguous support checks.
19. Missing legacy activity stays “Not recorded”; invalid and future dates no longer imply recent observed activity.
20. Account-change confirmations compare the captured user/email/state with the latest loaded snapshot before submitting.
21. Email verification uses an atomic parameterized server update conditioned on captured email and verification state; missing, stale and already-completed changes are distinguished.
22. Both administrative account mutations require the configured same origin, retaining server-side admin authorization.
23. A 401 on those account mutations immediately clears the private user/order/visitor/VIP snapshot and draft cache; logout and admin-identity changes also clear drafts.
24. Recently Online can restrict the loaded records to the past hour or past 24 hours.
25. Source filtering separates records with no observation from recorded direct/unavailable observations.
26. Visitor source coverage and provenance explain that observations describe available browser context, without inventing first-touch attribution or human certainty.
27. An observed public path can be opened safely in a separate tab, restricted by the existing public-path allowlist.
28. Daily charts, financial summaries and customer groups share duplicate-order-ID handling so duplicate snapshots do not inflate one view differently.
29. A visible quality summary counts malformed timestamps, order values and item rows; relevant calculations exclude invalid values without rewriting records.
30. Statistics compare bounded periods with the preceding equal-length calendar period, including explicit incomplete-current-period and zero-baseline explanations.
31. Delivery/pickup statistics use the same eligible order set and retain an explicit unknown historical category.
32. Date inputs add future-date constraints, associated error text and an inclusive Amsterdam calendar-day summary.
33. A previous-calendar-month shortcut handles month boundaries and leap years.
34. The daily table supports chronological direction and active-date filtering before pagination.
35. Statistics exports use selected-period filenames and export the full filtered table, rather than the visible page.
36. The product explorer supports normalized search, quantity/gross-value ranking and top-ten/all-results expansion.
37. Customer Insights can filter account, explicitly linked guest-session and unlinked-order groups independently.
38. Customer groups can be ranked by average order value with deterministic tie-breaking.
39. Customer Insights describes the top-five concentration within the selected groups, explicitly avoiding a claim about unique people.
40. Missing group names are distinguished from conflicting submitted session names.
41. Image preparation rejects unsupported, empty and over-10-MB files, impossible dimensions and images over 40 megapixels before raster allocation.
42. Image decoding has a timeout, cancellation and object-URL cleanup; preparation sequence guards prevent an older selection replacing a newer draft.
43. An unconfirmed gallery upload blocks another submission until an explicit successful refresh/check; only a confirmed response clears its draft.
44. Image/event drafts are held per administrator in tab memory, survive section and SPA-route changes, warn on link navigation/tab closure and clear on session loss; no draft persistence or autosave API was added.
45. The uploaded gallery gains caption search, category filtering, chronological/name sorting and bounded pagination.
46. Uploaded/event thumbnails validate URLs and render an accessible fallback after a failed image load.
47. New gallery uploads require bounded English and Dutch descriptions, with counts and field guidance.
48. Prepared image previews show source/output dimensions and byte estimates so an administrator can inspect the actual delivery derivative before saving.
49. Manual gallery refresh preserves a draft and existing loaded images on failure, showing an error rather than falsely declaring an empty gallery.
50. Event management, field guidance, statuses, confirmations and guest-list UI now have English and Dutch copy.
51. Event requests use bounded loading, abort on unmount, avoid overlapping polls, pause while hidden/offline and retain earlier data on refresh failure.
52. Payment reconciliation explains its external effects and requires confirmation; an uncertain result blocks repetition until an explicit server-state refresh/check.
53. The event guest list exports all matching purchases with a personal-data confirmation, independently of pagination.
54. Event-list search and visibility/status filters operate separately from booking filters.
55. Event editing validates individual fields, duplicate URLs, real dates, times, price, image URLs and capacity against recorded tickets, with focusable error links.
56. Publication and cancellation changes receive an impact confirmation explaining that purchased details remain and refunds/guest communications are separate actions.
57. New-event titles suggest a normalized URL slug until the administrator edits the slug manually.
58. The mobile guest table retains actual column headers and explicit cell associations; its scrollable region is keyboard accessible.
59. The operations product catalogue mounts only when opened or reached through its local link, retaining parent-held form state when collapsed.
60. A daily attention queue links to pending reservations, VIP requests and today's recorded failed/cancelled personal payment attempts, without silently processing them.

## Separate visual requests

`app/light-gold.css` scopes a darker gold page/surface/soft palette to explicit light mode. Slate/white utility surfaces, forms, options and cookie controls are mapped consistently; app surfaces are gold rather than white. Photographs, logos, video pixels and operating-system picker surfaces are not recolored. Light-only danger/status/button colors were adjusted after actual contrast findings. Dark tokens remain unchanged.

The main desktop navigation increases from 13 to 15 px with weight 600; dropdown links use 15 px and collapsed-menu links 16 px. Existing 48 px targets and responsive navigation remain. Tests cover both locales and themes, including the 1280 px desktop boundary.

## Verification records

- [48 fully loaded admin layouts](admin-plus50-browser-2026-11-13.json): four routes, EN/NL, dark/gold, 1440/390/360 px; screenshot and automated accessibility findings are recorded, including failures rather than silently omitted.
- [Workflow checks](admin-plus50-workflows-2026-11-13.json): all 175 synthetic accounts, page-size preference, normalized searches, export confirmation, clipboard paths, captured-state conflicts, daily sorting/filtering, insight controls, catalogue mounting, attention links, 57 guest purchases, editor validation, draft retention, actual raster preparation, uncertain upload blocking, publication/reconciliation cancellation and narrow expanded layout.
- [Lifecycle checks](admin-plus50-lifecycle-2026-11-13.json): broken thumbnail fallback, native navigation cancellation, public-route/Back draft restoration, no draft storage, gallery failure retention, reconciliation repeat guard, real Next `unstable_retry` recovery and unauthorized private-snapshot clearing.
- [Refresh/backoff checks](admin-plus50-refresh-2026-11-13.json) and [delayed/hidden/reduced-motion checks](admin-plus50-resilience-browser-2026-11-13.json) use an explicitly simulated clock/visibility where stated; these are not physical-device background measurements.
- [25 real compiled authorization cases](admin-plus50-authorization-2026-11-13.json) use signed synthetic sessions and a narrowly scoped read-only role transport, including role revocation. [50 HTTP public-route/access/sitemap/robots checks](events-visibility-http-admin-plus50-20261113.json) also assert build identity and unchanged source.
- `node scripts/test-admin-plus50.cjs` runs ten synthetic helper/SQL/API regression cases. The email compare-and-set query runs against isolated in-memory PostgreSQL, including stale-email/state, idempotent success, missing records and non-admin denial. Existing redesign/privacy, guest-recognition, metrics/DST/100k-order, chart/date-rendering and proxy checks are retained.
- [Public theme/navigation audit](admin-plus50-public-theme-2026-11-13.json) records six widths from 360 to 1440 px in both themes/locales, key public/account pages, gold surface checks and dark-token comparisons. The intro can temporarily make the header transparent; comparison records distinguish that state from changed tokens.
- [14 first-frame/default/saved-theme and authenticated-header cases](admin-plus50-theme-default-header-2026-11-13.json) include both OS themes and EN/NL top-level admin navigation at 1280/1440 px. The 48 admin-layout scans reported zero automated violations; the public gold scans also reported zero. Three public dark contrast groups reproduce in the [preserved prior release](admin-plus50-dark-contrast-baseline-2026-11-13.json) and are not claimed fixed.
- [LAN verification](phone-preview-2026-11-11.json): 56 policy cases, 60 asset HEADs, 17 route/method guards, three guest-only fixture APIs and four approved video ranges passed. [LAN browser check](admin-plus50-lan-browser-2026-11-13.json) confirms the exact consent observer loads while its write stays blocked. [Four playback cases](admin-plus50-public-playback-2026-11-13.json) verify increasing media time and actual video-frame counters for both languages and desktop/portrait sources, plus the closing transition and inability to return to the removed film. These are PC Chrome and mobile-viewport checks, not fresh physical-phone results.
- Focused lint reports zero errors/warnings. The [whole-repository lint record](admin-plus50-lint-2026-11-13.json) retains 22 errors and four warnings in pre-existing/unrelated code, including an unused variable elsewhere in `serverStore.ts`; no claim that full lint passes.

[Gold desktop accounts](admin-plus50-screenshots/customers-desktop-gold.png), [dark mobile accounts](admin-plus50-screenshots/customers-mobile-dark.png), [gold statistics](admin-plus50-screenshots/stats-desktop-gold.png), [mobile guest list](admin-plus50-screenshots/events-mobile-gold.png), [gold homepage](admin-plus50-screenshots/homepage-gold.png).

## Measurements and limits

The on-demand catalogue reduces the matching synthetic operations document from roughly 5,175 to 1,735 elements and from 539 to 107 controls at 1440 px. The [DOM record](admin-plus50-dom-2026-11-13.json) includes the 390 px comparison. This is a reduction in rendered work, not a measured real-device INP guarantee.

New functionality increases initial admin JavaScript. [Gzip6 bundle records](admin-plus50-bundles-2026-11-13.json) and the [public comparison](admin-plus50-public-bundle-2026-11-13.json) show the exact costs. No global JavaScript budget, Lighthouse score, instant loading or guaranteed performance improvement is claimed.

| Route | Prior initial JS gzip6 | New initial JS gzip6 | Change |
| --- | ---: | ---: | ---: |
| `/admin` | 238,113 B | 243,468 B | +5,355 B |
| `/admin/stats` | 204,827 B | 213,761 B | +8,934 B |
| `/admin/customers` | 206,122 B | 214,139 B | +8,017 B |
| `/admin/events` | 199,571 B | 204,717 B | +5,146 B |

The public homepage increases by 166 B gzip6. Figures exclude HTML, APIs, media, deferred imports and prefetch, and are not total-session transfer sizes.

Client pagination still loads the authorized relevant history; this round does not introduce database pagination or measure production SQL latency. Source/bot observations remain optional, consent-bound, recent and uncertain; historical attribution is not reconstructed. The previously documented optional observation migration/retention prerequisites still apply. This round introduces no database migration or automatic migration execution.

Gold-theme checks do not imply an accessibility certification. Public dark-mode contrast findings are retained in the report; the requested dark palette was preserved. Synthetic error-boundary tests intentionally inject one malformed response. Real external storage, payment reconciliation, email delivery, physical phones, Safari and screen-reader behavior are not newly verified. Read-only previews cannot save changes.
