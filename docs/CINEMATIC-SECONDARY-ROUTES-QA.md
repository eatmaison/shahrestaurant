# Cinematic secondary-route QA

Tested production build: `EwyI5J4c8In3dnKh4mht7`. Captures were taken on 11 November 2026; exact UTC timestamps are in the [compact results](cinematic-secondary-route-qa-2026-11-11.json). This report covers menu, reservation and legal routes. Homepage film sequencing is tested separately by the parent QA workflow.

## Result

All sixteen route/viewport cases rendered the expected cinematic title and choreography, without horizontal overflow or nested vertical product scrolling. All had zero captured console errors and Runtime exceptions. Both Dutch and English keyboard SPA transitions passed for privacy-to-terms and menu-to-reservations, preserving the same document and correct locale/title/reveal markers.

The earlier streamed-page hydration warning is resolved by page-owned readiness registration. Production photo headers and legal typography remain styled correctly after moving the page CSS imports.

| Route | Viewport | Document px | First dish Y | Map px | Reveal targets |
| --- | --- | ---: | ---: | ---: | ---: |
| `/menukaart` | 375x812 | 2380 | 768.3 | n/a | 8 |
| `/en/menu` | 375x812 | 2338 | 725.4 | n/a | 8 |
| `/reserveren` | 375x812 | 4486 | n/a | 260 | 5 |
| `/en/reservations` | 375x812 | 4505 | n/a | 260 | 5 |
| `/privacy` | 375x812 | 5952 | n/a | n/a | 13 |
| `/en/privacy` | 375x812 | 5716 | n/a | n/a | 13 |
| `/voorwaarden` | 375x812 | 5688 | n/a | n/a | 13 |
| `/en/terms` | 375x812 | 5230 | n/a | n/a | 13 |
| `/menukaart` | 1200x800 | 2121 | 875.9 | n/a | 8 |
| `/en/menu` | 1200x800 | 2109 | 875.9 | n/a | 8 |
| `/reserveren` | 1200x800 | 2813 | n/a | 300 | 5 |
| `/en/reservations` | 1200x800 | 2801 | n/a | 300 | 5 |
| `/privacy` | 1200x800 | 3472 | n/a | n/a | 13 |
| `/en/privacy` | 1200x800 | 3468 | n/a | n/a | 13 |
| `/voorwaarden` | 1200x800 | 3436 | n/a | n/a | 13 |
| `/en/terms` | 1200x800 | 3245 | n/a | n/a | 13 |

## Visual assessment

The menu and reservation openings now use photo-led teal scenes and stronger display type. Compact horizontal dish rows replace large empty image blocks in the seed fixture; the empty desktop checkout is quiet and its optional details are collapsed. Reservation visit information is grouped into a closed native disclosure, and the map facade is 260px on mobile and 300px on desktop. Legal pages now have a clear editorial chapter structure.

The first dish still begins below the initial viewport at both widths. That is a documented cinematic-heading tradeoff, rather than an unmeasured claim that every important item fits above the fold. The seed fixture omits per-product photos, so its icon placeholders do not represent live uploaded photography.

## Functional and theme smoke

- Mobile local cart: after adding one fixture dish, the cart control was inside the viewport and topmost; it stayed reachable after scrolling to the second dish. Its native OrderSheet opened, Escape closed it, and removing the item cleared the cart bar.
- Desktop checkout disclosure was closed while empty and opened after the first local add. Both test items were removed; no business API mutation or submission occurred.
- Dark menu at 1200px and dark reservation form at 375px were visually inspected. Keyboard theme switching worked, no overflow/errors occurred, and the native date control reported dark color scheme. The isolated test theme was returned to light.
- No checkout, booking, payment, email, account or Google Maps submission/activation was performed.

## Evidence and limits

Native top/full/section screenshots are kept for internal review in `C:/Users/DaviiC/AppData/Local/Temp/shah-cinematic-route-qa-20261111/production-EwyI5J4c8In3dnKh4mht7`. Useful files include `menukaart-mobile-top.png`, `menukaart-desktop-full.png`, `reserveren-mobile-form.png`, `reserveren-mobile-map.png`, `privacy-desktop-full.png`, `en-terms-mobile-top.png`, `dark-menu-desktop.png` and `dark-reservation-mobile-form.png`. Local cart and keyboard SPA screenshots are alongside them.

This was a production visual and state-flow smoke test using a read-only fixture. No Lighthouse, Core Web Vitals, INP, timing or continuous-frame smoothness claim was measured here. Real Safari/mobile hardware and live transactional behavior remain unverified. Browser 9226 is left idle on about:blank for the parent timing window.
