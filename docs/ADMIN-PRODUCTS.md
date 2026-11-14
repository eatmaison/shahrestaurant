# Latest homepage and mobile header follow-up

Build **PCqBg5KEUI1VqK_c0VZe0**, source **7b5cc49c713e85c39040888a3de995977e083df76d2e49330e6fe743d0929368**, 503 frozen inputs, 67 routes; build and TypeScript passed.

- Homepage search removed in both languages; category filters and ordering-page search retained.
- Original adaptive brand symbol welcomes visitors, followed by staggered 3D title and text entrances. Existing observers handle visibility; no dependency, media replacement or continuous animation loop was added. Entrances wait for film completion/skip, also work on return visits, and become immediate with reduced motion or data saving.
- Mobile header below 640px uses only the original symbol, keeps its 88px bar, and exposes theme, EN/NL, cart and menu controls in that order. Each control remains 48px. Wider headers retain full branding.
- Only the dark-gold story-image Shah badge gets a gold background; its teal artwork and the other theme remain unchanged.

[Final checks](homepage-refinements-checks-2026-11-14.json): 20 welcome variants, 32 header variants, eight public variants, 50 public HTTP cases, 59 byte-matched LAN assets, actual film skip/natural-ending entrances and live reduced-motion changes passed. EN/NL, both themes, 320/360/369/390/448/640/938/1304px were covered as recorded. [Welcome](homepage-refinements-browser-2026-11-14.json), [header](homepage-refinements-header-2026-11-14.json), [film handoff](homepage-refinements-handoff-2026-11-14.json), [source](homepage-refinements-source-2026-11-14.json). The 31 category/API/SQL/combo regressions passed again; focused lint has zero errors/warnings. No physical-device or site-wide accessibility claim is made.

Only five application files changed after the product-workspace checkpoint below; admin/category/combo implementation and all 244 media files remain unchanged. Historical measurements below describe their explicitly named builds, not the new homepage bundle. [GitHub handoff and deployment limits](GITHUB-RELEASE-HANDOFF.md).

## Product workspace checkpoint

# Product workspace and website follow-ups - 14 November 2026

Product management now has its own private **/admin/products** page and fifth admin navigation tab. Daily operations no longer mounts the catalogue or product-editor logic. Existing product add/edit/delete, images, prices, multi-restaurant publishing, restaurant names/logos, category/subcategory editing and CSV export were moved with their existing behavior.

In Restaurants & categories, drag a category grip with a mouse or touch, or use the up/down buttons with a keyboard. Changes save automatically to the existing brands.categories JSONB array. Moving Tandoori Starters before Soups changes the public ordering sequence on a fresh load. An already-open ordering tab uses the new order when its catalogue refreshes. Nested subcategories travel with their parent; separate subcategory dragging is not introduced.

POST /api/brands/categories/order requires an administrator, validates the input and expected sequence, rate limits changes and rejects foreign origin hosts. A full JSON comparison prevents overwriting concurrent edits. Conflicts return 409 and attempt a refresh; failed saves are reported. Keyboard focus and Escape cancellation are supported. A shared touch-action rule was overridden only on the grip after emulated touch exposed browser gesture cancellation. The products bootstrap skips order/customer/reservation list queries.

Other requested changes:

- Homepage search was removed in the latest follow-up; category filters and the independent ordering-page search remain.
- Home categories support mouse drag, wheel, native touch swipe and keyboard scrolling. Dragging does not select a category. Radio inputs keep native keyboard selection. Edge scrolling releases to the page; an outside pointer release cannot leave hover-drag active.
- Matcha, lassi, smoothies and bubble tea cannot be selected as free combo drinks, including in server validation. They remain separately purchasable. Old invalid stored selections require correction; independent drinks, mixed plain wraps and existing prices remain supported. Word boundaries prevent chocola from matching cola.
- Footer legal links have 2px gaps and aligned 48px targets. At 1304px, the measured Dutch footer is 510px rather than 522px, a 12px reduction. Transparent logo backgrounds and the previously requested 8px vertical logo-row padding remain.
- The atmosphere gallery has the existing gold brand ornament in teal mode and teal ornament in dark gold. It sits behind photographs without intercepting input.
- Dark-gold partners use graphite theme surfaces; teal mode keeps #0D4952. Original neutral brand-logo plates remain. The footer brand caption matches the original artwork exactly: #E0AF59 in teal mode and #0D4952 in dark gold.

## Build and verification

