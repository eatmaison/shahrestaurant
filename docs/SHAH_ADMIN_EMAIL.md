# Shah Admin → Email

This adds a private contact directory and an opt-in-only email campaign workspace. No campaign is sent by a deployment, migration, customer import or preview.

## Rollout

1. Apply `db/migrations/20261124_shah_admin_email.sql` to the verified Shah Neon target using the existing versioned SQL workflow. It creates three tables without copying contacts, inferring consent or touching orders, accounts, reservations or Stock.
2. Deploy the application and open Admin → Email. The directory and consent records work with sending disabled. Confirm the site/brand ownership for historical data: Shah uses the existing `tandoor` site identifier; orders with a matching item brand are included, as are reservations for that site. Accounts enter the directory via activity at Shah or a linked Shah purchase or reservation. Untagged historical records with no trustworthy attribution are not assumed to be Shah customers.
3. To enable delivery, configure the existing Resend account/API key (`RESEND_API_KEY`), its verified sending domain, a monitored `SHAH_CAMPAIGN_FROM` mailbox at `shahrestaurant.nl`, and set `SHAH_CAMPAIGN_EMAIL_ENABLED=true`. Check mail quota, sender policy and whether the existing provider agreement covers this use. First verify a single explicitly consented internal test recipient and their unsubscribe link. Keep real customer campaigns disabled until that check passes.

## Use

The same email (trimmed and case-insensitive) merges records across the three sources. Blank fields remain blank. Name follows the account where available; contact details use the latest nonempty evidence. No identity is guessed from a matching name, street or phone. No address is inferred from a pickup or reservation. Contacts without proven permission are visible but cannot be selected for marketing. Record fresh, explicit, verifiable consent one person at a time; enter the date and source of the permission and retain the evidence separately under the restaurant's privacy rules. Do not infer consent from a purchase, reservation, account, or imported list. The privacy policy currently promises that marketing uses consent, even where Dutch law may allow narrower exceptions.

Select the eligible contacts across the entire filtered list, review the exact text and count, then confirm. Messages are delivered separately without revealing other recipients. Pending messages can be paused and resumed from the admin page. Closing the page does not start background sends; in-flight delivery can still complete. An unconfirmed provider outcome is never automatically retried; use the provider activity before resending. “Accepted” does not promise inbox delivery, and does not include later bounces.

Unsubscribes work without sign-in and immediately suppress pending marketing sends. A mailbox's one-click action may also POST the capability link; simply opening a link does not alter consent. An admin cannot override an unsubscribe via the normal consent form. For an access/deletion request, include the marketing permission and history in the restaurant's privacy workflow, preserving only any minimum suppression information the restaurant has a basis to keep. Review the retention of campaign bodies/evidence before enabling; never paste sensitive information into campaign copy or evidence notes.

References: [ACM spam guidance](https://www.acm.nl/nl/verkoop-aan-consumenten/reclame-en-verleiden/spam-voorkomen-uw-reclame), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
