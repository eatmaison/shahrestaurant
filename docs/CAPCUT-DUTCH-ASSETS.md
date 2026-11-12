# Dutch CapCut intro assets

The Dutch desktop and mobile masters were copied exactly into `assets/video-masters/capcut-luxury-nl-v1/`. Their Downloads originals remain unchanged. The English public assets and original v4 videos also retain their recorded hashes.

| Variant | Public delivery | Bytes | SHA-256 |
|---|---|---:|---|
| desktop | /brand/capcut-luxury-nl-v1/shah-luxury-capcut-desktop-nl-v1-web.mp4 | 21595932 | 2f6d1d21801835892aa2d176df8fa02b1e0eeeb054ce58371ec92b82b1d608ad |
| mobile | /brand/capcut-luxury-nl-v1/shah-luxury-capcut-mobile-nl-v1-web.mp4 | 14767612 | f1daccbe2856904ee673227169d32a356653ab67f22922d56895f944d69c335a |

Both deliveries use H.264 stream copy with fast-start metadata before media data. There was no visual encoding, scaling, grading, trimming or interpolation. All **368 decoded-frame MD5 hashes and presentation timestamps match** their respective Dutch masters. Resolution remains 1920×1080 desktop and 1080×1920 mobile, at 30 fps with limited-range BT.709 tags. First frame PTS is 0.066000 s and last is 12.299333 s. The Dutch middle and closing text, animated transitions and intentional dark/black tail are preserved.

The initial AAC-removal prototype produced an incorrect shortened container duration with the installed CapCut muxer. It was preserved outside public assets in task-local diagnostics. The accepted fallback keeps the silent AAC stream and copies all streams. Delivery container duration is 12.332666 s and video-track duration 12.266666 s, each one microsecond shorter in metadata than the masters. This accepted mux-rounding difference is explicit; frame presentation times and decoded images are unchanged. No meaningful file-size or instant-loading improvement is claimed.

Twelve posters use frame 43 at PTS 1.499333 s, with complete SHAH/RESTAURANT branding over the entrance. AVIF/WebP/JPEG variants use desktop 960/1600 and mobile 360/720 widths. Every body is below 120,000 bytes (maximum 116,239), never upscaled and stripped of EXIF/XMP/IPTC/ICC/orientation metadata. Independent review covered all twelve matched variants without a blocking readability or composition issue.

`app/lib/capcutDutchPosters.ts` exports `capcutDutchPosters` with the same shape as the English poster manifest. No HeroFilm, HeroPoster, RootLayout or page code was edited by this asset task. Locale selection, accessible playback fallbacks and actual browser cover-crop checks belong to the integration owner. Targeted ESLint passed. No browser service, system install, paid service, Git action or deployment occurred.

Reproduce with `node scripts/prepare-capcut-dutch-video.mjs` and `node scripts/generate-capcut-dutch-posters.mjs`. Both scripts refuse to overwrite mismatched existing assets.

Evidence: [video hashes, probes and frame verification](capcut-dutch-video-v1.json), [poster evidence](capcut-dutch-posters-v1.json). Full probes, frame-PTS lists, frame-MD5 files and comparison sheets are retained at the Temp paths recorded there.

## Website verification

Build `ROlbbD83zLUL6I7QyZ5_e` on `http://127.0.0.1:3688` was checked in six fresh native Chromium contexts: Dutch and English at 390 x 844, 360 x 800, and 1440 x 900. Every case deliberately started with the opposite saved language preference and an absent intro session key. All selected the correct locale video and matching AVIF poster/preloads, downloaded the expected complete file, and played muted inline with the native clock advancing by 0.65-0.67 seconds.

All 18 actual website screenshots at held decoded times near 1.5, 4.8 and 9.8 seconds were viewed. The Dutch and English opening, middle and closing typography remains inside these viewports, with no visible duplicate HTML title, site controls over the film, or horizontal overflow. At 360 x 800 the portrait frame uses contain; 390 x 844 and desktop use cover. Runtime and console errors were zero. A raw rectangle-only heading test flagged the underlying page headings; the report retains this diagnostic and explains that the opaque fullscreen film covers them.

These are shared-host functional and held-frame checks, without an FPS, uninterrupted ending, real Safari, or instant-loading claim. Continuous playback/handoff and lifecycle checks are owned by the separate playback QA. Exact source/response/clock details and all screenshot hashes are in [locale browser verification](intro-locales-browser-verification-2026-11-12.json). Browser and network activity ended at `2026-11-12T01:07:54.842Z`.
