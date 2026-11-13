# Interior photography update — 13 November 2026

Current read-only preview: http://localhost:3398/en (English), http://localhost:3398/ (Dutch); same Wi-Fi: http://192.168.0.122:3618/en and `/`.

Build `0QM01vrtIDTCaYpYCCdXf`, `.next-review-shah-interior-final-20261113`. Frozen source SHA-256 `c4ac07745e89450202db9e7e7475760c5101123c1eab5ff699391c3e179ffb7f`, 460 inputs, unchanged before/after the successful build and TypeScript check. All 61 routes generated. This followup is local, without a GitHub push or public deployment.

## Delivered images

All three edits used the built-in image_gen tool, with the original photographs viewed as edit targets; no CLI/API fallback was used.

| Image | Selected master | Prompt and revision history |
| --- | --- | --- |
| Bar: brighter polished counter and clean-glass highlights | [shah-bar-shine-v1.png](../assets/imagegen/shah-bar-shine-v1.png) | [Bar prompt](../assets/imagegen/BAR-PROMPT-2026-11-13.md) |
| Story: cherry napkins and cutlery on both seating sides, corrected foreground orientation, brighter marble and lit lotus decorations | [shah-room-setting-v3.png](../assets/imagegen/shah-room-setting-v3.png) | [Room prompts](../assets/imagegen/ROOM-PROMPT-2026-11-13.md) |
| Better together: brighter seating view, matching decorations and exactly two settings per small table | [shah-atmosphere-setting-v2.png](../assets/imagegen/shah-atmosphere-setting-v2.png) | [Atmosphere prompts](../assets/imagegen/ATMOSPHERE-PROMPT-2026-11-13.md) |

The user explicitly approved replacement and deletion of the old bar and atmosphere photographs. Their 58 original/derived public files were removed, with hashes recorded in [bar inventory](replaced-bar-photo-files-2026-11-13.json) and [atmosphere inventory](replaced-atmosphere-photo-files-2026-11-13.json). Legacy generators exclude them, and obsolete metadata entries are removed. Room originals remain available; active room consumers select the new version. Superseded generated drafts are outside the project public directory.

The new images appear through the shared native-picture registry in the homepage gallery/lightbox, story, visit and evening cards, full event gallery and matching image structured data. The full gallery retains nine photographs; five now use the approved edited deliveries, including the earlier dining/kitchen edits. Existing saved event image references to the deleted bar originals resolve to the new bar at render time. No database row was rewritten; admin defaults and private image metadata use the new path, with access rules and transaction logic unchanged.

The three new photographs have 27 delivery copies: 320/640/960 px in AVIF, WebP and JPEG. Each is below 200,000 bytes; largest new file is 197,548 bytes. All 51 delivery files, including the earlier 24 dining/kitchen copies, passed file-size and SHA-256 checks. The earlier dining/kitchen bytes remained unchanged. The PNG masters preserve the selected generated outputs. [Dimensions, encoder qualities and hashes](edited-restaurant-photo-assets-2026-11-13.json). Reproduce with `node scripts/generate-edited-restaurant-photos.mjs`.

## Verification

- Build/TypeScript, focused ESLint, locale/route tests and legacy-image mapping checks passed. Foreign/user image URLs remain unchanged by the mapping. [Build identity](interior-build-2026-11-13.json).
- Fresh main-preview Chrome checks passed at English 1232×932 and 390×844, and Dutch 360×800: responsive sources decoded, the bar and atmosphere lightboxes used the new assets, bar lightbox used `object-fit: contain`, story and third evening card used the selected revisions, full gallery and JSON-LD matched, and there were no page errors or horizontal overflow. Screenshots were visually reviewed. [Browser evidence](final-interior-browser-2026-11-13.json).
- All 145 withdrawn image URLs returned 404: 58 in this followup and 87 from the preceding approved image replacements/removal. The 29-file bar deletion initially encountered a local Sharp/libvips file lock; after that reader exited, all recorded hashes were rechecked and deletion completed. Nothing remains blocked.
- The existing pinned-gallery sequence still passed nine native scroll positions, reverse/release, keyboard PageDown, focused skip navigation and live reduced-motion cleanup at desktop English and mobile Dutch sizes. [Scroll evidence](interior-scroll-browser-2026-11-13.json).
- All 50 post-promotion HTTP cases passed, covering 24 public pages, public event routes, private-party denials, canonical/localized URLs, robots, sitemap and three homepage occasion cards. [HTTP evidence](interior-http-2026-11-13.json).
- Same-network checks passed 56 policy cases, 58 Next asset heads, 17 route guards, three fixture APIs and four video byte ranges. The interface/subnet binding and security policy are unchanged; no firewall, VPN or router settings were changed. [LAN evidence](phone-preview-2026-11-11.json).

These are desktop Chrome and mobile browser emulation results, not a fresh physical-phone test. No new Lighthouse/INP/FPS measurement was taken. No real order, payment, reservation, message, live customer record change, production migration or public deployment ran. Unrelated phone-agent work is preserved.

## Start commands

From this checkout in PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-interior-final-main.cjs"
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-0QM01vrtIDTCaYpYCCdXf.json"
```

These task-local helpers verify the exact frozen build, public/config files, fixture and helper hashes. They leave an already running matching preview unchanged and never stop an unknown listener. The LAN listener requires the matching main build first. Ordinary development remains `npm run dev -- --hostname 127.0.0.1 --port 3397`; that is a separate mutable server, not this verified fixture preview.
