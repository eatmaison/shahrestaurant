# Approved CapCut homepage assets

The homepage assets use only the approved desktop v3 and mobile v2 pair. The public copies are byte-identical to their Downloads masters. Rejected edits, previous exports and original v4 files remain untouched.

| Variant | Public file | Bytes | Dimensions |
|---|---|---:|---|
| Desktop | /brand/capcut-luxury-v3/shah-luxury-capcut-desktop-v3.mp4 | 22,055,086 | 1920×1080 |
| Mobile | /brand/capcut-luxury-v3/shah-luxury-capcut-mobile-v2.mp4 | 14,802,082 | 1080×1920 |

Actual probing finds 368 decoded video frames at 30fps. Both video tracks start at PTS 0.066000 seconds, last present a frame at 12.299333 seconds, and last 12.266667 seconds. Their container duration is 12.332667 seconds. Pixels are yuv420p with limited range and BT.709 primaries, transfer and matrix tags. The original silent AAC streams remain in these direct copies. No frames, typography, grade, timing, aspect ratio or intentional fade and black tail were changed.

Poster frame 43, at PTS 1.499333 seconds, shows the fully revealed SHAH / RESTAURANT title over the façade and entrance. Twelve AVIF, WebP and JPEG variants use desktop widths of 960/1600 and mobile widths of 360/720. Every poster is below 120,000 bytes; the largest is 116,162 bytes. Dimensions, absence of upscaling, and removal of EXIF/XMP/IPTC/ICC/orientation metadata were verified. Two reviewers viewed matched comparisons covering all twelve variants and found no blocking readability, content or colour issue. This is visual acceptance of lossy poster encoding, not pixel equality.

HeroPoster uses the new manifest and retains native AVIF, WebP and JPEG fallback selection. Both homepage AVIF preloads match the new srcsets. Other RootLayout dictionaries, cookies and schema code were preserved. TypeScript and targeted ESLint passed. No duplicate HTML titles were added.

Root owns video source/FPS selection and combined-browser verification. Actual muted autoplay, playsinline, advancing currentTime, responsive source choice, and text safety at 320/390px mobile and 1440×900 desktop remain separate integration checks. No new performance pass or transfer-budget result is implied.

Web-optimized video derivatives can follow separately after the approved preview. No video transcode, encoder download, installation, publication or deployment occurred on this critical path.

See [delivery metadata and hashes](capcut-luxury-v3-delivery.json) and [poster evidence](capcut-luxury-posters-v3.json). Reproduce posters with `node scripts/generate-capcut-luxury-posters.mjs`.
