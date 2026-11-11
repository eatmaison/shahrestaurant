# Production payload budget

Measured on 2026-11-11T01:42:33.335Z. Production build ID: ZvsF7jSptyH4JJlRdUepP. Preview: http://127.0.0.1:3397.

Initial external JavaScript and stylesheet URLs were extracted from each production HTML response (HTTP 200). Each distinct local build asset was matched byte-for-byte against the served asset, then independently gzip-compressed at zlib level 6. Route totals sum each asset once for a cold-cache page load. Units below are decimal bytes; the requested limits are JS <120,000 and CSS <40,000 bytes.

Modern-browser totals exclude nomodule legacy polyfills. Inline executable/Flight scripts are reported separately because they travel inside HTML, whose compression dictionary is shared with the surrounding markup; their standalone gzip sum is an indicator, not an additional measured HTTP response. JSON-LD is excluded from executable inline JavaScript. No HTML, fonts, images, API data, dynamically imported chunks, prefetched navigation, or video bytes are counted as external initial JS/CSS.

| Route | JS gzip B | JS reduction needed B | CSS gzip B | CSS reduction needed B | JS files | CSS files | Inline JS raw B | Inline JS standalone gzip B | Legacy nomodule gzip B |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 233650 | 113651 | 39957 | 0 | 16 | 5 | 16379 | 3491 | 39627 |
| /en | 233650 | 113651 | 39957 | 0 | 16 | 5 | 16831 | 3513 | 39627 |
| /menukaart | 231913 | 111914 | 29178 | 0 | 16 | 5 | 17830 | 3748 | 39627 |
| /en/menu | 231913 | 111914 | 29178 | 0 | 16 | 5 | 18250 | 3764 | 39627 |
| /reserveren | 224988 | 104989 | 39957 | 0 | 16 | 5 | 17847 | 3762 | 39627 |
| /en/reservations | 224988 | 104989 | 39957 | 0 | 16 | 5 | 18334 | 3767 | 39627 |
| /privacy | 218795 | 98796 | 27275 | 0 | 15 | 4 | 17652 | 3744 | 39627 |
| /en/privacy | 218795 | 98796 | 27275 | 0 | 15 | 4 | 17843 | 3711 | 39627 |
| /voorwaarden | 218763 | 98764 | 27275 | 0 | 15 | 4 | 17402 | 3699 | 39627 |
| /en/terms | 218763 | 98764 | 27275 | 0 | 15 | 4 | 17851 | 3717 | 39627 |

10 of 10 public canonical routes exceed the initial external JS budget. All routes meet the CSS budget. A framework/provider split and smaller route-specific client dependencies are still needed before the JavaScript gate can be claimed met. These measurements do not establish Lighthouse, LCP, CLS, INP or TBT results.

The unchanged optional hero film is deliberately prebuffered separately for full-quality scrubbing. Its 36,744,691-byte desktop or 11,337,072-byte mobile source is not JavaScript and is excluded here; this remains a significant media transfer cost. The poster is usable while that file loads.

## Reproduction

Run the final production server on port 3397, then from the repository root execute:

```powershell
node C:\Users\DaviiC\AppData\Local\Temp\shah-payload-audit.cjs
```

The script only reads source/build files and GETs localhost resources; it writes this report and a JSON evidence file in the temporary directory. Compression basis: node:zlib gzipSync(buffer, { level: 6 }). The exact inventory below permits independent calculation even if the temporary script is removed.

## Exact build asset inventory