Product-workspace checkpoint build **Z6l6e9KRC62wZNbm4qoy9**, Next 16.2.10/Webpack, 67 routes. Build and TypeScript passed. Frozen source **8a082f5fb9017d85bd2b55546538d9dc0adca01bb231d56719b856c48674c222**, 503 unchanged application/config/public inputs. All 244 public media files remain byte-identical to the prior preview. No dependency or schema change. [Build](admin-products-build-2026-11-14.json), [source](admin-products-source-2026-11-14.json), [checks](admin-products-checks-2026-11-14.json).

- 31 category/SQL/API/combo regressions passed, including isolated PostgreSQL JSON persistence, concurrent writes, authorization/origin/input rejection and separate paid prepared drinks. Run: `node --test scripts/test-product-workspace.cjs scripts/test-menu-upgrades.cjs`.
- 17 additional existing admin regressions passed, including a proxy test file with 16 authorization subcases. Focused new/refactored code and test lint has zero errors/warnings. Historical whole-repository lint findings are not claimed fixed.
- [12 layouts and nine admin workflows](admin-products-browser-2026-11-14.json) passed on functional build **5I8iyfolp37tsMy8FDpWc**, with zero recorded workspace accessibility violations or page errors. Mouse/touch drag, persistence after reload, keyboard focus, Escape, failed saves, conflict recovery, the existing editor and public ordering sequence were exercised. Browser writes used an intercepted endpoint backed by isolated PGlite; no production write occurred.
- [Four combo browser cases](admin-products-menu-drinks-2026-11-14.json), EN/NL and desktop/mobile, checked old invalid selections, permitted options, independent drinks and a plain wrap on that functional build.
- Only partner theme CSS and footer caption styling changed afterwards. [Exact source comparison](admin-products-validation-scope-2026-11-14.json) confirms the admin, ordering, API and data code is unchanged. Final-build [eight public variants](admin-products-public-2026-11-14.json), [two partner scans](admin-products-partners-2026-11-14.json), four compiled JWT/page access cases, [50 public HTTP cases](admin-products-http-2026-11-14.json), ten promoted-origin checks and 60 byte-matched LAN assets passed.
- [Four actual video cases](admin-products-playback-2026-11-14.json) verify EN/NL desktop/portrait source selection, advancing time and frames, muted inline playback and the ending handoff. Approved video assets are unchanged. No instant-load or zero-dropped-frame guarantee is made.

## Initial JavaScript

Modern initial external scripts from byte-checked served HTML, excluding nomodule, dynamic imports, HTML, APIs and media; gzip6. Prior preview PzjPHBw-VZvDS7ajsimVL versus the final build. These measure transfer size, not latency/Core Web Vitals.

| Route | Before gzip6 bytes | Final gzip6 bytes |
| --- | ---: | ---: |
| /admin | 203869 | 193472 |
| /admin/products | new page | 194440 |
| /en | 184407 | 185290 |
| /en/menu | 177895 | 178068 |

Daily operations saves 10,397 bytes gzip6. The homepage increases by 883 bytes for the requested interactions. Inherited global JavaScript/mobile targets are not claimed solved. [Exact accounting](admin-products-payload-2026-11-14.json).

## Preview and limits

- Public: http://localhost:3398/en or / for Dutch.
- Same Wi-Fi: http://192.168.0.122:3618/en or / for Dutch, public pages only.
- Admin: http://localhost:4068/admin/products, labelled synthetic data. **This preview is read-only: writes return 405. Persistent category saving was verified through the isolated browser/SQL tests.** Actual catalogue changes require the normal authenticated application and configured database after deployment.

Guarded start/verify from this checkout in PowerShell, with the matching build and local Temp fixtures:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-home-welcome-v4-main.cjs"
node "$env:TEMP\shah-gold-cinema-20261113\start-or-verify-private-home-welcome-v4.cjs"
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-PCqBg5KEUI1VqK_c0VZe0.json"
```

No production data, real orders/payments/emails, migration or deployment was performed. GitHub publication is recorded in GITHUB-RELEASE-HANDOFF.md. No new physical-phone, Safari or screen-reader result is claimed. Accessibility results are scoped to the recorded workspace/partner scans. The specifically requested exact dark-teal branding caption is low contrast on graphite; no site-wide AA claim is made. An initial HTTP check raced local process startup; the final 50-case run passed after readiness.

[Admin](admin-products-screenshots/products-teal-desktop.png), [mobile ordering controls](admin-products-screenshots/category-order-mobile.png), [combo choices](admin-products-screenshots/menu-drinks-mobile.png), [gold partners](admin-products-screenshots/partners-gold.png), [gallery ornament](admin-products-screenshots/gallery-symbol-gold.png).
