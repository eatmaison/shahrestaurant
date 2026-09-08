# Homepage Experience Upgrades

This checklist records 80 implemented additions and refinements to the homepage.
It includes visible design changes, interactions, accessibility and rendering
safeguards. Existing ordering, reservations, authentication, brand IDs and the
shared database are unchanged.

## First Impression

1. Two-level Shah Restaurant headline with a larger brand name and italic subtitle.
2. Left-aligned editorial hero composition with a constrained desktop content width.
3. Directional photo shading that protects text contrast while revealing the bar.
4. Location and hospitality identifiers along the top of the hero.
5. Separate numbered kitchen invitation linking directly to the menu.
6. Longer, eased and staggered hero content entrance.
7. Translucent secondary hero action with backdrop blur.
8. Layered elevation and a pressed edge on primary action hover.
9. Subtle elevation below the sticky section navigation.
10. Cuisine, hospitality and location icons in the introduction.

## Depth and Motion

11. Full-bleed Three.js photographic hero scene above a real image fallback.
12. Subdivided, subtly curved photographic mesh.
13. Horizontal pointer-responsive camera movement and mesh rotation.
14. Vertical pointer-responsive camera movement and mesh rotation.
15. Scroll-responsive hero camera depth.
16. Damped interpolation rather than abrupt pointer movement.
17. On-demand rendering that stops once the camera settles.
18. Rendering suspension when the hero leaves the viewport.
19. Rendering suspension when the browser tab is hidden.
20. Deferred Three.js import, excluded from the initial component import graph.
21. Reuse of the decoded hero photo without a second texture network request.
22. GPU texture dimensions capped at 2048 pixels and the device texture limit.
23. Renderer pixel ratio capped at 1.5 to control fill-rate costs.
24. Resize-observed camera framing with photographic aspect ratio preserved.
25. Static photograph fallback for failed initialization or rendering.
26. Static fallback on WebGL context loss.
27. Disposal of geometry, material, texture, renderer, observers and context.
28. Accessible animation toggle with translated state-dependent labels and tooltip.
29. Persisted motion choice, cross-tab updates and storage-denied fallback.
30. Live respect for the operating system's reduced-motion preference.
31. Fine-pointer-only photo tilting, without device-orientation permissions.
32. Perspective tilt on menu, gallery, story and occasion photographs.
33. Pointer-positioned photographic reflection sheen.
34. Softer scale-and-translate section reveals with eased timing.

## Menu Discovery

35. Actual dinner photograph as the main menu image.
36. Legible caption overlay on the featured dinner photograph.
37. Desktop photo inset linking the menu to the atmosphere section.
38. Typographic kitchen aside below the menu photograph.
39. Search across dish names and categories.
40. Search across descriptions and ingredients in both supported languages.
41. Deferred search rendering to keep text entry responsive.
42. Clear-search icon that returns focus to the search input.
43. Visible matching-dish count beside the selection heading.
44. Dedicated no-results state with a working filter reset.
45. Expandable results beyond the initial six dishes.
46. Collapse control with an exposed expanded state and rotating chevron.
47. Busy feedback while deferred search results catch up.
48. Connected, segmented category controls with hover feedback.
49. Horizontal category scroll snapping and visible scrollbar styling.
50. Dish thumbnails backed by the product's own image.
51. Neutral utensil fallback for missing or failed product photos.
52. Guest-favourite badge derived from actual product metadata.
53. New-dish badge derived from actual product metadata.
54. Scoped thumbnail zoom on dish hover.

## Photos and Details

55. Five-photo lightbox spanning the table, food, bar, cocktail and dining room.
56. Direct photo selection through a thumbnail strip.
57. Active-thumbnail border, opacity and accessible current state.
58. Horizontal touch-swipe navigation with vertical and multi-touch guards.
59. Photo transition when the selected lightbox image changes.
60. Eased dialog entrance and deeper modal shadow.
61. Animated close-button hover with a stable hit area.
62. Large product photograph in the dish detail dialog when supplied.
63. Detailed product description with language-aware fallbacks.
64. Readable, wrapping ingredient list in the dish dialog.
65. Distinct allergen information treatment in the dish dialog.

## Atmosphere and Visit

66. Offset depth shadow on the story photograph.
67. Decorative Shah signature on the story photograph.
68. Numbered photographic gallery overlays.
69. Editorial serif gallery captions with stronger visual hierarchy.
70. Three photographic evening options for dining, ordering and occasions.
71. Eased photographic zoom on the evening option links.
72. Sliding highlight feedback on birthday, celebration and company links.
73. Decorative quotation accent for real guest reviews, when present.
74. Restaurant photograph linked to directions in the visit section.
75. Numbered FAQ rows with a stable question-and-chevron grid.
76. Direct email contact action beside the FAQ heading.
77. Scroll-linked closing photograph movement in supporting browsers.
78. Frosted mobile action bar with improved elevation and safe-area padding.
79. Shorter mobile hero and dedicated narrow-phone typography/layout adjustments.
80. Fully static paused mode, including reveals, hover transforms and anchor scrolling.

## Implementation

- `app/page.tsx`: presentation, search, product details and gallery controls.
- `app/home.module.css`: homepage styling, responsive layout and motion fallbacks.
- `app/components/HomeDepth.tsx`: progressive Three.js layer and motion preference.
- `app/lib/homeContent.ts`: English and Dutch content, labels and corrected photo descriptions.

## Validation

Focused checks: `npx eslint app/page.tsx app/components/HomeDepth.tsx app/lib/homeContent.ts`
and `npx tsc --noEmit`. Production gate: `npm run build`.

Browser checks cover desktop/mobile screenshots, canvas pixels and pointer
response, search/reset/expanded results, gallery buttons/keyboard/swipe/thumbnails,
focus restoration, FAQ exclusivity, motion persistence, reduced motion,
WebGL fallback, English/Dutch content, dark mode and narrow-screen overflow.

The dependencies currently report 35 npm audit findings. No unrelated or
potentially breaking automatic dependency fixes were applied as part of this work.