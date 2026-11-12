# Guest recognition and Recently Online verification

Date: 2026-11-11. Local implementation only. No live database queries, data migration, deployment or publication was performed for this work.

## Implemented

- Registered lists contain every account already available to this shared restaurant admin, including accounts last active more than 24 hours ago or with no recorded activity. Guest traffic cannot displace registered accounts. Missing activity is shown explicitly, not as a fabricated visit date.
- Recent guest sessions retain the existing site and 24-hour scope. The server's 150-row guest/combined caps and the UI's silent 50-row cap are removed. Filtering/search/sorting precedes deterministic 50-row pagination.
- Guest names and emails come only from submissions linked to the exact visitor session. The session ID remains available. This is an unverified, submitted identity, never authentication.
- Conflicting names/emails or incomplete/placeholder names suppress attributed name/email. Orders and reservations belonging to registered accounts do not identify guest sessions.
- Possible-repeat totals match normalized full name, full delivery street/number/unit, and Dutch postcode. Pickup/incomplete addresses and conflicting email groups are excluded. A session with multiple complete delivery addresses does not get one combined matching total. Names/addresses are not fuzzily matched. Email dots/plus-tags, accents and apartment suffixes are preserved.
- Matching counts are explicitly described as possible matches, not a verified person. They overlap session counts and must not be added to them. Paid totals are separate from all recorded attempts. No customer, order or session records are merged.
- Identity enrichment runs only in the existing administrator bootstrap branch. Raw guest email/history was not added to public Order or Reservation mappers. Non-admin payloads remain empty for visitor identity/directory data. Existing private/no-store API caching remains intact.

## Reservation activation requires approval

Existing reservations have no reliable visitor-session link, so historical reservation-only guests remain unidentified. No name/email/time/IP guessing or backfill is performed.

`db/migrations/20261111_reservation_visitor_session.sql` is a manual, optional additive migration. It is deliberately absent from automatic startup DDL. The runtime checks whether the field exists and preserves the legacy insert when absent or metadata is unavailable. After the database owner approves and applies the migration to the intended database, new guest reservations can store the server-cookie session ID. A form-supplied session ID is ignored. Registered reservations do not inherit a guest session.

## Verification

- `node --test scripts/test-guest-recognition.cjs`: 20/20 passed. Coverage includes direct identity, ambiguous/shared sessions, Unicode/spacing, apartment distinctions, missing/conflicting emails, paid counts, account isolation, old reservations, privacy, 175 registered accounts plus 206 guests, filter-before-pagination and page clamping.
- Actual bootstrap and reservation functions were exercised with stubbed database/session/email dependencies. Real database/network access is prohibited in these tests.
- The optional migration, repeated application and pre/post-migration insert statements passed against disposable in-memory PostgreSQL (PGlite), not a configured application database.
- TypeScript check: `node node_modules/typescript/bin/tsc --noEmit --incremental false` passed after the implementation.
- Focused lint of new helpers and regression tests passed. Existing unrelated warnings in admin/server code are outside this task.
- Browser visual/interaction QA was not completed: the available Computer Use route stopped because Chrome's current URL could not be verified. No alternate UI route was used to bypass that stop. HTTP availability or unit tests do not establish visual correctness.

A synthetic read-only combined admin preview is available at `http://localhost:3472/admin` while the local helper is running. It includes 175 synthetic registered accounts and 106 guest sessions, with known, ambiguous and unknown examples. It blocks API writes and does not connect to live application APIs. This is test data, not a report of actual customer totals.

## Limitations

- Guest recognition depends on the browser cookie and an existing exact persisted link. Clearing cookies, switching devices, historical missing fields or never submitting an order/reservation can leave a visitor anonymous.
- Exact name/address similarity remains a heuristic even when email does not conflict. Shared households and false submissions are possible; the UI states that explicitly.
- Pagination is client-side over the existing admin bootstrap dataset. Every account is reachable, but large installations may eventually need a separate server-paginated admin endpoint. This change does not broaden the existing shared admin access model or add a new tenant boundary.
- Applying the optional reservation migration and deploying the code remain separate, unperformed actions requiring approval.
