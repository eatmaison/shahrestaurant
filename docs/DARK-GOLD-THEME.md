# Two dark themes — 13 November 2026

The rejected bright gold/light mode is replaced by a warm dark-gold style. Original dark teal remains the default for new visitors. Its existing stylesheets, colors and media were not edited. Shared overrides apply only to `:root.dark[data-shah-theme="gold"]`.

The existing `tm.theme` preference is preserved: saved `"light"` now means dark gold; saved `"dark"` retains teal. Keeping this internal legacy value avoids losing visitor preferences or changing cart/account storage. Both themes keep the root `dark` class and native `color-scheme: dark`, including the first paint. Invalid/unavailable storage defaults to teal. Cross-tab changes, preference removal and keyboard operation were checked. EN/NL toggle labels now name dark gold and dark teal rather than light mode.

| Token | Original teal | Dark gold |
| --- | --- | --- |
| Page | `#062b32` | `#16130f` |
| Surface | `#0a3540` | `#231e16` |
| Main text | `#f7f2e7` | `#f5ecdc` |
| Accent | `#e0af59` | `#dfb875` |

Forms, native selects, placeholders, public sections, account dialogs, admin workspaces, cookie controls, footer, buttons, error states and cart totals use dark surfaces with readable text. Existing teal image overlays and brand accents remain where applicable. Verification found and fixed two specific gold-mode contrast defects: the selected reservation occasion and the mobile cart's total-price chip. Four existing neutral partner-logo plates per homepage locale remain unchanged for logo readability; these are also present in original dark mode.

## Preview and exact build

- Public English: http://localhost:3398/en; Dutch: http://localhost:3398/.
- Synthetic read-only admin: http://localhost:4068/admin, plus `/admin/customers`, `/admin/stats`, `/admin/events`.
- Same Wi-Fi: http://192.168.0.122:3618/en; Dutch: http://192.168.0.122:3618/.
- Build: `TnGIIful8W70dmhVNZaHd`, `.next-review-shah-dark-gold-final-20261113`, 65 routes.
- Frozen source: `146f3a39a49bc2a0d6ccd8699d1a2a6c6b373a55598d59a3e6a055e0868f15f1`, 496 inputs, unchanged before/after build and final verification. All 244 public media files match the prior build byte for byte.

The LAN preview permits public pages/assets only and blocks private routes and all submissions. The admin preview uses invented fixture data, never live customer records. No firewall, VPN, network-profile or router setting changed.

## Verification

[Machine-readable check index](dark-gold-checks-2026-11-13.json), [build identity](dark-gold-build-2026-11-13.json), [frozen input hashes](dark-gold-source-2026-11-13.json).

- Production Webpack build and TypeScript passed; focused ESLint: zero errors/warnings. Eight tests execute the actual first-paint bootstrap, including malformed/blocked storage.
- [48 admin layouts](dark-gold-admin-browser-2026-11-13.json): four routes × two languages × two themes × 1440/390/360 widths. No overflow, page errors or automated accessibility violations in those cases.
- [52 public/header checks](dark-gold-public-browser-2026-11-13.json): both themes/languages and six header widths, with original teal token/body parity asserted on six routes. Gold cases had no contrast findings. The original teal mode retains three existing contrast finding groups on menu/reservations/events, documented rather than altered against the preservation instruction.
- [24 public routes at phone width](dark-gold-all-public-2026-11-13.json): no gold contrast violations, page errors or horizontal overflow. The eight bright-panel observations are exactly the four preserved logo plates on each homepage locale.
- [10 browser persistence/first-frame cases](dark-gold-persistence-2026-11-13.json): OS light/dark, stored preferences, reload, routes, EN/NL switch, cross-tab synchronization, blocked storage and keyboard Enter/Space.
- [40 form/dialog/error states](dark-gold-states-2026-11-13.json) and [four cart cases](dark-gold-cart-2026-11-13.json): no contrast violations, page errors or overflow in the checked states. Tests use synthetic data; login attempts were intercepted locally. Cart combinations/drinks were edited without submitting orders.
- [50 post-promotion HTTP checks](dark-gold-promoted-http-2026-11-13.json) passed against the final build, including public events, private parties restrictions, sitemap, robots and frozen source identity.
- [Four post-promotion video cases](dark-gold-playback-2026-11-13.json): EN/NL desktop and portrait sources selected correctly, muted inline autoplay advanced real frames/currentTime, and the ending transition removed the video. Phone-width cases used the actual LAN preview URL.
- [Fresh LAN checks](phone-preview-2026-11-11.json) retain the subnet, public-asset/media allowlist and private/write restrictions.

Visual samples: [gold homepage](dark-gold-screenshots/public-home-en-gold.png), [original teal homepage](dark-gold-screenshots/public-home-en-teal.png), [gold admin customers](dark-gold-screenshots/admin-customers-en-gold-1440.png), [mobile account dialog](dark-gold-screenshots/state-account-confirmation-en-390.png), [mobile cart](dark-gold-screenshots/cart-en-390.png).

Automated scans cover the recorded pages/states, not a certification of every possible browser, content or state. No new physical-phone or Safari test is claimed. Full repository lint still has 22 errors and four warnings outside this change. No fresh performance benchmark or guaranteed playback quality is claimed. Application data, schema and assets were not changed. Unrelated phone-agent work is preserved. These theme changes were not pushed to GitHub or deployed; no production migration ran.

## Start or verify the local previews

Run from this checkout in PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-dark-gold-final-main.cjs"
node "$env:TEMP\shah-dark-gold-20261113\start-or-verify-private-final.cjs"
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-TnGIIful8W70dmhVNZaHd.json"
```

These guarded helpers are local to this computer and depend on the exact build and Temp fixtures. They verify existing matching listeners or start on free ports; they do not stop unknown processes. They are not production deployment commands. Ordinary development can be started separately with `npm run dev -- --hostname 127.0.0.1 --port 3395`.
