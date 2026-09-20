# Party / Events

Public page: `/parties`. Management: `/admin#party-admin`.

## Configuration

- Uses existing `DATABASE_URL`, `MOLLIE_API_KEY`, `APP_URL`, session authentication, SMTP/Resend and DigitalOcean Spaces configuration.
- Production requires `APP_URL` set to this site's canonical HTTPS origin. Register/allow the public callback `/api/parties/webhook` in any reverse-proxy or firewall rules.
- Production party administration requires an explicitly configured `SESSION_SECRET`; it will not use the existing development fallback secret.
- No payment-provider configuration means checkout is unavailable, never automatically paid. Use a Mollie **test** key in an isolated staging environment for payment acceptance testing.
- The first request creates the additive tables and triggers in `app/lib/partySchema.ts` and seeds the October 2 event once, scoped to the existing `SITE_ID`. Existing restaurant tables and food-order callbacks are unchanged. The database account needs DDL privileges for initialization, consistent with the existing project.
- Prices use integer EUR cents. Event times are Europe/Amsterdam local time; an earlier end time is the next day. The first event is October 2, 2026, 22:00 through October 3, 03:00.

## Payment And Capacity Guarantees

- Pending, failed, cancelled and abandoned checkouts consume **no** inventory. No temporary checkout holds are introduced.
- Checkout copies the server's event and price into an immutable booking snapshot. A stale displayed price is rejected, not silently replaced at payment time.
- The callback retrieves the payment from Mollie and checks its amount, EUR currency, site and booking metadata. Browser redirects never establish payment success.
- A PostgreSQL trigger atomically increments the event's capacity-checked counter on transition to confirmed. Repeated callbacks do not increment it again. Public/admin totals are derived from confirmed paid booking rows, not from a manually editable counter.
- Because inventory is not held during checkout, payments can finish after the final places sell. Such a booking becomes `refund_pending`, never confirmed. A full Mollie refund is requested using a stable idempotency key, with existing refunds checked before retrying. It becomes `refunded` only when Mollie reports that refund status. Customers see an explicit refund message.
- Refund/API failures return non-2xx so Mollie can retry. Admin **Check payments** retries outstanding payment, refund and confirmation-email work (30 bookings per batch). Monitor failures and retry until processed; a rejected/cancelled refund requires attention in Mollie.
- Paid confirmation emails use the existing mail service, HTML escaping, a database claim and retry on failure. Email delivery is at-least-once: a process crash after SMTP accepts mail but before the DB update can cause a duplicate. The browser confirmation remains usable independently of email.
- Booking access uses a random 256-bit bearer token whose hash is stored in the database. The return URL puts the token in its fragment, then moves it into session storage. It is not sent in HTTP URLs/referrers. Confirmation responses are private and uncached.

## Administration

- All management reads/writes independently require the existing signed-in administrator role. Writes validate same-origin requests and server-side Zod schemas.
- Create/edit events, upload images with the existing resizer/storage, publish/unpublish, close ticket sales, or cancel. Capacity cannot be reduced below confirmed tickets.
- Editing an event does not rewrite historical booking details or notify existing guests. Contact booked guests before changing a published date/time or cancelling an event. Cancelling closes sales and refunds newly completing payments; previously confirmed purchases require refunds arranged by the administrator in Mollie.
- Search guest name/email/phone/ticket ID, filter event/payment/ticket status, sort by purchase date, and browse 25 purchases per page. The totals reflect the selected event independently of guest search.
- Bookings cannot be deleted through application APIs or ordinary SQL DELETE because payment records need an audit trail. Apply the restaurant's retention/privacy procedures to contact data separately; no new marketing subscription is created.

## Verification

- `node scripts/test-party.mjs`: runs PostgreSQL schema and invariant tests in an isolated in-memory PGlite database, without contacting Mollie or writing shared production tables.
- `npx eslint app/parties app/api/parties app/admin/PartyAdmin.tsx app/lib/party*.ts app/lib/mollie.ts`
- `npm run build`
- Before taking live sales: complete paid, cancelled, failed and refunded test-key checkouts in staging; verify the public webhook URL and confirmation-email receipt. Confirm the restaurant's admission, cancellation and age policies before publishing additional claims about them.