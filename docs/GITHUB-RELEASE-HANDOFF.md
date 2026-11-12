# GitHub release handoff — 12 November 2026

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
