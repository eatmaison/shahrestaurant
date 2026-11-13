# Gold and cinematic polish — 13 November 2026

The second dark theme now uses neutral graphite instead of brown, with the original logo gold, `#E0AF59`, as its prominent accent. Headings, metallic buttons, fine borders and image frames carry the gold. The established teal theme retains its base tokens, photographs and typography; small public labels and selected buttons received targeted contrast corrections.

UI logo mapping is deliberately opposite to the background theme:

| Theme | Original SVG artwork shown |
| --- | --- |
| Dark teal | Gold |
| Dark graphite/gold | Teal |

This covers header, footer, story wordmark, closing mark and loading logo. The teal logo uses a small gold plate where it needs readable contrast; decorative marks have no plate. Artwork dimensions and aspect ratios are preserved. The original vectors were not redrawn, recolored or distorted. Decorative story/footer marks follow the same theme mapping. Approved photographs and burned-in film typography remain untouched.

Gold text on the graphite surface has a nominal 8.82:1 contrast ratio; teal artwork on the solid gold plate is 4.99:1. A dark inset focus ring distinguishes the logo plate during keyboard navigation. Actual page/state audits are linked below; these ratios do not certify every possible content state.

## Motion and delivery

- The existing three-picture, right-to-left gallery now has restrained floating rotation on desktop. Native scrolling, Continue, keyboard focus and the short-viewport fallback remain available.
- Evening cards enter with staggered lateral movement, and image frames settle into place. Text entrances use transforms with full opacity after reveal, preserving legibility during movement.
- Desktop chapter rules and photo-frame details follow the existing one-time reveal attributes. No additional scroll-linked animation timeline is introduced.
- Link underlines draw on hover/focus. No JavaScript animation loop, extra dependency, canvas, particle layer or media asset was added.
- Phones retain shorter lateral entrances and the sequential gallery, with static decorative lines/frames and no added card rotation or large ambient gradients. Large new header/logo blur shadows were removed.
- Reduced motion and data-saving retain ordinary visible content without the pinned sequence or new decorative animation.
- Responsive AVIF/WebP/JPEG deliveries, lazy loading, image dimensions and placeholders remain in place. All 244 public media files match the preceding build byte for byte. This change does not promise instant loading.

The existing `tm.theme` choice and dark default are preserved. Saved legacy `"light"` selects the new dark-gold appearance; saved `"dark"` selects teal. Both modes use native dark controls. A reload updates the currently open preview's cached stylesheet.

## Exact verification

Build **A3XGcJrqHbutMgWYhQ9-y**, Next 16.2.10/Webpack, 65 routes; TypeScript/build and focused lint passed. Frozen application/config/public source **8d97670c8b413ff0c1f3f9030452cfc6757d7c7d7d7a8878a12d67b6e5ae8431**, 496 inputs, unchanged through final verification. [Build](gold-cinema-build-2026-11-13.json), [source hashes](gold-cinema-source-2026-11-13.json).

- [52 public/header checks](gold-cinema-public-browser-2026-11-13.json), including EN/NL, both themes, six header widths and original teal token/body parity on six routes.
- [48 admin layouts](gold-cinema-admin-browser-2026-11-13.json), four workspaces × EN/NL × both themes × 1440/390/360 widths.
- [24 public routes at phone width](gold-cinema-all-public-2026-11-13.json). Four original neutral partner-logo plates per homepage locale remain as brand assets; no unexpected bright panels.
- [10 persistence/first-paint cases](gold-cinema-persistence-2026-11-13.json), plus eight existing bootstrap unit tests.
- [40 account/form/dialog states](gold-cinema-states-2026-11-13.json), [four cart cases](gold-cinema-cart-2026-11-13.json), [10 motion/logo/preference cases](gold-cinema-motion-logo-hover-2026-11-13.json), and [12 primary/selected-control hover/focus states](gold-cinema-public-controls-2026-11-13.json). Logo assets, natural aspect ratios, active gallery stages, loaded photos, Continue/keyboard access, reduced motion and data-saving were checked. Contrast scans assess settled text; regular text entrances now avoid extra opacity transitions.
- These recorded scans have zero automated accessibility violations/page errors and no checked horizontal overflow. They use synthetic/read-only data; four login responses were intercepted locally. No real order, reservation, email, export, payment or customer update was submitted.
- [50 post-promotion HTTP cases](gold-cinema-promoted-http-2026-11-13.json), [four actual EN/NL desktop/portrait video cases](gold-cinema-playback-2026-11-13.json), and [fresh LAN policy/asset/media checks](phone-preview-2026-11-11.json) passed. Frame/time advancement and the ending handoff were observed; this is not a dropped-frame guarantee.

