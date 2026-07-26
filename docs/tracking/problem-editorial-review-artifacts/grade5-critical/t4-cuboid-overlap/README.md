# T4 cuboid and three-shape-overlap browser review

Reviewed on 2026-07-26 with the local Next.js practice routes and Chromium.

## Viewport and state matrix

| Visual | Viewport | Pre-answer | Hint | Revealed |
| --- | --- | --- | --- | --- |
| Cuboid | 390 × 844 | `cuboid-mobile-pre.png` | `cuboid-mobile-hint.png` | `cuboid-mobile-revealed.png` |
| Cuboid | 1024 × 768 | `cuboid-tablet-pre.png` | `cuboid-tablet-hint.png` | `cuboid-tablet-revealed.png` |
| Three-shape overlap | 390 × 844 | `overlap-mobile-pre.png` | `overlap-mobile-hint.png` | `overlap-mobile-revealed.png` |
| Three-shape overlap | 1024 × 768 | `overlap-tablet-pre.png` | `overlap-tablet-hint.png` | `overlap-tablet-revealed.png` |

Additional pre-answer checks:

- `cuboid-mobile-property-pre.png` and `cuboid-tablet-property-pre.png` show a face-count diagram without measurement labels.
- `cuboid-mobile-unknown-pre.png` shows `가로 ? cm`; the accessible image name reported `가로 미지수, 세로 2 cm, 높이 6 cm` and did not contain the hidden width.

## Runtime observations

- Both viewports reported `document.documentElement.scrollWidth === window.innerWidth`; no horizontal overflow was present.
- The quantitative cuboid exposed `data-cuboid-focus="total-edge-length"` and the semantic labels `가로 5 cm`, `세로 6 cm`, `높이 3 cm`.
- The overlap diagram introduced A, B, and C before the region model and exposed four given-value callouts: A-only, B-only, C-only, and A∩B∩C.
- Pairwise-only A∩B, A∩C, and B∩C callouts contained symbols but no numbers before answer reveal. A zero-area B∩C region was omitted.
- Chromium reported no console errors for either visual at either viewport.
