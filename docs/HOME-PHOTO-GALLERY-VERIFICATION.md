# Homepage photo, FAQ and scroll update — 13 November 2026

Verified local preview: http://localhost:3398/en and http://localhost:3398/. Same-network preview: http://192.168.0.122:3618/en and `/`. Build `s6DGqOfaobcTNZMY4qQDK`, `.next-review-shah-pinned-gallery-v3-20261113`, source `b3cd7a0df1bbd2e02b6add29a73a52fd0b4b9dde1209b73a70c6f157ccaff176`, 490 inputs. This followup is local; it has not been pushed or deployed.

## Result

- The atmosphere section pins below the header while three photographs enter consecutively from the right. Desktop retains the three-photo composition; phones show a sequence of individual cards. Native scrolling drives a 1.9-viewport timeline, then ordinary page flow resumes. Reverse scrolling works. No wheel, touch or keyboard events are cancelled.
- “Continue”/“Verder” skips to the story and transfers focus. Hidden cards are inert and hidden from assistive technology. Reduced motion, data saving, missing browser support, short landscape windows and stages that cannot fit retain the ordinary gallery. The enhancement is absent before JavaScript runs. The progress offset follows the current section bounds, including catalogue hydration layout changes.
- User-approved dining and kitchen edits replace their old photographs across homepage, full gallery, lightbox and structured data. The dining image has the approved cherry-red napkin and longer foreground cutlery. The unwanted green cocktail image and all its public derivatives are removed, including the private parties backdrop reference. All 87 replaced/withdrawn public URLs return 404. Other three-card event links and private access rules remain intact.
- Each replacement has 320/640/960/1400px AVIF, WebP and JPEG deliveries and a small placeholder. All 24 delivery files are below 200,000 bytes; PNG masters are preserved. [Generation prompts and provenance](../assets/imagegen/PROMPTS-2026-11-13.md), [asset hashes and dimensions](edited-restaurant-photo-assets-2026-11-13.json).
- Dish thumbnails are 80 px wide on desktop and 64 px on ordinary phones; the prior narrow-screen fallback and horizontal padding remain. Measured menu text-to-search spacing is 14 px, search-to-filters 24 px, versus 28 px/74 px before.
- The first two FAQ answers link to the locale-correct reservation and menu pages. Actual clicks reached `/en/reservations`, `/en/menu`, `/reserveren` and `/menukaart`. Payment wording in both languages now states the owner-confirmed cash/PIN availability at the restaurant.

## Verification

Build and TypeScript passed with all 490 inputs unchanged before/after; 61 routes generated. Focused ESLint and event-locale checks passed. [Build identity](photo-refresh-build-2026-11-13.json).

Pinned-scene browser cases: 1232×932,1147×932,390×844,320×800 and Dutch 360×800; nine scroll positions each, including release and reverse. Stage remained below the header, entrances originated from the right, links were unobstructed and there was no document overflow. Native PageDown, focused skip navigation, live reduced-motion cleanup, initial reduced motion and short 844×390 fallback passed. [Candidate evidence](pinned-gallery-browser-2026-11-13.json), [fresh main-preview checks](pinned-gallery-main-browser-2026-11-13.json).

Photo/browser checks passed in English at 1232,1147,390 and320px and Dutch 1147px, including edited lightbox images, nine full-gallery figures, matching structured data, all 87 withdrawn URLs and no browser runtime errors. FAQ clicks and 56 px-or-larger buttons passed at desktop, 320 px and Dutch 390 px. [Photo evidence](photo-refresh-browser-2026-11-13.json), [FAQ evidence](visit-details-browser-2026-11-13.json).

All 50 post-promotion HTTP checks passed: 14 public event URLs, private party denial, canonical/localized URLs, sitemap/robots, 24 public pages and three public homepage cards. [HTTP evidence](photo-refresh-http-2026-11-13.json). LAN checks passed 56 policy cases, 58 static asset heads, 17 route guards, 3 fixture APIs and 4 video byte ranges. No firewall/security changes. [LAN evidence](phone-preview-2026-11-11.json).

## Limits

These are isolated desktop Chrome and mobile browser emulation checks, not a fresh physical iOS/Android test. CDP synthetic touch scrolling failed even on a minimal 15000 px-tall control page; this tool limitation prevents a claimed touch-swipe result. Native wheel scrolling advanced 350 px in both the control and gallery, and keyboard/native-position tests passed. [Input control](gallery-input-browser-2026-11-13.json). The implementation has no touch or wheel cancellation. No new Lighthouse/INP/video frame-rate benchmark was taken, so no performance guarantee is implied.

The preview uses the pinned read-only public catalogue. No real order, payment, reservation, message, live database mutation or production migration was submitted. Unrelated phone-agent work is preserved. Start commands and historical baseline controls are in [LOCAL_PREVIEW.md](LOCAL_PREVIEW.md) and [PHONE-PREVIEW.md](PHONE-PREVIEW.md).
