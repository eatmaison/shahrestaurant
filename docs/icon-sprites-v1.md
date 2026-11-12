# Public SVG icon delivery

The public source graph now uses107glyph wrappers backed by three same-origin SVG sprites. Each glyph's ordered geometry and root attributes are copied exactly from installedreact-icons5.7.0. No path simplification or SVG artwork changes were applied. The public files received19import-specifier replacements across17files; admin, terminal and privatebusinesslogic were not edited.

| Sprite | Glyphs | Raw body | Isolated gzip |
|---|---:|---:|---:|
| common.svg | 25 | 13664 B | 6066 B |
| catalog.svg | 53 | 28820 B | 10000 B |
| features.svg | 29 | 17818 B | 7123 B |

The common sprite contains the25icons measured on the legal routes. Catalog and remainingfeature glyphs are separate assets. A browser requests a sprite when a rendered use references it; this avoids an individual HTTP request for every icon. The table measures standalone encoded assets, not production route savings. The final combinedbuild must measure initial JS and its actual native SVG request set together.

Generated ESM wrappers preserve named exports and IconType compatibility. The outer SVG retains defaultcurrentColor fill/stroke, exactviewBox, size/width precedence, class/style/color, title, aria/data attributes and event/ref forwarding. Fragment groups deliberately have no independentviewBox, so caller root overrides keep their coordinate behavior. No new aria-hidden, pointer-event or focus defaults were introduced. Eventtarget may be use rather than path; eventcurrentTarget remains the outerSVG. No public IconContext use was found; hypothetical future IconContext behavior is outside the replacement's supported contract.

Independent verification matched all107glyphs and109orderedpathnodes exactly and passed1926default-context prop probes. Public dependency analysis found zero runtime react-icons edges through89static and15asyncreachablemodules. The three remaining imports are erased TypeScript types. TypeScript, targeted ESLint, generator repetition, and the existing real-module locale/access tests passed. A separate original-vs-wrapper SSR comparison passed749root/title combinations.

Actual Chromium screenshots compared all107glyphs in four JS/NoJS and light/dark scenarios. All rendered. Comparisons have ten differing antialiasing pixels in total, with maximumchannel delta31; they are not pixel-identical. The interactive fixture initially used renderToStaticMarkup, which is not hydratable. After only that TempProbe renderer was corrected to renderToString, a bounded retry reported zero consoleerrors before/after interactions, both refs attached to SVG, correct SVGcurrentTarget, and equal counts after trustedmouse, Space and Enter actions. Native anchors, keyboard order, accessibleimage naming and inheritedcurrentColor were checked. Earlier screenshots and corrected hydration are recorded separately. These tests concern an isolatedfixture, not appintegration or otherbrowser engines.

[Generation evidence](icon-sprites-v1.json), [independent review](icon-sprites-v1-review.json) and [SSR/browser validation](icon-sprites-v1-validation.json) retain hashes, raw Tempreferences and limits. The generated sprites link [distributed licences](../public/brand/icon-sprites-v1/LICENSES.txt): react-icons MIT, FontAwesome6 CC BY4.0, MaterialDesign Apache2.0 and SimpleIcons CC0. Existing logos and unrelated SVG assets remain untouched.

Reproduce accepted sprite geometry with `node scripts/generate-icon-sprites.mjs`. The generator pins packageversion and accepted groupmembership and refuses to overwrite a changed versioned sprite. Browserfixture/proofdata are task-local and no deployment occurred.
