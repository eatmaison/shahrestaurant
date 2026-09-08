# Luxury depth refinement

This pass preserves the existing photography, content, navigation, translations,
white/graphite/gold identity and ordering/reservation behavior. The earlier
`homepage-upgrades.md` inventory is not included in the count below.

## 100 new design refinements

### Homepage: hero and navigation

1. Stronger horizontal curvature in the Three.js photographic mesh.
2. Vertical curvature adds a second depth axis to the photograph.
3. Wider camera parallax makes the photographic perspective more visible.
4. Stronger two-axis mesh rotation responds to the pointer.
5. Foreground hero copy moves independently from the photograph.
6. Scroll depth gently offsets foreground copy.
7. Hero menu invitation moves on a counter-parallax layer.
8. Fine inset outline finishes the full-bleed hero photograph.
9. Layered embossed shadows give the Shah wordmark physical depth.
10. Champagne-colored secondary wordmark has a separate embossed finish.
11. Brushed highlight replaces the flat hero eyebrow rule.
12. Hero location line has a stronger readability shadow.
13. Engraved double-edge treatment separates the hero footer.
14. Hero menu arrow uses a glass-and-metal circular surface.
15. Motion control has an inset highlight and contact shadow.
16. Primary actions have a multi-stop metallic finish.
17. Primary actions have a visible extruded lower edge.
18. Primary action hover increases elevation and contact shadow.
19. Primary action press compresses the extrusion.
20. Primary action trailing icons move on interaction.
21. Secondary hero actions use a translucent beveled surface.
22. Secondary hero action press uses an inset shadow.
23. Sticky section navigation has a raised top edge and layered shadow.
24. Active section underline uses a wider metallic rule.
25. Section reservation icon sits in a small embossed medallion.

### Homepage: editorial content and menu

26. Introduction divider uses a double-edge engraved treatment.
27. Introduction heading has a controlled editorial measure.
28. Section eyebrow rules fade from metal to the page surface.
29. Restaurant facts have embossed circular icon mounts.
30. Main dish photograph has a stepped, multi-layer mount.
31. Main dish photograph has a fine metallic outer edge.
32. Main dish photograph has an inset photographic keyline.
33. Photograph caption plaque has an extruded white lower edge.
34. Photograph metadata divider receives an engraved highlight.
35. Kitchen note has a vertical gold editorial rule.
36. Small table photograph receives an elevated lower edge.
37. Menu search uses a recessed, fully outlined field.
38. Search focus has a soft gold perimeter ring.
39. Menu category segments have beveled top edges.
40. Selected menu category looks pressed into the control.
41. Menu result metadata has engraved upper/lower separation.
42. Dish list row separators receive a fine reflected edge.
43. Dish thumbnails have layered contact shadows and lower edges.
44. Popular/new dish labels receive fine underlines.
45. Dish detail arrows are circular, outlined icon controls.
46. Keyboard-focused dish rows receive a distinct surface state.
47. Show-more control uses a raised porcelain surface.
48. Show-more press switches to a recessed surface.
49. Allergy note rule uses the accent metal color.
50. Editorial text links have an animated underline reveal.

### Homepage: gallery, story and hospitality

51. Gallery band receives directional neutral surface lighting.
52. Gallery photographs have separated contact and cast shadows.
53. Gallery photographs have inset photographic keylines.
54. Gallery image numbers use beveled translucent plaques.
55. Gallery expand buttons have a porcelain face and extruded edge.
56. Gallery captions align their baselines above an engraved rule.
57. Story band has fine reflective top and bottom edges.
58. Story quotation receives a stronger gold rule and depth shadow.
59. Story photograph uses a stepped graphite-and-gold mount.
60. Story photograph has an inset photographic keyline.
61. Story photo wordmark has an embossed finish.
62. Story photo caption has an additional fine dividing rule.
63. Dining/takeaway/events photographs have raised lower edges.
64. Hospitality photographs have inset photographic keylines.
65. Hospitality icons use embossed porcelain medallions.
66. Hospitality photo numbers have dark translucent index plates.
67. Hospitality titles have editorial baseline rules and hover color.
68. Occasion links use engraved row separators.
69. Occasion link arrows have circular beveled mounts.
70. Guest-review band uses a neutral directional surface gradient.
71. Review figures have stronger metallic top rules.
72. Decorative quotation marks have an embossed highlight.
73. Review author/date area has a separate divider.
74. Review stars have a subtle reflected highlight.
75. Aggregate rating uses larger display typography with stable numerals.

### Homepage: visit, dialogs and mobile

