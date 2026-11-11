# Public events and private parties

Original isolated visibility-worker record, 11 November 2026. Its no-commit statement applied to that step. The public integration is now included in local project commits; nothing was deployed or pushed. The final combined build Hj2ubUjCMfbacacwFligZ passed all 31 HTTP cases on the main localhost preview, with 418 inputs unchanged. See [current verification](CINEMATIC-FINAL-VERIFICATION.md) and [current HTTP proof](events-visibility-http-20261111.json). No production database write or migration occurred.

## Route behavior

- Public to guests, registered accounts and admins: `/events`, `/events/about`, `/events/gallery`, `/events/birthdays`, `/events/celebrations`, `/events/company-catering`, `/events/company-lunches`.
- `/parties` and every nested page remain admin-only. Guests and ordinary accounts receive 404. The proxy and server layout independently check access.
- `/api/parties` and nested listing, admin, booking and checkout endpoints remain admin-only. The proxy returns 403 for unauthorised callers; each handler independently checks the current admin role before touching data.
- The existing exact `/api/parties/webhook` exception remains for payment reconciliation. It returns no booking information and verifies payment details through Mollie. No webhook or payment transaction was triggered during this task.
- Public desktop and mobile navigation now include the events dropdown. The homepage gallery/story links, events card, occasion links and celebrations FAQ are public. The evening grid consistently has three cards. The footer gallery link is public.
- All seven event pages are indexable and present in the sitemap. Parties remain excluded from the sitemap and robots, with private/no-store and noindex headers.

## Data boundary

Event pages contain public marketing content. Gallery reads use the existing site-scoped public gallery endpoint; mutations still require admin. Private party guests, bookings and management data were not exposed or moved into public APIs. Admin role is read from the database, not trusted from a JWT role claim.

## Verification

- `node scripts/test-proxy.cjs`: 11 checks passed, including preserved public canonical redirects and private party access.
- `node scripts/test-event-visibility.cjs`: 11 grouped regression cases passed. Real JWT verification and NextRequest objects, isolated role/database fixtures, no network calls. Covers all public routes for guest/user/admin; private nested routes and API methods; malformed/forged/expired sessions; deleted/demoted accounts; role lookup failure; missing production session secret; RSC-like requests; exact webhook exception; independent server layout/API guards; real desktop/expanded-mobile header and footer JSX; sitemap, robots and homepage policy.
- Focused ESLint and project TypeScript passed. Repository-wide ESLint still reports 22 unrelated errors and 6 warnings in terminal, phone-agent and older scripts; no visibility-task file has an error.
- Existing 20 guest-recognition tests, admin metrics suite and admin chart JSX tests passed against the combined checkout.
- Independent read-only security review found no actionable regressions.
- Local webpack build `Gj41vNXYLZSBV42x-eb2p` passed in `.next-review-events-20261111`; 31 HTTP route/session cases passed. The final source comparison deliberately fails because concurrent cinematic edits changed `app/layout.tsx` and `app/components/DrinkPartners.tsx` after the build snapshot. All visibility-task application files still match. The cinematic task owns the final combined rebuild and must rerun `scripts/test-event-http.cjs` against it. Current evidence: `docs/events-visibility-http-20261111.json`.
- Browser visual and interaction verification has not been performed for this change. Authenticated roles were checked using offline fixtures, not live user accounts. Dynamic gallery uploads were not read from production.

## Files

Application changes: `proxy.ts`, `app/events/layout.tsx`, `app/components/header.tsx`, `app/components/footer.tsx`, `app/page.tsx`, `app/home.module.css`, `app/lib/homeContent.ts`, `app/robots.ts`, `app/sitemap.ts`.

Tests: `scripts/test-proxy.cjs`, `scripts/test-event-visibility.cjs`, `scripts/test-event-http.cjs`.

## Local review

Read-only preview: http://localhost:3482/events . All API writes are blocked; data is the existing public fixture, not production data. Dynamic uploaded gallery images are not available in this fixture. This preview contains the verified visibility fix but predates the latest unrelated cinematic source edits.

Final combined-build command: `node scripts/test-event-http.cjs <.next-review-build> <http://127.0.0.1:app-port> <http://127.0.0.1:read-only-preview-port>`. The test uses only loopback origins, records the build ID and route results, and fails if any application source changed since the build snapshot.
