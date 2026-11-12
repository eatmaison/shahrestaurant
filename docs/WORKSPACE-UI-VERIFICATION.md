# Account, admin and menu sidebar — 12 November 2026

The account and admin pages previously had functional tools but had not received the full public-site design treatment. The existing guest recognition and daily-progress work was present locally and has been preserved. This change gives both workspaces a consistent teal/gold design, readable typography, responsive panels, persistent form labels, visible keyboard focus and usable controls. It does not change permissions, prices or transaction rules.

## Changes

- Account: form-first mobile authentication, personal/company registration labels, compact statistics, membership/loyalty panels, section navigation and expandable available order history (eight initially, then all loaded orders).
- Admin: eleven section links, calmer panel hierarchy, responsive statistics, stronger contrast and labelled selects. Section links open collapsed visitor/user/social panels. The daily chart and customer-history scrollers are keyboard accessible.
- Four admin dialogs now use native modal dialogs with labelled titles, keyboard containment, Escape dismissal, background scroll locking and focus restoration. Editing, category management, deletion confirmation and customer-history handlers remain intact.
- Duplicate Popular/New inputs in the add-product form were removed; the existing Popular/New/BOGO controls remain. Workspace statistics appear immediately instead of waiting through decorative stagger animations.
- Desktop menu sidebar: 180 → 240 px at 1200 px and above, 220 px at 1024–1199 px. Labels may wrap rather than truncate. The cart stays 280 px. At 1625, 1280 and 1024 px, the previously clipped Vegetarian Starters, Tandoori Starters and Vegetarian Mains labels fit. Mobile layout remains unchanged.

## Exact combined artifact

Build `6zD0ge5SdqAm0X_krXcdr`, `.next-review-shah-workspaces-mobile-20261112`, Next.js 16.2.10/Webpack. Source SHA-256 `c932fd7a1cbe84c52ab2e1e3d2669b143efcf918c8d252a1322e95e441c4fb71`, 551 inputs, identical before and after the successful build/TypeScript check. All 61 routes generated. The snapshot includes preserved, unrelated local work; the design commit alone does not reproduce that entire combined state.

## Verification

- Forty browser cases: EN/NL × dark/light × 320/1440 px × admin/personal/company/VIP/guest. No document overflow, runtime errors or axe WCAG 2 A/AA and 2.1 AA violations in the tested states. Incomplete automated checks are retained in the evidence; this is not universal accessibility certification.
- Sixteen open-dialog cases: four dialogs × dark/light × 320/1440 px. Native modality, Tab/Shift+Tab containment, Escape, restored trigger focus, scroll restoration and scoped axe checks passed.
- Review controls tested at 320, 390, 768 and 1440 px: five 48 × 48 px rating buttons, no page overflow. Account history expanded 8 → 12 → 8 in every applicable matrix case.
- Keyboard section navigation, company registration in both languages, password visibility preserving an unsent draft, no-JavaScript explanation, and guest/non-admin denial were checked using local fixtures.
- Existing daily-metrics and actual chart JSX tests passed, including inclusive dates, Amsterdam DST, independent ranges, empty days and 100,000 orders. Guest-recognition regression tests passed 20/20, including privacy boundaries and all 175 registered accounts remaining reachable.
- Fifty HTTP checks passed on this artifact: 24 public URLs, language alternatives, 14 event URLs, sitemap/robots and private-route guards. Focused lint: zero errors, one existing unused `index` warning. Build includes full TypeScript verification.

Evidence: [responsive/accessibility](workspace-responsive-accessibility-2026-11-12.json), [dialogs and account controls](workspace-dialog-functional-2026-11-12.json), [navigation/auth](workspace-navigation-auth-2026-11-12.json), [sidebar before/after](menu-sidebar-width-2026-11-12.json), [public HTTP](workspace-public-http-2026-11-12.json), [payload](workspace-payload-2026-11-12.json), [promoted playback](workspace-promoted-browser-2026-11-12.json).

## Preview and data boundaries

- Public desktop: http://localhost:3398/en/menu; phone: http://192.168.0.122:3618/en/menu.
- Synthetic admin: http://localhost:3758/admin.
- Synthetic personal account: http://localhost:3768/account; company: http://localhost:3778/account; VIP: http://localhost:3798/account; pending VIP: http://localhost:3808/account.
- Guest login/registration: http://localhost:3788/account.

Private previews bind only to loopback. Their users, orders, bookings and metrics are invented test fixtures, not restaurant records. All API mutations return 405 before reaching the upstream, all API reads are intercepted, and identity headers/cookies are stripped. They do not log in to production or send orders, messages or payments. Private previews are deliberately unavailable on the phone LAN proxy. Start them locally with `node "$env:TEMP\shah-workspaces-20261112\launch-synthetic.cjs"` after the guarded candidate command `node "$env:TEMP\shah-preview-20261111\start-shah-workspaces-mobile-review.cjs"`; do not start a second instance on occupied ports. Helpers and fixtures are PC-local Temp files.

## Remaining limits

Real authentication, persisted CRUD, email, payments, physical-device Safari and production infrastructure were not exercised. The optional reservation session-link migration remains unapplied; see the existing guest-recognition report. No live customer records, production database or network-security settings were changed. Nothing was deployed publicly.

This is a design/accessibility improvement, not a claim of reduced private-page JavaScript. Account initial external JS rises 169,036 → 169,828 gzip bytes; admin 204,709 → 205,896 bytes. Their CSS rises to 29,192 and 30,794 bytes respectively. Public homepage JS remains 179,609 bytes and menu 174,222; all 24 public CSS totals remain below 40,000 bytes (maximum 39,854). The original 120,000-byte JavaScript target and full performance acceptance remain unmet. Byte measurements exclude HTML/Flight, fonts, media, APIs, deferred imports, prefetch and legacy nomodule code; no new Lighthouse or field-INP claim is made.