76. Address icon has an embossed circular mount.
77. Location photograph has a raised lower edge and inset keyline.
78. Location caption has an extruded plaque treatment.
79. Opening-hour rows use roomier engraved separation and accented hours.
80. Open/closed status indicator has a static inset highlight and outline.
81. Open FAQ answers receive a subtle directional surface state.
82. FAQ summaries have inset horizontal spacing and contained focus rings.
83. Closing photograph has a fine full-bleed inset outline.
84. Closing heading has embossed shadow layers and a longer accent rule.
85. Photo/product dialogs have metallic borders and layered cast shadows.
86. Dialog close button uses a raised porcelain surface.
87. Lightbox caption band uses a softly lit neutral surface.
88. Lightbox navigation buttons have raised and pressed states.
89. Active photo thumbnail has an offset gold selection outline.
90. Product detail photograph is raised; price and headings use engraved rules.
91. Pointer-controlled highlights move on both horizontal and vertical axes.
92. Keyboard focus exposes a static photographic highlight.
93. Section reveals use a restrained perspective rotation.
94. Mobile photo mounts use smaller, lighter depth treatments.
95. Mobile action dock has a reflected top edge and extruded actions.

### Shared pages

96. Header monogram, utility controls and language selector use matching
    beveled materials; active navigation uses recessed surfaces.
97. Desktop dropdown unfolds in perspective with a metallic edge and cast
    shadow; mobile navigation uses matching surface and selection treatments.
98. Footer, social icons, cookie notice and back-to-top control receive
    matching surface depth. Back-to-top clears the mobile action dock.
99. Order search is recessed; category bar, product cards, product actions,
    cart sheet and sheet close control use coordinated raised surfaces.
100. Reservation heading band, fields, selected time controls, submit action
     and map frame use the same porcelain/metal material system.

## Performance and accessibility safeguards

- Delay the Three.js import until the hero photograph has decoded.
- Do not initialize Three.js until the hero intersects the viewport.
- Skip WebGL initialization when the browser advertises Save-Data.
- Cap the mobile drawing pixel ratio at 1; desktop remains capped at 1.5.
- Keep the original optimized Next Image visible as the WebGL fallback.
- Preserve demand-driven rendering, visibility suspension and GPU disposal.
- Skip hero scroll geometry reads while the hero is offscreen.
- Batch tilt geometry reads and CSS writes into one animation-frame callback.
- Clamp pointer tilt values and reset them on scrolling or window blur.
- Clear foreground depth offsets after context loss or effect cleanup.
- Preserve reduced-motion and the persisted homepage motion preference.
- Extend reduced-motion handling to footer animation transitions.
- Use existing icons and fonts; add no runtime dependencies or photo assets.
- Preserve semantic headings, form behavior, keyboard controls and translations.
- Keep section layouts unframed and keep interactive target dimensions stable.

## Verification

- `npx eslint app/components/HomeDepth.tsx`: passed.
- `npx tsc --noEmit`: passed.
- Editor diagnostics for all six changed implementation/style files: passed.
- `npm run build`: passed, including generation of all 37 static pages.
- Inventory validation: exactly 100 numbered design refinements.
- Homepage, order and reservations: no document-level horizontal overflow at
    320, 390, 768, 1024 and 1920px widths in the development preview.
- Production preview: `npm run start -- --port 3001`.
- Desktop canvas: 1,020 nonzero RGBA channels in a 16x16 sample; sample hashes
    changed from 846745 to 790574 after changing pointer perspective.
- Mobile canvas: 574 nonzero RGBA channels in a 12x12 sample after scrolling;
    drawing width was 380px for a 380.8px CSS-wide hero.
- Offscreen rendering: draw count remained at 171 across 20 animation frames.
- Inspected desktop hero, mobile hero and dark desktop gallery screenshots.
- All three gallery photographs decoded successfully.
- Menu search, product dialog, gallery arrow keys and FAQ expansion: passed.
- Product/gallery dialogs and mobile menu restore keyboard focus after Escape.
- Motion pause survives reload; reduced-motion hides the canvas and disables
    the motion control; dark mode has no horizontal overflow.
- Simulated WebGL context loss restores the photograph fallback and clears
    foreground offsets. Simulated Save-Data skips renderer initialization.
- No page errors occurred during the exercised production interactions.

No orders or reservations were submitted. Existing backend/payment behavior
was not changed or end-to-end tested. Browser preload-not-used warnings were
observed during viewport/route changes; they were not treated as a performance
score. Lighthouse, real-device GPU timings and field Core Web Vitals were not
measured. Performance work here reduces render work and initialization cost;
it is not a claim of a measured speedup across every device.