# T4 three-shape-overlap readability review

Reviewed on 2026-07-27 with Chromium against the T4 worktree on a dedicated local port.

## Evidence matrix

| Viewport | Pre-answer | Hint | Revealed |
| --- | --- | --- | --- |
| 390 × 844 | `mobile-pre.png` | `mobile-hint.png` | `mobile-revealed.png` |
| 1024 × 768 | `tablet-pre.png` | `tablet-hint.png` | `tablet-revealed.png` |

## Final rendered measurements

| Viewport | SVG size | Smallest unit cell | Smallest callout label | Bottom note |
| --- | --- | --- | --- | --- |
| 390 × 844 | 284 × 389 px | 8.68 px | 13.41 px | 12.62 px |
| 1024 × 768 | 393 × 551 px | 12.01 px | 18.56 px | 17.47 px |

The mobile contract requires unit cells at least 8 px, callout labels at least 13 px, and the bottom note at least 12 px after final SVG scaling.

Both viewports had no horizontal overflow and no Chromium console errors. The pre-answer DOM still omitted the zero B∩C-only region and all pairwise-only numeric values.