| Asset | Raw B | Gzip B | SHA-256 |
| --- | ---: | ---: | --- |
| /_next/static/chunks/08ok-nv2f6di8.js | 10355 | 4109 | be262051721465bcaec766363ed4d13ce318376e2b757f6561423ca7fe7b639c |
| /_next/static/chunks/0cz1d0mv5g_q7.js | 112594 | 39627 | 0973c1d64c88adc8e3c950410cb58b288f72118d5965b78049438deb8f2f9683 |
| /_next/static/chunks/0dhspf_ga-l9x.js | 87355 | 26962 | 652be0fcdca17e30e1944dd3854741639dfc351eba4b0195a272b7395827219b |
| /_next/static/chunks/0voe5_zysxsr6.js | 249 | 215 | 1e4cdc451742d5494f03d1cff28dc2ee051f149fd7381724e6109d36b3a5859e |
| /_next/static/chunks/0wklf-kakfjf6.js | 14365 | 4895 | 9cb37afcc825eadead527d75615af2920cf0c1849ea950b3be38d398fe854293 |
| /_next/static/chunks/0ya23fqxsak8w.js | 1238 | 653 | 1ffc23714a6f50423313c25849b6897a54b9f294e72c29a453870505986398ce |
| /_next/static/chunks/1_2y89iwwsfyu.js | 64831 | 13184 | 8ec50634e5522a9952eda0bf4bdae99acd5d7b71957bc0230db4caf618a3f6f6 |
| /_next/static/chunks/11c5-ejki0ug9.js | 76161 | 24910 | 4ff4b02d8cd806ae2ad1b97d820c60994e7d08d3f0dceb038713e471563caf3e |
| /_next/static/chunks/1gr3r4e635nmb.js | 9692 | 4143 | 661171224eb66eab3ca96098387c49ef7ab100fe5d478086d41dde09a2553d33 |
| /_next/static/chunks/1nopnqt7qnlse.css | 7318 | 983 | 8d2f15aa212dd8caaccdb5e0e8b246517348ca921562c86028db861efee6e7be |
| /_next/static/chunks/1q10gebm76pre.js | 10292 | 4175 | d010bec34b9543bb7b4036a65f3a0b7da60b6b021291209cd97b08a75e047037 |
| /_next/static/chunks/1y6v2-t5emllr.js | 45108 | 13908 | 5de0c5798bf04919bcf553f34e4332178ace65dd2b0f794e08e3b60a04c1b656 |
| /_next/static/chunks/2-r0a5gokqs12.js | 137451 | 37376 | 99c5799f727b68eacb43bdb19ccde8701e78e1282bbd650973e89a0a73a0ad23 |
| /_next/static/chunks/26104sj9fsi27.js | 37213 | 10153 | be56fbc104b1e7f9f4d3e3a9988891073043a8ddff261178eb99c19226f0fcf6 |
| /_next/static/chunks/27jktro2p5rq9.js | 44414 | 9236 | 5261101892e2476e4346e19e86fd5f19cbcf7c765ff76e92eb9cefcc86b6db6a |
| /_next/static/chunks/28keh17utdbr7.css | 143460 | 24121 | 5c75f42bef18362c77c9149b7e8efeea9d6a93c2ccbf08f49d5e6e8aa93eef90 |
| /_next/static/chunks/28ktb5g6io9qz.css | 73621 | 12682 | 387dbfa5e9425434e6b5f785afe94a3273ddf899e849386ef1efe5cdef31b7a1 |
| /_next/static/chunks/294xocp5a9263.js | 48233 | 14135 | 59bc424e77c05b909f2e744b52e98a82aee5195bc60f031a840995241b11c141 |
| /_next/static/chunks/2tflvsbt13_04.js | 1180 | 680 | c66767795df8ede8c78718ceaa9ab551861b7396d6d4d3650c9e1287d6c1b547 |
| /_next/static/chunks/2zjueh7t2vecu.js | 5587 | 2018 | a46211a22ca83766afe77489b2635bc7ed6efd3da4f1c60bc94408deb352a575 |
| /_next/static/chunks/3_sou3zb03dxz.js | 817 | 536 | 165f5db93b2e223bc8234c0e7f5cc73314793d3d441a012a7a637adaf8eff7d8 |
| /_next/static/chunks/34y30617y348f.js | 2938 | 1416 | 1644ffb37b99c9df440c75d51dc63743dac5ecbb6d2749f1daef90f8e5b3ce30 |
| /_next/static/chunks/35ip4ctshr802.js | 54646 | 12875 | fe005dd52019dfda7b5ff8b3250cb487cfbe4d86f5ca7f38a8712a086d793c49 |
| /_next/static/chunks/3hwy0zmhe3hbf.css | 8186 | 1903 | 37172f442b4e8bff3d55250a6ea1dcb68ba407430120e2e509e8501491d4eb75 |
| /_next/static/chunks/3v5p_89gzoou-.js | 31396 | 8907 | e8c00a84a67971e3d8f73e09637a2e6cf73c5648a2f6ead020a2f8a36386e41d |
| /_next/static/chunks/3xfqn17rerb5e.css | 4854 | 1245 | a41088e48e99b6bef1d2f29fdbdb6896cf7c0e6e57b35b5dbde227d4bc0a3d9c |
| /_next/static/chunks/41w8vsc5pk8eg.css | 2508 | 926 | 2d3c3336ebca5c8aeacfd5198252e4d7196a1f8582ac7e11bb20adb52e71d6c4 |
| /_next/static/chunks/43rfq7guowqma.js | 227315 | 70980 | eff638c3b4dd291ee747a5e5d500ca703cf32e0c9e6576988f69e93d72bfe7f5 |
| /_next/static/chunks/turbopack-3smeg9pl7nawj.js | 10613 | 4163 | 03d229eacfdca99f6aeae5198ee122f8cdc35749156434622a9cc16e3a91b2ae |

## Route asset membership

### /

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/0wklf-kakfjf6.js`, `/_next/static/chunks/294xocp5a9263.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`, `/_next/static/chunks/28ktb5g6io9qz.css`

### /en

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/0wklf-kakfjf6.js`, `/_next/static/chunks/294xocp5a9263.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`, `/_next/static/chunks/28ktb5g6io9qz.css`

