# Promoted local preview — 12 November 2026

The verified combined performance build is now active at **http://localhost:3398/** and **http://192.168.0.122:3618/** on the same local network. Add `/en` for English. Both include the approved NL/EN desktop/portrait CapCut intros, all earlier public-site changes, selected-language homepage copy, and responsive menu card rendering. **Nothing was publicly deployed or changed in production data.**

Build **`BUodo1etC1wSEnAZD_-52`**, `.next-review-shah-grid-perf-20261112`, Next16.2.10/Webpack; source **`68e753609f8298de7db2bae4dae3dfcc0fd3d0898c4ff300651c44d4ef39927e`**,549 inputs. Build/TypeScript passed with identical before/after source fingerprints. The final promotion check also found all recorded source bytes unchanged. [Final address/source checkpoint](cinematic-performance-promotion-2026-11-12.json), [build](cinematic-grid-build-2026-11-12.json), [source](cinematic-grid-source-2026-11-12.json), [start commands and fixture](LOCAL_PREVIEW.md).

## Accepted improvements and limits

- Home initial external JS:183,621→179,609 gzip B, saving4,012B (2.18%). After selected-copy HTML cost, JS+HTML savings are2,708B NL/2,768B EN. Other transfers are excluded. [Exact comparison](HOME-COPY-PERFORMANCE.md).
- Responsive menu renders40 Curries cards instead of80 after hydration. All40 visible dish names/prices, five cart wraps, two separate drink choices and an unsent name draft survive12 NL/EN viewport transitions. Native/no-JS SSR lists remain available.
- Three alternating CPU4 mobile samples per build: median category click384→296ms; processing165.9→97.4ms. These are bounded local EventTiming samples, not field INP or Lighthouse. Both event medians still exceed150ms.
- Menu JS costs73 additional gzip B (174,149→174,222B); home stays179,609B and CSS is unchanged. [Attribution, tradeoffs and responsive proof](JS-LATENCY-FOLLOWUP.md).

The original full definition of done remains unmet. Current24-route external JS is153,296–179,609B: every route fails120,000B. CSS26,601–39,866B passes40,000B on all24. These are individually gzip6 byte-matched initial files, excluding HTML/Flight, inline scripts, SVG bodies, media/fonts/API/deferred/prefetch and legacy nomodule. [Current byte inventory](cinematic-grid-payload-2026-11-12.json).

Two React/Next runtime chunks total123,626B,68.83% of home JS; the observed startup composition is126,254B. This explains the limits of small component changes in this build, not a universal framework minimum. Prior actual-feature Pages and unsupported ESM experiments did not provide a passing safe replacement. Further substantial savings need validated client/provider or architecture changes; none were introduced speculatively.

## Final promotion checks

Fifty HTTP/source/access checks pass against the promoted direct app3397 and read-only main3398:24 public URLs/12locale pairs,14event URLs,72sitemap alternatives, robots, redirects and private parties restrictions. [Current HTTP proof](events-visibility-http-20261111.json).

The promoted LAN listener is PID50388, bound only192.168.0.122:3618, serving same-subnet peers.56policy cases, all58 public Next asset HEADs,17route/master/write guards,3guest-only APIs and4video Range/prefix checks pass. All four full media hashes match their previously verified frozen files; those full-body measurements are carried explicitly, not repeated. Private/master/admin/test paths remain excluded and submissions disabled. Only the exact-owned prior listeners were stopped. No firewall, network-profile, router or VPN setting changed. [Phone policy and proof](PHONE-PREVIEW.md).

Fresh promoted Chromium checks cover NLdesktop1440×900 on3398 and ENmobile390×844 on the LAN address: actual muted inline playback, advancing native clock, closing transition, menu40/40 visible cards and no intro replay on return. No runtime errors, overflow or write attempts. This is browser emulation on the PC, not a new physical-phone result. The first harness incorrectly treated an intentional blob playback URL as a wrong source; its failed path assertion is archived. Fresh network requests and the selected-source attribute confirm the expected NLdesktop/ENmobile MP4s without changing app code. [Final browser/source evidence](cinematic-promoted-grid-browser-2026-11-12.json).

## Preserved work and remaining gaps

Original logos/palette/menu/prices/contact, approved masters, independent combo drinks, compact accessible footer, dark default, single language toggle, partner motion and all public events remain. The combined frozen build includes preserved parallel working-tree changes; unrelated hunks are not staged in these public-feature commits. [Previous full verified milestone and historical evidence](cinematic-s2-promoted-control-2026-11-12.md).

No full Lighthouse/INP matrix was rerun for this artifact. Older Cde controls retain their original failing mobile performance/LCP/TBT and six INP samples; they are not relabeled as current. Original mobileP92, LCP<1800ms and INP/TBT<150ms are not certified. Fresh no-input CLS0 belongs to the earlier exact-controller controls and remains scoped there.

The substantial approved video files still require buffering. The older English mobile cold1.6Mbps/150ms/CPU4 control took80.095s before playback and recorded six dropped frames; no instant/stutter-free guarantee is made for current connections. Physical Safari/iPhone/iPad, field CWV and real checkout/reservation/email/payment flows remain unverified.

Google current CODE validation is still **NOT_RUN** because CUA browser initialization failed before submission; local schema/SEO controls retain their actual earlier build scope. [Schema limits](STRUCTURED-DATA-VALIDATION.md). Focused changed-file lint has zero errors/one existing dependency warning; prior whole-repository failures are outside this change. No rankings, rich-result display or availability guarantee follows.

Preview start/check:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-grid-perf-main.cjs"
```

The once-per-tab intro intentionally skips on refresh; use a new independent/private tab for fresh playback. Restart commands depend on the retained local Temp guards/fixture and frozen build. No public deployment or real transaction is part of this delivery.
