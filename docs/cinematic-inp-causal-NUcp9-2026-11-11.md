# INP causal diagnostic — frozen NU control

No application change is justified by this trace alone. The controlled INP target remains unmet, and the original measurements are retained.

The exact frozen build NUcp9_HWho-gmCR-jRh8K was loaded on port 3508 through explicit fresh targets in reserved Chrome profile 9227. Both cases stayed visible and focused with fonts loaded. No business API writes, application edits or native global input occurred. The cold first interaction and original 600 ms key cadence were preserved; no continuous requestAnimationFrame loop forced frames.

| Case | Original official control | Diagnostic EventTiming group | Commit evidence |
|---|---:|---:|---|
| Mobile menu cookie | 1712 ms | 1744 ms | Commit 57.38 ms after input; a subsequent compositor submission pair spans 1675.03 ms |
| Desktop menu focus | 1824 ms | 1864 ms | Commit 36.82 ms after input; later presentation feedback around 9013 ms |

The mobile interval contains 0.4 ms total Layout and 1.6 ms total Paint, without a long main-thread task spanning the wait. Desktop records 59 DrawFrame events during the slow-focus window, with an 11.4 ms maximum individual Paint. The trace does not support describing the 1.7–1.8 second waits as equivalent CSS paint time.

Later search typing produces substantial React scheduler tasks: up to 3.69 seconds on mobile and 0.925 seconds on desktop in these instrumented captures. A desktop deferred update also contains 54.9 ms style and 47.6 ms layout work with 992 dirty objects. Attribution stops at framework Scheduler function A. No CPU sampling profile identifies ProductsGrid or proves that a memo with roughly fifteen dependencies would safely remove the work.

The presentation-feedback gap is observed; its ultimate origin remains uncertain. Chrome, GPU/OS scheduling, machine conditions or layer behavior may contribute. These traces do not establish a specific browser bug, a CSS property to change, or exact perceived latency on a physical device.

The original harness groups official onINP interactions correctly. Its fixed 600 ms delay does not await presentation, so bursts can overlap a prior slow interaction. Its flush leaves blank tabs behind; the generic first-page helper can attach to one, but the main INP harness creates explicit targets, so this alone does not invalidate its samples.

Raw trace hashes, native EventTiming commit data, compositor pairs, frame aggregates, LoAF script attribution and settings are in [JSON](cinematic-inp-causal-NUcp9-2026-11-11.json). Full raw references:

- %TEMP%/shah-cinematic-qa-20261111/production/inp-diagnostic-NUcp9_HWho-gmCR-jRh8K/mobile-trace.json — 147,601,138 bytes.
- %TEMP%/shah-cinematic-qa-20261111/production/inp-diagnostic-NUcp9_HWho-gmCR-jRh8K/desktop-trace.json — 40,590,421 bytes.
- The same directory contains mobile-events.json, desktop-events.json and parsed frame/commit summaries.

The raw traces remain in Temp and were not copied into Git. The diagnostic adds trace/LoAF overhead and does not inject the official onINP bundle, so these values do not replace the six original controlled samples. No source fix or performance improvement is claimed.

Interpretation follows [web.dev's INP phase guidance](https://web.dev/articles/optimize-inp) and [Chrome's Long Animation Frames guidance](https://developer.chrome.com/docs/web-platform/long-animation-frames). All owned targets were closed and tracing ended. The quiet capture window is clear.