### /menukaart

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/08ok-nv2f6di8.js`, `/_next/static/chunks/1_2y89iwwsfyu.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`, `/_next/static/chunks/3hwy0zmhe3hbf.css`

### /en/menu

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/08ok-nv2f6di8.js`, `/_next/static/chunks/1_2y89iwwsfyu.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`, `/_next/static/chunks/3hwy0zmhe3hbf.css`

### /reserveren

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/0voe5_zysxsr6.js`, `/_next/static/chunks/26104sj9fsi27.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`, `/_next/static/chunks/28ktb5g6io9qz.css`

### /en/reservations

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/0voe5_zysxsr6.js`, `/_next/static/chunks/26104sj9fsi27.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`, `/_next/static/chunks/28ktb5g6io9qz.css`

### /privacy

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/1q10gebm76pre.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`

### /en/privacy

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/1q10gebm76pre.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`

### /voorwaarden

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/1gr3r4e635nmb.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`

### /en/terms

JavaScript: `/_next/static/chunks/3v5p_89gzoou-.js`, `/_next/static/chunks/43rfq7guowqma.js`, `/_next/static/chunks/2-r0a5gokqs12.js`, `/_next/static/chunks/27jktro2p5rq9.js`, `/_next/static/chunks/turbopack-3smeg9pl7nawj.js`, `/_next/static/chunks/1y6v2-t5emllr.js`, `/_next/static/chunks/11c5-ejki0ug9.js`, `/_next/static/chunks/0dhspf_ga-l9x.js`, `/_next/static/chunks/34y30617y348f.js`, `/_next/static/chunks/35ip4ctshr802.js`, `/_next/static/chunks/3_sou3zb03dxz.js`, `/_next/static/chunks/1gr3r4e635nmb.js`, `/_next/static/chunks/2tflvsbt13_04.js`, `/_next/static/chunks/0ya23fqxsak8w.js`, `/_next/static/chunks/2zjueh7t2vecu.js`

CSS: `/_next/static/chunks/1nopnqt7qnlse.css`, `/_next/static/chunks/28keh17utdbr7.css`, `/_next/static/chunks/41w8vsc5pk8eg.css`, `/_next/static/chunks/3xfqn17rerb5e.css`

## Protected original hash check

All four hashes below match the values recorded before editing.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| public/brand/shah-hero-scroll-desktop-v4.mp4 | 36744691 | 91934E4FC834E7050F37B3CD2C6EE063779B622C22E8BA61E3C788B1E63D3A2C |
| public/brand/shah-hero-scroll-mobile-v4.mp4 | 11337072 | 685F08858741F06D04BC436C2B633AF01D2FB4E56A07C24F2FC5EC0D311B67F0 |
| public/brand/shah-landscape-gold-v1.svg | 17100 | 13DE955BAE005CDCBD680ADAF6BE1546E2AEDC1452791F7640700AE73138E46B |
| public/brand/shah-landscape-teal-v1.svg | 17099 | B543B5EE55804B9044C7D8A570E859BF4977FFD673256A4124F22445139685B7 |

## JavaScript cost and remaining work

The current framework/runtime chunks sum to **145,555 gzip bytes** before app/mixed chunks: React DOM/bootstrap 70,980; Next Flight/router 37,376; React/navigation 8,907; Next dynamic/render support 9,236; client params/loading/cache support 12,875; Turbopack runtime 4,163; global error/head support 2,018. This measures the current graph, not a universal Next minimum.

The shared fa6 icon chunk remains 26,962 gzip bytes and exports 137 SVG functions, including admin/terminal/event icons. The provider chunk remains 24,910 gzip bytes and includes both full NL/EN dictionaries, store/admin actions and brand/category defaults. The full TANDOOR_PRODUCTS seed catalogue is already tree-shaken from initial client bundles; full-product-description signatures are absent.

Candidate work: separate string-key defaults from icon registries, public theme/language from store/admin actions, and dictionary sections by language/feature. A previous in-memory removal model for admin/terminal dictionary strings indicated about 5,390 gzip bytes of opportunity, not a measured rebuild or promised saving. Independently compressed module sizes are not additive savings estimates. Small cleanup alone cannot close the current gap. Preserve checkout/authentication behavior and unrelated provider edits, then remeasure any new build.

## Preserved full-quality film

The original film fully prebuffers after poster.decode(), two animation frames and an idle opportunity. Non-WebKit decodes an effect-owned video outside the DOM and attaches it to the fullscreen stage only when scrolling requires a decoded frame. WebKit keeps its attached native play/end-to-first warm-up path. Source bytes and scroll mapping are unchanged. Real Safari behavior is not established by Chrome tests. Browser, interaction and Lighthouse evidence is recorded separately by the verification owner.

This report is bound to the final legal-date contrast build ZvsF7jSptyH4JJlRdUepP. The report update changed no application source or media.
