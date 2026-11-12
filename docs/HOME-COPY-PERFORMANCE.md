# Selected-language homepage performance candidate

**Promotion update:** The verified combined build `BUodo1etC1wSEnAZD_-52` is now active on desktop3398 and same-network phone3618. Candidate/control build identities and measurements below retain their original capture scope. [Current preview](LOCAL_PREVIEW.md).

Candidate **http://localhost:3718/** (`/en` for English) serves build `S_b0mpTvbVmqqJ-ThVCUE`, source `016f7cc73bd7d33e2177c902e0bdf812463c5ce93f737e4a4b59c15e3f2dc906`,549 inputs. Build/TypeScript, focused lint and50 exact-build HTTP checks pass. Source is unchanged before/after compilation. **At capture time main3398 and phone3618 retained s_2p. They now serve the promoted combined build identified above; no deployment or production data change.**

The homepage server boundary selects the URL-authoritative locale and serializes only that homepage copy into the existing interactive component. Previously both copies executed in the initial client module. Markup, content, prices, controls, media and session logic are preserved. This follows the installed Next16.2.10 client-boundary guidance, without framework patches or router migration.

| Homepage | JS before → after gzip B | HTML added B | JS+HTML saved B |
|---|---:|---:|---:|
| NL |183,621 →179,609|1,304|2,708|
| EN |183,621 →179,609|1,244|2,768|

External JS falls4,012B (2.18%); CSS remains39,866B. Both copies no longer execute as client code, but the selected copy adds HTML/Flight bytes. Combined figures sum independently gzip6 files and HTML, not actual HTTP encoding totals. Other22 route byte budgets are unchanged. [24-route payload](cinematic-home-copy-payload-2026-11-12.json), [comparison](cinematic-home-copy-comparison-2026-11-12.json).

Four paired browser controls cover NL/EN at390×844/1440×900: identical full homepage text, FAQ and parsed JSON-LD; correct locale, working Butter Chicken search/dialog/Escape; no runtime errors, write attempts or positive horizontal overflow. Both builds initially produced a signed desktop width difference of-10px; an overly strict boolean falsely counted this as overflow. The original failed harness report is retained, with the corrected positive-overflow interpretation and unchanged raw measurements. No app change hid a defect. Fresh candidate NLdesktop/ENmobile videos advanced0.709/0.715s, completed their closing transition and did not replay after reload. [Actual browser evidence and correction](cinematic-home-copy-browser-2026-11-12.json).

Mobile CPU4 diagnostic long-task blocking sums were NL368→370ms and EN379→457ms; DCL1344→1283ms and1375→1310ms. These single shared-host, sequential, reduced-motion returning-session samples **do not show a reliable mobile responsiveness improvement**. They are not Lighthouse TBT, field INP, cold intro or a causal speed benchmark. The measured accepted gain is bytes; larger performance claims are unwarranted.

The strict120,000B JS gate remains exceeded by59,609B on home. All24 current App routes still fail it. The unchanged observed root-main composition is126,254B; this is not a universal Next minimum. Prior supported Pages experiments had102,732B for a plain counter but133,891–151,856B for actual restaurant routes, with additional CSS/validation limitations. Repeating those same prototypes or unsupported ESM substitutions is not a safe route to acceptance. [Specific prior blockers](RUNTIME-BUDGET-INVESTIGATION.md).

Further substantial work requires reducing shared provider/client responsibilities and route hydration, or validating a larger supported architecture change while retaining cart/auth/admin, SEO and cinematic accessibility. This candidate does not certify that migration, mobileP92/LCP1800/INP150, physical Safari, real transactions or external Google validation. No instant-loading or ranking promise follows.

Start/check the isolated candidate from PowerShell:

```powershell
node "$env:TEMP\shah-preview-20261111\start-shah-copy-perf-review.cjs"
```

The guard uses the existing read-only fixture and frozen build. Keep its task-local Temp helpers and build artifacts. [Current accepted main/phone instructions](LOCAL_PREVIEW.md) remain valid and separate.
