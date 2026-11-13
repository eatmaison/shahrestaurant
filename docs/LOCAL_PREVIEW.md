# Current local preview - 13 November 2026

Public site: http://localhost:3398/en or http://localhost:3398/. Same Wi-Fi: http://192.168.0.122:3618/en or `/`. The approved photographs, bilingual intro, menu and public events are retained.

The restructured admin demo is **http://localhost:4068/admin** with separate `/admin/customers`, `/admin/stats` and `/admin/events` pages. This loopback-only preview contains labelled synthetic data; writes are blocked. Admin is never exposed through the phone listener.

Build `Q2nFHmc8z6XlftjRttVYU`, `.next-review-shah-admin-release-20261113`, frozen source `b3c001864ded7ec998ea4a347f91dc433c923b138204e069a262b48667321939`, 483 inputs. Build, TypeScript, scoped regressions, browser layouts/interactions, 25 real proxy-authorization cases, 50 public HTTP checks and LAN checks passed. Full repository lint still has 22 unrelated errors. [Changes, measurements, optional migration, verification limits and exact start commands](ADMIN-REDESIGN.md).

Start/verify public: `node "$env:TEMP\shah-preview-20261111\start-shah-admin-release-main.cjs"`. Start/verify admin demo: `node "$env:TEMP\shah-admin-redesign-20261113\start-or-verify-private-release.cjs"`. No production deployment or production migration was performed. Unrelated listeners and phone-agent edits are preserved.

The earlier interior-photo build `0QM01vrtIDTCaYpYCCdXf` is preserved as historical verification in [INTERIOR-PHOTO-VERIFICATION.md](INTERIOR-PHOTO-VERIFICATION.md).

## Historical workspace baseline - 12 November 2026

Open **http://localhost:3398/** (Dutch) or **http://localhost:3398/en** (English). The running read-only preview serves build **`6zD0ge5SdqAm0X_krXcdr`**, Webpack / Next.js16.2.10, `.next-review-shah-workspaces-mobile-20261112`. Frozen combined source SHA-256 is **`c932fd7a1cbe84c52ab2e1e3d2669b143efcf918c8d252a1322e95e441c4fb71`**,551 inputs, identical before/after the successful build and TypeScript check. All61 routes generated. [Exact build](workspace-build-2026-11-12.json), [input hashes](workspace-source-2026-11-12.json).

Account/admin workspaces and the wider menu sidebar are included. [Changes, private synthetic previews and validation limits](WORKSPACE-UI-VERIFICATION.md).

Main promotion was verified at2026-11-12T11:28:11.012Z after 50 candidate HTTP checks, 24-route payload accounting, 40 workspace/browser cases and 16 dialog cases. Fresh post-promotion HTTP, LAN-policy and eight playback cases also passed. The app listens only on127.0.0.1:3397 (PID57492), the read-only proxy on127.0.0.1:3398 (PID58604). PID values are a checkpoint, not permission to stop a reused process. The preserved candidate http://localhost:3899/ serves the same artifact and catalog fixture.

## Start or verify this exact preview

From the repository in PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-workspaces-mobile-main.cjs"
```

This checks the frozen build, public/config bytes, runtime-helper hashes and catalog fixture. If the exact preview already runs, it prints a verified URL and exits. It does not rebuild, stop unknown processes, publish or submit transactions. Both ports3397/3398 must be free for a new start; do not stop arbitrary processes to free them.

Frozen runtime guards: `start-shah-workspaces-mobile-runtimes.cjs` SHA256 `8ab4bebd9f65d3aee4fccc1e1bef422eca14041b8f43faaea398d35b471d29d1`, `shah-workspaces-mobile-preview-proxy.cjs` `7d002c61295417162749b0643c16bed4e46ce2365ab2cb76769209bc25ad99ce`, catalog transport `b8dfbe7e08522fdd07f77e835ffbe3efc22bfb805b6ae5ba3fbce8724f9fdb9a`.

The helpers, fixture and raw QA are local to this PC in Temp. Preserve them together with the build and its `.source.json`/`.tsconfig.json` files. Their loss requires reconstructing a guarded review; this is not a portable deployment command. No environment file or production database was changed.

## Intro viewing and languages

Dutch homepage entry selects the new Dutch desktop/portrait CapCut pair. English retains approved desktop v3/mobile v2. Matching posters, embedded typography, full-screen framing and accessible fallbacks are retained. [Exact paths and media QA](CAPCUT-DUTCH-ASSETS.md).

The intro intentionally runs **once per tab session**, shared between languages. Reloading or returning from the menu proceeds to content without another MP4. For a fresh video viewing, open a genuinely new independent tab or private browsing session. Duplicated tabs can inherit session storage; blocked storage only retains the marker in the current document. `localhost`, `127.0.0.1` and the phone IP have separate origin storage.

The final-second upward film reveal exposes stationary content/header and removes the movie; it uses a transform rather than native page auto-scroll. Ordinary scrolling remains available and cannot reveal the removed video. Reduced motion/data-saving and blocked autoplay retain usable poster/Skip/manual paths. No JavaScript leaves the poster and native Skip.

## Phone on the same network

Open **http://192.168.0.122:3618/** or **http://192.168.0.122:3618/en** on the router's local network. [Phone instructions](PHONE-PREVIEW.md) record the current exact-build listener, restart command, four-file media allowlist and private/write restrictions. No firewall, network-profile, VPN or router setting was changed. DHCP may later change the PC address.

## Preview data and route boundary

The GET/HEAD-only fixture contains224 captured public products/two brands and a fixed status clock. Uploaded gallery/private user/order/reservation/review data are explicitly empty; ten supplied restaurant photos remain. It is not live availability. Checkout, booking, account and other mutations are disabled. The phone proxy additionally excludes private routes, identity headers and response cookies.

- Dutch: `/`, `/menukaart`, `/reserveren`, `/privacy`, `/voorwaarden`.
- English: `/en`, `/en/menu`, `/en/reservations`, `/en/privacy`, `/en/terms`.
- Events: `/events` and six `{about,birthdays,celebrations,company-catering,company-lunches,gallery}` subpaths, with corresponding `/en/events` pairs. All are public.
- `/parties`, nested pages and private APIs remain administrator-only; the fixture provides no admin account.

All24 public URLs have explicit language, canonical and reciprocal alternatives. Public language changes navigate to the matching URL; utility routes retain in-page language choice/drafts. Menus, independent combo drinks and totals can be reviewed locally without sending an order.

## Ordinary development

Run separately from the frozen review:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3395
```

Review builds use installed `next build --webpack` through an isolated `SHAH_REVIEW_DIST_DIR` and TypeScript config. Development/hot-reload timings are not production measurements.

[Final verification](CINEMATIC-FINAL-VERIFICATION.md) records functional proof, exact carried controls and unresolved JS/performance/tool/device limits. The combined snapshot preserves unrelated working-tree changes; public-feature commits do not claim to reproduce that snapshot alone. No deployment or publication was authorized or performed.

The promoted combined build includes selected-language homepage delivery and active-viewport menu cards. [Measured savings, responsive tests and limits](JS-LATENCY-FOLLOWUP.md).
