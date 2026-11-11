# Frozen design tokens and asset delivery

Recorded from the existing project before visual edits on 2026-11-11. No existing palette value, SVG artwork, logo layout rule, or video file is changed by the delivery pass.

## Existing palette

The authoritative CSS custom properties remain in `app/design-system.css`; `app/globals.css` retains the existing remapped Tailwind teal and neutral scales. Historical component shade values are preserved.

| Property | Light | Dark |
| --- | --- | --- |
| --shah-brand-teal | #0D4952 | #0D4952 |
| --shah-brand-gold | #E0AF59 | #E0AF59 |
| --shah-page | #fbf7ef | #062b32 |
| --shah-surface | #fffdfa | #0a3540 |
| --shah-soft | #eef2eb | #0c3d46 |
| --shah-ink | #0D4952 | #f7f2e7 |
| --shah-muted | #4b6568 | #bdd1cf |
| --shah-line | #ccd9d4 | #2c545b |
| --shah-gold | #80591e | #E0AF59 |
| --shah-accent | #0D4952 | #E0AF59 |
| --shah-button | #E0AF59 | #E0AF59 |
| --shah-button-ink | #0D4952 | #0D4952 |

The accessibility stylesheet uses these existing properties for focus outlines. It adds no hue.

## Existing type scale

Fonts: Jost variable for body/UI, Cormorant Garamond 400/500/600/700 for display. The baseline used `next/font/google`. The cinematic delivery revision now serves the exact same eight WOFF2 byte sequences from versioned `/fonts/` URLs, preserving all 25 font/fallback faces, weights and metrics. It requires no Google font lookup at build or runtime. See [FONT-PIPELINE.md](FONT-PIPELINE.md) for provenance, licenses and the route-specific preload policy.

| Role | Existing size / behavior |
| --- | --- |
| Home h2 | 50px; responsive overrides 42px, 38px, 34px |
| Intro h2 | clamp(44px, 4.8vw, 68px) |
| Story h2 | clamp(42px, 4.5vw, 64px) |
| Home h3 | 28px, line-height 1.2 |
| Body / section copy | 16px, line-height 1.85–1.9 |
| Lead | 18px; mobile 16px |
| Eyebrow | 12px; mobile 11px |
| Hero subtitle | clamp(29px, 3vw, 38px) |
| Primary CTA | 14px; 54px target before existing responsive overrides |

## Protected originals

SHA-256 recorded before and after this pass:

| File | SHA-256 |
| --- | --- |
| public/brand/shah-hero-scroll-desktop-v4.mp4 | 91934E4FC834E7050F37B3CD2C6EE063779B622C22E8BA61E3C788B1E63D3A2C |
| public/brand/shah-hero-scroll-mobile-v4.mp4 | 685F08858741F06D04BC436C2B633AF01D2FB4E56A07C24F2FC5EC0D311B67F0 |
| public/brand/shah-landscape-gold-v1.svg | 13DE955BAE005CDCBD680ADAF6BE1546E2AEDC1452791F7640700AE73138E46B |
| public/brand/shah-landscape-teal-v1.svg | B543B5EE55804B9044C7D8A570E859BF4977FFD673256A4124F22445139685B7 |

`BrandLogo.tsx` now renders a native image instead of an unoptimized Next image. Landscape, wordmark and mark use the same original artwork, intrinsic dimensions, aspect ratio and existing placement classes. The hidden homepage header does not preload a logo above the film.

## Poster delivery variants

The original desktop poster is 410,246 bytes at 1920×1080. The original mobile poster is 138,306 bytes at 608×1080. Both remain intact.

New delivery variants are generated from those same frames, never upscaled, with metadata stripped by Sharp's default encoding. See `ASSET-INVENTORY.csv` for their actual byte sizes. Base desktop variants are 1600×900; small desktop variants 960×540; base mobile 608×1080; small mobile 360×639. Every new poster is under 120,000 bytes. Each AVIF was tuned to be smaller than its corresponding WebP fallback; the actual browser selects an appropriate responsive width.

The WebP and decoded AVIF variants were visually inspected: composition, signage and warm lighting remain intact, with no obvious sky banding. This is visual QA, not an assertion of lossless encoding. The unchanged video remains the full-quality animated experience.

## Film delivery trade-off

The film still fully prebuffers its original file before display to preserve the existing scrubbing approach. The change removes the full-screen gate, body scroll lock and inert content. The poster, restaurant copy and booking actions remain usable while loading. Once prebuffering is complete, the initial poster stays visible until the visitor scrolls; the film is then revealed only after its scroll-target frame is decoded. This avoids an unnecessary initial still-to-video swap.

The film starts after the critical poster settles and an idle opportunity. Save-Data, 2G and reduced-motion visitors retain a static poster. A bounded loading/decode failure also retains the poster. The cinematic revision scrubs the unchanged 24fps timeline through the first 80% of the active track and holds its decoded final frame for the last 20%; the existing Safari decode warm-up remains. Early scrolling can choose an accessible one-viewport still, and explicit skips do not pretend that the final frame was viewed.

This deliberately preserves a 36,744,691-byte desktop or 11,337,072-byte mobile optional download; it does not claim the original film meets a small-page transfer budget. Browser/connection-specific smoothness still needs real-device checking.
