# GitHub release handoff - 13 November 2026

Target: **eatmaison/shahrestaurant**, branch **main**, authenticated **eatmaison** account. The verified website revision is `8c3edd718c95013be5ae7bdae46d73d7abdb1a64`; the publication tip also includes this documentation update. Compare the final published commit with `git rev-parse HEAD` on the server. No Droplet login, restart, production data change or migration is part of this publication.

The release fast-forwards the existing GitHub revision `42c485c23b926a7c588e2bb1df9f0cbd3c06f1f6`. It includes the approved photo/gallery/FAQ followups and the restructured admin workspaces, compact customer directory, corrected statistics and optional consented visitor-source observations. Existing unrelated, uncommitted `phone-agent/` work and local control documents are excluded. Environment files, credentials, temporary synthetic admin/auth fixtures, compiled builds and dependency directories are excluded.

Verified combined build: `Q2nFHmc8z6XlftjRttVYU`, Next.js 16.2.10 / Webpack, source `b3c001864ded7ec998ea4a347f91dc433c923b138204e069a262b48667321939`, 483 frozen inputs. [Current implementation, measurements and exact verification limits](ADMIN-REDESIGN.md). Build/type checking, focused lint, 24 EN/NL desktop/mobile browser layouts, 25 real compiled-proxy authorization cases, 50 public HTTP checks, gallery/consent/conflict tests and four video-frame/playback cases passed. Browser writes used synthetic responses; real orders, payments, email, production database performance and a new physical-phone/Safari test were not exercised. Full repository lint retains 22 unrelated errors and four warnings. Performance budgets are not all solved.

## Current migration and retention prerequisites

The ordinary admin redesign needs **no mandatory new migration**. `app/lib/db.ts`, `db/schema.sql`, dependencies and automatic startup DDL have not changed relative to the GitHub base. Do not apply SQL just to make the site start.

The new [20261113 visitor observations migration](../db/migrations/20261113_visitor_observations.sql) is **optional, additive, manual and not applied**. Without it, source fields remain unavailable and existing admin tools continue. Before enabling it, review/approve the SQL, take the normal database backup, verify `APP_URL` is the actual public HTTPS origin and schedule expiry cleanup using the existing maintenance system. The cleanup statement is:

```sql
DELETE FROM visitor_observations WHERE expires_at <= now();
```

Observations have fixed 30-day expiry and are excluded after expiry. Physical deletion requires application cleanup or the scheduled daily job, including idle periods. Only the new explicit analytics permission enables observations; old cookie-notice acceptance never does. No historical source is backfilled. Possible automation/interaction labels remain uncertain; no unique-person, first-touch attribution or verified-human claim is made. [Consent, retained fields and limitations](ADMIN-REDESIGN.md#sources-consent-and-uncertainty).

The earlier optional `20261111_reservation_visitor_session.sql` caveat below still applies. Neither migration was run in production.

## Update procedure

Use the guarded Git commands and staged-build/maintenance-window guidance below. Confirm a clean checkout, the correct origin and fast-forward ancestry, create the backup branch, and use `npm ci` then `npm run build -- --webpack` in the existing release workflow. Do not build over a running server's active `.next` directory. Restart only the confirmed existing Shah service after a successful build; its production process manager/name and live checkout have not been inspected, so no guessed restart command is supplied. Preserve environment values and the configured port. Verify public EN/NL pages, menu, reservations, admin authorization and videos without submitting real transactions.

## Historical 12 November release

Target: `https://github.com/eatmaison/shahrestaurant`, branch `main`, using only the authenticated `eatmaison` account. This handoff publishes website source; it does not deploy or restart the droplet.

The website release includes all 551 inputs from the verified local build `6zD0ge5SdqAm0X_krXcdr` (Windows source fingerprint `c932fd7a1cbe84c52ab2e1e3d2669b143efcf918c8d252a1322e95e441c4fb71`), including the previously uncommitted guest-recognition and daily-metrics helpers. Text line endings can differ on Linux. Local phone-agent service work remains separate and is not included. No environment files, credentials, database exports, node_modules, compiled .next directories or private synthetic runtime helpers are included.

The successful Webpack/TypeScript build, browser and HTTP results are recorded in [workspace verification](WORKSPACE-UI-VERIFICATION.md). Release regression checks include 20 guest-recognition and 23 menu-upgrade cases, daily metrics/chart tests, proxy checks, localized event rendering and event/private-route access tests. Two offline event test harnesses were updated for the existing footer CSS, intro imports and the requested single language toggle; application behavior was not changed by those harness updates. Focused credential-pattern scanning found no staged secrets, and no outgoing Git object exceeded GitHub's 100 MiB limit. These are bounded checks, not a complete security audit. The existing JavaScript/performance limits still apply.

## Droplet update

No SSH login or production change was performed. The read-only SSH inspection stopped at host-key verification because this execution environment has no trusted key for `67.205.141.224`; strict host-key checking was preserved. Consequently the actual process manager, service name, live checkout state and production health were not verified.

Use the existing confirmed deployment/restart procedure and preserve the current environment and database. These Git commands deliberately refuse local changes and a diverged history:

```sh
ssh root@67.205.141.224
cd ~/shahrestaurant
test -z "$(git status --porcelain)" || { echo 'Local changes found: stop and preserve them'; exit 1; }
git remote get-url origin
git fetch origin main
git merge-base --is-ancestor HEAD origin/main || { echo 'History diverged: stop'; exit 1; }
git branch "backup/before-shah-$(date +%Y%m%d-%H%M%S)"
git merge --ff-only origin/main
git rev-parse HEAD
```

Confirm that `origin` is the eatmaison/shahrestaurant repository before fetching, and compare the resulting revision with the published revision in the final handoff. Do not reset, clean, force-push, regenerate SESSION_SECRET, overwrite environment files or apply SQL merely to resolve a dirty checkout.

Build with the same bundler used for verification:

```sh
npm ci
npm run build -- --webpack
```

Run that build in the existing staged-release workflow, or a planned maintenance window after stopping only the confirmed Shah application. Building `.next` in a directory used by a running Next server can interrupt requests. Restart only the already configured Shah process after a successful build; its manager/name could not be verified, so no guessed `pm2 restart all`, service restart or new daemon command is supplied. The checked-in nginx configuration targets `127.0.0.1:3005`; preserve the real configured port and proxy. Check the homepage, both languages, menu, reservation page, guest/admin restrictions and videos afterwards, without sending actual orders or payments. Keep a database/provider backup through the existing backup procedure.

## Migration caveat

No change to `app/lib/db.ts`, checkout DDL or `db/schema.sql` is required by this release relative to the fetched GitHub base. `db/migrations/20261111_reservation_visitor_session.sql` is optional, additive and manual; it is not automatically registered. The code works against the existing schema without it. Leave it unapplied unless the database owner separately approves activation and a backup/rollout. Without it, new reservation-only guest sessions cannot be reliably linked. Historical data is not backfilled or merged.