Visuals: [gold desktop](gold-cinema-screenshots/public-home-en-gold.png), [teal desktop](gold-cinema-screenshots/public-home-en-teal.png), [gold phone layout](gold-cinema-screenshots/home-gold-en-390.png), [admin](gold-cinema-screenshots/admin-customers-en-gold-1440.png), [account dialog](gold-cinema-screenshots/state-account-confirmation-en-390.png), [cart](gold-cinema-screenshots/cart-en-390.png).

## Performance

Loaded homepage resources remained 13 JS and 2 CSS files. JS gzip6: **184443 → 184407 B** (-36 B); CSS gzip6: **41583 → 41530 B** (-53 B). Any small JS byte change comes from compiled CSS module/chunk mapping; no animation JavaScript was added.

This follow-up compares the initial polish checkpoint a876d23 (XAvWn1WCfZVojo1yazM5b) with entry-triggered details. Palette, logo assets and media are the same. Builds were interleaved in one browser instance, three runs per width/theme. Median of each run's p95 requestAnimationFrame interval (lower is better):

| Width/theme | Before | After |
| --- | ---: | ---: |
| 390px / teal | 43.2 ms | 57.5 ms |
| 390px / gold | 42.4 ms | 41.5 ms |
| 1440px / teal | 53.9 ms | 42.5 ms |
| 1440px / gold | 56.1 ms | 44.5 ms |

[Raw 24-run comparison](gold-cinema-performance-final-interleaved-2026-11-13.json), [ranges, task counts and byte accounting](gold-cinema-performance-summary-2026-11-13.json). The results do not support a universal speedup claim; individual slower samples and ranges are retained.

These are local headless Chromium measurements with 4× CPU slowdown and synthetic/public fixtures, not physical-phone FPS, production Core Web Vitals, network benchmarks or a stutter-free guarantee. Variance and any remaining regression are retained in the results. The earlier global JavaScript budget is not claimed as solved.

## Preview and restart

Public English: http://localhost:3398/en; Dutch: http://localhost:3398/.

Synthetic read-only admin: http://localhost:4068/admin, with customers, stats and events pages. All displayed customers/orders/events there are labelled test fixtures; writes are blocked.

Same network: http://192.168.0.122:3618/en; Dutch: http://192.168.0.122:3618/. The LAN listener permits public pages/assets only, strips identity information and blocks private routes and submissions. No firewall, VPN, router or network-profile settings changed.

PowerShell from this checkout, retaining the matching build and task-local Temp fixtures:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-gold-cinema-polish-v6-main.cjs"
node "$env:TEMP\shah-gold-cinema-20261113\start-or-verify-private-polish-v6.cjs"
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-A3XGcJrqHbutMgWYhQ9-y.json"
```

These guarded helpers verify the exact local build or start on free ports. They do not replace unknown listeners and are not production deployment commands.

No new physical-phone, Safari or screen-reader result is claimed. Automated checks cover the recorded routes and states rather than all possible browser/content combinations. Focused lint and build/type checking pass; unrelated whole-repository lint findings are outside this style change. Unrelated `phone-agent` work is preserved. No GitHub push, public deployment, production-data change or migration is part of this task.
