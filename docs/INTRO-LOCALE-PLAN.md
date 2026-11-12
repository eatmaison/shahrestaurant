# Locale-specific intro integration — 12 November 2026

Verified Dutch and English desktop/mobile pairs are integrated in the homepage. The URL-authoritative SSR locale is passed through the shared intro-media manifest, poster component and responsive preload. The767px breakpoint selects desktop or portrait within that language; an opposite saved language cannot override the public URL.

English retains the approved desktop v3/mobile v2 in `public/brand/capcut-luxury-v3/`. Dutch selects only the verified fast-start files in `public/brand/capcut-luxury-nl-v1/`. Both Dutch masters are separately preserved in `assets/video-masters/capcut-luxury-nl-v1/`. No original or English file was overwritten. [Exact identities, decode/frame/timing proof and posters](CAPCUT-DUTCH-ASSETS.md).

The Dutch middle text is “Een avond / als geen ander.”; desktop closing is “MAAK ER EEN AVOND VAN”, with a two-line portrait adaptation. CapCut typography, effects, grade, framing and timing are retained. No extra HTML heading duplicates the embedded text.

Six real-browser NL/EN desktop/390×844/360×800 cases verify correct source, preload, intrinsic dimensions, full-file identity, actual muted inline playback and natural currentTime advancement. Eighteen held frames were visually reviewed for safe readable typography. [Locale browser evidence](intro-locales-browser-verification-2026-11-12.json).

The shared once-per-tab marker avoids another intro when language changes. An active language navigation dismisses the old video. A responsive change before load selects the current variant; rotation during playback preserves the chosen source/clock, using containment when needed. Reduced motion/data saving, blocked autoplay/manual controls, Skip, backgrounding and early exit retain page access. [Lifecycle and qualified final-build evidence](hero-intro-handoff-verification-2026-11-11.json).

The final-second upward film reveal removes the movie over a stationary page. Fresh tEO desktop/mobile no-input controls measured native CLS0; final source/controller matching and scoped CSS equivalence are recorded separately. This is local functional proof, not a cold-network or physical Safari result. Video files remain substantial and instant/stutter-free playback is not guaranteed.

[Current frozen build, localhost/phone URLs and start command](LOCAL_PREVIEW.md). No deployment or publication was performed.
