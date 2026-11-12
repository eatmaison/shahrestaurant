# JavaScript attribution and responsive-menu latency follow-up

The largest remaining homepage payload was inspected in build `S_b0mpTvbVmqqJ-ThVCUE` (the selected-copy candidate). Its initial external JavaScript is179,609 gzip bytes. The unchanged verified main/phone remain build `s_2pU6IxrWANtKLhFIf2S` at **http://localhost:3398/** and **http://192.168.0.122:3618/**. Nothing was deployed or changed in production data.

## Largest contributors

| Compiled chunk/scope | gzip B |
|---|---:|
| ReactDOM client chunk `4bd1b696` |62,877|
| Shared Next/React App runtime chunk `3794` |60,749|
| Homepage chunk `3573` |23,915|
| Shared provider/data chunk `1398` |10,102|
| Header/footer/layout chunk |8,669|
| Chunk `5772` |5,552|
| Chunk `8500` |3,531|

The first two account for123,626B, **68.83%** of homepage JS. Including its recorded startup/loader composition, root-main is126,254B. The remaining app-specific difference is53,355B. This demonstrates why deleting a few app helpers cannot meet120,000B in this exact composition; it is **not a universal minimum for Next.js**. Earlier supported Pages probes and their actual-feature failures remain separately documented in [runtime investigation](RUNTIME-BUDGET-INVESTIGATION.md).

The largest RSC-manifest-linked concatenated factory is `HomeExperience` (67,713 raw B), followed by Providers16,257B, Header10,823B and Footer7,735B. These factory bodies include concatenated dependencies: they are not exclusive source-component sizes. Standalone factory gzip numbers must not be added as transfer. Unknown module IDs were retained rather than guessed. [Exact inert webpack registration capture and manifest mappings](cinematic-js-attribution-2026-11-12.json).

## Measured menu improvement

A fresh trusted mobile category tap exposed an avoidable cost: selecting40 Curries creates80 product articles because both desktop and mobile product grids render, even though one is CSS-hidden. ReactDOM attribute-setting and DOM work appear in sampled profiles; profiler `(program)`/idle time is not assigned to application JavaScript.

The new candidate keeps the existing SSR/no-JavaScript lists, then renders product cards only for the active1024px breakpoint after hydration. The rest of each layout, global cart, forms and product controls remain intact. Media-query changes update the active list. This avoids the duplicate hidden card render without pagination, truncation, virtualization or loss of visible dishes.

Candidate **http://localhost:3728/**, English `/en/menu`, Dutch `/menukaart`:

- Build `BUodo1etC1wSEnAZD_-52`, source `68e753609f8298de7db2bae4dae3dfcc0fd3d0898c4ff300651c44d4ef39927e`,549 frozen inputs.
- Build/TypeScript,50 exact-build HTTP checks and focused lint pass (one existing dependency warning).
- Only the responsive menu code changes from the preceding selected-copy candidate; product card rendering/content and asset bytes are unchanged.
- Menu JS increases73 gzip bytes,174,149→174,222B. Home remains179,609B and CSS is unchanged. [24-route inventory](cinematic-grid-payload-2026-11-12.json).

Six fresh browser contexts alternated control/candidate, three each:390×844,DPR1, CPU4, local read-only fixture, reduced motion, trusted touchscreen tap, same profiler settings.

| Observed quantity | Main control | Candidate |
|---|---:|---:|
| Rendered Curries articles |80|40|
| Click EventTiming duration samples, ms |408 /384 /368|296 /296 /280|
| Median click duration, ms |384|296|
| Median processing time, ms |165.9|97.4|

This is an88ms/22.9% observed median event reduction and41.3% processing reduction for this bounded action. Both event medians still fail the original150ms gate. Three instrumented local samples do not establish field INP, a whole-page score, physical-device performance or a universal guarantee. [Raw events, timing splits and six profile hashes/paths](cinematic-grid-latency-2026-11-12.json).

## Regression scope

Both languages passed six viewport transitions each (1440→390→1023→1024→360→1440), retaining all40 visible dish names/prices in order, five cart wraps, two independently selected menu drinks, an unsent name draft and no overflow. Inactive card count is always0 after hydration. Two no-JavaScript controls retain both SSR lists (four total initial articles), with two visible cards at390/1440. No runtime errors or business writes were recorded. [Functional proof](cinematic-grid-functional-2026-11-12.json).

The first resize harness incorrectly changed Puppeteer's mobile-emulation flag while resizing, which reloads the document; that invalidated the in-memory draft/category test. The corrected run changes width only under a fixed mobile/touch emulation profile. A second fixture mistake selected the nonexistent `Soft Drinks` category rather than the actual same-brand Fuze Tea products in `Drinks`; valid explicit products were used in the settled result. Neither required an app change. An earlier exploratory home-focus diagnostic stopped at its obscured-target guard, so no home-focus timing or app defect was inferred.

## Remaining tradeoffs

This is a measured latency improvement, **not a homepage JavaScript reduction**. The previous selected-language server boundary still provides the4,012B home JS saving, with its HTML cost reported separately. Substantial further JS savings require reducing client hydration/shared-provider responsibilities or validating a supported router architecture change. Deferring critical video, navigation or order confirmation merely to meet a count risks startup/accessibility/recovery regressions; prior unsupported ESM experiments failed. No such rewrite was adopted.

The initial SSR still includes both responsive product lists, so this does not claim reduced initial HTML or zero hydration cost. It deliberately preserves native/no-JS behavior. Physical Safari, cold mobile video, full current Lighthouse/INP and real checkout remain outside this check. Main3398 and phone3618 are intentionally unchanged; this measured candidate is separate and reviewable.

Start/check it from PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-grid-perf-review.cjs"
```

No further speculative rewrite is justified by these samples. The remaining120KB, mobile Lighthouse/LCP and150ms gates must remain marked unmet.
