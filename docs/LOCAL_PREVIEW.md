# Local review workflow — 12 November 2026

Open **http://localhost:3398/** (Dutch) or **http://localhost:3398/en** (English). The running read-only preview serves build **`BUodo1etC1wSEnAZD_-52`**, Webpack / Next.js16.2.10, `.next-review-shah-grid-perf-20261112`. Frozen combined source SHA-256 is **`68e753609f8298de7db2bae4dae3dfcc0fd3d0898c4ff300651c44d4ef39927e`**,549 inputs, identical before/after the successful build and TypeScript check. All61 routes generated. [Exact build](cinematic-grid-build-2026-11-12.json), [input hashes](cinematic-grid-source-2026-11-12.json).

Main promotion was verified at2026-11-12T02:19:52Z after candidate HTTP50,24-route payload, feature checks and computed-style equivalence. The app listens only on127.0.0.1:3397 (PID59252), the read-only proxy on127.0.0.1:3398 (PID59076). PID values are a checkpoint, not permission to stop a reused process. The preserved candidate http://localhost:3728/ serves the same artifact and catalog fixture.

## Start or verify this exact preview

From the repository in PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-grid-perf-main.cjs"
```

This checks the frozen build, public/config bytes, runtime-helper hashes and catalog fixture. If the exact preview already runs, it prints a verified URL and exits. It does not rebuild, stop unknown processes, publish or submit transactions. Both ports3397/3398 must be free for a new start; do not stop arbitrary processes to free them.

Frozen runtime guards: `start-shah-grid-perf-runtimes.cjs` SHA256 `774b7fd3aaf3dd991348131d70c94384e08f36bfd5efb91e2946f025759b5e46`, `shah-grid-perf-preview-proxy.cjs` `f4f75cc5995b57cfe2670d70143af4dba220d372028af4e6523d191c482b6581`, catalog transport `b8dfbe7e08522fdd07f77e835ffbe3efc22bfb805b6ae5ba3fbce8724f9fdb9a`.

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
